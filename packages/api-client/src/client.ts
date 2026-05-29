export type ApiClientPath = `/api/${string}` | `/auth/${string}`;

export const apiRoutes = {
  getMe: () => "/api/me",
  listChatSessions: () => "/api/chat-sessions",
  submitQuestion: (chatId: string) => `/api/chat-sessions/${encodeURIComponent(chatId)}/messages`,
  listMessageEvents: (chatId: string, messageId: string) =>
    `/api/chat-sessions/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}/events`,
  issueWsTicket: () => "/api/ws-ticket",
  listPublishedArtifacts: () => "/api/admin/artifacts",
  startEvaluationRun: () => "/api/admin/evaluation-runs"
} as const satisfies Record<string, (...args: string[]) => ApiClientPath>;

export type ApiClientRouteName = keyof typeof apiRoutes;

export async function apiGet<T>(path: ApiClientPath): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function apiPost<T>(path: ApiClientPath, body: unknown, csrfToken: string): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
    body: JSON.stringify(body)
  });
}

async function request<T>(path: ApiClientPath, init: RequestInit): Promise<T> {
  if (!path.startsWith("/api/") && !path.startsWith("/auth/")) {
    throw new Error("Saphnexa web client only accepts relative /api or /auth paths.");
  }
  const response = await fetch(path, { credentials: "include", ...init });
  if (!response.ok) throw await response.json();
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
