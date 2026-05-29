export const roles = {
  GENERAL_USER: "general_user",
  ADMIN: "admin"
} as const;

export type Role = (typeof roles)[keyof typeof roles];

export const participantRoles = {
  OWNER: "owner",
  VIEWER: "viewer"
} as const;

export type ParticipantRole = (typeof participantRoles)[keyof typeof participantRoles];

export const statuses = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  DELETED: "deleted",
  REMOVED: "removed",
  QUEUED: "queued",
  RUNNING: "running",
  STREAMING: "streaming",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELED: "canceled"
} as const;

export type Status = (typeof statuses)[keyof typeof statuses];

export const chatEventNames = [
  "chat.run.started",
  "chat.run.progress",
  "chat.retrieval.started",
  "chat.retrieval.completed",
  "chat.generation.started",
  "chat.message.partial_ready",
  "chat.message.final_ready",
  "chat.feedback.recorded",
  "chat.run.failed",
  "chat.run.canceled"
] as const;

export type ChatEventName = (typeof chatEventNames)[number];

export const adminEventNames = [
  "admin.ingestion.updated",
  "admin.evaluation.updated",
  "admin.user_import.updated",
  "admin.artifact.published"
] as const;

export type AdminEventName = (typeof adminEventNames)[number];

export interface ChatParticipantContract {
  status?: string | null;
  participant_role?: string | null;
}

export interface UserContract {
  role?: string | null;
  status?: string | null;
}

export interface ErrorResponseDetails {
  [key: string]: unknown;
}

export interface ErrorResponse {
  trace_id: string;
  error_code: string;
  message: string;
  details: ErrorResponseDetails;
}

export function canReadChat(participant: ChatParticipantContract | null | undefined): boolean {
  return participant?.status === statuses.ACTIVE && [participantRoles.OWNER, participantRoles.VIEWER].includes(participant.participant_role as ParticipantRole);
}

export function canWriteChat(participant: ChatParticipantContract | null | undefined): boolean {
  return participant?.status === statuses.ACTIVE && participant.participant_role === participantRoles.OWNER;
}

export function canManageAdmin(user: UserContract | null | undefined): boolean {
  return user?.role === roles.ADMIN && user?.status === statuses.ACTIVE;
}

export function createErrorResponse(error_code: string, message: string, details: ErrorResponseDetails = {}, trace_id = "trace-local"): ErrorResponse {
  return { trace_id, error_code, message, details };
}
