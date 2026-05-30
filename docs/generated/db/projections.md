# Event正本とProjection対応

基本設計 v0.17 の案Bに合わせ、状態の正本は append-only event table、既存状態列はprojectionとして扱う。

## 更新境界

- API: 入力検証、権限確認、domain event appendを担当し、状態列を正本として直接更新しない。
- Worker: 取り込み・評価など非同期処理のevent appendを担当する。
- Projector: eventを読んでprojection列とread modelを更新する唯一の境界である。
- Agent: Tool呼び出しeventをappendし、監査に必要な要約のみを保持する。
- CI: 公開成果物とテストレポートのeventをappendし、公開状態projectionを更新する。

## Event append / projector責務

- Event table はappend-onlyとして扱い、update/deleteは行わない。
- `event_id` はevent一意性、`idempotency_key` はclient retryの冪等性、`event_seq` はaggregate内順序とOCC retryの基準として使う。
- Aurora DSQLのOCC競合時は、event append serviceが冪等性を確認したうえでretryする。
- Projectorは `projection_event_id` / `projection_event_seq` / `projected_at` を更新し、どのeventから現在projectionが作られたかを残す。

## UI通知イベントとの違い

`chat_message_events` はUI通知とREST再取得のための時系列read modelであり、domain event正本とは分けて扱う。業務状態の正本は `chat_message_lifecycle_events`、`chat_session_events`、`chat_participant_events`、`chat_run_events` などのappend-only event tableである。

## Event / Projection対応

| event table | projection table | updateOwner | 方針 |
|---|---|---|---|
| `tenant_events` | `tenants` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `user_events` | `users` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `user_group_events` | `user_groups` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `web_session_events` | `web_sessions` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `chat_session_events` | `chat_sessions` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `chat_participant_events` | `chat_participants` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `chat_message_lifecycle_events` | `chat_messages` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `chat_message_lifecycle_events` | `chat_message_events` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `chat_run_events` | `chat_runs` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `document_events` | `documents` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `document_version_events` | `document_versions` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `document_acl_events` | `document_acl_entries` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `ingestion_job_events` | `ingestion_jobs` | worker | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `ws_ticket_events` | `ws_tickets` | projector | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `user_import_job_events` | `user_import_jobs` | worker | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `user_import_row_events` | `user_import_rows` | worker | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `evaluation_dataset_events` | `evaluation_datasets` | worker | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `evaluation_run_events` | `evaluation_runs` | worker | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `evaluation_run_item_events` | `evaluation_run_items` | worker | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `llm_model_events` | `llm_models` | api | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `bm25_search_document_events` | `bm25_search_documents` | worker | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `bm25_posting_events` | `bm25_postings` | worker | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `bm25_term_stat_events` | `bm25_term_stats` | worker | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `bm25_field_stat_events` | `bm25_field_stats` | worker | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `event_delivery_events` | `event_delivery_logs` | worker | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `agent_tool_events` | `agent_tools` | api | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `published_artifact_events` | `published_artifacts` | ci | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `tool_invocation_events` | `tool_invocations` | agent | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |
| `test_report_run_events` | `test_report_runs` | ci | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |

## Projection metadata columns

- `projection_event_id`
- `projection_event_seq`
- `projected_at`

## 状態系カラム

| table | column | derivedFrom | 説明 |
|---|---|---|---|
| `tenants` | `status` | tenant_events | 現在状態projection。tenant_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `tenants` | `updated_at` | tenant_events | 更新at。tenant_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `users` | `status` | user_events | 現在状態projection。user_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `users` | `updated_at` | user_events | 更新at。user_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `user_groups` | `status` | user_group_events | 現在状態projection。user_group_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `web_sessions` | `status` | web_session_events | 現在状態projection。web_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `web_sessions` | `expires_at` | web_session_events | 期限at。web_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `web_sessions` | `updated_at` | web_session_events | 更新at。web_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_sessions` | `status` | chat_session_events | 現在状態projection。chat_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_sessions` | `last_message_at` | chat_session_events | lastメッセージat。chat_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_sessions` | `updated_at` | chat_session_events | 更新at。chat_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_sessions` | `deleted_at` | chat_session_events | 削除at。chat_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_participants` | `status` | chat_participant_events | 現在状態projection。chat_participant_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_participants` | `removed_at` | chat_participant_events | removedat。chat_participant_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_messages` | `status` | chat_message_lifecycle_events | 現在状態projection。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_messages` | `completed_at` | chat_message_lifecycle_events | 完了at。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_runs` | `status` | chat_run_events | 現在状態projection。chat_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_runs` | `started_at` | chat_run_events | 開始at。chat_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_runs` | `completed_at` | chat_run_events | 完了at。chat_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `documents` | `status` | document_events | 現在状態projection。document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `documents` | `updated_at` | document_events | 更新at。document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `document_versions` | `status` | document_version_events | 現在状態projection。document_version_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `ingestion_jobs` | `status` | ingestion_job_events | 現在状態projection。ingestion_job_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `ws_tickets` | `status` | ws_ticket_events | 現在状態projection。ws_ticket_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `ws_tickets` | `expires_at` | ws_ticket_events | 期限at。ws_ticket_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `ws_tickets` | `used_at` | ws_ticket_events | usedat。ws_ticket_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `user_import_jobs` | `status` | user_import_job_events | 現在状態projection。user_import_job_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `user_import_rows` | `status` | user_import_row_events | 現在状態projection。user_import_row_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `evaluation_datasets` | `status` | evaluation_dataset_events | 現在状態projection。evaluation_dataset_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `evaluation_runs` | `status` | evaluation_run_events | 現在状態projection。evaluation_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `evaluation_run_items` | `status` | evaluation_run_item_events | 現在状態projection。evaluation_run_item_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `llm_models` | `status` | llm_model_events | 現在状態projection。llm_model_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `llm_models` | `updated_at` | llm_model_events | 更新at。llm_model_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_search_documents` | `is_deleted` | bm25_search_document_events | is削除。bm25_search_document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `event_delivery_logs` | `status` | event_delivery_events | 現在状態projection。event_delivery_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `event_delivery_logs` | `updated_at` | event_delivery_events | 更新at。event_delivery_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `agent_tools` | `status` | agent_tool_events | 現在状態projection。agent_tool_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `agent_tools` | `updated_at` | agent_tool_events | 更新at。agent_tool_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `tool_invocations` | `status` | tool_invocation_events | 現在状態projection。tool_invocation_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `tool_invocations` | `completed_at` | tool_invocation_events | 完了at。tool_invocation_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `published_artifacts` | `status` | published_artifact_events | 現在状態projection。published_artifact_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `published_artifacts` | `published_at` | published_artifact_events | publishedat。published_artifact_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `published_artifacts` | `expires_at` | published_artifact_events | 期限at。published_artifact_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `published_artifacts` | `updated_at` | published_artifact_events | 更新at。published_artifact_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `test_report_runs` | `status` | test_report_run_events | 現在状態projection。test_report_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `test_report_runs` | `started_at` | test_report_run_events | 開始at。test_report_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `test_report_runs` | `completed_at` | test_report_run_events | 完了at。test_report_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
