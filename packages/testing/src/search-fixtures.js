export const referenceGraphSamples = Array.from({ length: 10 }, (_, index) => {
  const number = index + 1;
  return {
    id: `ref-sample-${number}`,
    source_node_id: `node-${number}`,
    target_node_id: `node-${number}-expanded`,
    edge_type: number % 3 === 0 ? "figure_reference" : number % 3 === 1 ? "section_reference" : "table_reference",
    document_id: "doc-design",
    version_id: "ver-design-016",
    chunk_id: `chunk-design-${String(number).padStart(3, "0")}`
  };
});

export const bm25GoldenQueries = [
  query("bm25-001", "Saphnexa RAG 根拠付き回答", "chunk-design-001"),
  query("bm25-002", "ACL 確認 Evidence", "chunk-design-002"),
  query("bm25-003", "引用 整形 citation", "chunk-design-003"),
  query("bm25-004", "文書 取り込み metadata", "chunk-design-004"),
  query("bm25-005", "参照 グラフ 展開", "chunk-design-005"),
  query("bm25-006", "評価 指標 retrieval generation", "chunk-design-006"),
  query("bm25-007", "WebSocket 通知 payload", "chunk-design-007"),
  query("bm25-008", "Flyway migration schema_migrations", "chunk-design-008"),
  query("bm25-009", "BM25F sparse search", "chunk-design-009"),
  query("bm25-010", "CloudWatch alarm metric", "chunk-design-010")
];

export const bm25Documents = bm25GoldenQueries.map((item) => ({
  doc_id: `bm25-doc-${item.id}`,
  source_chunk_id: item.expected_chunk_id,
  title: item.query,
  snippet: `${item.query} は Saphnexa 基本設計の検索対象である。`,
  fields: {
    title: item.query,
    body: `${item.query} local fixture evidence`
  }
}));

function query(id, queryText, expectedChunkId) {
  return { id, query: queryText, expected_chunk_id: expectedChunkId };
}
