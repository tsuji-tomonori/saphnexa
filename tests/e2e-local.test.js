import assert from "node:assert/strict";
import { test } from "node:test";
import { createLocalApi } from "../apps/api/src/local-api.js";
import { createLogEvent, assertTracePropagation } from "../packages/domain/src/observability.js";

test("local user journey covers chat, share, favorite, admin artifact, and evaluation paths", () => {
  const api = createLocalApi();
  const ownerCsrf = csrf(api, "user-owner");
  const viewerCsrf = csrf(api, "user-viewer");
  const adminCsrf = csrf(api, "admin-1");
  const chat = api.request("user-owner", "createChatSession", { csrf_token: ownerCsrf, title: "local e2e" }).body.chat;
  assert.equal(api.request("user-owner", "addChatParticipant", { csrf_token: ownerCsrf, chat_id: chat.chat_id, user_id: "user-viewer" }).status, 201);

  const accepted = api.request("user-owner", "submitQuestion", {
    csrf_token: ownerCsrf,
    chat_id: chat.chat_id,
    question: "Saphnexa は何をするシステムか",
    retrieval_policy: { top_k: 10, allowed_acl_scope_ids: ["user:user-owner"] }
  });
  assert.equal(accepted.status, 202);

  const events = api.request("user-viewer", "listMessageEvents", {
    chat_id: chat.chat_id,
    message_id: accepted.body.message_id
  });
  assert.equal(events.status, 200);
  assert.equal(events.body.events.at(-1).event_name, "chat.message.final_ready");

  const favorite = api.request("user-viewer", "addFavorite", { csrf_token: viewerCsrf, chat_id: chat.chat_id });
  assert.equal(favorite.status, 201);
  assert.equal(api.request("user-viewer", "listFavorites").body.favorites.length, 1);

  assert.equal(api.request("admin-1", "listPublishedArtifacts").body.artifacts.length, 2);
  assert.equal(api.request("admin-1", "startEvaluationRun", { csrf_token: adminCsrf, dataset_id: "dataset-local-golden" }).status, 202);
});

function csrf(api, userId) {
  return api.request(userId, "getMe").body.csrf_token;
}

test("common JSON log schema carries trace and correlation IDs across local chain", () => {
  const trace_id = "trace-local-e2e";
  const chain = ["api", "worker", "tools-api", "agent"].map((logical_function) => createLogEvent({
    logical_function,
    trace_id,
    message: `${logical_function} handled local e2e step`
  }));
  assert.equal(assertTracePropagation(chain), true);
});
