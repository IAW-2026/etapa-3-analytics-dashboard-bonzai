"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, Search, X, Truck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary/ErrorBoundary";
import { ChartCard } from "@/components/charts/ChartCard/ChartCard";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton/ExportCsvButton";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { shippingApi } from "@/services/shipping";
import type { DeliveryStats, FunnelLevel, PaginatedResponse, Shipment, ShipmentByType, ShipmentStatus, TrackingEvent } from "@/types/shipping";
import DeliveryStatCards from "./components/DeliveryStatCards";
import ActivityHeatmap from "./components/ActivityHeatmap";
import LogisticsFunnel from "./components/LogisticsFunnel";
import RecentActivityFeed from "./components/RecentActivityFeed";
import ShipmentTable from "./components/ShipmentTable";
import styles from "./page.module.css";

const PAGE_SIZE = 10;
const STATUS_OPTIONS: { label: string; value: ShipmentStatus | "" }[] = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Assigned", value: "ASSIGNED" },
  { label: "In Transit", value: "IN_TRANSIT" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  PENDING: "#D4A853",
  ASSIGNED: "#6B7D5F",
  IN_TRANSIT: "#1B3D2F",
  DELIVERED: "#16A34A",
  CANCELLED: "#DC2626",
};

const BY_TYPE_COLORS = ["#1B3D2F", "#2D5A46", "#6B7D5F", "#8A9B7E", "#D4A853", "#E2C47A", "#C5C0B0", "#A0B09A"];

export default function ShippingAnalyticsPage() {
  const searchParams = useSearchParams();

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [shipmentsByType, setShipmentsByType] = useState<ShipmentByType[]>([]);
  const [shipments, setShipments] = useState<PaginatedResponse<Shipment> | null>(null);
  const [activity, setActivity] = useState<TrackingEvent[] | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingShipments, setLoadingShipments] = useState(true);

  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = (searchParams.get("status") || "") as ShipmentStatus | "";
  const initialFrom = searchParams.get("from") || thirtyDaysAgo;
  const initialTo = searchParams.get("to") || today;
  const initialGranularity = (searchParams.get("granularity") as "day" | "week" | "month") || "day";

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "">(initialStatus);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [granularity, setGranularity] = useState<"day" | "week" | "month">(initialGranularity);

  const fromISO = from ? `${from}T00:00:00.000Z` : "";
  const toISO = to ? `${to}T23:59:59.000Z` : "";

  const fetchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const overviewFetchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const statusRef = useRef(statusFilter);
  statusRef.current = statusFilter;
  const appliedSearchRef = useRef(appliedSearch);
  appliedSearchRef.current = appliedSearch;
  const fromRef = useRef(from);
  fromRef.current = from;
  const toRef = useRef(to);
  toRef.current = to;
  const granularityRef = useRef(granularity);
  granularityRef.current = granularity;

  const fetchOverview = useCallback(() => {
    setLoadingOverview(true);

    Promise.allSettled([
      shippingApi.getDeliveryStats(fromISO || undefined, toISO || undefined, granularity),
      shippingApi.getShipmentsByType(fromISO || undefined, toISO || undefined),
      shippingApi.getRecentActivity(fromISO || undefined, toISO || undefined),
    ]).then(([s, bt, ac]) => {
      if (s.status === "fulfilled") setStats(s.value);
      else setStats(null);

      if (bt.status === "fulfilled") setShipmentsByType(bt.value.data ?? []);
      else setShipmentsByType([]);

      if (ac.status === "fulfilled") setActivity(ac.value);
      else setActivity([]);
    }).finally(() => setLoadingOverview(false));
  }, [fromISO, toISO, granularity]);

  const fetchShipments = useCallback((page: number, status: string, searchValue: string) => {
    setLoadingShipments(true);

    shippingApi.getShipments(page, PAGE_SIZE, status || undefined, searchValue || undefined, fromISO || undefined, toISO || undefined)
      .then((sh) => setShipments(sh))
      .catch(() => setShipments(null))
      .finally(() => setLoadingShipments(false));
  }, [fromISO, toISO]);

  useEffect(() => {
    fetchOverview();
    fetchShipments(currentPage, statusFilter, appliedSearch);
  }, []);

  useEffect(() => {
    clearTimeout(fetchRef.current);
    fetchRef.current = setTimeout(() => fetchShipments(currentPage, statusFilter, appliedSearch), 400);
    return () => clearTimeout(fetchRef.current);
  }, [fetchShipments, currentPage, statusFilter, appliedSearch]);

  useEffect(() => {
    clearTimeout(overviewFetchRef.current);
    overviewFetchRef.current = setTimeout(fetchOverview, 400);
    return () => clearTimeout(overviewFetchRef.current);
  }, [fetchOverview]);

  useEffect(() => {
    if (!shipments || loadingShipments) return;
    if (shipments.meta.total_pages > 0 && currentPage > shipments.meta.total_pages) {
      syncURL(shipments.meta.total_pages, statusRef.current, appliedSearchRef.current, fromRef.current, toRef.current, granularityRef.current);
    }
  }, [shipments]);

  const syncURL = (page: number, status: ShipmentStatus | "", searchValue: string, fromVal: string, toVal: string, gran: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (status) params.set("status", status);
    if (searchValue) params.set("search", searchValue);
    if (fromVal !== thirtyDaysAgo) params.set("from", fromVal);
    if (toVal !== today) params.set("to", toVal);
    if (gran !== "day") params.set("granularity", gran);
    const qs = params.toString();
    window.history.replaceState(null, "", `/dashboard/shipping${qs ? `?${qs}` : ""}`);
  };

  const handleApplySearch = () => {
    clearTimeout(fetchRef.current);
    setAppliedSearch(search);
    syncURL(1, statusFilter, search, from, to, granularity);
    fetchShipments(1, statusFilter, search);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleApplySearch();
  };

  const handlePageChange = (page: number) => {
    syncURL(page, statusFilter, appliedSearch, from, to, granularity);
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value as ShipmentStatus | "";
    setStatusFilter(newStatus);
    syncURL(1, newStatus, appliedSearch, from, to, granularity);
  };

  const handleFromChange = (value: string) => {
    setFrom(value);
    syncURL(1, statusFilter, appliedSearch, value, to, granularity);
  };

  const handleToChange = (value: string) => {
    setTo(value);
    syncURL(1, statusFilter, appliedSearch, from, value, granularity);
  };

  const handleGranularityChange = (value: "day" | "week" | "month") => {
    setGranularity(value);
    syncURL(1, statusFilter, appliedSearch, from, to, value);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setAppliedSearch("");
    setFrom(thirtyDaysAgo);
    setTo(today);
    setGranularity("day");
    syncURL(1, "", "", thirtyDaysAgo, today, "day");
  };

  const handleRefresh = () => {
    fetchOverview();
    clearTimeout(fetchRef.current);
    fetchShipments(currentPage, statusFilter, appliedSearch);
  };

  const hasActiveFilters = statusFilter !== "" || appliedSearch !== "" || from !== thirtyDaysAgo || to !== today || granularity !== "day";
  const isFirstLoad = loadingOverview || loadingShipments;

  const formatPeriodLabel = (period: string): string => {
    const datePart = period.split(" ")[0];
    const d = new Date(datePart + "T00:00:00");
    if (granularity === "month") {
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    if (granularity === "week") {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const statusPieData = stats
    ? (Object.entries(stats.by_status) as [ShipmentStatus, number][]).map(([k, v]) => ({
        name: k.charAt(0) + k.slice(1).toLowerCase().replace("_", " "),
        value: v,
        color: STATUS_COLORS[k],
      }))
    : [];

  const csvByType = shipmentsByType.map((d) => [d.type, String(d.count)]);
  const csvStatus = statusPieData.map((d) => [d.name, String(d.value)]);

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Shipping App Analytics</h1>
          <p className={styles.description}>Delivery metrics and shipment tracking from the logistics microservice.</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleRefresh} disabled={isFirstLoad} className={styles.refreshBtn}>
            <RefreshCw size={14} className={isFirstLoad ? styles.refreshBtnSpin : ""} /> Refresh
          </button>
        </div>
      </header>

      <div className={styles.dateFilterBar}>
        <div className={styles.dateGroup}>
          <label className={styles.filterLabel}>From</label>
          <input type="date" value={from} onChange={(e) => handleFromChange(e.target.value)} className={styles.dateInput} disabled={loadingOverview || loadingShipments} />
        </div>
        <div className={styles.dateGroup}>
          <label className={styles.filterLabel}>To</label>
          <input type="date" value={to} onChange={(e) => handleToChange(e.target.value)} className={styles.dateInput} disabled={loadingOverview || loadingShipments} />
        </div>
        <div className={styles.groupToggle}>
          {(["day", "week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => handleGranularityChange(v)}
              className={`${styles.toggleBtn} ${granularity === v ? styles.toggleActive : ""}`}
              disabled={loadingOverview || loadingShipments}
            >
              {v === "day" ? "Day" : v === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      {loadingOverview ? (
        <>
          <div className={styles.statGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={100} className={styles.skelCard} />
            ))}
          </div>
          <Skeleton height={60} className={styles.skelCard} />
          <div className={styles.chartGrid}>
            <Skeleton height={320} className={styles.skelCard} />
            <Skeleton height={320} className={styles.skelCard} />
          </div>
          <div className={styles.funnelGrid}>
            <Skeleton height={240} className={styles.skelCard} />
            <Skeleton height={240} className={styles.skelCard} />
          </div>
        </>
      ) : !stats && !activity ? (
        <div className={styles.empty}>
          <Truck size={24} />
          <p>Logistics data unavailable</p>
          <span>Verify the Shipping API is reachable and try again.</span>
        </div>
      ) : (
        <>
          <ErrorBoundary>
            <DeliveryStatCards stats={stats} loading={false} />
          </ErrorBoundary>

          <ErrorBoundary>
            <ActivityHeatmap events={activity} loading={false} />
          </ErrorBoundary>

          {stats?.periods && stats.periods.length > 0 && (
            <ErrorBoundary>
              <ChartCard
                title="Shipments Over Time"
                description={`${granularity === "day" ? "Daily" : granularity === "week" ? "Weekly" : "Monthly"} shipment breakdown by status`}
                tall
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.periods.map((p) => ({ ...p, label: formatPeriodLabel(p.period) }))}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                    <Bar dataKey="DELIVERED" stackId="a" fill="#16A34A" name="Delivered" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="PENDING" stackId="a" fill="#D4A853" name="Pending" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="IN_TRANSIT" stackId="a" fill="#1B3D2F" name="In Transit" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="ASSIGNED" stackId="a" fill="#6B7D5F" name="Assigned" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className={styles.pieLegend}>
                  <div className={styles.pieLegendItem}><span className={styles.pieLegendDot} style={{ background: "#16A34A" }} />Delivered</div>
                  <div className={styles.pieLegendItem}><span className={styles.pieLegendDot} style={{ background: "#D4A853" }} />Pending</div>
                  <div className={styles.pieLegendItem}><span className={styles.pieLegendDot} style={{ background: "#1B3D2F" }} />In Transit</div>
                  <div className={styles.pieLegendItem}><span className={styles.pieLegendDot} style={{ background: "#6B7D5F" }} />Assigned</div>
                </div>
              </ChartCard>
            </ErrorBoundary>
          )}

          <ErrorBoundary>
            <div className={styles.chartGrid}>
              {shipmentsByType.length > 0 && (
                <ChartCard title="Shipments by Type" description="Distribution by specimen category" tall>
                  <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 1rem 0.5rem" }}>
                    <ExportCsvButton filename="shipments-by-type.csv" headers={["Type", "Count"]} rows={csvByType} label="CSV" />
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={shipmentsByType} dataKey="count" nameKey="type"
                        cx="50%" cy="50%" outerRadius={80} innerRadius={45}
                        label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {shipmentsByType.map((_, i) => (
                          <Cell key={i} fill={BY_TYPE_COLORS[i % BY_TYPE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className={styles.pieLegend}>
                    {shipmentsByType.map((d, i) => (
                      <div key={d.type} className={styles.pieLegendItem}>
                        <span className={styles.pieLegendDot} style={{ background: BY_TYPE_COLORS[i % BY_TYPE_COLORS.length] }} />
                        {d.type}
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}

              {statusPieData.length > 0 && (
                <ChartCard title="Status Breakdown" description="Shipments by current status" tall>
                  <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 1rem 0.5rem" }}>
                    <ExportCsvButton filename="shipment-status.csv" headers={["Status", "Count"]} rows={csvStatus} label="CSV" />
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statusPieData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" outerRadius={80} innerRadius={45}
                        label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {statusPieData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className={styles.pieLegend}>
                    {statusPieData.map((d) => (
                      <div key={d.name} className={styles.pieLegendItem}>
                        <span className={styles.pieLegendDot} style={{ background: d.color }} />
                        {d.name}
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <div className={styles.funnelGrid}>
              <LogisticsFunnel stats={stats} loading={false} />
              <RecentActivityFeed events={activity} loading={false} />
            </div>
          </ErrorBoundary>

          <div className={styles.filterBar}>
            <div className={styles.searchGroup}>
              <Search size={14} className={styles.searchIcon} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search by tracking ID or order..."
                className={styles.searchInput}
                disabled={loadingShipments}
              />
              <button onClick={handleApplySearch} className={styles.searchBtn} disabled={loadingShipments}>
                Search
              </button>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={styles.statusSelect}
              disabled={loadingShipments}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearBtn} disabled={loadingShipments}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          <ErrorBoundary>
            <ShipmentTable
              shipments={shipments}
              loading={loadingShipments}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </ErrorBoundary>
        </>
      )}
    </>
  );
}
