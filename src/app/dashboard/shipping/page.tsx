"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, X, Truck } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary/ErrorBoundary";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { shippingApi } from "@/services/shipping";
import type { DeliveryStats, PaginatedResponse, Shipment, ShipmentStatus, TrackingEvent } from "@/types/shipping";
import DeliveryStatCards from "./components/DeliveryStatCards";
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

export default function ShippingAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [shipments, setShipments] = useState<PaginatedResponse<Shipment> | null>(null);
  const [activity, setActivity] = useState<TrackingEvent[] | null>(null);
  const [loading, setLoading] = useState(true);

  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const initialStatus = (searchParams.get("status") || "") as ShipmentStatus | "";

  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "">(initialStatus);

  const fetchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const statusRef = useRef(statusFilter);
  statusRef.current = statusFilter;

  const doFetch = useCallback((page: number, status: string) => {
    setLoading(true);

    Promise.allSettled([
      shippingApi.getDeliveryStats(),
      shippingApi.getShipments(page, PAGE_SIZE, status || undefined),
      shippingApi.getRecentActivity(),
    ]).then(([s, sh, ac]) => {
      if (s.status === "fulfilled") setStats(s.value);
      else setStats(null);

      if (sh.status === "fulfilled") setShipments(sh.value);
      else setShipments(null);

      if (ac.status === "fulfilled") setActivity(ac.value);
      else setActivity([]);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    clearTimeout(fetchRef.current);
    fetchRef.current = setTimeout(() => doFetch(currentPage, statusFilter), 400);
    return () => clearTimeout(fetchRef.current);
  }, [doFetch, currentPage, statusFilter]);

  useEffect(() => {
    if (!shipments || loading) return;
    if (shipments.meta.total_pages > 0 && currentPage > shipments.meta.total_pages) {
      syncURL(shipments.meta.total_pages, statusRef.current);
    }
  }, [shipments]);

  const syncURL = (page: number, status: ShipmentStatus | "") => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (status) params.set("status", status);
    const qs = params.toString();
    router.replace(`/dashboard/shipping${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    syncURL(page, statusFilter);
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value as ShipmentStatus | "";
    setStatusFilter(newStatus);
    syncURL(1, newStatus);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    syncURL(1, "");
  };

  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Shipping App Analytics</h1>
          <p className={styles.description}>Delivery metrics and shipment tracking from the logistics microservice.</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={() => { clearTimeout(fetchRef.current); doFetch(currentPage, statusFilter); }} disabled={loading} className={styles.refreshBtn}>
            <RefreshCw size={14} className={loading ? styles.refreshBtnSpin : ""} /> Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <>
          <div className={styles.statGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={100} className={styles.skelCard} />
            ))}
          </div>
          <Skeleton height={320} className={styles.skelCard} />
          <Skeleton height={400} className={styles.skelCard} />
        </>
      ) : !stats && !shipments && !activity ? (
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
            <RecentActivityFeed events={activity} loading={false} />
          </ErrorBoundary>

          <div className={styles.filterBar}>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={styles.statusSelect}
              disabled={loading}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {statusFilter !== "" && (
              <button onClick={handleClearFilters} className={styles.clearBtn} disabled={loading}>
                <X size={14} /> Clear
              </button>
            )}
          </div>

          <ErrorBoundary>
            <ShipmentTable
              shipments={shipments}
              loading={false}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </ErrorBoundary>
        </>
      )}
    </>
  );
}
