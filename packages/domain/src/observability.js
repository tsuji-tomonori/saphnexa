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
