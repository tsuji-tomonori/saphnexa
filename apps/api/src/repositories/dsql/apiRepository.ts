import type { ApiOperationId } from "@saphnexa/api-contract";
import type { DbRow, DbTableName } from "@saphnexa/db-types";

export interface DsqlQuery<TResultTable extends DbTableName = DbTableName> {
  operationId: ApiOperationId;
  resultTable: TResultTable;
  sql: string;
  params: Record<string, unknown>;
}

export interface DsqlQueryExecutor {
  query<TResultTable extends DbTableName>(query: DsqlQuery<TResultTable>): Promise<Array<DbRow<TResultTable>>> | Array<DbRow<TResultTable>>;
}

export interface ApiRepositoryRequest {
  actorId: string | undefined;
  operationId: ApiOperationId | string;
  input: Record<string, unknown>;
}

export interface ApiRepositoryResponse {
  status: number;
  body: unknown;
}

export interface DsqlApiRepository {
  execute(request: ApiRepositoryRequest): Promise<ApiRepositoryResponse> | ApiRepositoryResponse;
}

export interface DsqlApiRepositoryOptions {
  csrfTokenIssuer?: DsqlCsrfTokenIssuer;
  executor?: DsqlQueryExecutor;
}

export type DsqlCsrfTokenIssuer = (input: { actorId: string | undefined; row: DbRow<DbTableName> }) => Promise<string> | string;

type DsqlOperationPlanner = (request: ApiRepositoryRequest) => DsqlQuery;
type DsqlOperationMapper = (rows: Array<DbRow<DbTableName>>, request: ApiRepositoryRequest, options: DsqlApiRepositoryOptions) => Promise<unknown> | unknown;

interface DsqlOperationMapping {
  notFoundErrorCode?: string;
  plan: DsqlOperationPlanner;
  map: DsqlOperationMapper;
  status?: number;
}

export function createDsqlApiRepository(options: DsqlApiRepositoryOptions = {}): DsqlApiRepository {
  return {
    async execute(request) {
      if (!isMappedOperationId(request.operationId)) {
        return repositoryError(501, "DSQL_OPERATION_NOT_MAPPED", "Aurora DSQL operation mapping is not implemented.", {
          operationId: request.operationId
        });
      }
      if (!options.executor) {
        return repositoryError(501, "DSQL_EXECUTOR_NOT_BOUND", "Aurora DSQL query executor is not configured.", {
          operationId: request.operationId
        });
      }
      if (request.operationId === "getMe" && !options.csrfTokenIssuer) {
        return repositoryError(501, "DSQL_CSRF_ISSUER_NOT_BOUND", "CSRF token issuer is not configured for the DSQL API repository.", {
          operationId: request.operationId
        });
      }
      const mapping: DsqlOperationMapping = dsqlOperationMappings[request.operationId];
      const rows = await options.executor.query(mapping.plan(request));
      if (rows.length === 0 && mapping.notFoundErrorCode) {
        return repositoryError(404, mapping.notFoundErrorCode, "Aurora DSQL query did not find the requested resource.", {
          operationId: request.operationId
        });
      }
      return {
        status: mapping.status ?? 200,
        body: await mapping.map(rows, request, options)
      };
    }
  };
}

export function createUnboundDsqlApiRepository(): DsqlApiRepository {
  return {
    execute(request) {
      return repositoryError(501, "DSQL_REPOSITORY_NOT_BOUND", "Aurora DSQL repository is not configured.", {
        operationId: request.operationId
      });
    }
  };
}

const dsqlOperationMappings = {
  authCallback: {
    status: 302,
    notFoundErrorCode: "DSQL_AUTH_USER_NOT_FOUND",
    plan(request) {
      return {
        operationId: "authCallback",
        resultTable: "web_sessions",
        sql: `
          WITH authenticated_user AS (
            SELECT tenant_id, user_id
            FROM users
            WHERE user_id = COALESCE(:user_id, :actor_id)
              AND status = 'active'
            LIMIT 1
          ),
          created_session AS (
            INSERT INTO web_sessions (
              tenant_id, session_id, user_id, refresh_token_ref, csrf_secret_hash, status, expires_at, created_at, updated_at
            )
            SELECT
              u.tenant_id,
              gen_random_uuid()::varchar,
              u.user_id,
              :refresh_token_ref,
              :csrf_secret_hash,
              'active',
              now() + interval '8 hours',
              now(),
              now()
            FROM authenticated_user u
            RETURNING *
          ),
          web_session_event AS (
            INSERT INTO web_session_events (
              tenant_id, event_id, aggregate_id, aggregate_type, event_seq, event_name, occurred_at,
              actor_user_id, correlation_id, causation_id, idempotency_key, payload_json
            )
            SELECT
              s.tenant_id,
              gen_random_uuid(),
              s.session_id,
              'web_session',
              1,
              'web_session.started',
              now(),
              s.user_id,
              :state,
              NULL,
              :idempotency_key,
              json_build_object('session_id', s.session_id, 'user_id', s.user_id)
            FROM created_session s
            RETURNING aggregate_id
          )
          SELECT s.*
          FROM created_session s
          JOIN web_session_event e
            ON e.aggregate_id = s.session_id
        `,
        params: {
          actor_id: request.actorId,
          user_id: request.input.user_id,
          state: request.input.state,
          refresh_token_ref: request.input.refresh_token_ref ?? "cognito-refresh-token-ref",
          csrf_secret_hash: request.input.csrf_secret_hash ?? "csrf-secret-hash",
          idempotency_key: `auth-callback:${String(request.input.code ?? "")}`
        }
      };
    },
    map(rows) {
      const session = firstRow(rows) as DbRow<"web_sessions">;
      return { redirect_url: "/chat", session_id: session.session_id };
    }
  },
  logout: {
    status: 204,
    plan(request) {
      return {
        operationId: "logout",
        resultTable: "web_sessions",
        sql: `
          WITH revoked_session AS (
            UPDATE web_sessions s
               SET status = 'revoked',
                   updated_at = now()
             WHERE s.user_id = :actor_id
               AND s.status = 'active'
               AND (:session_id IS NULL OR s.session_id = :session_id)
             RETURNING *
          ),
          next_event_seq AS (
            SELECT
              s.tenant_id,
              s.session_id,
              COALESCE(MAX(e.event_seq), 0) + 1 AS event_seq
            FROM revoked_session s
            LEFT JOIN web_session_events e
              ON e.tenant_id = s.tenant_id
             AND e.aggregate_id = s.session_id
            GROUP BY s.tenant_id, s.session_id
          ),
          web_session_event AS (
            INSERT INTO web_session_events (
              tenant_id, event_id, aggregate_id, aggregate_type, event_seq, event_name, occurred_at,
              actor_user_id, correlation_id, causation_id, idempotency_key, payload_json
            )
            SELECT
              s.tenant_id,
              gen_random_uuid(),
              s.session_id,
              'web_session',
              n.event_seq,
              'web_session.logged_out',
              now(),
              s.user_id,
              NULL,
              NULL,
              CONCAT('logout:', s.session_id, ':', n.event_seq),
              json_build_object('session_id', s.session_id)
            FROM revoked_session s
            JOIN next_event_seq n
              ON n.tenant_id = s.tenant_id
             AND n.session_id = s.session_id
            RETURNING aggregate_id
          )
          SELECT s.*
          FROM revoked_session s
          LEFT JOIN web_session_event e
            ON e.aggregate_id = s.session_id
        `,
        params: { actor_id: request.actorId, session_id: request.input.session_id ?? null }
      };
    },
    map() {
      return null;
    }
  },
  getMe: {
    notFoundErrorCode: "DSQL_USER_NOT_FOUND",
    plan(request) {
      return {
        operationId: "getMe",
        resultTable: "users",
        sql: `
          SELECT
            u.tenant_id,
            u.user_id,
            u.email,
            u.display_name,
            u.role,
            u.department,
            u.employment_type,
            u.status,
            u.created_at,
            u.updated_at
          FROM users u
          JOIN web_sessions ws
            ON ws.tenant_id = u.tenant_id
           AND ws.user_id = u.user_id
           AND ws.status = 'active'
           AND ws.expires_at > now()
          WHERE u.user_id = :actor_id
            AND u.status = 'active'
          ORDER BY ws.updated_at DESC
          LIMIT 1
        `,
        params: { actor_id: request.actorId }
      };
    },
    async map(rows, request, options) {
      const row = firstRow(rows);
      if (!options.csrfTokenIssuer) throw new Error("CSRF token issuer is not configured for getMe.");
      return {
        user: row,
        csrf_token: await options.csrfTokenIssuer({ actorId: request.actorId, row })
      };
    }
  },
  listChatSessions: {
    plan(request) {
      return {
        operationId: "listChatSessions",
        resultTable: "chat_sessions",
        sql: `
          SELECT
            c.tenant_id,
            c.chat_id,
            c.title,
            c.status,
            c.last_message_at,
            c.created_by_user_id,
            c.created_at,
            c.updated_at,
            c.deleted_at
          FROM chat_sessions c
          JOIN chat_participants p
            ON p.tenant_id = c.tenant_id
           AND p.chat_id = c.chat_id
           AND p.user_id = :actor_id
           AND p.status = 'active'
          WHERE c.status <> 'deleted'
          ORDER BY c.updated_at DESC
        `,
        params: { actor_id: request.actorId }
      };
    },
    map(rows) {
      return { chats: rows };
    }
  },
  createChatSession: {
    notFoundErrorCode: "DSQL_CHAT_ACTOR_NOT_FOUND",
    plan(request) {
      return {
        operationId: "createChatSession",
        resultTable: "chat_sessions",
        sql: `
          WITH actor AS (
            SELECT tenant_id, user_id
            FROM users
            WHERE user_id = :actor_id
              AND status = 'active'
          ),
          created_chat AS (
            INSERT INTO chat_sessions (
              tenant_id, chat_id, title, status, last_message_at, created_by_user_id, created_at, updated_at, deleted_at
            )
            SELECT
              a.tenant_id,
              gen_random_uuid(),
              COALESCE(NULLIF(:title, ''), '新規チャット'),
              'active',
              NULL,
              a.user_id,
              now(),
              now(),
              NULL
            FROM actor a
            RETURNING *
          ),
          owner_participant AS (
            INSERT INTO chat_participants (
              tenant_id, chat_id, user_id, participant_role, status, added_by_user_id, added_at, removed_at
            )
            SELECT
              c.tenant_id,
              c.chat_id,
              c.created_by_user_id,
              'owner',
              'active',
              c.created_by_user_id,
              now(),
              NULL
            FROM created_chat c
            RETURNING chat_id
          ),
          chat_session_event AS (
            INSERT INTO chat_session_events (
              tenant_id, event_id, aggregate_id, aggregate_type, event_seq, event_name,
              occurred_at, actor_user_id, correlation_id, causation_id, idempotency_key, payload_json
            )
            SELECT
              c.tenant_id,
              gen_random_uuid(),
              c.chat_id::varchar,
              'chat_session',
              1,
              'chat.session.created',
              now(),
              c.created_by_user_id,
              NULL,
              NULL,
              concat('chat-session:create:', c.chat_id::varchar),
              json_build_object('chat_id', c.chat_id, 'title', c.title, 'created_by_user_id', c.created_by_user_id)
            FROM created_chat c
            JOIN owner_participant op
              ON op.chat_id = c.chat_id
            RETURNING aggregate_id
          ),
          audit_event AS (
            INSERT INTO audit_events (
              tenant_id, audit_event_id, actor_user_id, event_name, category, resource_id, payload_json, created_at
            )
            SELECT
              c.tenant_id,
              gen_random_uuid(),
              c.created_by_user_id,
              'chat.session.created',
              'chat_session',
              c.chat_id::varchar,
              json_build_object('chat_id', c.chat_id, 'title', c.title, 'participant_role', 'owner'),
              now()
            FROM created_chat c
            JOIN owner_participant op
              ON op.chat_id = c.chat_id
            RETURNING resource_id
          )
          SELECT c.*
          FROM created_chat c
          JOIN owner_participant op
            ON op.chat_id = c.chat_id
          JOIN chat_session_event cse
            ON cse.aggregate_id = c.chat_id::varchar
          JOIN audit_event ae
            ON ae.resource_id = c.chat_id::varchar
        `,
        params: {
          actor_id: request.actorId,
          title: request.input.title ?? ""
        }
      };
    },
    map(rows) {
      return { chat: firstRow(rows) };
    }
  },
  getChatSession: {
    notFoundErrorCode: "DSQL_CHAT_NOT_FOUND",
    plan(request) {
      return {
        operationId: "getChatSession",
        resultTable: "chat_sessions",
        sql: `
          SELECT
            c.tenant_id,
            c.chat_id,
            c.title,
            c.status,
            c.last_message_at,
            c.created_by_user_id,
            c.created_at,
            c.updated_at,
            c.deleted_at,
            COALESCE(participants.participants_json, '[]'::json) AS participants_json,
            COALESCE(messages.messages_json, '[]'::json) AS messages_json
          FROM chat_sessions c
          JOIN chat_participants requester
            ON requester.tenant_id = c.tenant_id
           AND requester.chat_id = c.chat_id
           AND requester.user_id = :actor_id
           AND requester.status = 'active'
          LEFT JOIN LATERAL (
            SELECT json_agg(p ORDER BY p.added_at ASC) AS participants_json
            FROM chat_participants p
            WHERE p.tenant_id = c.tenant_id
              AND p.chat_id = c.chat_id
              AND p.status = 'active'
          ) participants ON TRUE
          LEFT JOIN LATERAL (
            SELECT json_agg(m ORDER BY m.created_at ASC, m.message_id ASC) AS messages_json
            FROM chat_messages m
            WHERE m.tenant_id = c.tenant_id
              AND m.chat_id = c.chat_id
          ) messages ON TRUE
          WHERE c.chat_id = :chat_id
            AND c.status <> 'deleted'
          LIMIT 1
        `,
        params: {
          actor_id: request.actorId,
          chat_id: request.input.chat_id
        }
      };
    },
    map(rows) {
      const row = firstRow(rows) as DbRow<"chat_sessions"> & {
        participants_json?: unknown[];
        messages_json?: unknown[];
      };
      const { participants_json, messages_json, ...chat } = row;
      return {
        chat: {
          ...chat,
          participants: participants_json ?? [],
          messages: messages_json ?? []
        }
      };
    }
  },
  updateChatSession: {
    notFoundErrorCode: "DSQL_CHAT_OWNER_OR_SESSION_NOT_FOUND",
    plan(request) {
      return {
        operationId: "updateChatSession",
        resultTable: "chat_sessions",
        sql: `
          WITH owner_participant AS (
            SELECT tenant_id, chat_id
            FROM chat_participants
            WHERE user_id = :actor_id
              AND chat_id = :chat_id
              AND participant_role = 'owner'
              AND status = 'active'
          ),
          updated_chat AS (
            UPDATE chat_sessions c
               SET title = COALESCE(NULLIF(:title, ''), c.title),
                   updated_at = now()
              FROM owner_participant op
             WHERE c.tenant_id = op.tenant_id
               AND c.chat_id = op.chat_id
               AND c.status <> 'deleted'
            RETURNING c.*
          ),
          chat_session_event AS (
            INSERT INTO chat_session_events (
              tenant_id, event_id, aggregate_id, aggregate_type, event_seq, event_name,
              occurred_at, actor_user_id, correlation_id, causation_id, idempotency_key, payload_json
            )
            SELECT
              uc.tenant_id,
              gen_random_uuid(),
              uc.chat_id::varchar,
              'chat_session',
              COALESCE((
                SELECT max(e.event_seq)
                FROM chat_session_events e
                WHERE e.tenant_id = uc.tenant_id
                  AND e.aggregate_id = uc.chat_id::varchar
              ), 0) + 1,
              'chat.session.title_updated',
              now(),
              :actor_id,
              NULL,
              NULL,
              NULL,
              json_build_object('chat_id', uc.chat_id, 'title', uc.title)
            FROM updated_chat uc
            RETURNING aggregate_id
          ),
          audit_event AS (
            INSERT INTO audit_events (
              tenant_id, audit_event_id, actor_user_id, event_name, category, resource_id, payload_json, created_at
            )
            SELECT
              uc.tenant_id,
              gen_random_uuid(),
              :actor_id,
              'chat.session.title_updated',
              'chat_session',
              uc.chat_id::varchar,
              json_build_object('chat_id', uc.chat_id, 'title', uc.title),
              now()
            FROM updated_chat uc
            RETURNING resource_id
          )
          SELECT uc.*
          FROM updated_chat uc
          JOIN chat_session_event cse
            ON cse.aggregate_id = uc.chat_id::varchar
          JOIN audit_event ae
            ON ae.resource_id = uc.chat_id::varchar
        `,
        params: {
          actor_id: request.actorId,
          chat_id: request.input.chat_id,
          title: request.input.title ?? ""
        }
      };
    },
    map(rows) {
      return { chat: firstRow(rows) };
    }
  },
  deleteChatSession: {
    notFoundErrorCode: "DSQL_CHAT_OWNER_OR_SESSION_NOT_FOUND",
    plan(request) {
      return {
        operationId: "deleteChatSession",
        resultTable: "chat_sessions",
        sql: `
          WITH owner_participant AS (
            SELECT tenant_id, chat_id
            FROM chat_participants
            WHERE user_id = :actor_id
              AND chat_id = :chat_id
              AND participant_role = 'owner'
              AND status = 'active'
          ),
          removed_participants AS (
            UPDATE chat_participants p
               SET status = 'removed',
                   removed_at = now()
              FROM owner_participant op
             WHERE p.tenant_id = op.tenant_id
               AND p.chat_id = op.chat_id
               AND p.status = 'active'
             RETURNING p.chat_id
          ),
          deleted_chat AS (
            UPDATE chat_sessions c
               SET status = 'deleted',
                   deleted_at = now(),
                   updated_at = now()
              FROM owner_participant op
             WHERE c.tenant_id = op.tenant_id
               AND c.chat_id = op.chat_id
               AND c.status <> 'deleted'
            RETURNING c.*
          ),
          chat_session_event AS (
            INSERT INTO chat_session_events (
              tenant_id, event_id, aggregate_id, aggregate_type, event_seq, event_name,
              occurred_at, actor_user_id, correlation_id, causation_id, idempotency_key, payload_json
            )
            SELECT
              dc.tenant_id,
              gen_random_uuid(),
              dc.chat_id::varchar,
              'chat_session',
              COALESCE((
                SELECT max(e.event_seq)
                FROM chat_session_events e
                WHERE e.tenant_id = dc.tenant_id
                  AND e.aggregate_id = dc.chat_id::varchar
              ), 0) + 1,
              'chat.session.deleted',
              now(),
              :actor_id,
              NULL,
              NULL,
              NULL,
              json_build_object(
                'chat_id', dc.chat_id,
                'deleted_at', dc.deleted_at,
                'physical_delete', false,
                'removed_participants', (SELECT count(*) FROM removed_participants)
              )
            FROM deleted_chat dc
            RETURNING aggregate_id
          ),
          audit_event AS (
            INSERT INTO audit_events (
              tenant_id, audit_event_id, actor_user_id, event_name, category, resource_id, payload_json, created_at
            )
            SELECT
              dc.tenant_id,
              gen_random_uuid(),
              :actor_id,
              'chat.session.deleted',
              'chat_session',
              dc.chat_id::varchar,
              json_build_object(
                'chat_id', dc.chat_id,
                'deleted_at', dc.deleted_at,
                'physical_delete', false,
                'removed_participants', (SELECT count(*) FROM removed_participants)
              ),
              now()
            FROM deleted_chat dc
            RETURNING resource_id
          )
          SELECT dc.*
          FROM deleted_chat dc
          JOIN chat_session_event cse
            ON cse.aggregate_id = dc.chat_id::varchar
          JOIN audit_event ae
            ON ae.resource_id = dc.chat_id::varchar
        `,
        params: {
          actor_id: request.actorId,
          chat_id: request.input.chat_id
        }
      };
    },
    map() {
      return undefined;
    }
  },
  listChatParticipants: {
    plan(request) {
      return {
        operationId: "listChatParticipants",
        resultTable: "chat_participants",
        sql: `
          SELECT
            target.tenant_id,
            target.chat_id,
            target.user_id,
            target.participant_role,
            target.status,
            target.added_by_user_id,
            target.added_at,
            target.removed_at
          FROM chat_participants requester
          JOIN chat_participants target
            ON target.tenant_id = requester.tenant_id
           AND target.chat_id = requester.chat_id
           AND target.status = 'active'
          WHERE requester.user_id = :actor_id
            AND requester.chat_id = :chat_id
            AND requester.status = 'active'
          ORDER BY target.added_at ASC
        `,
        params: {
          actor_id: request.actorId,
          chat_id: request.input.chat_id
        }
      };
    },
    map(rows) {
      return { participants: rows };
    }
  },
  addChatParticipant: {
    notFoundErrorCode: "DSQL_CHAT_OWNER_OR_TARGET_NOT_FOUND",
    plan(request) {
      return {
        operationId: "addChatParticipant",
        resultTable: "chat_participants",
        sql: `
          WITH owner_participant AS (
            SELECT tenant_id, chat_id, user_id
            FROM chat_participants
            WHERE user_id = :actor_id
              AND chat_id = :chat_id
              AND participant_role = 'owner'
              AND status = 'active'
          ),
          target_user AS (
            SELECT u.tenant_id, u.user_id
            FROM users u
            JOIN owner_participant op
              ON op.tenant_id = u.tenant_id
            WHERE u.user_id = :user_id
              AND u.role = 'general_user'
              AND u.status = 'active'
          ),
          upserted_participant AS (
            INSERT INTO chat_participants (
              tenant_id, chat_id, user_id, participant_role, status, added_by_user_id, added_at, removed_at
            )
            SELECT
              op.tenant_id,
              op.chat_id,
              tu.user_id,
              'viewer',
              'active',
              op.user_id,
              now(),
              NULL
            FROM owner_participant op
            JOIN target_user tu
              ON tu.tenant_id = op.tenant_id
            ON CONFLICT (tenant_id, chat_id, user_id)
            DO UPDATE SET
              participant_role = 'viewer',
              status = 'active',
              added_by_user_id = EXCLUDED.added_by_user_id,
              removed_at = NULL
            RETURNING *
          ),
          chat_participant_event AS (
            INSERT INTO chat_participant_events (
              tenant_id, event_id, aggregate_id, aggregate_type, event_seq, event_name,
              occurred_at, actor_user_id, correlation_id, causation_id, idempotency_key, payload_json
            )
            SELECT
              up.tenant_id,
              gen_random_uuid(),
              concat(up.chat_id::varchar, ':', up.user_id),
              'chat_participant',
              COALESCE((
                SELECT max(e.event_seq)
                FROM chat_participant_events e
                WHERE e.tenant_id = up.tenant_id
                  AND e.aggregate_id = concat(up.chat_id::varchar, ':', up.user_id)
              ), 0) + 1,
              'chat.participant.added',
              now(),
              :actor_id,
              NULL,
              NULL,
              NULL,
              json_build_object(
                'chat_id', up.chat_id,
                'user_id', up.user_id,
                'participant_role', up.participant_role,
                'status', up.status,
                'added_by_user_id', up.added_by_user_id
              )
            FROM upserted_participant up
            RETURNING aggregate_id
          ),
          audit_event AS (
            INSERT INTO audit_events (
              tenant_id, audit_event_id, actor_user_id, event_name, category, resource_id, payload_json, created_at
            )
            SELECT
              up.tenant_id,
              gen_random_uuid(),
              :actor_id,
              'chat.participant.added',
              'chat_participant',
              concat(up.chat_id::varchar, ':', up.user_id),
              json_build_object(
                'chat_id', up.chat_id,
                'user_id', up.user_id,
                'participant_role', up.participant_role,
                'status', up.status
              ),
              now()
            FROM upserted_participant up
            RETURNING resource_id
          )
          SELECT up.*
          FROM upserted_participant up
          JOIN chat_participant_event cpe
            ON cpe.aggregate_id = concat(up.chat_id::varchar, ':', up.user_id)
          JOIN audit_event ae
            ON ae.resource_id = concat(up.chat_id::varchar, ':', up.user_id)
        `,
        params: {
          actor_id: request.actorId,
          chat_id: request.input.chat_id,
          user_id: request.input.user_id
        }
      };
    },
    map(rows) {
      return { participant: firstRow(rows) };
    }
  },
  updateChatParticipant: {
    notFoundErrorCode: "DSQL_CHAT_PARTICIPANT_NOT_FOUND",
    plan(request) {
      return {
        operationId: "updateChatParticipant",
        resultTable: "chat_participants",
        sql: `
          WITH owner_participant AS (
            SELECT tenant_id, chat_id, user_id
            FROM chat_participants
            WHERE user_id = :actor_id
              AND chat_id = :chat_id
              AND participant_role = 'owner'
              AND status = 'active'
          ),
          target_viewer AS (
            SELECT target.tenant_id, target.chat_id, target.user_id
            FROM chat_participants target
            JOIN owner_participant op
              ON op.tenant_id = target.tenant_id
             AND op.chat_id = target.chat_id
            WHERE target.user_id = :user_id
              AND target.user_id <> op.user_id
              AND target.participant_role = 'viewer'
              AND target.status = 'active'
          ),
          demoted_owner AS (
            UPDATE chat_participants owner
               SET participant_role = 'viewer',
                   status = 'active',
                   removed_at = NULL
              FROM owner_participant op
              JOIN target_viewer tv
                ON tv.tenant_id = op.tenant_id
               AND tv.chat_id = op.chat_id
             WHERE owner.tenant_id = op.tenant_id
               AND owner.chat_id = op.chat_id
               AND owner.user_id = op.user_id
               AND COALESCE(:participant_role, 'viewer') = 'owner'
            RETURNING owner.*
          ),
          promoted_owner AS (
            UPDATE chat_participants target
               SET participant_role = 'owner',
                   status = 'active',
                   removed_at = NULL
              FROM target_viewer tv
             WHERE target.tenant_id = tv.tenant_id
               AND target.chat_id = tv.chat_id
               AND target.user_id = tv.user_id
               AND COALESCE(:participant_role, 'viewer') = 'owner'
            RETURNING target.*
          ),
          reactivated_viewer AS (
            UPDATE chat_participants target
               SET participant_role = 'viewer',
                   status = 'active',
                   removed_at = NULL
              FROM owner_participant op
             WHERE target.tenant_id = op.tenant_id
               AND target.chat_id = op.chat_id
               AND target.user_id = :user_id
               AND target.participant_role <> 'owner'
               AND COALESCE(:participant_role, 'viewer') = 'viewer'
            RETURNING target.*
          ),
          changed_participants AS (
            SELECT p.*
            FROM promoted_owner p
            UNION ALL
            SELECT p.*
            FROM demoted_owner p
            UNION ALL
            SELECT p.*
            FROM reactivated_viewer p
          ),
          response_participants AS (
            SELECT 1 AS sort_order, p.*
            FROM promoted_owner p
            UNION ALL
            SELECT 2 AS sort_order, p.*
            FROM reactivated_viewer p
          ),
          chat_participant_event AS (
            INSERT INTO chat_participant_events (
              tenant_id, event_id, aggregate_id, aggregate_type, event_seq, event_name,
              occurred_at, actor_user_id, correlation_id, causation_id, idempotency_key, payload_json
            )
            SELECT
              cp.tenant_id,
              gen_random_uuid(),
              concat(cp.chat_id::varchar, ':', cp.user_id),
              'chat_participant',
              COALESCE((
                SELECT max(e.event_seq)
                FROM chat_participant_events e
                WHERE e.tenant_id = cp.tenant_id
                  AND e.aggregate_id = concat(cp.chat_id::varchar, ':', cp.user_id)
              ), 0) + 1,
              'chat.participant.role_updated',
              now(),
              :actor_id,
              NULL,
              NULL,
              NULL,
              json_build_object(
                'chat_id', cp.chat_id,
                'user_id', cp.user_id,
                'participant_role', cp.participant_role,
                'status', cp.status
              )
            FROM changed_participants cp
            RETURNING aggregate_id
          ),
          audit_event AS (
            INSERT INTO audit_events (
              tenant_id, audit_event_id, actor_user_id, event_name, category, resource_id, payload_json, created_at
            )
            SELECT
              cp.tenant_id,
              gen_random_uuid(),
              :actor_id,
              'chat.participant.role_updated',
              'chat_participant',
              concat(cp.chat_id::varchar, ':', cp.user_id),
              json_build_object(
                'chat_id', cp.chat_id,
                'user_id', cp.user_id,
                'participant_role', cp.participant_role,
                'status', cp.status
              ),
              now()
            FROM changed_participants cp
            RETURNING resource_id
          )
          SELECT
            rp.tenant_id,
            rp.chat_id,
            rp.user_id,
            rp.participant_role,
            rp.status,
            rp.added_by_user_id,
            rp.added_at,
            rp.removed_at
          FROM response_participants rp
          JOIN chat_participant_event cpe
            ON cpe.aggregate_id = concat(rp.chat_id::varchar, ':', rp.user_id)
          JOIN audit_event ae
            ON ae.resource_id = concat(rp.chat_id::varchar, ':', rp.user_id)
          ORDER BY rp.sort_order ASC
        `,
        params: {
          actor_id: request.actorId,
          chat_id: request.input.chat_id,
          user_id: request.input.user_id,
          participant_role: request.input.participant_role ?? "viewer"
        }
      };
    },
    map(rows) {
      return { participant: firstRow(rows) };
    }
  },
  removeChatParticipant: {
    notFoundErrorCode: "DSQL_CHAT_PARTICIPANT_NOT_FOUND",
    plan(request) {
      return {
        operationId: "removeChatParticipant",
        resultTable: "chat_participants",
        sql: `
          WITH owner_participant AS (
            SELECT tenant_id, chat_id
            FROM chat_participants
            WHERE user_id = :actor_id
              AND chat_id = :chat_id
              AND participant_role = 'owner'
              AND status = 'active'
          ),
          removed_participant AS (
            UPDATE chat_participants target
               SET status = 'removed',
                   removed_at = now()
              FROM owner_participant op
             WHERE target.tenant_id = op.tenant_id
               AND target.chat_id = op.chat_id
               AND target.user_id = :user_id
               AND target.participant_role = 'viewer'
               AND target.status = 'active'
            RETURNING target.*
          ),
          chat_participant_event AS (
            INSERT INTO chat_participant_events (
              tenant_id, event_id, aggregate_id, aggregate_type, event_seq, event_name,
              occurred_at, actor_user_id, correlation_id, causation_id, idempotency_key, payload_json
            )
            SELECT
              rp.tenant_id,
              gen_random_uuid(),
              concat(rp.chat_id::varchar, ':', rp.user_id),
              'chat_participant',
              COALESCE((
                SELECT max(e.event_seq)
                FROM chat_participant_events e
                WHERE e.tenant_id = rp.tenant_id
                  AND e.aggregate_id = concat(rp.chat_id::varchar, ':', rp.user_id)
              ), 0) + 1,
              'chat.participant.removed',
              now(),
              :actor_id,
              NULL,
              NULL,
              NULL,
              json_build_object(
                'chat_id', rp.chat_id,
                'user_id', rp.user_id,
                'participant_role', rp.participant_role,
                'status', rp.status,
                'removed_at', rp.removed_at
              )
            FROM removed_participant rp
            RETURNING aggregate_id
          ),
          audit_event AS (
            INSERT INTO audit_events (
              tenant_id, audit_event_id, actor_user_id, event_name, category, resource_id, payload_json, created_at
            )
            SELECT
              rp.tenant_id,
              gen_random_uuid(),
              :actor_id,
              'chat.participant.removed',
              'chat_participant',
              concat(rp.chat_id::varchar, ':', rp.user_id),
              json_build_object(
                'chat_id', rp.chat_id,
                'user_id', rp.user_id,
                'participant_role', rp.participant_role,
                'status', rp.status,
                'removed_at', rp.removed_at
              ),
              now()
            FROM removed_participant rp
            RETURNING resource_id
          )
          SELECT rp.*
          FROM removed_participant rp
          JOIN chat_participant_event cpe
            ON cpe.aggregate_id = concat(rp.chat_id::varchar, ':', rp.user_id)
          JOIN audit_event ae
            ON ae.resource_id = concat(rp.chat_id::varchar, ':', rp.user_id)
        `,
        params: {
          actor_id: request.actorId,
          chat_id: request.input.chat_id,
          user_id: request.input.user_id
        }
      };
    },
    map() {
      return undefined;
    }
  },
  listMessages: {
    plan(request) {
      return {
        operationId: "listMessages",
        resultTable: "chat_messages",
        sql: `
          SELECT
            m.tenant_id,
            m.chat_id,
            m.message_id,
            m.parent_message_id,
            m.sender_user_id,
            m.sender_type,
            m.content_text,
            m.run_id,
            m.status,
            m.created_at,
            m.completed_at,
            CASE
              WHEN f.feedback_id IS NULL THEN NULL
              ELSE json_build_object(
                'tenant_id', f.tenant_id,
                'feedback_id', f.feedback_id,
                'chat_id', f.chat_id,
                'message_id', f.message_id,
                'user_id', f.user_id,
                'rating', f.rating,
                'comment', f.comment,
                'problem_type', f.problem_type,
                'created_at', f.created_at
              )
            END AS feedback,
            COALESCE(citations.citations_json, '[]'::json) AS citations
          FROM chat_messages m
          JOIN chat_participants p
            ON p.tenant_id = m.tenant_id
           AND p.chat_id = m.chat_id
           AND p.user_id = :actor_id
           AND p.status = 'active'
          LEFT JOIN message_feedback f
            ON f.tenant_id = m.tenant_id
           AND f.chat_id = m.chat_id
           AND f.message_id = m.message_id
           AND f.user_id = :actor_id
          LEFT JOIN LATERAL (
            SELECT json_agg(
              json_build_object(
                'tenant_id', c.tenant_id,
                'chat_id', c.chat_id,
                'message_id', c.message_id,
                'citation_id', c.citation_id,
                'document_id', c.document_id,
                'version_id', c.version_id,
                'chunk_id', c.chunk_id,
                'display', c.display_json
              )
              ORDER BY c.citation_id ASC
            ) AS citations_json
            FROM citation_records c
            WHERE c.tenant_id = m.tenant_id
              AND c.chat_id = m.chat_id
              AND c.message_id = m.message_id
          ) citations ON TRUE
          WHERE m.chat_id = :chat_id
            AND (
              :after_message_id IS NULL
              OR (m.created_at, m.message_id) > (
                SELECT cursor_message.created_at, cursor_message.message_id
                FROM chat_messages cursor_message
                WHERE cursor_message.tenant_id = m.tenant_id
                  AND cursor_message.chat_id = m.chat_id
                  AND cursor_message.message_id = :after_message_id
              )
            )
          ORDER BY m.created_at ASC, m.message_id ASC
          LIMIT :page_limit_plus_one
        `,
        params: {
          actor_id: request.actorId,
          chat_id: request.input.chat_id,
          after_message_id: request.input.after_message_id ?? null,
          page_limit_plus_one: messagePageLimit(request.input.limit) + 1
        }
      };
    },
    map(rows, request) {
      const limit = messagePageLimit(request.input.limit);
      const messages = rows.slice(0, limit);
      const lastMessage = messages.at(-1) as { message_id?: string } | undefined;
      return {
        messages,
        next_cursor: rows.length > limit ? lastMessage?.message_id ?? null : null
      };
    }
  },
  listMessageEvents: {
    plan(request) {
      return {
        operationId: "listMessageEvents",
        resultTable: "chat_message_events",
        sql: `
          SELECT
            e.tenant_id,
            e.chat_id,
            e.message_id,
            e.event_seq,
            e.event_id,
            e.event_name,
            e.event_type,
            e.payload_json,
            e.created_at
          FROM chat_message_events e
          JOIN chat_participants p
            ON p.tenant_id = e.tenant_id
           AND p.chat_id = e.chat_id
           AND p.user_id = :actor_id
           AND p.status = 'active'
          WHERE e.chat_id = :chat_id
            AND e.message_id = :message_id
            AND e.event_seq > :after_seq
          ORDER BY e.event_seq ASC
        `,
        params: {
          actor_id: request.actorId,
          chat_id: request.input.chat_id,
          message_id: request.input.message_id,
          after_seq: Number(request.input.after_seq ?? 0)
        }
      };
    },
    map(rows) {
      return { events: rows };
    }
  },
  cancelAnswerGeneration: {
    notFoundErrorCode: "DSQL_CANCEL_TARGET_NOT_FOUND",
    plan(request) {
      return {
        operationId: "cancelAnswerGeneration",
        resultTable: "chat_runs",
        sql: `
          WITH cancelable_run AS (
            SELECT
              r.tenant_id,
              r.run_id,
              r.chat_id,
              r.message_id,
              r.requested_by_user_id
            FROM chat_runs r
            JOIN chat_participants p
              ON p.tenant_id = r.tenant_id
             AND p.chat_id = r.chat_id
             AND p.user_id = :actor_id
             AND p.status = 'active'
            WHERE r.chat_id = :chat_id
              AND r.message_id = :message_id
              AND (
                p.participant_role = 'owner'
                OR r.requested_by_user_id = :actor_id
              )
          ),
          canceled_run AS (
            UPDATE chat_runs r
               SET status = 'canceled',
                   completed_at = now(),
                   error_code = NULL
              FROM cancelable_run cr
             WHERE r.tenant_id = cr.tenant_id
               AND r.run_id = cr.run_id
             RETURNING r.*
          ),
          canceled_message AS (
            UPDATE chat_messages m
               SET status = 'canceled',
                   completed_at = now()
              FROM canceled_run cr
             WHERE m.tenant_id = cr.tenant_id
               AND m.chat_id = cr.chat_id
               AND m.message_id = cr.message_id
             RETURNING m.message_id
          ),
          next_event AS (
            SELECT
              cr.tenant_id,
              cr.chat_id,
              cr.message_id,
              COALESCE(MAX(e.event_seq), 0) + 1 AS event_seq,
              cr.run_id
            FROM canceled_run cr
            LEFT JOIN chat_message_events e
              ON e.tenant_id = cr.tenant_id
             AND e.chat_id = cr.chat_id
             AND e.message_id = cr.message_id
            GROUP BY cr.tenant_id, cr.chat_id, cr.message_id, cr.run_id
          )
          INSERT INTO chat_message_events (
            tenant_id, chat_id, message_id, event_seq, event_id, event_name, event_type, payload_json, created_at
          )
          SELECT
            ne.tenant_id,
            ne.chat_id,
            ne.message_id,
            ne.event_seq,
            gen_random_uuid(),
            'chat.run.canceled',
            'final',
            json_build_object('run_id', ne.run_id, 'status', 'canceled', 'reason', :reason),
            now()
          FROM next_event ne
          RETURNING (
            SELECT row_to_json(cr)
            FROM canceled_run cr
          ) AS canceled_run_json
        `,
        params: {
          actor_id: request.actorId,
          chat_id: request.input.chat_id,
          message_id: request.input.message_id,
          reason: request.input.reason ?? null
        }
      };
    },
    map(rows) {
      const row = firstRow(rows) as DbRow<"chat_runs"> & { canceled_run_json?: DbRow<"chat_runs"> };
      const run = row.canceled_run_json ?? row;
      return { message_id: run.message_id, run_id: run.run_id, status: "canceled" };
    }
  },
  createFeedback: {
    notFoundErrorCode: "DSQL_FEEDBACK_TARGET_NOT_FOUND",
    plan(request) {
      return {
        operationId: "createFeedback",
        resultTable: "message_feedback",
        sql: `
          WITH actor AS (
            SELECT tenant_id, user_id
            FROM users
            WHERE user_id = :actor_id
              AND status = 'active'
          ),
          readable_message AS (
            SELECT m.tenant_id, m.chat_id, m.message_id
            FROM chat_messages m
            JOIN chat_participants p
              ON p.tenant_id = m.tenant_id
             AND p.chat_id = m.chat_id
             AND p.user_id = :actor_id
             AND p.status = 'active'
            WHERE m.chat_id = :chat_id
              AND m.message_id = :message_id
              AND m.sender_type = 'assistant'
              AND :rating IN ('positive', 'negative')
          )
          INSERT INTO message_feedback (
            tenant_id, feedback_id, chat_id, message_id, user_id, rating, comment, problem_type, created_at
          )
          SELECT
            a.tenant_id,
            COALESCE(existing.feedback_id, gen_random_uuid()),
            rm.chat_id,
            rm.message_id,
            a.user_id,
            :rating,
            :comment,
            :problem_type,
            COALESCE(existing.created_at, now())
          FROM actor a
          JOIN readable_message rm
            ON rm.tenant_id = a.tenant_id
          LEFT JOIN message_feedback existing
            ON existing.tenant_id = a.tenant_id
           AND existing.chat_id = rm.chat_id
           AND existing.message_id = rm.message_id
           AND existing.user_id = a.user_id
          ON CONFLICT (tenant_id, chat_id, message_id, user_id)
          DO UPDATE SET
            rating = EXCLUDED.rating,
            comment = EXCLUDED.comment,
            problem_type = EXCLUDED.problem_type
          RETURNING *
        `,
        params: {
          actor_id: request.actorId,
          chat_id: request.input.chat_id,
          message_id: request.input.message_id,
          rating: request.input.rating ?? "positive",
          comment: request.input.comment ?? null,
          problem_type: request.input.problem_type ?? null
        }
      };
    },
    map(rows) {
      return { feedback: firstRow(rows) };
    }
  },
  listFavorites: {
    plan(request) {
      return {
        operationId: "listFavorites",
        resultTable: "favorites",
        sql: `
          SELECT f.*
          FROM favorites f
          JOIN users u
            ON u.tenant_id = f.tenant_id
           AND u.user_id = :actor_id
           AND u.status = 'active'
          WHERE f.user_id = u.user_id
          ORDER BY f.created_at DESC
        `,
        params: { actor_id: request.actorId }
      };
    },
    map(rows) {
      return { favorites: rows };
    }
  },
  addFavorite: {
    plan(request) {
      return {
        operationId: "addFavorite",
        resultTable: "favorites",
        sql: `
          WITH actor AS (
            SELECT tenant_id, user_id
            FROM users
            WHERE user_id = :actor_id
              AND status = 'active'
          ),
          readable_chat AS (
            SELECT p.tenant_id, p.chat_id
            FROM chat_participants p
            JOIN actor a
              ON a.tenant_id = p.tenant_id
             AND a.user_id = p.user_id
            WHERE p.chat_id = :chat_id
              AND p.status = 'active'
          ),
          target_message AS (
            SELECT m.tenant_id, m.chat_id, m.message_id
            FROM chat_messages m
            JOIN readable_chat rc
              ON rc.tenant_id = m.tenant_id
             AND rc.chat_id = m.chat_id
            WHERE m.message_id = :message_id
              AND m.sender_type = 'assistant'
          ),
          favorite_scope AS (
            SELECT rc.tenant_id, rc.chat_id, a.user_id
            FROM readable_chat rc
            JOIN actor a
              ON a.tenant_id = rc.tenant_id
            WHERE :message_id IS NULL
               OR EXISTS (
                 SELECT 1
                 FROM target_message tm
                 WHERE tm.tenant_id = rc.tenant_id
                   AND tm.chat_id = rc.chat_id
               )
          ),
          existing_favorite AS (
            SELECT f.*
            FROM favorites f
            JOIN favorite_scope fs
              ON fs.tenant_id = f.tenant_id
             AND fs.user_id = f.user_id
             AND fs.chat_id = f.chat_id
             AND (
               (fs.chat_id IS NOT NULL AND :message_id IS NULL AND f.message_id IS NULL)
               OR f.message_id = :message_id
             )
          ),
          inserted_favorite AS (
            INSERT INTO favorites (
              tenant_id, favorite_id, user_id, chat_id, message_id, created_at
            )
            SELECT
              fs.tenant_id,
              gen_random_uuid(),
              fs.user_id,
              fs.chat_id,
              :message_id,
              now()
            FROM favorite_scope fs
            WHERE NOT EXISTS (SELECT 1 FROM existing_favorite)
            RETURNING *
          )
          SELECT *
          FROM existing_favorite
          UNION ALL
          SELECT *
          FROM inserted_favorite
        `,
        params: {
          actor_id: request.actorId,
          chat_id: request.input.chat_id,
          message_id: request.input.message_id ?? null
        }
      };
    },
    map(rows) {
      return { favorite: firstRow(rows) };
    }
  },
  deleteFavorite: {
    notFoundErrorCode: "DSQL_FAVORITE_NOT_FOUND",
    plan(request) {
      return {
        operationId: "deleteFavorite",
        resultTable: "favorites",
        sql: `
          DELETE FROM favorites f
          USING users u
          WHERE u.tenant_id = f.tenant_id
            AND u.user_id = :actor_id
            AND u.status = 'active'
            AND f.user_id = u.user_id
            AND f.favorite_id = :favorite_id
          RETURNING f.*
        `,
        params: { actor_id: request.actorId, favorite_id: request.input.favorite_id }
      };
    },
    map() {
      return undefined;
    }
  },
  issueWsTicket: {
    status: 201,
    notFoundErrorCode: "DSQL_WS_TICKET_ACTOR_NOT_FOUND",
    plan(request) {
      return {
        operationId: "issueWsTicket",
        resultTable: "ws_tickets",
        sql: `
          WITH actor AS (
            SELECT tenant_id, user_id
            FROM users
            WHERE user_id = :actor_id
              AND status = 'active'
          ),
          created_ticket AS (
            INSERT INTO ws_tickets (
              tenant_id, ticket_id, session_id, user_id, channel_scope_json, status, expires_at, used_at
            )
            SELECT
              a.tenant_id,
              gen_random_uuid()::varchar,
              gen_random_uuid()::varchar,
              a.user_id,
              json_build_object('channels', json_build_array(concat('/', a.user_id, '/chat/*'))),
              'active',
              now() + interval '60 seconds',
              NULL
            FROM actor a
            RETURNING *
          ),
          ws_ticket_event AS (
            INSERT INTO ws_ticket_events (
              tenant_id, event_id, aggregate_id, aggregate_type, event_seq, event_name,
              occurred_at, actor_user_id, correlation_id, causation_id, idempotency_key, payload_json
            )
            SELECT
              t.tenant_id,
              gen_random_uuid(),
              t.ticket_id,
              'ws_ticket',
              1,
              'ws.ticket.issued',
              now(),
              t.user_id,
              NULL,
              NULL,
              concat('ws-ticket:issue:', t.ticket_id),
              json_build_object(
                'ticket_id', t.ticket_id,
                'user_id', t.user_id,
                'channels', t.channel_scope_json -> 'channels',
                'expires_at', t.expires_at
              )
            FROM created_ticket t
            RETURNING aggregate_id
          )
          SELECT t.*
          FROM created_ticket t
          JOIN ws_ticket_event wte
            ON wte.aggregate_id = t.ticket_id
        `,
        params: { actor_id: request.actorId }
      };
    },
    map(rows) {
      const ticket = firstRow(rows) as DbRow<"ws_tickets">;
      return {
        ticket: ticket.ticket_id,
        expires_in_seconds: 60,
        channels: channelScope(ticket.channel_scope_json)
      };
    }
  },
  listPublishedArtifacts: {
    plan(request) {
      return {
        operationId: "listPublishedArtifacts",
        resultTable: "published_artifacts",
        sql: `
          SELECT
            a.tenant_id,
            a.artifact_id,
            a.artifact_type,
            a.title,
            a.source_ref,
            a.s3_prefix,
            a.viewer_path,
            a.version_label,
            a.status,
            a.published_by,
            a.published_at,
            a.updated_at
          FROM published_artifacts a
          JOIN users u
            ON u.tenant_id = a.tenant_id
           AND u.user_id = :actor_id
           AND u.role = 'admin'
           AND u.status = 'active'
          WHERE a.status = 'active'
          ORDER BY a.published_at DESC
        `,
        params: { actor_id: request.actorId }
      };
    },
    map(rows) {
      return { artifacts: rows };
    }
  },
  adminListUsers: {
    plan(request) {
      return {
        operationId: "adminListUsers",
        resultTable: "users",
        sql: `
          WITH actor AS (
            SELECT tenant_id, user_id
            FROM users
            WHERE user_id = :actor_id
              AND role = 'admin'
              AND status = 'active'
          ),
          audit_event AS (
            INSERT INTO audit_events (
              tenant_id, audit_event_id, actor_user_id, event_name, category, resource_id, payload_json, created_at
            )
            SELECT
              a.tenant_id,
              gen_random_uuid(),
              a.user_id,
              'admin.users.listed',
              'admin_user',
              a.tenant_id,
              json_build_object('scope', 'tenant_users'),
              now()
            FROM actor a
            RETURNING actor_user_id
          )
          SELECT
            target.tenant_id,
            target.user_id,
            target.email,
            target.display_name,
            target.role,
            target.department,
            target.employment_type,
            target.status,
            target.created_at,
            target.updated_at
          FROM actor
          JOIN users target
            ON target.tenant_id = actor.tenant_id
          JOIN audit_event ae
            ON ae.actor_user_id = actor.user_id
          ORDER BY target.email ASC
        `,
        params: { actor_id: request.actorId }
      };
    },
    map(rows) {
      return { users: rows };
    }
  },
  adminListDocuments: {
    plan(request) {
      return {
        operationId: "adminListDocuments",
        resultTable: "documents",
        sql: `
          WITH actor AS (
            SELECT tenant_id, user_id
            FROM users
            WHERE user_id = :actor_id
              AND role = 'admin'
              AND status = 'active'
          ),
          audit_event AS (
            INSERT INTO audit_events (
              tenant_id, audit_event_id, actor_user_id, event_name, category, resource_id, payload_json, created_at
            )
            SELECT
              a.tenant_id,
              gen_random_uuid(),
              a.user_id,
              'admin.documents.listed',
              'document',
              a.tenant_id,
              json_build_object('scope', 'tenant_documents'),
              now()
            FROM actor a
            RETURNING actor_user_id
          )
          SELECT
            d.tenant_id,
            d.document_id,
            d.title,
            d.status,
            d.created_by_user_id,
            d.created_at,
            d.updated_at
          FROM documents d
          JOIN actor a
            ON a.tenant_id = d.tenant_id
          JOIN audit_event ae
            ON ae.actor_user_id = a.user_id
          WHERE d.status <> 'deleted'
          ORDER BY d.updated_at DESC
        `,
        params: { actor_id: request.actorId }
      };
    },
    map(rows) {
      return { documents: rows };
    }
  },
  getDocument: {
    notFoundErrorCode: "DSQL_DOCUMENT_NOT_FOUND",
    plan(request) {
      return {
        operationId: "getDocument",
        resultTable: "documents",
        sql: `
          SELECT
            d.tenant_id,
            d.document_id,
            d.title,
            d.status,
            d.created_by_user_id,
            d.created_at,
            d.updated_at,
            COALESCE(
              json_agg(DISTINCT dv.*) FILTER (WHERE dv.version_id IS NOT NULL),
              '[]'::json
            ) AS versions,
            COALESCE(
              json_agg(DISTINCT j.*) FILTER (WHERE j.job_id IS NOT NULL),
              '[]'::json
            ) AS ingestion_jobs,
            COALESCE(
              json_agg(DISTINCT acl.*) FILTER (WHERE acl.acl_scope_id IS NOT NULL),
              '[]'::json
            ) AS acl_entries
          FROM documents d
          JOIN users u
            ON u.tenant_id = d.tenant_id
           AND u.user_id = :actor_id
           AND u.role = 'admin'
           AND u.status = 'active'
          LEFT JOIN document_versions dv
            ON dv.tenant_id = d.tenant_id
           AND dv.document_id = d.document_id
          LEFT JOIN ingestion_jobs j
            ON j.tenant_id = d.tenant_id
           AND j.document_id = d.document_id
          LEFT JOIN document_acl_entries acl
            ON acl.tenant_id = d.tenant_id
           AND acl.document_id = d.document_id
          WHERE d.document_id = :document_id
            AND d.status <> 'deleted'
          GROUP BY d.tenant_id, d.document_id, d.title, d.status, d.created_by_user_id, d.created_at, d.updated_at
          LIMIT 1
        `,
        params: { actor_id: request.actorId, document_id: request.input.document_id }
      };
    },
    map(rows) {
      const row = firstRow(rows) as DbRow<"documents"> & {
        versions?: unknown;
        ingestion_jobs?: unknown;
        acl_entries?: unknown;
      };
      return {
        document: {
          ...row,
          versions: arrayValue(row.versions),
          ingestion_jobs: arrayValue(row.ingestion_jobs),
          acl_entries: arrayValue(row.acl_entries)
        }
      };
    }
  },
  createDocumentVersion: {
    plan(request) {
      return {
        operationId: "createDocumentVersion",
        resultTable: "document_versions",
        sql: `
          WITH actor AS (
            SELECT tenant_id, user_id
            FROM users
            WHERE user_id = :actor_id
              AND role = 'admin'
              AND status = 'active'
          ),
          target_document AS (
            SELECT d.tenant_id, d.document_id, d.title
            FROM documents d
            JOIN actor a
              ON a.tenant_id = d.tenant_id
            WHERE d.document_id = :document_id
              AND d.status <> 'deleted'
          ),
          inserted_version AS (
            INSERT INTO document_versions (
              tenant_id, document_id, version_id, version_label, status,
              raw_s3_uri, metadata_json, created_at
            )
            SELECT
              td.tenant_id,
              td.document_id,
              COALESCE(:version_id, concat('ver-', gen_random_uuid()::text)),
              :version_label,
              'uploaded',
              :raw_s3_uri,
              :metadata_json,
              now()
            FROM target_document td
            ON CONFLICT (tenant_id, document_id, version_id) DO NOTHING
            RETURNING *
          )
          SELECT * FROM inserted_version
        `,
        params: {
          actor_id: request.actorId,
          document_id: request.input.document_id,
          version_id: request.input.version_id,
          version_label: request.input.version_label,
          raw_s3_uri: request.input.raw_s3_uri ?? `s3://saphnexa-dsql/raw/${String(request.input.document_id)}/${String(request.input.version_id)}/${String(request.input.file_name ?? "document.pdf")}`,
          metadata_json: request.input.metadata ?? {
            document_id: request.input.document_id,
            version: request.input.version_id,
            acl_scope: request.input.acl_scope_id,
            status: "uploaded"
          }
        }
      };
    },
    map(rows, request) {
      const version = firstRow(rows) as DbRow<"document_versions">;
      return {
        document_id: version.document_id,
        version_id: version.version_id,
        raw_s3_uri: version.raw_s3_uri,
        job_id: request.input.job_id
      };
    }
  },
  activateDocumentVersion: {
    notFoundErrorCode: "DSQL_DOCUMENT_VERSION_NOT_READY",
    plan(request) {
      return {
        operationId: "activateDocumentVersion",
        resultTable: "document_versions",
        sql: `
          WITH actor AS (
            SELECT tenant_id
            FROM users
            WHERE user_id = :actor_id
              AND role = 'admin'
              AND status = 'active'
          ),
          ready_version AS (
            SELECT dv.tenant_id, dv.document_id, dv.version_id
            FROM document_versions dv
            JOIN actor a
              ON a.tenant_id = dv.tenant_id
            JOIN ingestion_jobs j
              ON j.tenant_id = dv.tenant_id
             AND j.document_id = dv.document_id
             AND j.version_id = dv.version_id
             AND j.status = 'succeeded'
            WHERE dv.document_id = :document_id
              AND dv.version_id = :version_id
          ),
          archive_old AS (
            UPDATE document_versions dv
               SET status = 'archived'
              FROM ready_version rv
             WHERE dv.tenant_id = rv.tenant_id
               AND dv.document_id = rv.document_id
               AND dv.version_id <> rv.version_id
            RETURNING dv.version_id
          )
          UPDATE document_versions dv
             SET status = 'active'
            FROM ready_version rv
           WHERE dv.tenant_id = rv.tenant_id
             AND dv.document_id = rv.document_id
             AND dv.version_id = rv.version_id
          RETURNING dv.*
        `,
        params: { actor_id: request.actorId, document_id: request.input.document_id, version_id: request.input.version_id }
      };
    },
    map(rows) {
      return { version: firstRow(rows) };
    }
  },
  updateDocumentAcl: {
    notFoundErrorCode: "DSQL_DOCUMENT_VERSION_NOT_FOUND",
    plan(request) {
      return {
        operationId: "updateDocumentAcl",
        resultTable: "documents",
        sql: `
          WITH actor AS (
            SELECT tenant_id
            FROM users
            WHERE user_id = :actor_id
              AND role = 'admin'
              AND status = 'active'
          ),
          target_version AS (
            SELECT dv.tenant_id, dv.document_id, dv.version_id
            FROM document_versions dv
            JOIN documents d
              ON d.tenant_id = dv.tenant_id
             AND d.document_id = dv.document_id
             AND d.status <> 'deleted'
            JOIN actor a
              ON a.tenant_id = dv.tenant_id
            WHERE dv.document_id = :document_id
              AND dv.version_id = :version_id
              AND dv.status <> 'deleted'
          ),
          delete_existing_acl AS (
            DELETE FROM document_acl_entries acl
             USING target_version tv
             WHERE acl.tenant_id = tv.tenant_id
               AND acl.document_id = tv.document_id
               AND acl.version_id = tv.version_id
            RETURNING acl.acl_scope_id
          ),
          insert_acl AS (
            INSERT INTO document_acl_entries (
              tenant_id, document_id, version_id, acl_scope_id, effect
            )
            SELECT
              tv.tenant_id,
              tv.document_id,
              tv.version_id,
              :acl_scope_id,
              'allow'
            FROM target_version tv
            RETURNING *
          )
          SELECT
            d.tenant_id,
            d.document_id,
            d.title,
            d.status,
            d.created_by_user_id,
            d.created_at,
            d.updated_at,
            COALESCE(
              json_agg(DISTINCT dv.*) FILTER (WHERE dv.version_id IS NOT NULL),
              '[]'::json
            ) AS versions,
            COALESCE(
              json_agg(DISTINCT j.*) FILTER (WHERE j.job_id IS NOT NULL),
              '[]'::json
            ) AS ingestion_jobs,
            COALESCE(
              json_agg(DISTINCT acl.*) FILTER (WHERE acl.acl_scope_id IS NOT NULL),
              '[]'::json
            ) AS acl_entries
          FROM documents d
          JOIN target_version tv
            ON tv.tenant_id = d.tenant_id
           AND tv.document_id = d.document_id
          LEFT JOIN document_versions dv
            ON dv.tenant_id = d.tenant_id
           AND dv.document_id = d.document_id
          LEFT JOIN ingestion_jobs j
            ON j.tenant_id = d.tenant_id
           AND j.document_id = d.document_id
          LEFT JOIN document_acl_entries acl
            ON acl.tenant_id = d.tenant_id
           AND acl.document_id = d.document_id
          GROUP BY d.tenant_id, d.document_id, d.title, d.status, d.created_by_user_id, d.created_at, d.updated_at
          LIMIT 1
        `,
        params: {
          actor_id: request.actorId,
          document_id: request.input.document_id,
          version_id: request.input.version_id,
          acl_scope_id: request.input.acl_scope_id
        }
      };
    },
    map(rows) {
      const row = firstRow(rows) as DbRow<"documents"> & {
        versions?: unknown;
        ingestion_jobs?: unknown;
        acl_entries?: unknown;
      };
      return {
        document: {
          ...row,
          versions: arrayValue(row.versions),
          ingestion_jobs: arrayValue(row.ingestion_jobs),
          acl_entries: arrayValue(row.acl_entries)
        }
      };
    }
  },
  suspendDocument: {
    notFoundErrorCode: "DSQL_DOCUMENT_NOT_FOUND",
    plan(request) {
      return {
        operationId: "suspendDocument",
        resultTable: "documents",
        sql: `
          WITH actor AS (
            SELECT tenant_id
            FROM users
            WHERE user_id = :actor_id
              AND role = 'admin'
              AND status = 'active'
          ),
          target_document AS (
            UPDATE documents d
               SET status = 'deleted',
                   updated_at = now()
              FROM actor a
             WHERE d.tenant_id = a.tenant_id
               AND d.document_id = :document_id
               AND d.status <> 'deleted'
            RETURNING d.*
          ),
          deleted_versions AS (
            UPDATE document_versions dv
               SET status = 'deleted'
              FROM target_document td
             WHERE dv.tenant_id = td.tenant_id
               AND dv.document_id = td.document_id
            RETURNING dv.*
          )
          SELECT
            td.tenant_id,
            td.document_id,
            td.title,
            td.status,
            td.created_by_user_id,
            td.created_at,
            td.updated_at,
            COALESCE(
              json_agg(DISTINCT dv.*) FILTER (WHERE dv.version_id IS NOT NULL),
              '[]'::json
            ) AS versions,
            COALESCE(
              json_agg(DISTINCT j.*) FILTER (WHERE j.job_id IS NOT NULL),
              '[]'::json
            ) AS ingestion_jobs,
            COALESCE(
              json_agg(DISTINCT acl.*) FILTER (WHERE acl.acl_scope_id IS NOT NULL),
              '[]'::json
            ) AS acl_entries
          FROM target_document td
          LEFT JOIN deleted_versions dv
            ON dv.tenant_id = td.tenant_id
           AND dv.document_id = td.document_id
          LEFT JOIN ingestion_jobs j
            ON j.tenant_id = td.tenant_id
           AND j.document_id = td.document_id
          LEFT JOIN document_acl_entries acl
            ON acl.tenant_id = td.tenant_id
           AND acl.document_id = td.document_id
          GROUP BY td.tenant_id, td.document_id, td.title, td.status, td.created_by_user_id, td.created_at, td.updated_at
          LIMIT 1
        `,
        params: { actor_id: request.actorId, document_id: request.input.document_id }
      };
    },
    map(rows) {
      const row = firstRow(rows) as DbRow<"documents"> & {
        versions?: unknown;
        ingestion_jobs?: unknown;
        acl_entries?: unknown;
      };
      return {
        document: {
          ...row,
          versions: arrayValue(row.versions),
          ingestion_jobs: arrayValue(row.ingestion_jobs),
          acl_entries: arrayValue(row.acl_entries)
        }
      };
    }
  },
  listLlmModels: {
    plan(request) {
      return {
        operationId: "listLlmModels",
        resultTable: "llm_models",
        sql: `
          SELECT
            m.tenant_id,
            m.model_id,
            m.display_name,
            m.provider,
            m.model_type,
            m.capability_json,
            m.status,
            m.visible_to_user,
            m.allowed_role,
            m.default_for_task,
            m.catalog_version
          FROM llm_models m
          JOIN users u
            ON u.user_id = :actor_id
           AND u.status = 'active'
          WHERE m.status = 'active'
            AND (m.visible_to_user = true OR u.role = 'admin')
            AND (m.tenant_id = 'global' OR m.tenant_id = u.tenant_id)
            AND (
              m.allowed_role = u.role
              OR m.allowed_role = 'general_user'
              OR (u.role = 'admin' AND m.allowed_role IN ('admin', 'system'))
            )
          ORDER BY m.default_for_task ASC, m.model_type ASC, m.model_id ASC
        `,
        params: { actor_id: request.actorId }
      };
    },
    map(rows) {
      return { models: rows };
    }
  },
  listEvaluationDatasets: {
    plan(request) {
      return {
        operationId: "listEvaluationDatasets",
        resultTable: "evaluation_datasets",
        sql: `
          SELECT
            d.tenant_id,
            d.dataset_id,
            d.dataset_name,
            d.status,
            d.source_s3_uri,
            d.created_at
          FROM evaluation_datasets d
          JOIN users u
            ON u.tenant_id = d.tenant_id
           AND u.user_id = :actor_id
           AND u.role = 'admin'
           AND u.status = 'active'
          WHERE d.status = 'active'
          ORDER BY d.created_at DESC, d.dataset_id ASC
        `,
        params: { actor_id: request.actorId }
      };
    },
    map(rows) {
      return { datasets: rows };
    }
  },
  startEvaluationRun: {
    notFoundErrorCode: "DSQL_EVALUATION_INPUT_NOT_FOUND",
    plan(request) {
      return {
        operationId: "startEvaluationRun",
        resultTable: "evaluation_runs",
        sql: `
          WITH admin_actor AS (
            SELECT tenant_id, user_id
            FROM users
            WHERE user_id = :actor_id
              AND role = 'admin'
              AND status = 'active'
          ),
          target_dataset AS (
            SELECT d.tenant_id, d.dataset_id
            FROM evaluation_datasets d
            JOIN admin_actor a
              ON a.tenant_id = d.tenant_id
            WHERE d.dataset_id = :dataset_id
              AND d.status = 'active'
          ),
          target_model AS (
            SELECT m.tenant_id, m.model_id
            FROM llm_models m
            JOIN admin_actor a
              ON m.tenant_id IN ('global', a.tenant_id)
            WHERE m.model_id = COALESCE(NULLIF(:model_id, ''), 'logical-chat-default')
              AND m.status = 'active'
              AND m.model_type IN ('chat', 'judge')
              AND (m.visible_to_user = true OR m.allowed_role = 'admin')
              AND m.allowed_role IN ('general_user', 'admin')
          )
          INSERT INTO evaluation_runs (
            tenant_id,
            evaluation_run_id,
            dataset_id,
            model_id,
            prompt_version,
            retrieval_config_json,
            artifact_s3_prefix,
            status,
            metrics_json,
            created_by_user_id
          )
          SELECT
            a.tenant_id,
            'eval-' || gen_random_uuid()::text,
            td.dataset_id,
            tm.model_id,
            'rag-chat-v1',
            json_build_object('top_k', 10),
            's3://saphnexa-local/evaluation/' || td.dataset_id || '/',
            'succeeded',
            json_build_object(
              'retrieval', json_build_object('recall_at_10', 0.86),
              'generation', json_build_object('groundedness', 0.91),
              'end_to_end', json_build_object('refusal_accuracy', 0.95)
            ),
            a.user_id
          FROM admin_actor a
          JOIN target_dataset td
            ON td.tenant_id = a.tenant_id
          JOIN target_model tm
            ON tm.tenant_id IN ('global', a.tenant_id)
          RETURNING *
        `,
        params: {
          actor_id: request.actorId,
          dataset_id: request.input.dataset_id,
          model_id: request.input.model_id ?? ""
        }
      };
    },
    map(rows) {
      return { evaluation_run: firstRow(rows) };
    }
  },
  getEvaluationRun: {
    notFoundErrorCode: "DSQL_EVALUATION_RUN_NOT_FOUND",
    plan(request) {
      return {
        operationId: "getEvaluationRun",
        resultTable: "evaluation_runs",
        sql: `
          SELECT
            r.tenant_id,
            r.evaluation_run_id,
            r.dataset_id,
            r.model_id,
            r.prompt_version,
            r.retrieval_config_json,
            r.artifact_s3_prefix,
            r.status,
            r.metrics_json,
            r.created_by_user_id,
            COALESCE(
              json_agg(i ORDER BY i.case_id ASC) FILTER (WHERE i.case_id IS NOT NULL),
              '[]'::json
            ) AS items
          FROM evaluation_runs r
          JOIN users u
            ON u.tenant_id = r.tenant_id
           AND u.user_id = :actor_id
           AND u.role = 'admin'
           AND u.status = 'active'
          LEFT JOIN evaluation_run_items i
            ON i.tenant_id = r.tenant_id
           AND i.evaluation_run_id = r.evaluation_run_id
          WHERE r.evaluation_run_id = :evaluation_run_id
          GROUP BY
            r.tenant_id,
            r.evaluation_run_id,
            r.dataset_id,
            r.model_id,
            r.prompt_version,
            r.retrieval_config_json,
            r.artifact_s3_prefix,
            r.status,
            r.metrics_json,
            r.created_by_user_id
          LIMIT 1
        `,
        params: {
          actor_id: request.actorId,
          evaluation_run_id: request.input.evaluation_run_id
        }
      };
    },
    map(rows) {
      const row = firstRow(rows) as DbRow<"evaluation_runs"> & { items?: unknown };
      const { items, ...evaluation_run } = row;
      return {
        evaluation_run,
        items: arrayValue(items)
      };
    }
  },
  getIngestionJob: {
    notFoundErrorCode: "DSQL_INGESTION_JOB_NOT_FOUND",
    plan(request) {
      return {
        operationId: "getIngestionJob",
        resultTable: "ingestion_jobs",
        sql: `
          SELECT
            j.tenant_id,
            j.job_id,
            j.document_id,
            j.version_id,
            j.status,
            CASE
              WHEN j.status IN ('succeeded', 'active') THEN 100
              WHEN j.status IN ('running', 'streaming') THEN 50
              WHEN j.status = 'queued' THEN 10
              ELSE 0
            END AS progress_percent,
            j.raw_s3_uri,
            j.parsed_s3_prefix,
            j.error_code,
            j.created_at
          FROM ingestion_jobs j
          JOIN users u
            ON u.tenant_id = j.tenant_id
           AND u.user_id = :actor_id
           AND u.role = 'admin'
           AND u.status = 'active'
          WHERE j.job_id = :job_id
          LIMIT 1
        `,
        params: { actor_id: request.actorId, job_id: request.input.job_id }
      };
    },
    map(rows) {
      const job = firstRow(rows) as DbRow<"ingestion_jobs"> & { progress_percent?: number };
      return { job: { ...job, retryable: job.status === "failed" } };
    }
  },
  retryIngestionJob: {
    notFoundErrorCode: "DSQL_INGESTION_JOB_NOT_FOUND",
    plan(request) {
      return {
        operationId: "retryIngestionJob",
        resultTable: "ingestion_jobs",
        sql: `
          WITH admin_actor AS (
            SELECT tenant_id, user_id
            FROM users
            WHERE user_id = :actor_id
              AND role = 'admin'
              AND status = 'active'
          )
          UPDATE ingestion_jobs j
             SET status = 'queued',
                 error_code = NULL
            FROM admin_actor a
           WHERE j.tenant_id = a.tenant_id
             AND j.job_id = :job_id
             AND j.status = 'failed'
          RETURNING
            j.tenant_id,
            j.job_id,
            j.document_id,
            j.version_id,
            j.status,
            10 AS progress_percent,
            j.raw_s3_uri,
            j.parsed_s3_prefix,
            j.error_code,
            j.created_at
        `,
        params: { actor_id: request.actorId, job_id: request.input.job_id }
      };
    },
    map(rows) {
      const job = firstRow(rows) as DbRow<"ingestion_jobs"> & { progress_percent?: number };
      return { job: { ...job, retryable: job.status === "failed" } };
    }
  }
} satisfies Partial<Record<ApiOperationId, DsqlOperationMapping>>;

function isMappedOperationId(operationId: string): operationId is keyof typeof dsqlOperationMappings {
  return operationId in dsqlOperationMappings;
}

function repositoryError(status: number, error_code: string, message: string, details: Record<string, unknown>): ApiRepositoryResponse {
  return {
    status,
    body: {
      error_code,
      message,
      details
    }
  };
}

function firstRow(rows: Array<DbRow<DbTableName>>): DbRow<DbTableName> {
  return rows[0] as DbRow<DbTableName>;
}

function messagePageLimit(limit: unknown): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) return 50;
  return Math.max(1, Math.min(100, Math.trunc(limit)));
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function channelScope(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const channels = (value as { channels?: unknown }).channels;
  return Array.isArray(channels) ? channels.filter((channel): channel is string => typeof channel === "string") : [];
}
