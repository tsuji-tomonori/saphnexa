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
        status: 200,
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
