"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, Search, X, Truck } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
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

  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [shipmentsByType, setShipmentsByType] = useState<ShipmentByType[]>([]);
  const [shipments, setShipments] = useState<PaginatedResponse<Shipment> | null>(null);
  const [activity, setActivity] = useState<TrackingEvent[] | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingShipments, setLoadingShipments] = useState(true);

  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = (searchParams.get("status") || "") as ShipmentStatus | "";

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "">(initialStatus);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);

  const fetchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const statusRef = useRef(statusFilter);
  statusRef.current = statusFilter;
  const appliedSearchRef = useRef(appliedSearch);
  appliedSearchRef.current = appliedSearch;

  const fetchOverview = useCallback(() => {
    setLoadingOverview(true);

    Promise.allSettled([
      shippingApi.getDeliveryStats(),
      shippingApi.getShipmentsByType(),
      shippingApi.getRecentActivity(),
    ]).then(([s, bt, ac]) => {
      if (s.status === "fulfilled") setStats(s.value);
      else setStats(null);

      if (bt.status === "fulfilled") setShipmentsByType(bt.value.data ?? []);
      else setShipmentsByType([]);

      if (ac.status === "fulfilled") setActivity(ac.value);
      else setActivity([]);
    }).finally(() => setLoadingOverview(false));
  }, []);

  const fetchShipments = useCallback((page: number, status: string, searchValue: string) => {
    setLoadingShipments(true);

    shippingApi.getShipments(page, PAGE_SIZE, status || undefined, searchValue || undefined)
      .then((sh) => setShipments(sh))
      .catch(() => setShipments(null))
      .finally(() => setLoadingShipments(false));
  }, []);

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
    if (!shipments || loadingShipments) return;
    if (shipments.meta.total_pages > 0 && currentPage > shipments.meta.total_pages) {
      syncURL(shipments.meta.total_pages, statusRef.current, appliedSearchRef.current);
    }
  }, [shipments]);

  const syncURL = (page: number, status: ShipmentStatus | "", searchValue: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (status) params.set("status", status);
    if (searchValue) params.set("search", searchValue);
    const qs = params.toString();
    window.history.replaceState(null, "", `/dashboard/shipping${qs ? `?${qs}` : ""}`);
  };

  const handleApplySearch = () => {
    clearTimeout(fetchRef.current);
    setAppliedSearch(search);
    syncURL(1, statusFilter, search);
    fetchShipments(1, statusFilter, search);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleApplySearch();
  };

  const handlePageChange = (page: number) => {
    syncURL(page, statusFilter, appliedSearch);
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value as ShipmentStatus | "";
    setStatusFilter(newStatus);
    syncURL(1, newStatus, appliedSearch);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setAppliedSearch("");
    syncURL(1, "", "");
  };

  const handleRefresh = () => {
    fetchOverview();
    clearTimeout(fetchRef.current);
    fetchShipments(currentPage, statusFilter, appliedSearch);
  };

  const hasActiveFilters = statusFilter !== "" || appliedSearch !== "";
  const isFirstLoad = loadingOverview || loadingShipments;

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
