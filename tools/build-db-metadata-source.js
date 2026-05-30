import { writeFileSync } from "node:fs";
import { assert, readText } from "./lib.js";

const check = process.argv.includes("--check");
const schema = readText("packages/db-migrations/migrations/V001__initial_saphnexa_schema.sql");
const tables = parseTables(schema);

const tableDescriptions = {
  tenants: ["テナント", "Saphnexaを利用する組織単位を表す。状態は tenant_events から導出されるprojectionとして扱う。"],
  users: ["ユーザー", "Cognito利用者に対応するアプリ内ユーザー属性を保持する。認証の正本はCognito、業務属性は user_events と本テーブルで管理する。"],
  user_groups: ["ユーザーグループ", "管理者が扱うユーザー集合と権限付与単位を表す。状態は user_group_events から導出されるprojectionとして扱う。"],
  user_group_memberships: ["ユーザーグループ所属", "ユーザーとグループの所属関係を保持する。所属変更イベントから同期されるread modelとして扱う。"],
  web_sessions: ["Webセッション", "Hono APIが発行するセッションcookie、refresh token参照、CSRF秘密情報を管理する。状態は web_session_events のprojectionとして扱う。"],
  chat_sessions: ["チャット", "ユーザー配下ではない独立した会話リソース。共有と参照権限は chat_participants で管理し、状態は chat_session_events のprojectionとして扱う。"],
  chat_participants: ["チャット参加者", "チャットとユーザーの関係、および owner/viewer 権限を表す。共有変更は chat_participant_events を正本にする。"],
  chat_messages: ["チャットメッセージ", "一般ユーザー発話とassistant回答を保持する。回答状態は chat_run_events などから導出されるprojectionとして扱う。"],
  chat_runs: ["回答生成run", "1つのassistant回答生成処理の実行単位。retrieval policy、model、prompt version、エラーを追跡する。"],
  chat_message_events: ["チャットメッセージUIイベント", "UIへ返す軽量イベント列。domain event正本とは分け、chat_message_lifecycle_events から導出される時系列read modelとして扱う。"],
  citation_records: ["引用レコード", "回答文が根拠として提示する文書版、chunk、表示情報を保持する。RAG根拠性の監査対象である。"],
  message_feedback: ["メッセージフィードバック", "利用者の回答評価、問題種別、任意コメントを保持する。品質改善と監査の入力として扱う。"],
  favorites: ["お気に入り", "ユーザーが保存したチャットまたはメッセージ参照を保持する。ユーザー操作のread modelとして扱う。"],
  documents: ["文書", "管理者が登録する文書の論理単位。文書版は document_versions で管理し、状態は document_events のprojectionとして扱う。"],
  document_versions: ["文書版", "PDF原本、metadata、取り込み対象となる版を表す。公開・有効化状態は document_version_events から導出する。"],
  document_acl_entries: ["文書ACL", "文書版に対する検索・閲覧許可scopeを保持する。ACL変更イベントと同期し、KB metadataはsnapshotとして扱う。"],
  ingestion_jobs: ["取り込みジョブ", "PDF登録後の解析、chunking、embedding、index登録を追跡する。状態は ingestion_job_events のprojectionとして扱う。"],
  reference_nodes: ["参照ノード", "章、節、図、表、chunkなど文書内参照グラフのノードを表す。"],
  reference_edges: ["参照エッジ", "文書内外の相互参照関係を表す。章参照や図表参照などに使う。"],
  ws_tickets: ["WebSocket ticket", "AppSync Events購読前にHono APIが発行する短期・単回利用ticketを表す。状態は ws_ticket_events から導出されるprojectionとして扱う。"],
  user_import_jobs: ["ユーザー取込ジョブ", "管理者によるユーザー一括取込の実行単位を表す。状態は user_import_job_events のprojectionとして扱う。"],
  user_import_rows: ["ユーザー取込行", "ユーザー一括取込の行単位結果を保持する。行状態は user_import_row_events から導出されるprojectionである。"],
  evaluation_datasets: ["評価データセット", "RAG評価またはLLM評価で使う問題集合を管理する。状態は evaluation_dataset_events から導出されるprojectionとして扱う。"],
  evaluation_cases: ["評価ケース", "評価データセット内の質問、期待回答、期待引用、回答可能性を保持する。"],
  evaluation_runs: ["評価実行", "RAG全体評価またはLLM評価の実行単位。metricsとartifact prefixを保持し、状態は evaluation_run_events から導出する。"],
  evaluation_run_items: ["評価実行項目", "評価実行に含まれるケース単位の回答、検索文脈、judge結果、metricsを保持する。状態は evaluation_run_item_events から導出されるprojectionとして扱う。"],
  llm_models: ["LLMモデルカタログ", "一般ユーザーや評価基盤が利用可能なモデル定義を共有する。表示状態は llm_model_events から導出されるカタログprojectionとして扱う。"],
  bm25_search_documents: ["BM25F検索文書", "Sparse retrieval用の文書read model。is_deleted は検索除外projectionであり正本ではない。"],
  bm25_postings: ["BM25F posting", "termと文書fieldの出現頻度を保持する転置インデックス本体。bm25_posting_events から導出されるread model。"],
  bm25_term_stats: ["BM25F term統計", "termごとのdf/idfを保持する検索用read model。bm25_term_stat_events から導出する。"],
  bm25_field_stats: ["BM25F field統計", "fieldごとの平均長を保持する検索用read model。bm25_field_stat_events から導出する。"],
  event_delivery_logs: ["イベント配信ログ", "AppSync Eventsなどへの通知配信試行と結果を保持するoperations projection。状態は event_delivery_events から導出する。"],
  audit_events: ["監査イベント", "管理操作、チャット共有、Tools実行、成果物アクセスなど監査対象のappend-onlyログ。"],
  agent_tools: ["Agent Tool定義", "AgentCore Gatewayから利用するtoolのschema、scope、timeout、副作用分類を管理する。状態は agent_tool_events から導出されるprojectionとして扱う。"],
  tool_invocations: ["Tool呼び出し履歴", "AgentまたはTools APIが実行したtool invocationを監査・性能分析するために記録する。"],
  published_artifacts: ["公開成果物", "Docusaurus設計書サイト、Allureレポート、評価レポート等の公開先を管理する。状態は published_artifact_events のprojectionとして扱う。"],
  test_report_runs: ["テストレポート実行", "Allure等のテストレポート生成・公開単位を保持する。状態は test_report_run_events のprojectionとして扱う。"],
  schema_migrations: ["スキーマmigration履歴", "Flyway互換のmigration適用結果を保持する。migration履歴の正本として扱う。"]
};

const domainByTable = {
  tenants: "tenant",
  users: "identity",
  user_groups: "identity",
  user_group_memberships: "identity",
  web_sessions: "identity",
  chat_sessions: "chat",
  chat_participants: "chat",
  chat_messages: "chat",
  chat_runs: "chat",
  chat_message_events: "chat",
  citation_records: "rag",
  message_feedback: "rag",
  favorites: "chat",
  documents: "document",
  document_versions: "document",
  document_acl_entries: "document",
  ingestion_jobs: "document",
  reference_nodes: "rag",
  reference_edges: "rag",
  ws_tickets: "operations",
  user_import_jobs: "identity",
  user_import_rows: "identity",
  evaluation_datasets: "evaluation",
  evaluation_cases: "evaluation",
  evaluation_runs: "evaluation",
  evaluation_run_items: "evaluation",
  llm_models: "rag",
  bm25_search_documents: "rag",
  bm25_postings: "rag",
  bm25_term_stats: "rag",
  bm25_field_stats: "rag",
  event_delivery_logs: "operations",
  audit_events: "audit",
  agent_tools: "rag",
  tool_invocations: "audit",
  published_artifacts: "artifact",
  test_report_runs: "artifact",
  schema_migrations: "migration"
};

const tableSourceKind = {
  audit_events: "audit",
  schema_migrations: "migration_history",
  published_artifacts: "artifact_index",
  test_report_runs: "artifact_index",
  chat_message_events: "projection",
  bm25_search_documents: "projection",
  bm25_postings: "projection",
  bm25_term_stats: "projection",
  bm25_field_stats: "projection",
  event_delivery_logs: "projection"
};

const eventMappings = [
  ["tenants", "tenant_events", "projector"],
  ["users", "user_events", "projector"],
  ["user_groups", "user_group_events", "projector"],
  ["web_sessions", "web_session_events", "projector"],
  ["chat_sessions", "chat_session_events", "projector"],
  ["chat_participants", "chat_participant_events", "projector"],
  ["chat_messages", "chat_message_lifecycle_events", "projector"],
  ["chat_message_events", "chat_message_lifecycle_events", "projector"],
  ["chat_runs", "chat_run_events", "projector"],
  ["documents", "document_events", "projector"],
  ["document_versions", "document_version_events", "projector"],
  ["document_acl_entries", "document_acl_events", "projector"],
  ["ingestion_jobs", "ingestion_job_events", "worker"],
  ["ws_tickets", "ws_ticket_events", "projector"],
  ["user_import_jobs", "user_import_job_events", "worker"],
  ["user_import_rows", "user_import_row_events", "worker"],
  ["evaluation_datasets", "evaluation_dataset_events", "worker"],
  ["evaluation_runs", "evaluation_run_events", "worker"],
  ["evaluation_run_items", "evaluation_run_item_events", "worker"],
  ["llm_models", "llm_model_events", "api"],
  ["bm25_search_documents", "bm25_search_document_events", "worker"],
  ["bm25_postings", "bm25_posting_events", "worker"],
  ["bm25_term_stats", "bm25_term_stat_events", "worker"],
  ["bm25_field_stats", "bm25_field_stat_events", "worker"],
  ["event_delivery_logs", "event_delivery_events", "worker"],
  ["agent_tools", "agent_tool_events", "api"],
  ["published_artifacts", "published_artifact_events", "ci"],
  ["tool_invocations", "tool_invocation_events", "agent"],
  ["test_report_runs", "test_report_run_events", "ci"]
];

const projectionTables = new Map(eventMappings.map(([projectionTable, eventTable, updateOwner]) => [projectionTable, { eventTable, updateOwner }]));
const projectionColumnNames = new Set(["status", "is_deleted", "deleted_at", "updated_at", "removed_at", "used_at", "completed_at", "started_at", "published_at", "expires_at", "last_message_at"]);

const metadata = tables.map((table) => {
  const [japaneseName, baseDescription] = tableDescriptions[table.name] ?? [toJapaneseName(table.name), `${table.name} の業務データを保持する。`];
  const projection = projectionTables.get(table.name);
  return {
    tableName: table.name,
    japaneseName,
    description: baseDescription,
    domain: domainByTable[table.name] ?? "operations",
    sourceOfTruthKind: tableSourceKind[table.name] ?? (projection ? "projection" : "master"),
    primaryKey: table.primaryKey,
    lifecycle: lifecycleFor(table.name, projection),
    retentionPolicy: retentionFor(table.name),
    columns: table.columns.map((column) => columnMetadata(table.name, column, projection))
  };
});

const outputs = [
  {
    path: "packages/db-schema/src/table-metadata.js",
    body: `${headerJs()}export const dbTableMetadata = ${JSON.stringify(metadata, null, 2)};\n\nexport function getDbTableMetadata(tableName) {\n  const metadata = dbTableMetadata.find((item) => item.tableName === tableName);\n  if (!metadata) throw new Error(\`unknown DB table metadata \${tableName}\`);\n  return metadata;\n}\n`
  },
  {
    path: "packages/db-schema/src/table-metadata.ts",
    body: `${headerTs()}${typeSurfaceComment(metadata)}import type { RequiredTableName } from "./tables";\nimport { dbTableMetadata as runtimeDbTableMetadata } from "./table-metadata.js";\n\nexport type DbLogicalType = "string" | "uuid" | "integer" | "bigint" | "float" | "json" | "timestamp" | "text" | "boolean";\nexport type DbDomain = "tenant" | "identity" | "chat" | "document" | "rag" | "evaluation" | "artifact" | "audit" | "operations" | "migration";\nexport type SourceOfTruthKind = "master" | "event" | "projection" | "audit" | "artifact_index" | "migration_history";\nexport type DataClassification = "public" | "internal" | "confidential" | "pii" | "secret_ref";\nexport type UpdateOwner = "api" | "worker" | "agent" | "projector" | "migration" | "ci";\n\nexport interface DbColumnMetadata {\n  name: string;\n  japaneseName: string;\n  logicalType: DbLogicalType;\n  nullable: boolean;\n  description: string;\n  dataClassification: DataClassification;\n  sourceOfTruthKind: SourceOfTruthKind;\n  derivedFrom?: string;\n  updateOwner: UpdateOwner;\n}\n\nexport interface DbTableMetadata {\n  tableName: RequiredTableName;\n  japaneseName: string;\n  description: string;\n  domain: DbDomain;\n  sourceOfTruthKind: SourceOfTruthKind;\n  primaryKey: readonly string[];\n  lifecycle: string;\n  retentionPolicy: string;\n  columns: readonly DbColumnMetadata[];\n}\n\nexport const dbTableMetadata = runtimeDbTableMetadata as readonly DbTableMetadata[];\nexport type DbMetadataTableName = (typeof dbTableMetadata)[number]["tableName"];\n\nexport function getDbTableMetadata(tableName: DbMetadataTableName): DbTableMetadata {\n  const metadata = dbTableMetadata.find((item) => item.tableName === tableName);\n  if (!metadata) throw new Error(\`unknown DB table metadata \${tableName}\`);\n  return metadata;\n}\n`
  }
];

if (check) {
  for (const output of outputs) {
    assert(readText(output.path) === output.body, `${output.path} is out of date. Run npm run db:metadata:build.`);
  }
  console.log(`DB metadata source check passed (${metadata.length} tables)`);
} else {
  for (const output of outputs) writeFileSync(output.path, output.body);
  console.log(`wrote DB metadata source for ${metadata.length} tables`);
}

function parseTables(sql) {
  const results = [];
  const tableRe = /CREATE TABLE ([a-z0-9_]+) \(([\s\S]*?)\n\);/g;
  for (const match of sql.matchAll(tableRe)) {
    const name = match[1];
    const body = match[2];
    const columns = [];
    let primaryKey = [];
    for (const rawLine of body.split("\n")) {
      const line = rawLine.trim().replace(/,$/, "");
      if (!line) continue;
      const pk = line.match(/^PRIMARY KEY \((.+)\)$/i);
      if (pk) {
        primaryKey = pk[1].split(",").map((item) => item.trim());
        continue;
      }
      const inlinePk = line.match(/^([a-z0-9_]+)\s+.+\s+PRIMARY KEY$/i);
      const column = line.match(/^([a-z0-9_]+)\s+(.+)$/i);
      if (!column) continue;
      columns.push({
        name: column[1],
        logicalType: logicalType(column[2]),
        nullable: !/\bNOT NULL\b/i.test(column[2]) && !/\bPRIMARY KEY\b/i.test(column[2])
      });
      if (inlinePk) primaryKey = [inlinePk[1]];
    }
    results.push({ name, primaryKey, columns });
  }
  return results;
}

function columnMetadata(tableName, column, projection) {
  const isProjectionColumn = projectionColumnNames.has(column.name);
  const dataClassification = classifyColumn(column.name);
  const sourceOfTruthKind = isProjectionColumn ? "projection" : sourceKindForColumn(tableName, column.name);
  const derivedFrom = sourceOfTruthKind === "projection" && projection ? projection.eventTable : undefined;
  return {
    ...column,
    japaneseName: japaneseColumnName(column.name),
    description: columnDescription(tableName, column.name, isProjectionColumn, projection),
    dataClassification,
    sourceOfTruthKind,
    ...(derivedFrom ? { derivedFrom } : {}),
    updateOwner: updateOwnerFor(tableName, column.name, sourceOfTruthKind === "projection", projection)
  };
}

function logicalType(sqlType) {
  if (/uuid/i.test(sqlType)) return "uuid";
  if (/bigint/i.test(sqlType)) return "bigint";
  if (/smallint|integer/i.test(sqlType)) return "integer";
  if (/double precision|real|numeric/i.test(sqlType)) return "float";
  if (/\bjson\b/i.test(sqlType)) return "json";
  if (/timestamp|timestamptz/i.test(sqlType)) return "timestamp";
  if (/\btext\b/i.test(sqlType)) return "text";
  if (/boolean/i.test(sqlType)) return "boolean";
  return "string";
}

function classifyColumn(name) {
  if (/email|display_name|user_id|actor_user_id|created_by|published_by|department|employment_type|comment|error_message/i.test(name)) return "pii";
  if (/secret|token|hash/i.test(name)) return "secret_ref";
  if (/payload|metadata|input|output|response|retrieved|judge|metrics|capability|schema|policy|scope/i.test(name)) return "confidential";
  if (/title|snippet|content|question|answer|description/i.test(name)) return "confidential";
  return "internal";
}

function sourceKindForColumn(tableName, columnName) {
  if (tableName === "audit_events") return "audit";
  if (tableName === "schema_migrations") return "migration_history";
  if (tableSourceKind[tableName]) return tableSourceKind[tableName];
  if (/event_id|event_name|event_seq|payload_json/.test(columnName) && tableName.endsWith("_events")) return "event";
  return "master";
}

function updateOwnerFor(tableName, columnName, isProjectionColumn, projection) {
  if (tableName === "schema_migrations") return "migration";
  if (tableName === "published_artifacts" || tableName === "test_report_runs") return "ci";
  if (tableName === "tool_invocations") return "agent";
  if (tableName.includes("ingestion") || tableName.includes("evaluation")) return isProjectionColumn ? "worker" : "api";
  if (isProjectionColumn && projection) return projection.updateOwner;
  return "api";
}

function columnDescription(tableName, name, isProjectionColumn, projection) {
  if (isProjectionColumn || sourceKindForColumn(tableName, name) === "projection") {
    const source = projection?.eventTable ? `${projection.eventTable} から導出される` : "具体event table未設定";
    return `${japaneseColumnName(name)}。${source}読み取り最適化値であり、状態の正本ではなくprojectionである。`;
  }
  const common = {
    tenant_id: "テナントID。データ分離の最小単位。全業務テーブルで必須のスコープキー。",
    created_at: "作成日時。レコードが初めて作成された日時。業務イベントの発生日時とは区別する。",
    event_id: "イベントID。イベントを一意に識別するID。冪等性確認と監査で利用する。",
    event_name: "イベント名。発生した業務イベントの種類。payload_json のschema選択に利用する。",
    event_seq: "イベント連番。aggregate内の順序を表す。append-only eventの並びを検証する。",
    payload_json: "payload JSON。event_nameごとのschemaはアプリケーション側で検証する。",
    metadata_json: "metadata JSON。文書取り込みmetadataやKB metadata snapshot生成の入力として扱う。",
    retrieval_policy_json: "検索ポリシーJSON。top_kやallowed_acl_scope_idsなど、Agentが緩和してはいけない検索制約を保持する。",
    response_summary_json: "Tool応答要約JSON。機密本文や全文chunkを含めず、監査・性能分析に必要な要約のみ保持する。"
  };
  return common[name] ?? `${japaneseColumnName(name)}。${tableName} における ${name} の値を保持する。分類と更新主体はmetadataで管理する。`;
}

function japaneseColumnName(name) {
  const labels = {
    id: "ID",
    tenant: "テナント",
    user: "ユーザー",
    group: "グループ",
    session: "セッション",
    chat: "チャット",
    message: "メッセージ",
    document: "文書",
    version: "版",
    status: "現在状態projection",
    created: "作成",
    updated: "更新",
    deleted: "削除",
    completed: "完了",
    started: "開始",
    expires: "期限",
    title: "タイトル",
    name: "名称",
    json: "JSON",
    event: "イベント",
    artifact: "成果物",
    evaluation: "評価",
    run: "実行",
    tool: "Tool"
  };
  return name
    .split("_")
    .map((part) => labels[part] ?? part)
    .join("");
}

function toJapaneseName(name) {
  return name.replaceAll("_", " ");
}

function lifecycleFor(tableName, projection) {
  if (tableName === "audit_events") return "append-onlyで作成し、更新・削除しない。";
  if (tableName === "schema_migrations") return "migration適用時に作成し、履歴として保持する。";
  if (projection) return `${projection.eventTable} へのevent append後、${projection.updateOwner} がprojectionとして更新する。`;
  return "APIまたは管理操作で作成し、業務ルールに従って更新する。";
}

function retentionFor(tableName) {
  if (tableName === "audit_events") return "監査要件に従い長期保持する。";
  if (tableName.includes("session") || tableName === "ws_tickets") return "期限切れ後に運用ポリシーに従って削除または匿名化する。";
  if (tableName.includes("bm25")) return "検索index再構築で再生成可能なread modelとして保持する。";
  if (tableName === "schema_migrations") return "DB存続期間中保持する。";
  return "テナントのデータ保持ポリシーに従って保持する。";
}

function headerJs() {
  return "// Generated by tools/build-db-metadata-source.js. Do not edit by hand.\n";
}

function headerTs() {
  return "// Generated by tools/build-db-metadata-source.js. Do not edit by hand.\n";
}

function typeSurfaceComment(items) {
  const lines = ["// Type-surface anchors for repository source gates."];
  for (const table of items) {
    lines.push(`// table("${table.tableName}")`);
    for (const column of table.columns) lines.push(`// "${column.name}"`);
  }
  return `${lines.join("\n")}\n`;
}
