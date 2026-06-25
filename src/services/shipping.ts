import type {
  DeliveryStats,
  PaginatedResponse,
  Shipment,
  TrackingEvent,
  ShipmentByType,
  Driver,
} from "@/types/shipping";

const BASE = typeof window !== "undefined"
  ? "/api/shipping"
  : (process.env.SHIPPING_API_URL || "https://proyecto-c-shipping-bonzai.vercel.app");

const SERVICE_KEY = typeof window !== "undefined"
  ? ""
  : (process.env.SHIPPING_SERVICE_KEY || "");

async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const headers: Record<string, string> = {};
  if (SERVICE_KEY) headers["x-shipping-service-key"] = SERVICE_KEY;

  const res = await fetch(`${BASE}${path}${qs}`, { headers, cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Error ${res.status}`);
  }
  return res.json();
}

export const shippingApi = {
  getDeliveryStats: (from?: string, to?: string, granularity?: string) => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (granularity) params.granularity = granularity;
    return get<DeliveryStats>("/api/analytics/delivery-stats", params);
  },

  getShipments: (page = 1, limit = 10, status?: string, search?: string, from?: string, to?: string) => {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (status) params.status = status;
    if (search) params.q = search;
    if (from) params.from = from;
    if (to) params.to = to;
    return get<PaginatedResponse<Shipment>>("/api/admin/shipments", params);
  },

  getRecentActivity: async (from?: string, to?: string) => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const data = await get<{ data?: TrackingEvent[] } | TrackingEvent[]>("/api/analytics/recent-activity", params);
    return Array.isArray(data) ? data : (data as { data?: TrackingEvent[] }).data ?? [];
  },

  getShipmentsByType: (from?: string, to?: string) => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return get<{ data: ShipmentByType[] }>("/api/analytics/shipments-by-type", params);
  },

  getDrivers: (page = 1) =>
    get<PaginatedResponse<Driver>>("/api/admin/drivers", { page: String(page) }),

  getIncidents: (page = 1) =>
    get<PaginatedResponse<Shipment>>("/api/admin/shipments/incidents", { page: String(page) }),

  getHealth: () =>
    get<{ status: string; database: string; version: string }>("/api/health"),
};
