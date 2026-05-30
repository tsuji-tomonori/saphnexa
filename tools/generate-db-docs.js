import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { eventSourceMappings, metadataTables, projectionMetadataColumns, stateProjectionColumnNames } from "./db-metadata-lib.js";

mkdirSync("docs/generated/db", { recursive: true });

writeFileSync("docs/generated/db/tables.md", tableDocs());
writeFileSync("docs/generated/db/columns.md", columnDocs());
writeFileSync("docs/generated/db/er.md", erDocs());
writeFileSync("docs/generated/db/lifecycle.md", lifecycleDocs());
writeFileSync("docs/generated/db/projections.md", projectionDocs());
execFileSync("node", ["tools/generate-db-comments.js"], { stdio: "inherit" });

console.log("generated DB docs");

function tableDocs() {
  const rows = metadataTables().map((table) => `| \`${table.tableName}\` | ${table.japaneseName} | ${table.domain} | ${table.sourceOfTruthKind} | ${table.description} | ${table.retentionPolicy} |`);
  return `# DBテーブル一覧\n\n生成元: \`packages/db-schema/src/table-metadata.ts\`\n\n| table | 日本語名 | domain | sourceOfTruth | 説明 | 保持方針 |\n|---|---|---|---|---|---|\n${rows.join("\n")}\n`;
}

function columnDocs() {
  const rows = [];
  for (const table of metadataTables()) {
    for (const column of table.columns) {
      rows.push(`| \`${table.tableName}\` | \`${column.name}\` | ${column.japaneseName} | ${column.logicalType} | ${column.nullable ? "yes" : "no"} | ${column.dataClassification} | ${column.sourceOfTruthKind} | ${column.updateOwner} | ${column.derivedFrom ?? ""} | ${column.description} |`);
    }
  }
  return `# DBカラム一覧\n\n全カラムの説明、分類、更新主体を示す。\n\n| table | column | 日本語名 | logicalType | nullable | dataClassification | sourceOfTruth | updateOwner | derivedFrom | 説明 |\n|---|---|---|---|---|---|---|---|---|---|\n${rows.join("\n")}\n`;
}

function erDocs() {
  const lines = ["# DB ER図", "", "```mermaid", "erDiagram"];
  for (const table of metadataTables()) {
    lines.push(`  ${table.tableName} {`);
    for (const column of table.columns) {
      const pk = table.primaryKey.includes(column.name) ? " PK" : "";
      lines.push(`    ${column.logicalType} ${column.name}${pk}`);
    }
    lines.push("  }");
  }
  lines.push("```", "");
  return lines.join("\n");
}

function lifecycleDocs() {
  const lines = ["# DBライフサイクル", "", "```mermaid", "flowchart TD", "  api[API / Worker / Agent] --> event[domain event append]", "  event --> projector[Projector]", "  projector --> projection[projection / read model]", "  projection --> read[API read / UI / evaluation]", "```", "", "| table | lifecycle |"];
  lines.push("|---|---|");
  for (const table of metadataTables()) lines.push(`| \`${table.tableName}\` | ${table.lifecycle} |`);
  return `${lines.join("\n")}\n`;
}

function projectionDocs() {
  const rows = eventSourceMappings.map((mapping) => `| \`${mapping.eventTable}\` | \`${mapping.projectionTable}\` | ${mapping.updateOwner} | event append後にprojection_event_id / projection_event_seq / projected_at と状態列を更新する |`);
  const stateRows = [];
  for (const table of metadataTables()) {
    for (const column of table.columns) {
      if (stateProjectionColumnNames.has(column.name)) {
        stateRows.push(`| \`${table.tableName}\` | \`${column.name}\` | ${column.derivedFrom ?? "具体event table未設定"} | ${column.description} |`);
      }
    }
  }
  return `# Event正本とProjection対応\n\n基本設計 v0.17 の案Bに合わせ、状態の正本は append-only event table、既存状態列はprojectionとして扱う。\n\n## 更新境界\n\n- API: 入力検証、権限確認、domain event appendを担当し、状態列を正本として直接更新しない。\n- Worker: 取り込み・評価など非同期処理のevent appendを担当する。\n- Projector: eventを読んでprojection列とread modelを更新する唯一の境界である。\n- Agent: Tool呼び出しeventをappendし、監査に必要な要約のみを保持する。\n- CI: 公開成果物とテストレポートのeventをappendし、公開状態projectionを更新する。\n\n## Event append / projector責務\n\n- Event table はappend-onlyとして扱い、update/deleteは行わない。\n- \`event_id\` はevent一意性、\`idempotency_key\` はclient retryの冪等性、\`event_seq\` はaggregate内順序とOCC retryの基準として使う。\n- Aurora DSQLのOCC競合時は、event append serviceが冪等性を確認したうえでretryする。\n- Projectorは \`projection_event_id\` / \`projection_event_seq\` / \`projected_at\` を更新し、どのeventから現在projectionが作られたかを残す。\n\n## UI通知イベントとの違い\n\n\`chat_message_events\` はUI通知とREST再取得のための時系列read modelであり、domain event正本とは分けて扱う。業務状態の正本は \`chat_message_lifecycle_events\`、\`chat_session_events\`、\`chat_participant_events\`、\`chat_run_events\` などのappend-only event tableである。\n\n## Event / Projection対応\n\n| event table | projection table | updateOwner | 方針 |\n|---|---|---|---|\n${rows.join("\n")}\n\n## Projection metadata columns\n\n${projectionMetadataColumns.map((column) => `- \`${column}\``).join("\n")}\n\n## 状態系カラム\n\n| table | column | derivedFrom | 説明 |\n|---|---|---|---|\n${stateRows.join("\n")}\n`;
}
