const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const SERVICE_KEY = process.env.NEXT_PUBLIC_SERVICE_KEY || "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(SERVICE_KEY ? { "x-service-key": SERVICE_KEY } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("UNAUTHORIZED");
    }
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  getAnalyticsOverview: () => request<any>("/api/admin/analytics"),
  getStatistics: () => request<any>("/api/admin/statistics"),
};
