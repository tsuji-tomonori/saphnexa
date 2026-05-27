export const logSchemaRequiredFields = [
  "timestamp",
  "level",
  "service",
  "env",
  "logical_function",
  "trace_id",
  "correlation_id",
  "message"
];

export const requiredMetricCatalog = [
  metric("api_latency_ms", "API latency", "Milliseconds", "p95 <= 800"),
  metric("api_5xx_count", "API 5xx", "Count", "0 during local smoke"),
  metric("rag_latency_ms", "RAG latency", "Milliseconds", "final p95 <= 60000"),
  metric("retrieval_count", "RAG retrieval count", "Count", "retrieval completed events emit count"),
  metric("dlq_message_count", "DLQ count", "Count", "0 after local smoke"),
  metric("ingestion_failed_count", "Ingestion failed", "Count", "failed metadata creates admin event"),
  metric("evaluation_failed_count", "Evaluation failed", "Count", "0 after local smoke")
];

export const requiredAlarmCatalog = [
  alarm("api_5xx_alarm", "api_5xx_count", "GreaterThanThreshold", 0),
  alarm("dlq_depth_alarm", "dlq_message_count", "GreaterThanThreshold", 0),
  alarm("rag_failure_rate_alarm", "rag_failure_rate", "GreaterThanThreshold", 0.02),
  alarm("ingestion_failed_alarm", "ingestion_failed_count", "GreaterThanThreshold", 0),
  alarm("evaluation_failed_alarm", "evaluation_failed_count", "GreaterThanThreshold", 0),
  alarm("waf_block_spike_alarm", "waf_block_count", "GreaterThanThreshold", 100)
];

export const retentionPolicyCatalog = [
  retention("api_logs", "CloudWatch Logs", 90),
  retention("worker_logs", "CloudWatch Logs", 90),
  retention("rag_trace_logs", "CloudWatch Logs", 180),
  retention("admin_artifacts", "S3", 365),
  retention("raw_documents", "S3", 3650),
  retention("parsed_artifacts", "S3", 3650),
  retention("schema_migrations", "DSQL", 3650)
];

export function createLogEvent(input) {
  return {
    timestamp: input.timestamp || "2026-05-27T00:00:00.000Z",
    level: input.level || "INFO",
    service: "saphnexa",
    env: input.env || "local",
    logical_function: input.logical_function,
    trace_id: input.trace_id,
    correlation_id: input.correlation_id || input.trace_id,
    message: input.message,
    attributes: input.attributes || {}
  };
}

export function assertLogSchema(event) {
  for (const field of logSchemaRequiredFields) {
    if (!event[field]) throw new Error(`log event missing ${field}`);
  }
  if (!["DEBUG", "INFO", "WARN", "ERROR"].includes(event.level)) throw new Error(`invalid log level ${event.level}`);
  if (event.service !== "saphnexa") throw new Error("service must be saphnexa");
  return true;
}

export function assertTracePropagation(events) {
  if (events.length === 0) throw new Error("trace propagation requires events");
  const traceId = events[0].trace_id;
  const correlationId = events[0].correlation_id;
  for (const event of events) {
    assertLogSchema(event);
    if (event.trace_id !== traceId) throw new Error("trace_id was not propagated");
    if (event.correlation_id !== correlationId) throw new Error("correlation_id was not propagated");
  }
  return true;
}

function metric(metric_name, description, unit, acceptance) {
  return { metric_name, description, unit, acceptance, namespace: "Saphnexa/Local" };
}

function alarm(alarm_name, metric_name, comparison_operator, threshold) {
  return { alarm_name, metric_name, comparison_operator, threshold, evaluation_periods: 1, treat_missing_data: "notBreaching" };
}

function retention(resource_name, resource_type, retention_days) {
  return { resource_name, resource_type, retention_days };
}
