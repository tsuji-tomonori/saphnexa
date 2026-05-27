export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export async function apiPost<T>(path: string, body: unknown, csrfToken: string): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-csrf-token": csrfToken },
    body: JSON.stringify(body)
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  if (!path.startsWith("/api/") && !path.startsWith("/auth/")) {
    throw new Error("Saphnexa web client only accepts relative /api or /auth paths.");
  }
  const response = await fetch(path, { credentials: "include", ...init });
  if (!response.ok) throw await response.json();
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
