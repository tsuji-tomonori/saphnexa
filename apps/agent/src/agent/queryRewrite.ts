export interface RewrittenQuery {
  original_question: string;
  retrieval_query: string;
}

export function rewriteQuery(question: string): RewrittenQuery {
  return {
    original_question: question,
    retrieval_query: question.trim().replace(/\s+/g, " ")
  };
}
