import { canManageAdmin, canReadChat, canWriteChat, chatEventNames, participantRoles, roles, statuses } from "./index.js";
import { llmModels } from "../../model-catalog/src/models.js";

const baseTime = "2026-05-27T00:00:00.000Z";

export function createLocalStore() {
  const state = {
    counters: new Map(),
    tenants: [{ tenant_id: "tenant-local", tenant_name: "Saphnexa Local", status: statuses.ACTIVE, created_at: baseTime, updated_at: baseTime }],
    users: [
      user("user-owner", roles.GENERAL_USER, "owner@example.test", "Local Owner"),
      user("user-viewer", roles.GENERAL_USER, "viewer@example.test", "Local Viewer"),
      user("user-outsider", roles.GENERAL_USER, "outsider@example.test", "Local Outsider"),
      user("admin-1", roles.ADMIN, "admin@example.test", "Local Admin")
    ],
    chat_sessions: [],
    chat_participants: [],
    chat_messages: [],
    chat_runs: [],
    chat_message_events: [],
    citation_records: [],
    message_feedback: [],
    favorites: [],
    documents: [],
    document_versions: [],
    document_acl_entries: [],
    ingestion_jobs: [],
    user_import_jobs: [],
    user_import_rows: [],
    evaluation_datasets: [{
      tenant_id: "tenant-local",
      dataset_id: "dataset-local-golden",
      dataset_name: "local golden dataset",
      status: statuses.ACTIVE,
      source_s3_uri: "s3://saphnexa-local/evaluation/golden.jsonl",
      created_at: baseTime
    }],
    evaluation_runs: [],
    published_artifacts: [
      artifact("artifact-docs-latest", "design_doc_html", "設計書サイト latest", "/admin/docs/latest/"),
      artifact("artifact-allure-latest", "allure_report", "Allure レポート latest", "/admin/test-reports/allure/latest/")
    ],
    tool_invocations: []
  };

  return {
    state,
    getCurrentUser,
    createChat,
    addParticipant,
    updateParticipant,
    removeParticipant,
    listChats,
    getChat,
    submitQuestion,
    listEvents,
    addFavorite,
    listFavorites,
    startUserImport,
    createDocument,
    createDocumentVersion,
    activateDocumentVersion,
    startEvaluationRun,
    listAdminArtifacts,
    listLlmModels: () => llmModels.filter((item) => item.status === statuses.ACTIVE)
  };

  function getCurrentUser(user_id) {
    return state.users.find((item) => item.user_id === user_id && item.status === statuses.ACTIVE);
  }

  function createChat(actor, input = {}) {
    requireActiveUser(actor);
    const chat_id = nextId("chat");
    const chat = {
      tenant_id: actor.tenant_id,
      chat_id,
      title: input.title || "新規チャット",
      status: statuses.ACTIVE,
      last_message_at: null,
      created_by_user_id: actor.user_id,
      created_at: now(),
      updated_at: now(),
      deleted_at: null
    };
    state.chat_sessions.push(chat);
    state.chat_participants.push({
      tenant_id: actor.tenant_id,
      chat_id,
      user_id: actor.user_id,
      participant_role: participantRoles.OWNER,
      status: statuses.ACTIVE,
      added_by_user_id: actor.user_id,
      added_at: now(),
      removed_at: null
    });
    return chat;
  }

  function addParticipant(actor, chat_id, input) {
    requireOwner(actor, chat_id);
    const target = getCurrentUser(input.user_id);
    if (!target) throw forbidden("USER_NOT_FOUND", "共有先ユーザーが存在しない。");
    const existing = participant(chat_id, target.user_id);
    if (existing) {
      existing.status = statuses.ACTIVE;
      existing.participant_role = participantRoles.VIEWER;
      existing.removed_at = null;
      return existing;
    }
    const row = {
      tenant_id: actor.tenant_id,
      chat_id,
      user_id: target.user_id,
      participant_role: participantRoles.VIEWER,
      status: statuses.ACTIVE,
      added_by_user_id: actor.user_id,
      added_at: now(),
      removed_at: null
    };
    state.chat_participants.push(row);
    return row;
  }

  function updateParticipant(actor, chat_id, user_id, input = {}) {
    requireOwner(actor, chat_id);
    const row = participant(chat_id, user_id);
    if (!row || row.status !== statuses.ACTIVE) throw forbidden("PARTICIPANT_NOT_FOUND", "参加者が存在しない。");
    if (input.participant_role && input.participant_role !== participantRoles.VIEWER) {
      throw forbidden("UNSUPPORTED_PARTICIPANT_ROLE", "初期構成では共有先は viewer 固定。");
    }
    row.participant_role = participantRoles.VIEWER;
    return row;
  }

  function removeParticipant(actor, chat_id, user_id) {
    requireOwner(actor, chat_id);
    const row = participant(chat_id, user_id);
    if (!row || row.participant_role === participantRoles.OWNER) throw forbidden("PARTICIPANT_REMOVE_FORBIDDEN", "owner は削除できない。");
    row.status = statuses.REMOVED;
    row.removed_at = now();
    return true;
  }

  function listChats(actor) {
    requireActiveUser(actor);
    const visibleIds = state.chat_participants
      .filter((item) => item.user_id === actor.user_id && canReadChat(item))
      .map((item) => item.chat_id);
    return state.chat_sessions.filter((item) => visibleIds.includes(item.chat_id) && item.status !== statuses.DELETED);
  }

  function getChat(actor, chat_id) {
    requireReader(actor, chat_id);
    const chat = state.chat_sessions.find((item) => item.chat_id === chat_id && item.status !== statuses.DELETED);
    return {
      ...chat,
      participants: state.chat_participants.filter((item) => item.chat_id === chat_id && item.status === statuses.ACTIVE),
      messages: state.chat_messages.filter((item) => item.chat_id === chat_id)
    };
  }

  function submitQuestion(actor, chat_id, input, ragAdapter) {
    requireOwner(actor, chat_id);
    const message_id = nextId("msg");
    const run_id = nextId("run");
    const userMessage = {
      tenant_id: actor.tenant_id,
      chat_id,
      message_id: nextId("msg-user"),
      parent_message_id: null,
      sender_user_id: actor.user_id,
      sender_type: roles.GENERAL_USER,
      content_text: input.question,
      run_id: null,
      status: statuses.SUCCEEDED,
      created_at: now(),
      completed_at: now()
    };
    const assistantMessage = {
      tenant_id: actor.tenant_id,
      chat_id,
      message_id,
      parent_message_id: userMessage.message_id,
      sender_user_id: null,
      sender_type: "assistant",
      content_text: "",
      run_id,
      status: statuses.QUEUED,
      created_at: now(),
      completed_at: null
    };
    const run = {
      tenant_id: actor.tenant_id,
      run_id,
      chat_id,
      message_id,
      requested_by_user_id: actor.user_id,
      retrieval_policy_json: input.retrieval_policy || { top_k: 10, allowed_acl_scope_ids: [`user:${actor.user_id}`] },
      model_id: input.model_id || "logical-chat-default",
      prompt_version: "rag-chat-v1",
      status: statuses.QUEUED,
      started_at: null,
      completed_at: null,
      error_code: null
    };
    state.chat_messages.push(userMessage, assistantMessage);
    state.chat_runs.push(run);
    appendEvent(actor.tenant_id, chat_id, message_id, "chat.run.started", "progress", { run_id, status: statuses.QUEUED });

    if (ragAdapter) {
      completeQuestion(actor, assistantMessage, run, input.question, ragAdapter);
    }
    return { message_id, run_id, status: statuses.QUEUED };
  }

  function completeQuestion(actor, message, run, question, ragAdapter) {
    run.status = statuses.RUNNING;
    run.started_at = now();
    message.status = statuses.RUNNING;
    appendEvent(actor.tenant_id, run.chat_id, run.message_id, "chat.retrieval.started", "progress", { run_id: run.run_id });
    const result = ragAdapter.answer({ question, actor, run, store: state });
    appendEvent(actor.tenant_id, run.chat_id, run.message_id, "chat.retrieval.completed", "progress", {
      run_id: run.run_id,
      retrieved_count: result.retrieved_count,
      allowed_count: result.allowed_count,
      denied_count: result.denied_count
    });
    appendEvent(actor.tenant_id, run.chat_id, run.message_id, "chat.generation.started", "progress", { run_id: run.run_id });
    if (result.refusal) {
      message.content_text = result.answer_text;
      message.status = statuses.SUCCEEDED;
      run.status = statuses.SUCCEEDED;
      appendEvent(actor.tenant_id, run.chat_id, run.message_id, "chat.message.final_ready", "final", {
        run_id: run.run_id,
        answer_available: true,
        citation_count: 0,
        refusal: true
      });
    } else {
      for (const citation of result.citations) {
        state.citation_records.push({ ...citation, tenant_id: actor.tenant_id, chat_id: run.chat_id, message_id: run.message_id });
      }
      message.content_text = result.answer_text;
      message.status = statuses.SUCCEEDED;
      run.status = statuses.SUCCEEDED;
      appendEvent(actor.tenant_id, run.chat_id, run.message_id, "chat.message.partial_ready", "partial", {
        run_id: run.run_id,
        delta_available: true
      });
      appendEvent(actor.tenant_id, run.chat_id, run.message_id, "chat.message.final_ready", "final", {
        run_id: run.run_id,
        answer_available: true,
        citation_count: result.citations.length,
        refusal: false
      });
    }
    run.completed_at = now();
    message.completed_at = now();
  }

  function listEvents(actor, chat_id, message_id, after_seq = 0) {
    requireReader(actor, chat_id);
    return state.chat_message_events
      .filter((item) => item.chat_id === chat_id && item.message_id === message_id && item.event_seq > after_seq)
      .sort((a, b) => a.event_seq - b.event_seq);
  }

  function addFavorite(actor, input) {
    requireActiveUser(actor);
    if (input.chat_id) requireReader(actor, input.chat_id);
    const favorite = {
      tenant_id: actor.tenant_id,
      favorite_id: nextId("fav"),
      user_id: actor.user_id,
      chat_id: input.chat_id || null,
      message_id: input.message_id || null,
      created_at: now()
    };
    state.favorites.push(favorite);
    return favorite;
  }

  function listFavorites(actor) {
    requireActiveUser(actor);
    return state.favorites.filter((item) => item.user_id === actor.user_id);
  }

  function startUserImport(actor, rows) {
    requireAdmin(actor);
    const import_id = nextId("import");
    const job = { tenant_id: actor.tenant_id, import_id, status: statuses.SUCCEEDED, result_s3_prefix: `s3://saphnexa-local/user-import/${import_id}/`, created_by_user_id: actor.user_id };
    state.user_import_jobs.push(job);
    rows.forEach((row, index) => state.user_import_rows.push({ tenant_id: actor.tenant_id, import_id, row_number: index + 1, status: row.email ? statuses.SUCCEEDED : statuses.FAILED, error_message: row.email ? null : "email is required" }));
    return job;
  }

  function createDocument(actor, input) {
    requireAdmin(actor);
    const document_id = nextId("doc");
    const version_id = nextId("ver");
    const job_id = nextId("ing");
    const raw_s3_uri = `s3://saphnexa-local/raw/${document_id}/${version_id}/${input.file_name || "document.pdf"}`;
    state.documents.push({ tenant_id: actor.tenant_id, document_id, title: input.title, status: statuses.ACTIVE, created_by_user_id: actor.user_id, created_at: now(), updated_at: now() });
    state.document_versions.push({ tenant_id: actor.tenant_id, document_id, version_id, version_label: input.version_label || "v1", status: "uploaded", raw_s3_uri, metadata_json: input.metadata || {}, created_at: now() });
    state.document_acl_entries.push({ tenant_id: actor.tenant_id, document_id, version_id, acl_scope_id: input.acl_scope_id || `user:${actor.user_id}`, effect: "allow" });
    state.ingestion_jobs.push({ tenant_id: actor.tenant_id, job_id, document_id, version_id, status: statuses.QUEUED, raw_s3_uri, parsed_s3_prefix: `s3://saphnexa-local/parsed/${document_id}/${version_id}/` });
    return { document_id, version_id, job_id, raw_s3_uri };
  }

  function createDocumentVersion(actor, document_id, input) {
    requireAdmin(actor);
    if (!state.documents.find((item) => item.document_id === document_id)) throw forbidden("DOCUMENT_NOT_FOUND", "文書が存在しない。");
    return createDocument(actor, { ...input, title: state.documents.find((item) => item.document_id === document_id).title });
  }

  function activateDocumentVersion(actor, document_id, version_id) {
    requireAdmin(actor);
    for (const version of state.document_versions.filter((item) => item.document_id === document_id)) {
      version.status = version.version_id === version_id ? statuses.ACTIVE : statuses.ARCHIVED;
    }
    return state.document_versions.find((item) => item.document_id === document_id && item.version_id === version_id);
  }

  function startEvaluationRun(actor, input = {}) {
    requireAdmin(actor);
    const evaluation_run_id = nextId("eval");
    const run = {
      tenant_id: actor.tenant_id,
      evaluation_run_id,
      dataset_id: input.dataset_id || "dataset-local-golden",
      model_id: input.model_id || "logical-chat-default",
      prompt_version: "rag-chat-v1",
      retrieval_config_json: { top_k: 10 },
      artifact_s3_prefix: `s3://saphnexa-local/evaluation/${evaluation_run_id}/`,
      status: statuses.SUCCEEDED,
      metrics_json: { retrieval: { recall_at_10: 0.86 }, generation: { groundedness: 0.91 }, end_to_end: { refusal_accuracy: 0.95 } },
      created_by_user_id: actor.user_id
    };
    state.evaluation_runs.push(run);
    return run;
  }

  function listAdminArtifacts(actor) {
    requireAdmin(actor);
    return state.published_artifacts;
  }

  function appendEvent(tenant_id, chat_id, message_id, event_name, event_type, payload_json) {
    if (!chatEventNames.includes(event_name)) throw new Error(`unknown chat event ${event_name}`);
    const event_seq = state.chat_message_events.filter((item) => item.chat_id === chat_id && item.message_id === message_id).length + 1;
    const event = {
      tenant_id,
      chat_id,
      message_id,
      event_seq,
      event_id: nextId("evt"),
      event_name,
      event_type,
      payload_json,
      created_at: now()
    };
    state.chat_message_events.push(event);
    return event;
  }

  function participant(chat_id, user_id) {
    return state.chat_participants.find((item) => item.chat_id === chat_id && item.user_id === user_id);
  }

  function requireActiveUser(actor) {
    if (!actor || actor.status !== statuses.ACTIVE) throw forbidden("UNAUTHENTICATED", "認証が必要。", 401);
  }

  function requireAdmin(actor) {
    requireActiveUser(actor);
    if (!canManageAdmin(actor)) throw forbidden("ADMIN_REQUIRED", "管理者権限が必要。");
  }

  function requireReader(actor, chat_id) {
    requireActiveUser(actor);
    if (!canReadChat(participant(chat_id, actor.user_id))) throw forbidden("CHAT_READ_FORBIDDEN", "チャット参加者のみ参照できる。");
  }

  function requireOwner(actor, chat_id) {
    requireActiveUser(actor);
    if (!canWriteChat(participant(chat_id, actor.user_id))) throw forbidden("CHAT_WRITE_FORBIDDEN", "owner のみ操作できる。");
  }

  function nextId(prefix) {
    const current = (state.counters.get(prefix) || 0) + 1;
    state.counters.set(prefix, current);
    return `${prefix}-${String(current).padStart(4, "0")}`;
  }
}

function user(user_id, role, email, display_name) {
  return { tenant_id: "tenant-local", user_id, email, display_name, role, department: "local", employment_type: "employee", status: statuses.ACTIVE, created_at: baseTime, updated_at: baseTime };
}

function artifact(artifact_id, artifact_type, title, viewer_path) {
  return {
    tenant_id: "tenant-local",
    artifact_id,
    artifact_type,
    title,
    version_label: "local",
    source_ref: "local-fixture",
    s3_bucket: "saphnexa-local-admin-artifacts",
    s3_prefix: viewer_path.replace(/^\/admin\//, "admin/"),
    viewer_path,
    status: "published",
    checksum: "local",
    published_by: "local-ci",
    published_at: baseTime,
    expires_at: null,
    created_at: baseTime,
    updated_at: baseTime
  };
}

function now() {
  return baseTime;
}

function forbidden(error_code, message, status = 403) {
  const error = new Error(message);
  error.status = status;
  error.error_code = error_code;
  return error;
}
