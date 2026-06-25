// Use the local proxy `/api/seller` in client-side to bypass CORS and protect keys.
// If on server-side, call the external API directly.
const API_BASE = typeof window !== "undefined" 
  ? "/api/seller" 
  : (process.env.SELLER_API_URL || "https://proyecto-c-seller-bonzai.vercel.app");

const SERVICE_KEY = typeof window !== "undefined" 
  ? "" 
  : (process.env.SELLER_SERVICE_KEY || "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(SERVICE_KEY ? { "x-service-key": SERVICE_KEY } : {}),
    ...(options?.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, cache: "no-store" });

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
  getStatistics: (from?: string, to?: string) =>
    request<any>(`/api/admin/statistics?${new URLSearchParams({ ...(from && { from }), ...(to && { to }) }).toString()}`),
  getAnalyticsOverview: () => request<any>("/api/admin/analytics"),
  getAnalyticsOrders: (from?: string, to?: string, groupBy?: string) =>
    request<any>(`/api/admin/analytics/orders?${new URLSearchParams({ ...(from && { from }), ...(to && { to }), ...(groupBy && { groupBy }) }).toString()}`),
  getAnalyticsRevenue: (from?: string, to?: string, interval?: string) =>
    request<any>(`/api/admin/analytics/revenue?${new URLSearchParams({ ...(from && { from }), ...(to && { to }), ...(interval && { interval }) }).toString()}`),
  getAnalyticsCategories: (from?: string, to?: string) =>
    request<any>(`/api/admin/analytics/categories?${new URLSearchParams({ ...(from && { from }), ...(to && { to }) }).toString()}`),
  getAnalyticsReviews: (from?: string, to?: string) =>
    request<any>(`/api/admin/analytics/reviews?${new URLSearchParams({ ...(from && { from }), ...(to && { to }) }).toString()}`),
  getAnalyticsReservations: (from?: string, to?: string) =>
    request<any>(`/api/admin/analytics/reservations?${new URLSearchParams({ ...(from && { from }), ...(to && { to }) }).toString()}`),
  getTopProducts: (limit?: number) =>
    request<any>(`/api/admin/analytics/products/top?limit=${limit || 10}`),
  getTopSellers: (limit?: number) =>
    request<any>(`/api/admin/analytics/sellers/top?limit=${limit || 10}`),
};
