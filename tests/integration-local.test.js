import assert from "node:assert/strict";
import { test } from "node:test";
import { createLocalApi } from "../apps/api/src/local-api.js";
import { assertRetrievalPolicyNotRelaxed } from "../apps/agent/src/rag-agent.js";
import { assertNotificationIsLightweight, createLightweightNotification } from "../apps/workers/src/event-publisher.js";

test("chat is an independent resource with owner/viewer participant permissions", () => {
  const api = createLocalApi();
  const created = api.request("user-owner", "createChatSession", { title: "検収チャット" });
  assert.equal(created.status, 201);
  const chatId = created.body.chat.chat_id;

  const shared = api.request("user-owner", "addChatParticipant", { chat_id: chatId, user_id: "user-viewer" });
  assert.equal(shared.status, 201);
  assert.equal(shared.body.participant.participant_role, "viewer");

  const viewerRead = api.request("user-viewer", "getChatSession", { chat_id: chatId });
  assert.equal(viewerRead.status, 200);

  const viewerWrite = api.request("user-viewer", "submitQuestion", { chat_id: chatId, question: "Saphnexa とは何か" });
  assert.equal(viewerWrite.status, 403);
  assert.equal(viewerWrite.body.error_code, "CHAT_WRITE_FORBIDDEN");

  const outsiderRead = api.request("user-outsider", "getChatSession", { chat_id: chatId });
  assert.equal(outsiderRead.status, 403);
});

test("question submission creates run/message ids, events, citations, and audited tool invocations", () => {
  const api = createLocalApi();
  const chatId = api.request("user-owner", "createChatSession", { title: "RAG" }).body.chat.chat_id;
  const accepted = api.request("user-owner", "submitQuestion", {
    chat_id: chatId,
    question: "Saphnexa は何をするシステムか",
    retrieval_policy: { top_k: 10, allowed_acl_scope_ids: ["user:user-owner"] }
  });
  assert.equal(accepted.status, 202);
  assert.match(accepted.body.message_id, /^msg-/);
  assert.match(accepted.body.run_id, /^run-/);

  const events = api.request("user-owner", "listMessageEvents", { chat_id: chatId, message_id: accepted.body.message_id }).body.events;
  assert.equal(events.length >= 5, true);
  assert.deepEqual(events.map((event) => event.event_seq), [1, 2, 3, 4, 5, 6]);
  assert.equal(events.at(-1).event_name, "chat.message.final_ready");

  const notification = createLightweightNotification(events.at(-1));
  assert.equal(assertNotificationIsLightweight(notification), true);
  assert.equal(notification.detail_url.includes("/api/chat-sessions/"), true);

  const message = api.store.state.chat_messages.find((item) => item.message_id === accepted.body.message_id);
  assert.equal(message.status, "succeeded");
  assert.equal(api.store.state.citation_records.length >= 1, true);
  assert.equal(api.store.state.tool_invocations.map((item) => item.tool_name).includes("acl-check"), true);
  const aclInvocation = api.store.state.tool_invocations.find((item) => item.tool_name === "acl-check");
  assert.equal(aclInvocation.response_summary_json.denied_count, 1);
});

test("fixture RAG refuses ungrounded questions without fake citations", () => {
  const api = createLocalApi();
  const chatId = api.request("user-owner", "createChatSession", { title: "Refusal" }).body.chat.chat_id;
  const accepted = api.request("user-owner", "submitQuestion", {
    chat_id: chatId,
    question: "根拠なしの質問",
    retrieval_policy: { top_k: 10, allowed_acl_scope_ids: ["user:user-owner"] }
  });
  const message = api.store.state.chat_messages.find((item) => item.message_id === accepted.body.message_id);
  assert.equal(message.content_text.includes("回答できません"), true);
});

test("admin APIs reject general users and allow admins", () => {
  const api = createLocalApi();
  assert.equal(api.request("user-owner", "adminListUsers").status, 403);
  assert.equal(api.request(undefined, "getMe").status, 401);
  assert.equal(api.request("admin-1", "adminListUsers").status, 200);
  const evaluation = api.request("admin-1", "startEvaluationRun", { dataset_id: "dataset-local-golden" });
  assert.equal(evaluation.status, 202);
  assert.equal(evaluation.body.evaluation_run.metrics_json.retrieval.recall_at_10 >= 0.85, true);
});

test("retrieval policy cannot be relaxed by agent-side code", () => {
  assert.equal(assertRetrievalPolicyNotRelaxed({ top_k: 5, allowed_acl_scope_ids: ["user:user-owner"] }, { top_k: 5, allowed_acl_scope_ids: ["user:user-owner"] }), true);
  assert.throws(() => assertRetrievalPolicyNotRelaxed({ top_k: 5, allowed_acl_scope_ids: ["user:user-owner"] }, { top_k: 6, allowed_acl_scope_ids: ["user:user-owner"] }));
  assert.throws(() => assertRetrievalPolicyNotRelaxed({ top_k: 5, allowed_acl_scope_ids: ["user:user-owner"] }, { top_k: 5, allowed_acl_scope_ids: ["group:restricted"] }));
});
