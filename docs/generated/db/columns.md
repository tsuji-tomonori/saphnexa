# DBカラム一覧

全カラムの説明、分類、更新主体を示す。

| table | column | 日本語名 | logicalType | nullable | dataClassification | sourceOfTruth | updateOwner | derivedFrom | 説明 |
|---|---|---|---|---|---|---|---|---|---|
| `tenants` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `tenants` | `tenant_name` | テナント名称 | string | no | internal | master | api |  | テナント名称。tenants における tenant_name の値を保持する。分類と更新主体はmetadataで管理する。 |
| `tenants` | `status` | 現在状態projection | string | no | internal | projection | projector | tenant_events | 現在状態projection。tenant_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `tenants` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `tenants` | `updated_at` | 更新at | timestamp | no | internal | projection | projector | tenant_events | 更新at。tenant_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `users` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `users` | `user_id` | ユーザーID | string | no | pii | master | api |  | ユーザーID。users における user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `users` | `email` | email | string | no | pii | master | api |  | email。users における email の値を保持する。分類と更新主体はmetadataで管理する。 |
| `users` | `display_name` | display名称 | string | no | pii | master | api |  | display名称。users における display_name の値を保持する。分類と更新主体はmetadataで管理する。 |
| `users` | `role` | role | string | no | internal | master | api |  | role。users における role の値を保持する。分類と更新主体はmetadataで管理する。 |
| `users` | `department` | department | string | yes | pii | master | api |  | department。users における department の値を保持する。分類と更新主体はmetadataで管理する。 |
| `users` | `employment_type` | employmenttype | string | yes | pii | master | api |  | employmenttype。users における employment_type の値を保持する。分類と更新主体はmetadataで管理する。 |
| `users` | `status` | 現在状態projection | string | no | internal | projection | projector | user_events | 現在状態projection。user_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `users` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `users` | `updated_at` | 更新at | timestamp | no | internal | projection | projector | user_events | 更新at。user_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `user_groups` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `user_groups` | `group_id` | グループID | string | no | internal | master | api |  | グループID。user_groups における group_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `user_groups` | `group_name` | グループ名称 | string | no | internal | master | api |  | グループ名称。user_groups における group_name の値を保持する。分類と更新主体はmetadataで管理する。 |
| `user_groups` | `group_type` | グループtype | string | no | internal | master | api |  | グループtype。user_groups における group_type の値を保持する。分類と更新主体はmetadataで管理する。 |
| `user_groups` | `status` | 現在状態projection | string | no | internal | projection | projector | user_group_events | 現在状態projection。user_group_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `user_groups` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `user_group_memberships` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `user_group_memberships` | `user_id` | ユーザーID | string | no | pii | master | api |  | ユーザーID。user_group_memberships における user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `user_group_memberships` | `group_id` | グループID | string | no | internal | master | api |  | グループID。user_group_memberships における group_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `user_group_memberships` | `source` | source | string | no | internal | master | api |  | source。user_group_memberships における source の値を保持する。分類と更新主体はmetadataで管理する。 |
| `user_group_memberships` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `web_sessions` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `web_sessions` | `session_id` | セッションID | string | no | internal | master | api |  | セッションID。web_sessions における session_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `web_sessions` | `user_id` | ユーザーID | string | no | pii | master | api |  | ユーザーID。web_sessions における user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `web_sessions` | `refresh_token_ref` | refreshtokenref | string | no | secret_ref | master | api |  | refreshtokenref。web_sessions における refresh_token_ref の値を保持する。分類と更新主体はmetadataで管理する。 |
| `web_sessions` | `csrf_secret_hash` | csrfsecrethash | string | no | secret_ref | master | api |  | csrfsecrethash。web_sessions における csrf_secret_hash の値を保持する。分類と更新主体はmetadataで管理する。 |
| `web_sessions` | `status` | 現在状態projection | string | no | internal | projection | projector | web_session_events | 現在状態projection。web_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `web_sessions` | `expires_at` | 期限at | timestamp | no | internal | projection | projector | web_session_events | 期限at。web_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `web_sessions` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `web_sessions` | `updated_at` | 更新at | timestamp | no | internal | projection | projector | web_session_events | 更新at。web_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_sessions` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `chat_sessions` | `chat_id` | チャットID | uuid | no | internal | master | api |  | チャットID。chat_sessions における chat_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_sessions` | `title` | タイトル | string | no | confidential | master | api |  | タイトル。chat_sessions における title の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_sessions` | `status` | 現在状態projection | string | no | internal | projection | projector | chat_session_events | 現在状態projection。chat_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_sessions` | `last_message_at` | lastメッセージat | timestamp | yes | internal | projection | projector | chat_session_events | lastメッセージat。chat_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_sessions` | `created_by_user_id` | 作成byユーザーID | string | no | pii | master | api |  | 作成byユーザーID。chat_sessions における created_by_user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_sessions` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `chat_sessions` | `updated_at` | 更新at | timestamp | no | internal | projection | projector | chat_session_events | 更新at。chat_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_sessions` | `deleted_at` | 削除at | timestamp | yes | internal | projection | projector | chat_session_events | 削除at。chat_session_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_participants` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `chat_participants` | `chat_id` | チャットID | uuid | no | internal | master | api |  | チャットID。chat_participants における chat_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_participants` | `user_id` | ユーザーID | string | no | pii | master | api |  | ユーザーID。chat_participants における user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_participants` | `participant_role` | participantrole | string | no | internal | master | api |  | participantrole。chat_participants における participant_role の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_participants` | `status` | 現在状態projection | string | no | internal | projection | projector | chat_participant_events | 現在状態projection。chat_participant_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_participants` | `added_by_user_id` | addedbyユーザーID | string | no | pii | master | api |  | addedbyユーザーID。chat_participants における added_by_user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_participants` | `added_at` | addedat | timestamp | no | internal | master | api |  | addedat。chat_participants における added_at の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_participants` | `removed_at` | removedat | timestamp | yes | internal | projection | projector | chat_participant_events | removedat。chat_participant_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_messages` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `chat_messages` | `chat_id` | チャットID | uuid | no | internal | master | api |  | チャットID。chat_messages における chat_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_messages` | `message_id` | メッセージID | uuid | no | internal | master | api |  | メッセージID。chat_messages における message_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_messages` | `parent_message_id` | parentメッセージID | uuid | yes | internal | master | api |  | parentメッセージID。chat_messages における parent_message_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_messages` | `sender_user_id` | senderユーザーID | string | yes | pii | master | api |  | senderユーザーID。chat_messages における sender_user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_messages` | `sender_type` | sendertype | string | no | internal | master | api |  | sendertype。chat_messages における sender_type の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_messages` | `content_text` | contenttext | text | yes | confidential | master | api |  | contenttext。chat_messages における content_text の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_messages` | `run_id` | 実行ID | uuid | yes | internal | master | api |  | 実行ID。chat_messages における run_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_messages` | `status` | 現在状態projection | string | no | internal | projection | projector | chat_message_lifecycle_events | 現在状態projection。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_messages` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `chat_messages` | `completed_at` | 完了at | timestamp | yes | internal | projection | projector | chat_message_lifecycle_events | 完了at。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_runs` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `chat_runs` | `run_id` | 実行ID | uuid | no | internal | master | api |  | 実行ID。chat_runs における run_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_runs` | `chat_id` | チャットID | uuid | no | internal | master | api |  | チャットID。chat_runs における chat_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_runs` | `message_id` | メッセージID | uuid | no | internal | master | api |  | メッセージID。chat_runs における message_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_runs` | `requested_by_user_id` | requestedbyユーザーID | string | no | pii | master | api |  | requestedbyユーザーID。chat_runs における requested_by_user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_runs` | `retrieval_policy_json` | retrievalpolicyJSON | json | no | confidential | master | api |  | 検索ポリシーJSON。top_kやallowed_acl_scope_idsなど、Agentが緩和してはいけない検索制約を保持する。 |
| `chat_runs` | `model_id` | modelID | string | no | internal | master | api |  | modelID。chat_runs における model_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_runs` | `prompt_version` | prompt版 | string | no | internal | master | api |  | prompt版。chat_runs における prompt_version の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_runs` | `status` | 現在状態projection | string | no | internal | projection | projector | chat_run_events | 現在状態projection。chat_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_runs` | `started_at` | 開始at | timestamp | yes | internal | projection | projector | chat_run_events | 開始at。chat_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_runs` | `completed_at` | 完了at | timestamp | yes | internal | projection | projector | chat_run_events | 完了at。chat_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_runs` | `error_code` | errorcode | string | yes | internal | master | api |  | errorcode。chat_runs における error_code の値を保持する。分類と更新主体はmetadataで管理する。 |
| `chat_message_events` | `tenant_id` | テナントID | string | no | internal | projection | projector | chat_message_lifecycle_events | テナントID。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_message_events` | `chat_id` | チャットID | uuid | no | internal | projection | projector | chat_message_lifecycle_events | チャットID。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_message_events` | `message_id` | メッセージID | uuid | no | internal | projection | projector | chat_message_lifecycle_events | メッセージID。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_message_events` | `event_seq` | イベントseq | bigint | no | internal | projection | projector | chat_message_lifecycle_events | イベントseq。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_message_events` | `event_id` | イベントID | uuid | no | internal | projection | projector | chat_message_lifecycle_events | イベントID。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_message_events` | `event_name` | イベント名称 | string | no | internal | projection | projector | chat_message_lifecycle_events | イベント名称。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_message_events` | `event_type` | イベントtype | string | no | internal | projection | projector | chat_message_lifecycle_events | イベントtype。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_message_events` | `payload_json` | payloadJSON | json | no | confidential | projection | projector | chat_message_lifecycle_events | payloadJSON。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `chat_message_events` | `created_at` | 作成at | timestamp | no | internal | projection | projector | chat_message_lifecycle_events | 作成at。chat_message_lifecycle_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `citation_records` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `citation_records` | `chat_id` | チャットID | uuid | no | internal | master | api |  | チャットID。citation_records における chat_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `citation_records` | `message_id` | メッセージID | uuid | no | internal | master | api |  | メッセージID。citation_records における message_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `citation_records` | `citation_id` | citationID | string | no | internal | master | api |  | citationID。citation_records における citation_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `citation_records` | `document_id` | 文書ID | string | no | internal | master | api |  | 文書ID。citation_records における document_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `citation_records` | `version_id` | 版ID | string | no | internal | master | api |  | 版ID。citation_records における version_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `citation_records` | `chunk_id` | chunkID | string | no | internal | master | api |  | chunkID。citation_records における chunk_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `citation_records` | `display_json` | displayJSON | json | no | internal | master | api |  | displayJSON。citation_records における display_json の値を保持する。分類と更新主体はmetadataで管理する。 |
| `citation_records` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `message_feedback` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `message_feedback` | `feedback_id` | feedbackID | uuid | no | internal | master | api |  | feedbackID。message_feedback における feedback_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `message_feedback` | `chat_id` | チャットID | uuid | no | internal | master | api |  | チャットID。message_feedback における chat_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `message_feedback` | `message_id` | メッセージID | uuid | no | internal | master | api |  | メッセージID。message_feedback における message_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `message_feedback` | `user_id` | ユーザーID | string | no | pii | master | api |  | ユーザーID。message_feedback における user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `message_feedback` | `rating` | rating | string | no | internal | master | api |  | rating。message_feedback における rating の値を保持する。分類と更新主体はmetadataで管理する。 |
| `message_feedback` | `comment` | comment | text | yes | pii | master | api |  | comment。message_feedback における comment の値を保持する。分類と更新主体はmetadataで管理する。 |
| `message_feedback` | `problem_type` | problemtype | string | yes | internal | master | api |  | problemtype。message_feedback における problem_type の値を保持する。分類と更新主体はmetadataで管理する。 |
| `message_feedback` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `favorites` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `favorites` | `favorite_id` | favoriteID | uuid | no | internal | master | api |  | favoriteID。favorites における favorite_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `favorites` | `user_id` | ユーザーID | string | no | pii | master | api |  | ユーザーID。favorites における user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `favorites` | `chat_id` | チャットID | uuid | yes | internal | master | api |  | チャットID。favorites における chat_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `favorites` | `message_id` | メッセージID | uuid | yes | internal | master | api |  | メッセージID。favorites における message_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `favorites` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `documents` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `documents` | `document_id` | 文書ID | string | no | internal | master | api |  | 文書ID。documents における document_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `documents` | `title` | タイトル | string | no | confidential | master | api |  | タイトル。documents における title の値を保持する。分類と更新主体はmetadataで管理する。 |
| `documents` | `status` | 現在状態projection | string | no | internal | projection | projector | document_events | 現在状態projection。document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `documents` | `created_by_user_id` | 作成byユーザーID | string | no | pii | master | api |  | 作成byユーザーID。documents における created_by_user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `documents` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `documents` | `updated_at` | 更新at | timestamp | no | internal | projection | projector | document_events | 更新at。document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `document_versions` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `document_versions` | `document_id` | 文書ID | string | no | internal | master | api |  | 文書ID。document_versions における document_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `document_versions` | `version_id` | 版ID | string | no | internal | master | api |  | 版ID。document_versions における version_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `document_versions` | `version_label` | 版label | string | no | internal | master | api |  | 版label。document_versions における version_label の値を保持する。分類と更新主体はmetadataで管理する。 |
| `document_versions` | `status` | 現在状態projection | string | no | internal | projection | projector | document_version_events | 現在状態projection。document_version_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `document_versions` | `raw_s3_uri` | raws3uri | string | no | internal | master | api |  | raws3uri。document_versions における raw_s3_uri の値を保持する。分類と更新主体はmetadataで管理する。 |
| `document_versions` | `metadata_json` | metadataJSON | json | no | confidential | master | api |  | metadata JSON。文書取り込みmetadataやKB metadata snapshot生成の入力として扱う。 |
| `document_versions` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `document_acl_entries` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `document_acl_entries` | `document_id` | 文書ID | string | no | internal | master | api |  | 文書ID。document_acl_entries における document_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `document_acl_entries` | `version_id` | 版ID | string | no | internal | master | api |  | 版ID。document_acl_entries における version_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `document_acl_entries` | `acl_scope_id` | aclscopeID | string | no | confidential | master | api |  | aclscopeID。document_acl_entries における acl_scope_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `document_acl_entries` | `effect` | effect | string | no | internal | master | api |  | effect。document_acl_entries における effect の値を保持する。分類と更新主体はmetadataで管理する。 |
| `ingestion_jobs` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `ingestion_jobs` | `job_id` | jobID | string | no | internal | master | api |  | jobID。ingestion_jobs における job_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `ingestion_jobs` | `document_id` | 文書ID | string | no | internal | master | api |  | 文書ID。ingestion_jobs における document_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `ingestion_jobs` | `version_id` | 版ID | string | no | internal | master | api |  | 版ID。ingestion_jobs における version_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `ingestion_jobs` | `status` | 現在状態projection | string | no | internal | projection | worker | ingestion_job_events | 現在状態projection。ingestion_job_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `ingestion_jobs` | `raw_s3_uri` | raws3uri | string | no | internal | master | api |  | raws3uri。ingestion_jobs における raw_s3_uri の値を保持する。分類と更新主体はmetadataで管理する。 |
| `ingestion_jobs` | `parsed_s3_prefix` | parseds3prefix | string | no | internal | master | api |  | parseds3prefix。ingestion_jobs における parsed_s3_prefix の値を保持する。分類と更新主体はmetadataで管理する。 |
| `ingestion_jobs` | `error_code` | errorcode | string | yes | internal | master | api |  | errorcode。ingestion_jobs における error_code の値を保持する。分類と更新主体はmetadataで管理する。 |
| `ingestion_jobs` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `reference_nodes` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `reference_nodes` | `node_id` | nodeID | string | no | internal | master | api |  | nodeID。reference_nodes における node_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `reference_nodes` | `document_id` | 文書ID | string | no | internal | master | api |  | 文書ID。reference_nodes における document_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `reference_nodes` | `version_id` | 版ID | string | no | internal | master | api |  | 版ID。reference_nodes における version_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `reference_nodes` | `node_type` | nodetype | string | no | internal | master | api |  | nodetype。reference_nodes における node_type の値を保持する。分類と更新主体はmetadataで管理する。 |
| `reference_nodes` | `title` | タイトル | text | yes | confidential | master | api |  | タイトル。reference_nodes における title の値を保持する。分類と更新主体はmetadataで管理する。 |
| `reference_nodes` | `page_number` | pagenumber | integer | yes | internal | master | api |  | pagenumber。reference_nodes における page_number の値を保持する。分類と更新主体はmetadataで管理する。 |
| `reference_nodes` | `section_label` | sectionlabel | string | yes | internal | master | api |  | sectionlabel。reference_nodes における section_label の値を保持する。分類と更新主体はmetadataで管理する。 |
| `reference_nodes` | `chunk_id` | chunkID | string | yes | internal | master | api |  | chunkID。reference_nodes における chunk_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `reference_edges` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `reference_edges` | `source_node_id` | sourcenodeID | string | no | internal | master | api |  | sourcenodeID。reference_edges における source_node_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `reference_edges` | `target_node_id` | targetnodeID | string | no | internal | master | api |  | targetnodeID。reference_edges における target_node_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `reference_edges` | `edge_type` | edgetype | string | no | internal | master | api |  | edgetype。reference_edges における edge_type の値を保持する。分類と更新主体はmetadataで管理する。 |
| `reference_edges` | `confidence` | confidence | float | yes | internal | master | api |  | confidence。reference_edges における confidence の値を保持する。分類と更新主体はmetadataで管理する。 |
| `ws_tickets` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `ws_tickets` | `ticket_id` | ticketID | string | no | internal | master | api |  | ticketID。ws_tickets における ticket_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `ws_tickets` | `session_id` | セッションID | string | no | internal | master | api |  | セッションID。ws_tickets における session_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `ws_tickets` | `user_id` | ユーザーID | string | no | pii | master | api |  | ユーザーID。ws_tickets における user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `ws_tickets` | `channel_scope_json` | channelscopeJSON | json | no | confidential | master | api |  | channelscopeJSON。ws_tickets における channel_scope_json の値を保持する。分類と更新主体はmetadataで管理する。 |
| `ws_tickets` | `status` | 現在状態projection | string | no | internal | projection | projector | ws_ticket_events | 現在状態projection。ws_ticket_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `ws_tickets` | `expires_at` | 期限at | timestamp | no | internal | projection | projector | ws_ticket_events | 期限at。ws_ticket_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `ws_tickets` | `used_at` | usedat | timestamp | yes | internal | projection | projector | ws_ticket_events | usedat。ws_ticket_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `user_import_jobs` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `user_import_jobs` | `import_id` | importID | string | no | internal | master | api |  | importID。user_import_jobs における import_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `user_import_jobs` | `status` | 現在状態projection | string | no | internal | projection | worker | user_import_job_events | 現在状態projection。user_import_job_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `user_import_jobs` | `result_s3_prefix` | results3prefix | string | no | internal | master | api |  | results3prefix。user_import_jobs における result_s3_prefix の値を保持する。分類と更新主体はmetadataで管理する。 |
| `user_import_jobs` | `created_by_user_id` | 作成byユーザーID | string | no | pii | master | api |  | 作成byユーザーID。user_import_jobs における created_by_user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `user_import_jobs` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `user_import_rows` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `user_import_rows` | `import_id` | importID | string | no | internal | master | api |  | importID。user_import_rows における import_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `user_import_rows` | `row_number` | rownumber | integer | no | internal | master | api |  | rownumber。user_import_rows における row_number の値を保持する。分類と更新主体はmetadataで管理する。 |
| `user_import_rows` | `status` | 現在状態projection | string | no | internal | projection | worker | user_import_row_events | 現在状態projection。user_import_row_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `user_import_rows` | `error_message` | errorメッセージ | text | yes | pii | master | api |  | errorメッセージ。user_import_rows における error_message の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_datasets` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `evaluation_datasets` | `dataset_id` | datasetID | string | no | internal | master | api |  | datasetID。evaluation_datasets における dataset_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_datasets` | `dataset_name` | dataset名称 | string | no | internal | master | api |  | dataset名称。evaluation_datasets における dataset_name の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_datasets` | `status` | 現在状態projection | string | no | internal | projection | worker | evaluation_dataset_events | 現在状態projection。evaluation_dataset_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `evaluation_datasets` | `source_s3_uri` | sources3uri | string | no | internal | master | api |  | sources3uri。evaluation_datasets における source_s3_uri の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_datasets` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `evaluation_cases` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `evaluation_cases` | `case_id` | caseID | uuid | no | internal | master | api |  | caseID。evaluation_cases における case_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_cases` | `dataset_id` | datasetID | string | no | internal | master | api |  | datasetID。evaluation_cases における dataset_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_cases` | `question` | question | text | no | confidential | master | api |  | question。evaluation_cases における question の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_cases` | `expected_answer` | expectedanswer | text | yes | confidential | master | api |  | expectedanswer。evaluation_cases における expected_answer の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_cases` | `expected_citation_json` | expectedcitationJSON | json | yes | internal | master | api |  | expectedcitationJSON。evaluation_cases における expected_citation_json の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_cases` | `answerability` | answerability | string | no | confidential | master | api |  | answerability。evaluation_cases における answerability の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_runs` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `evaluation_runs` | `evaluation_run_id` | 評価実行ID | string | no | internal | master | api |  | 評価実行ID。evaluation_runs における evaluation_run_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_runs` | `dataset_id` | datasetID | string | no | internal | master | api |  | datasetID。evaluation_runs における dataset_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_runs` | `model_id` | modelID | string | no | internal | master | api |  | modelID。evaluation_runs における model_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_runs` | `prompt_version` | prompt版 | string | no | internal | master | api |  | prompt版。evaluation_runs における prompt_version の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_runs` | `retrieval_config_json` | retrievalconfigJSON | json | no | internal | master | api |  | retrievalconfigJSON。evaluation_runs における retrieval_config_json の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_runs` | `artifact_s3_prefix` | 成果物s3prefix | string | yes | internal | master | api |  | 成果物s3prefix。evaluation_runs における artifact_s3_prefix の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_runs` | `status` | 現在状態projection | string | no | internal | projection | worker | evaluation_run_events | 現在状態projection。evaluation_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `evaluation_runs` | `metrics_json` | metricsJSON | json | yes | confidential | master | api |  | metricsJSON。evaluation_runs における metrics_json の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_runs` | `created_by_user_id` | 作成byユーザーID | string | no | pii | master | api |  | 作成byユーザーID。evaluation_runs における created_by_user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_run_items` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `evaluation_run_items` | `evaluation_run_id` | 評価実行ID | string | no | internal | master | api |  | 評価実行ID。evaluation_run_items における evaluation_run_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_run_items` | `case_id` | caseID | uuid | no | internal | master | api |  | caseID。evaluation_run_items における case_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_run_items` | `status` | 現在状態projection | string | no | internal | projection | worker | evaluation_run_item_events | 現在状態projection。evaluation_run_item_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `evaluation_run_items` | `answer_text` | answertext | text | yes | confidential | master | api |  | answertext。evaluation_run_items における answer_text の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_run_items` | `retrieved_context_json` | retrievedcontextJSON | json | yes | confidential | master | api |  | retrievedcontextJSON。evaluation_run_items における retrieved_context_json の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_run_items` | `judge_result_json` | judgeresultJSON | json | yes | confidential | master | api |  | judgeresultJSON。evaluation_run_items における judge_result_json の値を保持する。分類と更新主体はmetadataで管理する。 |
| `evaluation_run_items` | `metrics_json` | metricsJSON | json | yes | confidential | master | api |  | metricsJSON。evaluation_run_items における metrics_json の値を保持する。分類と更新主体はmetadataで管理する。 |
| `llm_models` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `llm_models` | `model_id` | modelID | string | no | internal | master | api |  | modelID。llm_models における model_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `llm_models` | `display_name` | display名称 | string | no | pii | master | api |  | display名称。llm_models における display_name の値を保持する。分類と更新主体はmetadataで管理する。 |
| `llm_models` | `provider` | provider | string | no | internal | master | api |  | provider。llm_models における provider の値を保持する。分類と更新主体はmetadataで管理する。 |
| `llm_models` | `model_type` | modeltype | string | no | internal | master | api |  | modeltype。llm_models における model_type の値を保持する。分類と更新主体はmetadataで管理する。 |
| `llm_models` | `capability_json` | capabilityJSON | json | no | confidential | master | api |  | capabilityJSON。llm_models における capability_json の値を保持する。分類と更新主体はmetadataで管理する。 |
| `llm_models` | `status` | 現在状態projection | string | no | internal | projection | api | llm_model_events | 現在状態projection。llm_model_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `llm_models` | `visible_to_user` | visibletoユーザー | boolean | no | internal | master | api |  | visibletoユーザー。llm_models における visible_to_user の値を保持する。分類と更新主体はmetadataで管理する。 |
| `llm_models` | `allowed_role` | allowedrole | string | yes | internal | master | api |  | allowedrole。llm_models における allowed_role の値を保持する。分類と更新主体はmetadataで管理する。 |
| `llm_models` | `default_for_task` | defaultfortask | string | yes | internal | master | api |  | defaultfortask。llm_models における default_for_task の値を保持する。分類と更新主体はmetadataで管理する。 |
| `llm_models` | `catalog_version` | catalog版 | string | no | internal | master | api |  | catalog版。llm_models における catalog_version の値を保持する。分類と更新主体はmetadataで管理する。 |
| `llm_models` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `llm_models` | `updated_at` | 更新at | timestamp | no | internal | projection | api | llm_model_events | 更新at。llm_model_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_search_documents` | `tenant_id` | テナントID | string | no | internal | projection | worker | bm25_search_document_events | テナントID。bm25_search_document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_search_documents` | `collection_id` | collectionID | uuid | no | internal | projection | worker | bm25_search_document_events | collectionID。bm25_search_document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_search_documents` | `doc_id` | docID | uuid | no | internal | projection | worker | bm25_search_document_events | docID。bm25_search_document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_search_documents` | `source_chunk_id` | sourcechunkID | string | no | internal | projection | worker | bm25_search_document_events | sourcechunkID。bm25_search_document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_search_documents` | `title` | タイトル | text | yes | confidential | projection | worker | bm25_search_document_events | タイトル。bm25_search_document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_search_documents` | `snippet` | snippet | text | yes | confidential | projection | worker | bm25_search_document_events | snippet。bm25_search_document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_search_documents` | `doc_type` | doctype | string | yes | internal | projection | worker | bm25_search_document_events | doctype。bm25_search_document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_search_documents` | `is_deleted` | is削除 | boolean | no | internal | projection | worker | bm25_search_document_events | is削除。bm25_search_document_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_postings` | `tenant_id` | テナントID | string | no | internal | projection | worker | bm25_posting_events | テナントID。bm25_posting_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_postings` | `collection_id` | collectionID | uuid | no | internal | projection | worker | bm25_posting_events | collectionID。bm25_posting_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_postings` | `term_id` | termID | uuid | no | internal | projection | worker | bm25_posting_events | termID。bm25_posting_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_postings` | `doc_id` | docID | uuid | no | internal | projection | worker | bm25_posting_events | docID。bm25_posting_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_postings` | `field_id` | fieldID | integer | no | internal | projection | worker | bm25_posting_events | fieldID。bm25_posting_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_postings` | `tf` | tf | integer | no | internal | projection | worker | bm25_posting_events | tf。bm25_posting_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_postings` | `field_len` | fieldlen | integer | no | internal | projection | worker | bm25_posting_events | fieldlen。bm25_posting_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_term_stats` | `tenant_id` | テナントID | string | no | internal | projection | worker | bm25_term_stat_events | テナントID。bm25_term_stat_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_term_stats` | `collection_id` | collectionID | uuid | no | internal | projection | worker | bm25_term_stat_events | collectionID。bm25_term_stat_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_term_stats` | `stats_version` | stats版 | uuid | no | internal | projection | worker | bm25_term_stat_events | stats版。bm25_term_stat_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_term_stats` | `term_id` | termID | uuid | no | internal | projection | worker | bm25_term_stat_events | termID。bm25_term_stat_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_term_stats` | `df` | df | integer | no | internal | projection | worker | bm25_term_stat_events | df。bm25_term_stat_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_term_stats` | `idf` | idf | float | no | internal | projection | worker | bm25_term_stat_events | idf。bm25_term_stat_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_field_stats` | `tenant_id` | テナントID | string | no | internal | projection | worker | bm25_field_stat_events | テナントID。bm25_field_stat_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_field_stats` | `collection_id` | collectionID | uuid | no | internal | projection | worker | bm25_field_stat_events | collectionID。bm25_field_stat_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_field_stats` | `stats_version` | stats版 | uuid | no | internal | projection | worker | bm25_field_stat_events | stats版。bm25_field_stat_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_field_stats` | `field_id` | fieldID | integer | no | internal | projection | worker | bm25_field_stat_events | fieldID。bm25_field_stat_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `bm25_field_stats` | `avg_len` | avglen | float | no | internal | projection | worker | bm25_field_stat_events | avglen。bm25_field_stat_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `event_delivery_logs` | `tenant_id` | テナントID | string | no | internal | projection | worker | event_delivery_events | テナントID。event_delivery_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `event_delivery_logs` | `delivery_id` | deliveryID | uuid | no | internal | projection | worker | event_delivery_events | deliveryID。event_delivery_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `event_delivery_logs` | `channel_path` | channelpath | string | no | internal | projection | worker | event_delivery_events | channelpath。event_delivery_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `event_delivery_logs` | `event_id` | イベントID | uuid | no | internal | projection | worker | event_delivery_events | イベントID。event_delivery_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `event_delivery_logs` | `status` | 現在状態projection | string | no | internal | projection | worker | event_delivery_events | 現在状態projection。event_delivery_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `event_delivery_logs` | `attempt_count` | attemptcount | integer | no | internal | projection | worker | event_delivery_events | attemptcount。event_delivery_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `event_delivery_logs` | `error_message` | errorメッセージ | text | yes | pii | projection | worker | event_delivery_events | errorメッセージ。event_delivery_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `event_delivery_logs` | `created_at` | 作成at | timestamp | no | internal | projection | worker | event_delivery_events | 作成at。event_delivery_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `event_delivery_logs` | `updated_at` | 更新at | timestamp | no | internal | projection | worker | event_delivery_events | 更新at。event_delivery_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `audit_events` | `tenant_id` | テナントID | string | no | internal | audit | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `audit_events` | `audit_event_id` | auditイベントID | uuid | no | internal | audit | api |  | auditイベントID。audit_events における audit_event_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `audit_events` | `actor_user_id` | actorユーザーID | string | no | pii | audit | api |  | actorユーザーID。audit_events における actor_user_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `audit_events` | `event_name` | イベント名称 | string | no | internal | audit | api |  | イベント名。発生した業務イベントの種類。payload_json のschema選択に利用する。 |
| `audit_events` | `category` | category | string | no | internal | audit | api |  | category。audit_events における category の値を保持する。分類と更新主体はmetadataで管理する。 |
| `audit_events` | `resource_id` | resourceID | string | no | internal | audit | api |  | resourceID。audit_events における resource_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `audit_events` | `payload_json` | payloadJSON | json | yes | confidential | audit | api |  | payload JSON。event_nameごとのschemaはアプリケーション側で検証する。 |
| `audit_events` | `created_at` | 作成at | timestamp | no | internal | audit | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `agent_tools` | `tenant_id` | テナントID | string | no | internal | master | api |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `agent_tools` | `tool_name` | Tool名称 | string | no | internal | master | api |  | Tool名称。agent_tools における tool_name の値を保持する。分類と更新主体はmetadataで管理する。 |
| `agent_tools` | `display_name` | display名称 | string | no | pii | master | api |  | display名称。agent_tools における display_name の値を保持する。分類と更新主体はmetadataで管理する。 |
| `agent_tools` | `description` | description | text | no | confidential | master | api |  | description。agent_tools における description の値を保持する。分類と更新主体はmetadataで管理する。 |
| `agent_tools` | `input_schema_json` | inputschemaJSON | json | no | confidential | master | api |  | inputschemaJSON。agent_tools における input_schema_json の値を保持する。分類と更新主体はmetadataで管理する。 |
| `agent_tools` | `output_schema_json` | outputschemaJSON | json | no | confidential | master | api |  | outputschemaJSON。agent_tools における output_schema_json の値を保持する。分類と更新主体はmetadataで管理する。 |
| `agent_tools` | `tool_scope` | Toolscope | string | no | confidential | master | api |  | Toolscope。agent_tools における tool_scope の値を保持する。分類と更新主体はmetadataで管理する。 |
| `agent_tools` | `side_effect_type` | sideeffecttype | string | no | internal | master | api |  | sideeffecttype。agent_tools における side_effect_type の値を保持する。分類と更新主体はmetadataで管理する。 |
| `agent_tools` | `timeout_ms` | timeoutms | integer | no | internal | master | api |  | timeoutms。agent_tools における timeout_ms の値を保持する。分類と更新主体はmetadataで管理する。 |
| `agent_tools` | `status` | 現在状態projection | string | no | internal | projection | api | agent_tool_events | 現在状態projection。agent_tool_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `agent_tools` | `created_at` | 作成at | timestamp | no | internal | master | api |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `agent_tools` | `updated_at` | 更新at | timestamp | no | internal | projection | api | agent_tool_events | 更新at。agent_tool_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `tool_invocations` | `tenant_id` | テナントID | string | no | internal | master | agent |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `tool_invocations` | `invocation_id` | invocationID | uuid | no | internal | master | agent |  | invocationID。tool_invocations における invocation_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `tool_invocations` | `run_id` | 実行ID | uuid | no | internal | master | agent |  | 実行ID。tool_invocations における run_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `tool_invocations` | `chat_id` | チャットID | uuid | yes | internal | master | agent |  | チャットID。tool_invocations における chat_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `tool_invocations` | `message_id` | メッセージID | uuid | yes | internal | master | agent |  | メッセージID。tool_invocations における message_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `tool_invocations` | `tool_name` | Tool名称 | string | no | internal | master | agent |  | Tool名称。tool_invocations における tool_name の値を保持する。分類と更新主体はmetadataで管理する。 |
| `tool_invocations` | `request_hash` | requesthash | string | no | secret_ref | master | agent |  | requesthash。tool_invocations における request_hash の値を保持する。分類と更新主体はmetadataで管理する。 |
| `tool_invocations` | `response_summary_json` | responsesummaryJSON | json | yes | confidential | master | agent |  | Tool応答要約JSON。機密本文や全文chunkを含めず、監査・性能分析に必要な要約のみ保持する。 |
| `tool_invocations` | `status` | 現在状態projection | string | no | internal | projection | agent | tool_invocation_events | 現在状態projection。tool_invocation_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `tool_invocations` | `latency_ms` | latencyms | integer | yes | internal | master | agent |  | latencyms。tool_invocations における latency_ms の値を保持する。分類と更新主体はmetadataで管理する。 |
| `tool_invocations` | `error_code` | errorcode | string | yes | internal | master | agent |  | errorcode。tool_invocations における error_code の値を保持する。分類と更新主体はmetadataで管理する。 |
| `tool_invocations` | `error_message` | errorメッセージ | text | yes | pii | master | agent |  | errorメッセージ。tool_invocations における error_message の値を保持する。分類と更新主体はmetadataで管理する。 |
| `tool_invocations` | `created_at` | 作成at | timestamp | no | internal | master | agent |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `tool_invocations` | `completed_at` | 完了at | timestamp | yes | internal | projection | agent | tool_invocation_events | 完了at。tool_invocation_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `published_artifacts` | `tenant_id` | テナントID | string | no | internal | artifact_index | ci |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `published_artifacts` | `artifact_id` | 成果物ID | string | no | internal | artifact_index | ci |  | 成果物ID。published_artifacts における artifact_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `published_artifacts` | `artifact_type` | 成果物type | string | no | internal | artifact_index | ci |  | 成果物type。published_artifacts における artifact_type の値を保持する。分類と更新主体はmetadataで管理する。 |
| `published_artifacts` | `title` | タイトル | string | no | confidential | artifact_index | ci |  | タイトル。published_artifacts における title の値を保持する。分類と更新主体はmetadataで管理する。 |
| `published_artifacts` | `version_label` | 版label | string | yes | internal | artifact_index | ci |  | 版label。published_artifacts における version_label の値を保持する。分類と更新主体はmetadataで管理する。 |
| `published_artifacts` | `source_ref` | sourceref | string | yes | internal | artifact_index | ci |  | sourceref。published_artifacts における source_ref の値を保持する。分類と更新主体はmetadataで管理する。 |
| `published_artifacts` | `s3_bucket` | s3bucket | string | no | internal | artifact_index | ci |  | s3bucket。published_artifacts における s3_bucket の値を保持する。分類と更新主体はmetadataで管理する。 |
| `published_artifacts` | `s3_prefix` | s3prefix | string | no | internal | artifact_index | ci |  | s3prefix。published_artifacts における s3_prefix の値を保持する。分類と更新主体はmetadataで管理する。 |
| `published_artifacts` | `viewer_path` | viewerpath | string | no | internal | artifact_index | ci |  | viewerpath。published_artifacts における viewer_path の値を保持する。分類と更新主体はmetadataで管理する。 |
| `published_artifacts` | `status` | 現在状態projection | string | no | internal | projection | ci | published_artifact_events | 現在状態projection。published_artifact_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `published_artifacts` | `checksum` | checksum | string | yes | internal | artifact_index | ci |  | checksum。published_artifacts における checksum の値を保持する。分類と更新主体はmetadataで管理する。 |
| `published_artifacts` | `published_by` | publishedby | string | no | pii | artifact_index | ci |  | publishedby。published_artifacts における published_by の値を保持する。分類と更新主体はmetadataで管理する。 |
| `published_artifacts` | `published_at` | publishedat | timestamp | yes | internal | projection | ci | published_artifact_events | publishedat。published_artifact_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `published_artifacts` | `expires_at` | 期限at | timestamp | yes | internal | projection | ci | published_artifact_events | 期限at。published_artifact_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `published_artifacts` | `created_at` | 作成at | timestamp | no | internal | artifact_index | ci |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `published_artifacts` | `updated_at` | 更新at | timestamp | no | internal | projection | ci | published_artifact_events | 更新at。published_artifact_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `test_report_runs` | `tenant_id` | テナントID | string | no | internal | artifact_index | ci |  | テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。 |
| `test_report_runs` | `test_run_id` | test実行ID | uuid | no | internal | artifact_index | ci |  | test実行ID。test_report_runs における test_run_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `test_report_runs` | `artifact_id` | 成果物ID | string | no | internal | artifact_index | ci |  | 成果物ID。test_report_runs における artifact_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `test_report_runs` | `workflow_run_id` | workflow実行ID | string | yes | internal | artifact_index | ci |  | workflow実行ID。test_report_runs における workflow_run_id の値を保持する。分類と更新主体はmetadataで管理する。 |
| `test_report_runs` | `commit_sha` | commitsha | string | no | internal | artifact_index | ci |  | commitsha。test_report_runs における commit_sha の値を保持する。分類と更新主体はmetadataで管理する。 |
| `test_report_runs` | `branch_name` | branch名称 | string | no | internal | artifact_index | ci |  | branch名称。test_report_runs における branch_name の値を保持する。分類と更新主体はmetadataで管理する。 |
| `test_report_runs` | `environment` | environment | string | no | internal | artifact_index | ci |  | environment。test_report_runs における environment の値を保持する。分類と更新主体はmetadataで管理する。 |
| `test_report_runs` | `test_suite` | testsuite | string | no | internal | artifact_index | ci |  | testsuite。test_report_runs における test_suite の値を保持する。分類と更新主体はmetadataで管理する。 |
| `test_report_runs` | `status` | 現在状態projection | string | no | internal | projection | ci | test_report_run_events | 現在状態projection。test_report_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `test_report_runs` | `total_count` | totalcount | integer | no | internal | artifact_index | ci |  | totalcount。test_report_runs における total_count の値を保持する。分類と更新主体はmetadataで管理する。 |
| `test_report_runs` | `passed_count` | passedcount | integer | no | internal | artifact_index | ci |  | passedcount。test_report_runs における passed_count の値を保持する。分類と更新主体はmetadataで管理する。 |
| `test_report_runs` | `failed_count` | failedcount | integer | no | internal | artifact_index | ci |  | failedcount。test_report_runs における failed_count の値を保持する。分類と更新主体はmetadataで管理する。 |
| `test_report_runs` | `skipped_count` | skippedcount | integer | no | internal | artifact_index | ci |  | skippedcount。test_report_runs における skipped_count の値を保持する。分類と更新主体はmetadataで管理する。 |
| `test_report_runs` | `duration_ms` | durationms | integer | yes | internal | artifact_index | ci |  | durationms。test_report_runs における duration_ms の値を保持する。分類と更新主体はmetadataで管理する。 |
| `test_report_runs` | `started_at` | 開始at | timestamp | no | internal | projection | ci | test_report_run_events | 開始at。test_report_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `test_report_runs` | `completed_at` | 完了at | timestamp | yes | internal | projection | ci | test_report_run_events | 完了at。test_report_run_events から導出される読み取り最適化値であり、状態の正本ではなくprojectionである。 |
| `test_report_runs` | `created_at` | 作成at | timestamp | no | internal | artifact_index | ci |  | 作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。 |
| `schema_migrations` | `installed_rank` | installedrank | integer | no | internal | migration_history | migration |  | installedrank。schema_migrations における installed_rank の値を保持する。分類と更新主体はmetadataで管理する。 |
| `schema_migrations` | `version` | 版 | string | yes | internal | migration_history | migration |  | 版。schema_migrations における version の値を保持する。分類と更新主体はmetadataで管理する。 |
| `schema_migrations` | `description` | description | string | no | confidential | migration_history | migration |  | description。schema_migrations における description の値を保持する。分類と更新主体はmetadataで管理する。 |
| `schema_migrations` | `type` | type | string | no | internal | migration_history | migration |  | type。schema_migrations における type の値を保持する。分類と更新主体はmetadataで管理する。 |
| `schema_migrations` | `script` | script | string | no | internal | migration_history | migration |  | script。schema_migrations における script の値を保持する。分類と更新主体はmetadataで管理する。 |
| `schema_migrations` | `checksum` | checksum | integer | yes | internal | migration_history | migration |  | checksum。schema_migrations における checksum の値を保持する。分類と更新主体はmetadataで管理する。 |
| `schema_migrations` | `installed_by` | installedby | string | no | internal | migration_history | migration |  | installedby。schema_migrations における installed_by の値を保持する。分類と更新主体はmetadataで管理する。 |
| `schema_migrations` | `installed_on` | installedon | timestamp | no | internal | migration_history | migration |  | installedon。schema_migrations における installed_on の値を保持する。分類と更新主体はmetadataで管理する。 |
| `schema_migrations` | `execution_time` | executiontime | integer | no | internal | migration_history | migration |  | executiontime。schema_migrations における execution_time の値を保持する。分類と更新主体はmetadataで管理する。 |
| `schema_migrations` | `success` | success | boolean | no | internal | migration_history | migration |  | success。schema_migrations における success の値を保持する。分類と更新主体はmetadataで管理する。 |
