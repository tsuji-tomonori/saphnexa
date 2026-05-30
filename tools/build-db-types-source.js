import { writeFileSync } from "node:fs";
import { dbTableMetadata } from "../packages/db-schema/src/table-metadata.js";

const lines = [
  'import { dbTableMetadata } from "@saphnexa/db-schema/metadata";',
  "",
  "export type DbJson = Record<string, unknown>;",
  "export type DbTimestamp = string;",
  "export type DbUuid = string;",
  "",
  "export type DbTableName = keyof DbRowByTable;",
  "",
  "export interface DbRowByTable {"
];

for (const table of dbTableMetadata) {
  lines.push(`  ${table.tableName}: {`);
  for (const column of table.columns) lines.push(`    ${column.name}: ${tsType(column)};`);
  lines.push("  };");
}

lines.push(
  "}",
  "",
  "export type DbRow<TTable extends DbTableName> = DbRowByTable[TTable];",
  "export type DbPrimaryKeyByTable = {",
  '  [TTable in DbTableName]: Extract<(typeof dbTableMetadata)[number], { tableName: TTable }>["primaryKey"][number];',
  "};",
  "export type DbPrimaryKey<TTable extends DbTableName> = DbPrimaryKeyByTable[TTable];",
  "export type DbInsert<TTable extends DbTableName> = Pick<DbRow<TTable>, RequiredInsertColumn<TTable>> & Partial<Pick<DbRow<TTable>, OptionalInsertColumn<TTable>>>;",
  "export type DbUpdate<TTable extends DbTableName> = Partial<Omit<DbRow<TTable>, DbPrimaryKey<TTable>>>;",
  "",
  "type NullableColumn<TTable extends DbTableName> = {",
  "  [TColumn in keyof DbRow<TTable>]: null extends DbRow<TTable>[TColumn] ? TColumn : never;",
  "}[keyof DbRow<TTable>];",
  "",
  "type OptionalInsertColumn<TTable extends DbTableName> = Extract<NullableColumn<TTable>, keyof DbRow<TTable>>;",
  "type RequiredInsertColumn<TTable extends DbTableName> = Exclude<keyof DbRow<TTable>, OptionalInsertColumn<TTable>>;",
  "",
  "export const dbTypeTableNames = dbTableMetadata.map((item) => item.tableName) as DbTableName[];",
  ""
);

writeFileSync("packages/db-types/src/index.ts", lines.join("\n"));
console.log(`wrote DB shared types for ${dbTableMetadata.length} tables`);

function tsType(column) {
  const base = {
    uuid: "DbUuid",
    integer: "number",
    bigint: "number",
    float: "number",
    json: "DbJson",
    timestamp: "DbTimestamp",
    boolean: "boolean",
    text: "string",
    string: "string"
  }[column.logicalType] ?? "string";
  return column.nullable ? `${base} | null` : base;
}
