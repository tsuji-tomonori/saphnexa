import { adminEventNames, canManageAdmin, canReadChat, canWriteChat, chatEventNames, participantRoles, roles, statuses } from "./index.js";
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
    admin_events: [],
    audit_events: [],
    ws_tickets: [],
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
      artifact("artifact-docs-latest", "design_doc_html", "設計書サイト latest", "/admin/docs/latest/", "dist/admin/docs/latest/manifest.json"),
      artifact("artifact-docs-v0-16", "design_doc_html", "設計書サイト v0.16", "/admin/docs/versions/v0.16/", "dist/admin/docs/versions/v0.16/manifest.json"),
      artifact("artifact-docs-v0-17", "design_doc_html", "設計書サイト v0.17", "/admin/docs/versions/v0.17/", "dist/admin/docs/versions/v0.17/manifest.json"),
      artifact("artifact-allure-latest", "allure_report", "Allure レポート latest", "/admin/test-reports/allure/latest/", "dist/admin/test-reports/allure/latest/manifest.json")
    ],
    tool_invocations: []
  };

  return {
    state,
    getCurrentUser,
    createChat,
    updateChat,
    deleteChat,
    addParticipant,
    updateParticipant,
    removeParticipant,
    listParticipants,
    listMessages,
    listChats,
    getChat,
    submitQuestion,
    listEvents,
    createFeedback,
    addFavorite,
    deleteFavorite,
    listFavorites,
    listAdminUsers,
    startUserImport,
    listDocuments,
    getDocument,
    getIngestionJob,
    createDocument,
    createDocumentVersion,
    activateDocumentVersion,
    updateDocumentAcl,
    suspendDocument,
    retryIngestionJob,
    issueArtifactAccessCookie,
    issueWsTicket,
    consumeWsTicket,
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

  function updateChat(actor, chat_id, input = {}) {
    requireOwner(actor, chat_id);
    const chat = activeChat(actor, chat_id);
    const title = typeof input.title === "string" ? input.title.trim() : "";
    if (title) {
      chat.title = title;
    }
    chat.updated_at = now();
    return chat;
  }

  function deleteChat(actor, chat_id) {
    requireOwner(actor, chat_id);
    const chat = activeChat(actor, chat_id);
    const deletedAt = now();
    chat.status = statuses.DELETED;
    chat.deleted_at = deletedAt;
    chat.updated_at = deletedAt;
    for (const row of state.chat_participants.filter((item) => item.tenant_id === actor.tenant_id && item.chat_id === chat_id && item.status === statuses.ACTIVE)) {
      row.status = statuses.REMOVED;
      row.removed_at = deletedAt;
    }
    return true;
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
    recordAuditEvent(actor, "chat.participant.added", "chat_share", chat_id, {
      target_user_id: target.user_id,
      participant_role: row.participant_role
    });
    return row;
  }

  function updateParticipant(actor, chat_id, user_id, input = {}) {
    requireOwner(actor, chat_id);
    const row = participant(chat_id, user_id);
    if (!row || row.participant_role === participantRoles.OWNER) throw forbidden("PARTICIPANT_NOT_FOUND", "参加者が存在しない。");
    if (input.participant_role && input.participant_role !== participantRoles.VIEWER) {
      throw forbidden("UNSUPPORTED_PARTICIPANT_ROLE", "初期構成では共有先は viewer 固定。");
    }
    row.participant_role = participantRoles.VIEWER;
    row.status = statuses.ACTIVE;
    row.removed_at = null;
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

  function listParticipants(actor, chat_id) {
    requireReader(actor, chat_id);
    return state.chat_participants
      .filter((item) => item.tenant_id === actor.tenant_id && item.chat_id === chat_id && item.status === statuses.ACTIVE)
      .sort((a, b) => a.added_at.localeCompare(b.added_at));
  }

  function listMessages(actor, chat_id) {
    requireReader(actor, chat_id);
    return state.chat_messages
      .filter((item) => item.tenant_id === actor.tenant_id && item.chat_id === chat_id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
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
    const chat = state.chat_sessions.find((item) => item.tenant_id === actor.tenant_id && item.chat_id === chat_id && item.status !== statuses.DELETED);
    if (!chat) throw forbidden("CHAT_NOT_FOUND", "チャットが存在しない。", 404);
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
      failure_injection: input.failure_injection || null,
      status: statuses.QUEUED,
      started_at: null,
      completed_at: null,
      error_code: null,
      retryable: false
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
    try {
      const toolCountBefore = state.tool_invocations.length;
      appendEvent(actor.tenant_id, run.chat_id, run.message_id, "chat.retrieval.started", "progress", { run_id: run.run_id });
      if (run.failure_injection === "retrieval") throw asyncFailure("RAG_RETRIEVAL_FAILED", "retrieval failure injection");
      const result = ragAdapter.answer({ question, actor, run, store: state });
      for (const invocation of state.tool_invocations.slice(toolCountBefore)) {
        recordAuditEvent(actor, "tool.invocation.recorded", "tools_execution", invocation.invocation_id, {
          tool_name: invocation.tool_name,
          run_id: invocation.run_id
        });
      }
      appendEvent(actor.tenant_id, run.chat_id, run.message_id, "chat.retrieval.completed", "progress", {
        run_id: run.run_id,
        retrieved_count: result.retrieved_count,
        allowed_count: result.allowed_count,
        denied_count: result.denied_count
      });
      appendEvent(actor.tenant_id, run.chat_id, run.message_id, "chat.generation.started", "progress", { run_id: run.run_id });
      if (run.failure_injection === "generation") throw asyncFailure("RAG_GENERATION_FAILED", "generation failure injection");
      if (result.refusal) {
        message.content_text = result.answer_text;
        message.status = statuses.SUCCEEDED;
        run.status = statuses.SUCCEEDED;
        if (run.failure_injection === "worker_notify") throw asyncFailure("WORKER_NOTIFY_FAILED", "worker notification failure injection");
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
        if (run.failure_injection === "worker_notify") throw asyncFailure("WORKER_NOTIFY_FAILED", "worker notification failure injection");
        appendEvent(actor.tenant_id, run.chat_id, run.message_id, "chat.message.final_ready", "final", {
          run_id: run.run_id,
          answer_available: true,
          citation_count: result.citations.length,
          citations: result.citations.map((citation) => ({
            citation_id: citation.citation_id,
            document_id: citation.document_id,
            version_id: citation.version_id,
            chunk_id: citation.chunk_id,
            display: citation.display
          })),
          refusal: false
        });
      }
    } catch (error) {
      markChatRunFailed(actor, message, run, error);
    }
    run.completed_at = now();
    message.completed_at = now();
  }

  function markChatRunFailed(actor, message, run, error) {
    const error_code = error.error_code || "CHAT_RUN_FAILED";
    message.status = statuses.FAILED;
    run.status = statuses.FAILED;
    run.error_code = error_code;
    run.retryable = true;
    appendEvent(actor.tenant_id, run.chat_id, run.message_id, "chat.run.failed", "error", {
      run_id: run.run_id,
      error_code,
      retryable: true
    });
  }

  function listEvents(actor, chat_id, message_id, after_seq = 0) {
    requireReader(actor, chat_id);
    return state.chat_message_events
      .filter((item) => item.chat_id === chat_id && item.message_id === message_id && item.event_seq > after_seq)
      .sort((a, b) => a.event_seq - b.event_seq);
  }

  function createFeedback(actor, chat_id, message_id, input = {}) {
    requireReader(actor, chat_id);
    const message = state.chat_messages.find((item) => item.tenant_id === actor.tenant_id && item.chat_id === chat_id && item.message_id === message_id);
    if (!message || message.sender_type !== "assistant") throw forbidden("MESSAGE_NOT_FOUND", "フィードバック対象の回答が存在しない。", 404);
    const rating = input.rating || "positive";
    if (!["positive", "negative"].includes(rating)) throw forbidden("FEEDBACK_RATING_INVALID", "フィードバック評価が不正。", 400);
    const existing = state.message_feedback.find((item) => item.tenant_id === actor.tenant_id && item.chat_id === chat_id && item.message_id === message_id && item.user_id === actor.user_id);
    if (existing) {
      existing.rating = rating;
      existing.comment = input.comment || null;
      existing.problem_type = input.problem_type || null;
      return existing;
    }
    const feedback = {
      tenant_id: actor.tenant_id,
      feedback_id: nextId("feedback"),
      chat_id,
      message_id,
      user_id: actor.user_id,
      rating,
      comment: input.comment || null,
      problem_type: input.problem_type || null,
      created_at: now()
    };
    state.message_feedback.push(feedback);
    appendEvent(actor.tenant_id, chat_id, message_id, "chat.feedback.recorded", "progress", {
      feedback_id: feedback.feedback_id,
      rating: feedback.rating
    });
    return feedback;
  }

  function addFavorite(actor, input) {
    requireActiveUser(actor);
    if (input.chat_id) requireReader(actor, input.chat_id);
    if (!input.chat_id && input.message_id) throw forbidden("FAVORITE_CHAT_REQUIRED", "回答のお気に入りにはチャットIDが必要。", 400);
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

  function deleteFavorite(actor, favorite_id) {
    requireActiveUser(actor);
    const favorite = state.favorites.find((item) => item.tenant_id === actor.tenant_id && item.favorite_id === favorite_id);
    if (!favorite || favorite.user_id !== actor.user_id) throw forbidden("FAVORITE_NOT_FOUND", "お気に入りが存在しない。", 404);
    state.favorites = state.favorites.filter((item) => !(item.tenant_id === actor.tenant_id && item.favorite_id === favorite_id));
    return true;
  }

  function listFavorites(actor) {
    requireActiveUser(actor);
    return state.favorites.filter((item) => item.user_id === actor.user_id);
  }

  function startUserImport(actor, rows) {
    requireAdmin(actor);
    const import_id = nextId("import");
    const result_s3_prefix = `s3://saphnexa-local/user-import/${import_id}/`;
    const job = {
      tenant_id: actor.tenant_id,
      import_id,
      status: statuses.SUCCEEDED,
      result_s3_prefix,
      result_report_json: { created: 0, updated: 0, deleted: 0, failed: 0, error_rows_s3_uri: `${result_s3_prefix}error-rows.jsonl` },
      created_by_user_id: actor.user_id
    };
    state.user_import_jobs.push(job);
    rows.forEach((row, index) => {
      const result = applyUserImportRow(row);
      job.result_report_json[result.counter] += 1;
      state.user_import_rows.push({
        tenant_id: actor.tenant_id,
        import_id,
        row_number: index + 1,
        action: row.action || "create",
        status: result.status,
        target_user_id: result.target_user_id || null,
        error_message: result.error_message || null
      });
    });
    recordAdminEvent(actor, "admin.user_import.updated", { import_id, status: job.status, failed_rows: job.result_report_json.failed });
    recordAuditEvent(actor, "admin.user_import.completed", "admin_operation", import_id, job.result_report_json);
    return job;
  }

  function listAdminUsers(actor) {
    requireAdmin(actor);
    return state.users.filter((item) => item.tenant_id === actor.tenant_id);
  }

  function createDocument(actor, input) {
    requireAdmin(actor);
    const document_id = input.document_id || nextId("doc");
    const version_id = input.version_id || nextId("ver");
    const metadata = input.metadata || {
      document_id,
      version: version_id,
      acl_scope: input.acl_scope_id || `user:${actor.user_id}`,
      status: "uploaded"
    };
    const metadataError = validateDocumentMetadata(metadata);
    const existingVersion = state.document_versions.find((item) => item.document_id === document_id && item.version_id === version_id);
    if (existingVersion) {
      return {
        document_id,
        version_id,
        job_id: state.ingestion_jobs.find((item) => item.document_id === document_id && item.version_id === version_id)?.job_id,
        raw_s3_uri: existingVersion.raw_s3_uri,
        idempotent: true
      };
    }
    const job_id = nextId("ing");
    const raw_s3_uri = `s3://saphnexa-local/raw/${document_id}/${version_id}/${input.file_name || "document.pdf"}`;
    const acceptedStatus = metadata.status === statuses.SUCCEEDED ? statuses.SUCCEEDED : "uploaded";
    const acceptedJobStatus = metadata.status === statuses.SUCCEEDED ? statuses.SUCCEEDED : statuses.QUEUED;
    if (!state.documents.find((item) => item.document_id === document_id)) {
      state.documents.push({ tenant_id: actor.tenant_id, document_id, title: input.title, status: statuses.ACTIVE, created_by_user_id: actor.user_id, created_at: now(), updated_at: now() });
    }
    state.document_versions.push({ tenant_id: actor.tenant_id, document_id, version_id, version_label: input.version_label || "v1", status: metadataError ? statuses.FAILED : acceptedStatus, raw_s3_uri, metadata_json: metadata, created_at: now() });
    if (!metadataError) {
      state.document_acl_entries.push({ tenant_id: actor.tenant_id, document_id, version_id, acl_scope_id: input.acl_scope_id || `user:${actor.user_id}`, effect: "allow" });
    }
    state.ingestion_jobs.push({
      tenant_id: actor.tenant_id,
      job_id,
      document_id,
      version_id,
      status: metadataError ? statuses.FAILED : acceptedJobStatus,
      raw_s3_uri,
      parsed_s3_prefix: `s3://saphnexa-local/parsed/${document_id}/${version_id}/`,
      error_code: metadataError?.error_code || null,
      retryable: Boolean(metadataError)
    });
    recordAdminEvent(actor, "admin.ingestion.updated", { job_id, document_id, version_id, status: metadataError ? statuses.FAILED : statuses.QUEUED, error_code: metadataError?.error_code || null });
    recordAuditEvent(actor, "document.registration.requested", "document_publish", document_id, {
      version_id,
      job_id,
      raw_s3_uri,
      parsed_s3_prefix: `s3://saphnexa-local/parsed/${document_id}/${version_id}/`,
      status: metadataError ? statuses.FAILED : statuses.QUEUED
    });
    return { document_id, version_id, job_id, raw_s3_uri };
  }

  function listDocuments(actor) {
    requireAdmin(actor);
    return state.documents.filter((item) => item.tenant_id === actor.tenant_id && item.status !== statuses.DELETED);
  }

  function getDocument(actor, document_id) {
    requireAdmin(actor);
    const document = state.documents.find((item) => item.tenant_id === actor.tenant_id && item.document_id === document_id && item.status !== statuses.DELETED);
    if (!document) throw forbidden("DOCUMENT_NOT_FOUND", "文書が存在しない。", 404);
    return documentDetail(actor, document);
  }

  function getIngestionJob(actor, job_id) {
    requireAdmin(actor);
    return state.ingestion_jobs.find((item) => item.tenant_id === actor.tenant_id && item.job_id === job_id);
  }

  function createDocumentVersion(actor, document_id, input) {
    requireAdmin(actor);
    if (!state.documents.find((item) => item.document_id === document_id)) throw forbidden("DOCUMENT_NOT_FOUND", "文書が存在しない。");
    return createDocument(actor, { ...input, document_id, title: state.documents.find((item) => item.document_id === document_id).title });
  }

  function activateDocumentVersion(actor, document_id, version_id) {
    requireAdmin(actor);
    const activeVersion = state.document_versions.find((item) => item.tenant_id === actor.tenant_id && item.document_id === document_id && item.version_id === version_id);
    if (!activeVersion) throw forbidden("DOCUMENT_VERSION_NOT_FOUND", "文書版が存在しない。", 404);
    const ingestionJob = state.ingestion_jobs.find((item) => item.tenant_id === actor.tenant_id && item.document_id === document_id && item.version_id === version_id);
    if (ingestionJob?.status !== statuses.SUCCEEDED && activeVersion.status !== statuses.SUCCEEDED && activeVersion.status !== statuses.ACTIVE) {
      throw forbidden("DOCUMENT_VERSION_NOT_READY", "取り込み完了済みの文書版だけ active 化できます。");
    }
    for (const version of state.document_versions.filter((item) => item.tenant_id === actor.tenant_id && item.document_id === document_id)) {
      version.status = version.version_id === version_id ? statuses.ACTIVE : statuses.ARCHIVED;
    }
    recordAuditEvent(actor, "document.version.activated", "document_publish", document_id, { version_id });
    return activeVersion;
  }

  function updateDocumentAcl(actor, document_id, version_id, input) {
    requireAdmin(actor);
    const document = state.documents.find((item) => item.tenant_id === actor.tenant_id && item.document_id === document_id && item.status !== statuses.DELETED);
    if (!document) throw forbidden("DOCUMENT_NOT_FOUND", "文書が存在しない。", 404);
    const version = state.document_versions.find((item) => item.tenant_id === actor.tenant_id && item.document_id === document_id && item.version_id === version_id && item.status !== statuses.DELETED);
    if (!version) throw forbidden("DOCUMENT_VERSION_NOT_FOUND", "文書版が存在しない。", 404);
    const acl_scope_id = typeof input.acl_scope_id === "string" ? input.acl_scope_id.trim() : "";
    if (!acl_scope_id) throw forbidden("DOCUMENT_ACL_SCOPE_REQUIRED", "ACL scope が必要。", 400);
    state.document_acl_entries = state.document_acl_entries.filter(
      (item) => !(item.tenant_id === actor.tenant_id && item.document_id === document_id && item.version_id === version_id)
    );
    state.document_acl_entries.push({ tenant_id: actor.tenant_id, document_id, version_id, acl_scope_id, effect: "allow" });
    recordAuditEvent(actor, "document.acl.updated", "document_acl", document_id, {
      version_id,
      acl_scope_id,
      cognito_group_synced: false,
      retrieval_index_resynced: false
    });
    return documentDetail(actor, document);
  }

  function suspendDocument(actor, document_id) {
    requireAdmin(actor);
    const document = state.documents.find((item) => item.tenant_id === actor.tenant_id && item.document_id === document_id && item.status !== statuses.DELETED);
    if (!document) throw forbidden("DOCUMENT_NOT_FOUND", "文書が存在しない。", 404);
    document.status = statuses.DELETED;
    document.updated_at = now();
    for (const version of state.document_versions.filter((item) => item.tenant_id === actor.tenant_id && item.document_id === document_id)) {
      version.status = statuses.DELETED;
    }
    recordAuditEvent(actor, "document.suspended", "document_publish", document_id, {
      affected_versions: state.document_versions.filter((item) => item.tenant_id === actor.tenant_id && item.document_id === document_id).length,
      physical_delete: false
    });
    return documentDetail(actor, document);
  }

  function documentDetail(actor, document) {
    return {
      ...document,
      versions: state.document_versions.filter((item) => item.tenant_id === actor.tenant_id && item.document_id === document.document_id),
      ingestion_jobs: state.ingestion_jobs.filter((item) => item.tenant_id === actor.tenant_id && item.document_id === document.document_id),
      acl_entries: state.document_acl_entries.filter((item) => item.tenant_id === actor.tenant_id && item.document_id === document.document_id)
    };
  }

  function retryIngestionJob(actor, job_id) {
    requireAdmin(actor);
    const job = state.ingestion_jobs.find((item) => item.tenant_id === actor.tenant_id && item.job_id === job_id);
    if (!job) throw forbidden("INGESTION_JOB_NOT_FOUND", "取り込みジョブが存在しない。", 404);
    if (!job.retryable && job.status !== statuses.FAILED) throw forbidden("INGESTION_RETRY_NOT_ALLOWED", "再実行できる状態ではない。");
    job.status = statuses.QUEUED;
    job.retryable = false;
    job.error_code = null;
    recordAdminEvent(actor, "admin.ingestion.updated", { job_id, status: statuses.QUEUED });
    recordAuditEvent(actor, "document.ingestion.retried", "admin_operation", job_id, { document_id: job.document_id, version_id: job.version_id });
    return job;
  }

  function issueWsTicket(actor, input = {}) {
    requireActiveUser(actor);
    const ticket_id = nextId("wst");
    const now_ms = input.now_ms || 0;
    const ticket = {
      tenant_id: actor.tenant_id,
      ticket_id,
      user_id: actor.user_id,
      channel_scope_json: { channels: [`/${actor.user_id}/chat/*`] },
      status: statuses.ACTIVE,
      issued_at_ms: now_ms,
      expires_at_ms: now_ms + 60000,
      used_at_ms: null
    };
    state.ws_tickets.push(ticket);
    return { ticket: ticket_id, expires_in_seconds: 60, channels: ticket.channel_scope_json.channels };
  }

  function consumeWsTicket(actor, ticket_id, now_ms = 0) {
    requireActiveUser(actor);
    const ticket = state.ws_tickets.find((item) => item.ticket_id === ticket_id);
    if (!ticket) throw forbidden("WS_TICKET_NOT_FOUND", "WebSocket ticket が存在しない。", 404);
    if (ticket.user_id !== actor.user_id) throw forbidden("WS_TICKET_USER_MISMATCH", "別ユーザーの ticket は利用できない。");
    if (ticket.status !== statuses.ACTIVE || ticket.used_at_ms !== null) throw forbidden("WS_TICKET_REUSED", "WebSocket ticket は再利用できない。");
    if (now_ms > ticket.expires_at_ms) throw forbidden("WS_TICKET_EXPIRED", "WebSocket ticket の期限が切れている。");
    ticket.used_at_ms = now_ms;
    ticket.status = "used";
    return { ticket_id, channels: ticket.channel_scope_json.channels, status: ticket.status };
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
    recordAdminEvent(actor, "admin.evaluation.updated", { evaluation_run_id, status: run.status, dataset_id: run.dataset_id });
    recordAuditEvent(actor, "admin.evaluation.completed", "evaluation", evaluation_run_id, {
      dataset_id: run.dataset_id,
      artifact_s3_prefix: run.artifact_s3_prefix,
      metrics: Object.keys(run.metrics_json)
    });
    return run;
  }

  function listAdminArtifacts(actor) {
    requireAdmin(actor);
    recordAuditEvent(actor, "admin.artifact.listed", "artifact_access", "published_artifacts", { artifact_count: state.published_artifacts.length });
    return state.published_artifacts;
  }

  function issueArtifactAccessCookie(actor) {
    requireAdmin(actor);
    recordAdminEvent(actor, "admin.artifact.published", { status: "published-local", artifact_count: state.published_artifacts.length });
    recordAuditEvent(actor, "admin.artifact.cookie_issued", "artifact_access", "artifact-cookie", { expires_in_seconds: 300 });
    return { cookie_issued: true, expires_in_seconds: 300 };
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
    activeChat(actor, chat_id);
    if (!canReadChat(participant(chat_id, actor.user_id))) throw forbidden("CHAT_READ_FORBIDDEN", "チャット参加者のみ参照できる。");
  }

  function requireOwner(actor, chat_id) {
    requireActiveUser(actor);
    if (!canWriteChat(participant(chat_id, actor.user_id))) throw forbidden("CHAT_WRITE_FORBIDDEN", "owner のみ操作できる。");
  }

  function activeChat(actor, chat_id) {
    const chat = state.chat_sessions.find((item) => item.tenant_id === actor.tenant_id && item.chat_id === chat_id && item.status !== statuses.DELETED);
    if (!chat) throw forbidden("CHAT_NOT_FOUND", "チャットが存在しない。", 404);
    return chat;
  }

  function nextId(prefix) {
    const current = (state.counters.get(prefix) || 0) + 1;
    state.counters.set(prefix, current);
    return `${prefix}-${String(current).padStart(4, "0")}`;
  }

  function validateDocumentMetadata(metadata) {
    const required = ["document_id", "version", "acl_scope", "status"];
    const missing = required.filter((key) => !metadata[key]);
    if (missing.length > 0) return { error_code: "DOCUMENT_METADATA_INVALID", missing };
    return null;
  }

  function applyUserImportRow(row) {
    if (!row.email) return { status: statuses.FAILED, counter: "failed", error_message: "email is required" };
    const action = row.action || "create";
    if (!["create", "update", "delete"].includes(action)) {
      return { status: statuses.FAILED, counter: "failed", error_message: `unsupported action: ${action}` };
    }
    const existing = state.users.find((item) => item.email === row.email || item.user_id === row.user_id);
    if (action === "create") {
      if (existing) return { status: statuses.FAILED, counter: "failed", error_message: "user already exists", target_user_id: existing.user_id };
      const user_id = row.user_id || nextId("usr");
      state.users.push(user(user_id, row.role || roles.GENERAL_USER, row.email, row.display_name || row.email));
      return { status: statuses.SUCCEEDED, counter: "created", target_user_id: user_id };
    }
    if (!existing) return { status: statuses.FAILED, counter: "failed", error_message: "user not found" };
    if (action === "update") {
      existing.display_name = row.display_name || existing.display_name;
      existing.department = row.department || existing.department;
      existing.updated_at = now();
      return { status: statuses.SUCCEEDED, counter: "updated", target_user_id: existing.user_id };
    }
    existing.status = statuses.REMOVED;
    existing.updated_at = now();
    return { status: statuses.SUCCEEDED, counter: "deleted", target_user_id: existing.user_id };
  }

  function recordAdminEvent(actor, event_name, payload = {}) {
    if (!adminEventNames.includes(event_name)) throw new Error(`unknown admin event ${event_name}`);
    const event = {
      tenant_id: actor.tenant_id,
      event_id: nextId("admevt"),
      event_name,
      ...payload,
      created_at: now()
    };
    state.admin_events.push(event);
    return event;
  }

  function recordAuditEvent(actor, event_name, category, resource_id, payload_json = {}) {
    const event = {
      tenant_id: actor.tenant_id,
      audit_event_id: nextId("audit"),
      actor_user_id: actor.user_id,
      event_name,
      category,
      resource_id,
      payload_json,
      created_at: now()
    };
    state.audit_events.push(event);
    return event;
  }
}

function user(user_id, role, email, display_name) {
  return { tenant_id: "tenant-local", user_id, email, display_name, role, department: "local", employment_type: "employee", status: statuses.ACTIVE, created_at: baseTime, updated_at: baseTime };
}

function artifact(artifact_id, artifact_type, title, viewer_path, source_ref) {
  const versionMatch = viewer_path.match(/\/versions\/([^/]+)\//);
  const s3Prefix = viewer_path
    .replace(/^\/admin\/docs\/latest\/$/, "docs-site/latest/")
    .replace(/^\/admin\/docs\/versions\/([^/]+)\/$/, "docs-site/releases/$1/")
    .replace(/^\/admin\/test-reports\/allure\/latest\/$/, "test-reports/allure/latest/");
  return {
    tenant_id: "tenant-local",
    artifact_id,
    artifact_type,
    title,
    version_label: versionMatch ? versionMatch[1] : "latest",
    source_ref,
    s3_bucket: "saphnexa-local-admin-artifacts",
    s3_prefix: s3Prefix,
    viewer_path,
    status: "published-local",
    checksum: "sha256:local-generated",
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

function asyncFailure(error_code, message) {
  const error = new Error(message);
  error.error_code = error_code;
  return error;
}
