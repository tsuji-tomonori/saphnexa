# DBテーブル一覧

生成元: `packages/db-schema/src/table-metadata.ts`

| table | 日本語名 | domain | sourceOfTruth | 説明 | 保持方針 |
|---|---|---|---|---|---|
| `tenants` | テナント | tenant | projection | Saphnexaを利用する組織単位を表す。状態は tenant_events から導出されるprojectionとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `users` | ユーザー | identity | projection | Cognito利用者に対応するアプリ内ユーザー属性を保持する。認証の正本はCognito、業務属性は user_events と本テーブルで管理する。 | テナントのデータ保持ポリシーに従って保持する。 |
| `user_groups` | ユーザーグループ | identity | master | 管理者が扱うユーザー集合と権限付与単位を表す。状態はprojectionとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `user_group_memberships` | ユーザーグループ所属 | identity | master | ユーザーとグループの所属関係を保持する。所属変更イベントから同期されるread modelとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `web_sessions` | Webセッション | identity | projection | Hono APIが発行するセッションcookie、refresh token参照、CSRF秘密情報を管理する。状態は web_session_events のprojectionとして扱う。 | 期限切れ後に運用ポリシーに従って削除または匿名化する。 |
| `chat_sessions` | チャット | chat | projection | ユーザー配下ではない独立した会話リソース。共有と参照権限は chat_participants で管理し、状態は chat_session_events のprojectionとして扱う。 | 期限切れ後に運用ポリシーに従って削除または匿名化する。 |
| `chat_participants` | チャット参加者 | chat | projection | チャットとユーザーの関係、および owner/viewer 権限を表す。共有変更は chat_participant_events を正本にする。 | テナントのデータ保持ポリシーに従って保持する。 |
| `chat_messages` | チャットメッセージ | chat | master | 一般ユーザー発話とassistant回答を保持する。回答状態は chat_run_events などから導出されるprojectionとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `chat_runs` | 回答生成run | chat | projection | 1つのassistant回答生成処理の実行単位。retrieval policy、model、prompt version、エラーを追跡する。 | テナントのデータ保持ポリシーに従って保持する。 |
| `chat_message_events` | チャットメッセージUIイベント | chat | projection | UIへ返す軽量イベント列。domain event正本とは分け、通知・REST取得のための時系列read modelとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `citation_records` | 引用レコード | rag | master | 回答文が根拠として提示する文書版、chunk、表示情報を保持する。RAG根拠性の監査対象である。 | テナントのデータ保持ポリシーに従って保持する。 |
| `message_feedback` | メッセージフィードバック | rag | master | 利用者の回答評価、問題種別、任意コメントを保持する。品質改善と監査の入力として扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `favorites` | お気に入り | chat | master | ユーザーが保存したチャットまたはメッセージ参照を保持する。ユーザー操作のread modelとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `documents` | 文書 | document | projection | 管理者が登録する文書の論理単位。文書版は document_versions で管理し、状態は document_events のprojectionとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `document_versions` | 文書版 | document | projection | PDF原本、metadata、取り込み対象となる版を表す。公開・有効化状態は document_version_events から導出する。 | テナントのデータ保持ポリシーに従って保持する。 |
| `document_acl_entries` | 文書ACL | document | projection | 文書版に対する検索・閲覧許可scopeを保持する。ACL変更イベントと同期し、KB metadataはsnapshotとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `ingestion_jobs` | 取り込みジョブ | document | projection | PDF登録後の解析、chunking、embedding、index登録を追跡する。状態は ingestion_job_events のprojectionとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `reference_nodes` | 参照ノード | rag | master | 章、節、図、表、chunkなど文書内参照グラフのノードを表す。 | テナントのデータ保持ポリシーに従って保持する。 |
| `reference_edges` | 参照エッジ | rag | master | 文書内外の相互参照関係を表す。章参照や図表参照などに使う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `ws_tickets` | WebSocket ticket | operations | master | AppSync Events購読前にHono APIが発行する短期・単回利用ticketを表す。状態はprojectionとして扱う。 | 期限切れ後に運用ポリシーに従って削除または匿名化する。 |
| `user_import_jobs` | ユーザー取込ジョブ | identity | projection | 管理者によるユーザー一括取込の実行単位を表す。状態は user_import_job_events のprojectionとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `user_import_rows` | ユーザー取込行 | identity | master | ユーザー一括取込の行単位結果を保持する。行状態は取込ジョブ処理から導出されるprojectionである。 | テナントのデータ保持ポリシーに従って保持する。 |
| `evaluation_datasets` | 評価データセット | evaluation | master | RAG評価またはLLM評価で使う問題集合を管理する。状態は管理操作から導出されるprojectionとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `evaluation_cases` | 評価ケース | evaluation | master | 評価データセット内の質問、期待回答、期待引用、回答可能性を保持する。 | テナントのデータ保持ポリシーに従って保持する。 |
| `evaluation_runs` | 評価実行 | evaluation | projection | RAG全体評価またはLLM評価の実行単位。metricsとartifact prefixを保持し、状態は evaluation_run_events から導出する。 | テナントのデータ保持ポリシーに従って保持する。 |
| `evaluation_run_items` | 評価実行項目 | evaluation | master | 評価実行に含まれるケース単位の回答、検索文脈、judge結果、metricsを保持する。 | テナントのデータ保持ポリシーに従って保持する。 |
| `llm_models` | LLMモデルカタログ | rag | master | 一般ユーザーや評価基盤が利用可能なモデル定義を共有する。表示状態はカタログprojectionとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `bm25_search_documents` | BM25F検索文書 | rag | projection | Sparse retrieval用の文書read model。is_deleted は検索除外projectionであり正本ではない。 | 検索index再構築で再生成可能なread modelとして保持する。 |
| `bm25_postings` | BM25F posting | rag | projection | termと文書fieldの出現頻度を保持する転置インデックス本体。 | 検索index再構築で再生成可能なread modelとして保持する。 |
| `bm25_term_stats` | BM25F term統計 | rag | projection | termごとのdf/idfを保持する検索用read model。 | 検索index再構築で再生成可能なread modelとして保持する。 |
| `bm25_field_stats` | BM25F field統計 | rag | projection | fieldごとの平均長を保持する検索用read model。 | 検索index再構築で再生成可能なread modelとして保持する。 |
| `event_delivery_logs` | イベント配信ログ | operations | projection | AppSync Eventsなどへの通知配信試行と結果を保持するoperations projection。 | テナントのデータ保持ポリシーに従って保持する。 |
| `audit_events` | 監査イベント | audit | audit | 管理操作、チャット共有、Tools実行、成果物アクセスなど監査対象のappend-onlyログ。 | 監査要件に従い長期保持する。 |
| `agent_tools` | Agent Tool定義 | rag | master | AgentCore Gatewayから利用するtoolのschema、scope、timeout、副作用分類を管理する。 | テナントのデータ保持ポリシーに従って保持する。 |
| `tool_invocations` | Tool呼び出し履歴 | audit | projection | AgentまたはTools APIが実行したtool invocationを監査・性能分析するために記録する。 | テナントのデータ保持ポリシーに従って保持する。 |
| `published_artifacts` | 公開成果物 | artifact | artifact_index | Docusaurus設計書サイト、Allureレポート、評価レポート等の公開先を管理する。状態は published_artifact_events のprojectionとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `test_report_runs` | テストレポート実行 | artifact | artifact_index | Allure等のテストレポート生成・公開単位を保持する。状態は test_report_run_events のprojectionとして扱う。 | テナントのデータ保持ポリシーに従って保持する。 |
| `schema_migrations` | スキーマmigration履歴 | migration | migration_history | Flyway互換のmigration適用結果を保持する。migration履歴の正本として扱う。 | DB存続期間中保持する。 |
