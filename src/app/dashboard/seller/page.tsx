"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  ShoppingCart, DollarSign, Package, Users, Star, BookMarked,
  TrendingUp, Award, RefreshCw, PieChart as PieChartIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { ChartCard } from "@/components/charts/ChartCard/ChartCard";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton/ExportCsvButton";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary/ErrorBoundary";
import styles from "./page.module.css";

const COLORS = ["#1B3D2F", "#2D5A46", "#6B7D5F", "#8A9B7E", "#D4A853", "#E2C47A", "#C5C0B0", "#A0B09A"];
const STATUS_COLORS = { pending: "#D4A853", paid: "#1B3D2F", awaiting: "#6B7D5F", shipped: "#2D5A46", cancelled: "#8B7355" };

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatMonth(m: string) {
  const [y, mo] = m.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(mo, 10) - 1]} ${y}`;
}

function pctChange(current: number, previous: number): string | null {
  if (!previous) return null;
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

export default function SellerAnalyticsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(searchParams.get("from") || sixMonthsAgo);
  const [to, setTo] = useState(searchParams.get("to") || today);
  const [groupBy, setGroupBy] = useState(searchParams.get("groupBy") || "month");
  const [stats, setStats] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any>(null);
  const [reservations, setReservations] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const urlRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doFetch = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.getStatistics(),
      api.getAnalyticsRevenue(from, to, groupBy),
      api.getAnalyticsOrders(from, to, groupBy),
      api.getAnalyticsReviews(),
      api.getAnalyticsReservations(),
    ])
      .then(([s, rev, ord, rvw, res]) => {
        setStats(s);
        setRevenueData(rev.revenue?.map((d: any) => ({ ...d, month: d.period })) || []);
        setOrdersData(ord.orders?.map((d: any) => ({ ...d, month: d.period })) || []);
        setReviews(rvw);
        setReservations(res);
      })
      .catch(() => { setStats(null); setRevenueData([]); setOrdersData([]); setReviews(null); setReservations(null); })
      .finally(() => setLoading(false));
  }, [from, to, groupBy]);

  useEffect(() => {
    clearTimeout(fetchRef.current);
    fetchRef.current = setTimeout(doFetch, 400);
    return () => clearTimeout(fetchRef.current);
  }, [doFetch]);

  useEffect(() => {
    clearTimeout(urlRef.current);
    urlRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (from !== sixMonthsAgo) params.set("from", from);
      if (to !== today) params.set("to", to);
      if (groupBy !== "month") params.set("groupBy", groupBy);
      const qs = params.toString();
      router.replace(`/dashboard/seller${qs ? `?${qs}` : ""}`, { scroll: false });
    }, 400);
    return () => clearTimeout(urlRef.current);
  }, [from, to, groupBy]);

  if (loading) return (
    <div>
      <div className={styles.header}>
        <div><Skeleton width={240} height={28} /><Skeleton width={320} height={16} className={styles.skelGap} /></div>
        <Skeleton width={160} height={32} />
      </div>
      <div className={styles.filterBar}>
        <Skeleton width={120} height={28} />
        <Skeleton width={120} height={28} />
        <Skeleton width={200} height={28} />
      </div>
      <div className={styles.statGrid}>
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={100} className={styles.skelCard} />)}
      </div>
      <div className={styles.chartGrid}>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={320} className={styles.skelCard} />)}
      </div>
      <div className={styles.resGrid}>
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={80} className={styles.skelCard} />)}
      </div>
      <div className={styles.chartGrid}>
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} height={280} className={styles.skelCard} />)}
      </div>
    </div>
  );
  if (!stats) return <div className={styles.empty}>Could not load Seller App data. Verify the API is running and NEXT_PUBLIC_API_URL is correct.</div>;

  const s = stats.summary || {};
  const trend = stats.revenueTrend || [];

  const statusTotals = ordersData.reduce((acc: any, o: any) => {
    acc.pending = (acc.pending || 0) + (o.pending || 0);
    acc.paid = (acc.paid || 0) + (o.paid || 0);
    acc.awaiting = (acc.awaiting || 0) + (o.awaiting || 0);
    acc.shipped = (acc.shipped || 0) + (o.shipped || 0);
    acc.cancelled = (acc.cancelled || 0) + (o.cancelled || 0);
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusTotals).map(([k, v]) => ({
    name: k === "awaiting" ? "Awaiting" : k.charAt(0).toUpperCase() + k.slice(1),
    value: v as number,
    color: STATUS_COLORS[k as keyof typeof STATUS_COLORS],
  }));

  const lastRev = trend.length >= 2 ? trend[trend.length - 1].revenue : null;
  const prevRev = trend.length >= 2 ? trend[trend.length - 2].revenue : null;
  const revChange = lastRev != null && prevRev != null ? pctChange(lastRev, prevRev) : null;
  const lastOrd = trend.length >= 2 ? trend[trend.length - 1].orders : null;
  const prevOrd = trend.length >= 2 ? trend[trend.length - 2].orders : null;
  const ordChange = lastOrd != null && prevOrd != null ? pctChange(lastOrd, prevOrd) : null;

  const csvRevenue = revenueData.map((d: any) => [d.month, String(d.revenue || 0), String(d.orders || 0)]);
  const csvOrders = ordersData.map((d: any) => [d.month, String(d.total || 0)]);
  const csvStatus = statusData.map((d: any) => [d.name, String(d.value)]);

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Seller App Analytics</h1>
          <p className={styles.description}>Consolidated metrics and reports from the Seller App.</p>
        </div>
        <div className={styles.headerActions}>
          <ExportCsvButton
            filename="seller-analytics.csv"
            headers={["Metric", "Value"]}
            rows={[
              ["Sellers", String(s.totalSellers ?? "")],
              ["Products", String(s.totalProducts ?? "")],
              ["Orders", String(s.totalOrders ?? "")],
              ["Revenue", formatCurrency(s.totalRevenue ?? 0)],
              ["Avg Rating", String(s.averageRating ?? "")],
              ["Reservations", String(s.totalReservations ?? "")],
              ["Buyers", String(s.uniqueBuyers ?? "")],
              ["Conversion Rate", s.reservationConversionRate != null ? `${s.reservationConversionRate}%` : ""],
            ]}
            label="Export CSV"
          />
          <button onClick={() => { clearTimeout(fetchRef.current); doFetch(); }} className={styles.refreshBtn} title="Refresh data">
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </header>

      <div className={styles.filterBar}>
        <div className={styles.dateGroup}>
          <label className={styles.filterLabel}>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={styles.dateInput} />
        </div>
        <div className={styles.dateGroup}>
          <label className={styles.filterLabel}>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={styles.dateInput} />
        </div>
        <div className={styles.groupToggle}>
          <button onClick={() => setGroupBy("day")} className={`${styles.toggleBtn} ${groupBy === "day" ? styles.toggleActive : ""}`}>Day</button>
          <button onClick={() => setGroupBy("week")} className={`${styles.toggleBtn} ${groupBy === "week" ? styles.toggleActive : ""}`}>Week</button>
          <button onClick={() => setGroupBy("month")} className={`${styles.toggleBtn} ${groupBy === "month" ? styles.toggleActive : ""}`}>Month</button>
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <Users size={16} className={styles.statIcon} />
          <span className={styles.statValue}>{s.totalSellers ?? "—"}</span>
          <span className={styles.statLabel}>Sellers</span>
        </div>
        <div className={styles.statCard}>
          <Package size={16} className={styles.statIcon} />
          <span className={styles.statValue}>{s.totalProducts ?? "—"}</span>
          <span className={styles.statLabel}>Products</span>
        </div>
        <div className={styles.statCard}>
          <ShoppingCart size={16} className={styles.statIcon} />
          <span className={styles.statValue}>{s.totalOrders ?? "—"}</span>
          <span className={styles.statLabel}>Orders</span>
          {ordChange && <span className={ordChange.startsWith("+") ? styles.changeUp : styles.changeDown}>{ordChange}</span>}
        </div>
        <div className={styles.statCard}>
          <DollarSign size={16} className={styles.statIcon} />
          <span className={styles.statValue}>{s.totalRevenue != null ? formatCurrency(s.totalRevenue) : "—"}</span>
          <span className={styles.statLabel}>Revenue</span>
          {revChange && <span className={revChange.startsWith("+") ? styles.changeUp : styles.changeDown}>{revChange}</span>}
        </div>
        <div className={styles.statCard}>
          <Star size={16} className={styles.statIcon} />
          <span className={styles.statValue}>{s.averageRating ?? "—"}</span>
          <span className={styles.statLabel}>Avg Rating</span>
        </div>
        <div className={styles.statCard}>
          <BookMarked size={16} className={styles.statIcon} />
          <span className={styles.statValue}>{s.totalReservations ?? "—"}</span>
          <span className={styles.statLabel}>Reservations</span>
        </div>
        <div className={styles.statCard}>
          <Users size={16} className={styles.statIcon} />
          <span className={styles.statValue}>{s.uniqueBuyers ?? "—"}</span>
          <span className={styles.statLabel}>Buyers</span>
        </div>
        <div className={`${styles.statCard} ${styles.statCardWarning}`}>
          <TrendingUp size={16} className={styles.statIconWarning} />
          <span className={styles.statValueWarning}>{s.reservationConversionRate != null ? `${s.reservationConversionRate}%` : "—"}</span>
          <span className={styles.statLabel}>Conversion</span>
        </div>
      </div>

      <ErrorBoundary>
        <div className={styles.chartGrid}>
          {revenueData.length > 0 && (
            <ChartCard title="Revenue Trend" description="Revenue over time" tall>
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 1rem 0.5rem" }}>
                <ExportCsvButton filename="revenue-trend.csv" headers={["Period", "Revenue", "Orders"]} rows={csvRevenue} label="CSV" />
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B3D2F" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#1B3D2F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={(v: any) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                  <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#1B3D2F" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {ordersData.length > 0 && (
            <ChartCard title="Orders Over Time" description="Order count over time" tall>
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 1rem 0.5rem" }}>
                <ExportCsvButton filename="orders-trend.csv" headers={["Period", "Orders"]} rows={csvOrders} label="CSV" />
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ordersData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                  <Bar dataKey="total" fill="#2D5A46" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <div className={styles.chartGrid}>
          {(stats.topCategories || []).length > 0 && (
            <ChartCard title="Revenue by Category" description="Top categories by revenue" tall>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={stats.topCategories.slice(0, 8)} dataKey="revenue" nameKey="name"
                    cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                    label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {(stats.topCategories.slice(0, 8) as any[]).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {(reviews?.metrics?.distribution ? Object.entries(reviews.metrics.distribution).map(([k, v]) => ({ rating: `${k} ★`, count: v as number })).reverse() : []).length > 0 && (
            <ChartCard title="Review Distribution" description="Rating breakdown" tall>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={Object.entries(reviews.metrics.distribution).map(([k, v]) => ({ rating: `${k} ★`, count: v as number })).reverse()} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="rating" type="category" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                  <Bar dataKey="count" fill="#6B7D5F" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {statusData.length > 0 && (
            <ChartCard title="Order Status Breakdown" description="Orders by current status" tall>
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 1rem 0.5rem" }}>
                <ExportCsvButton filename="order-status.csv" headers={["Status", "Count"]} rows={csvStatus} label="CSV" />
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80} innerRadius={45}
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {statusData.map((d: any) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {ordersData.length > 0 && (
            <ChartCard title="Orders by Status Over Time" description="Status distribution per period" tall>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ordersData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                  <Bar dataKey="pending" stackId="a" fill="#D4A853" />
                  <Bar dataKey="paid" stackId="a" fill="#1B3D2F" />
                  <Bar dataKey="awaiting" stackId="a" fill="#6B7D5F" />
                  <Bar dataKey="shipped" stackId="a" fill="#2D5A46" />
                  <Bar dataKey="cancelled" stackId="a" fill="#8B7355" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        {reservations?.metrics && (
          <div className={styles.resGrid}>
            <div className={styles.resCard}>
              <span className={styles.resValue}>{reservations.metrics.total}</span>
              <span className={styles.resLabel}>Total</span>
            </div>
            <div className={styles.resCard}>
              <span className={styles.resValue}>{reservations.metrics.active}</span>
              <span className={styles.resLabel}>Active</span>
            </div>
            <div className={styles.resCard}>
              <span className={styles.resValue}>{reservations.metrics.completed}</span>
              <span className={styles.resLabel}>Completed</span>
            </div>
            <div className={styles.resCard}>
              <span className={styles.resValue}>{reservations.metrics.cancelled}</span>
              <span className={styles.resLabel}>Cancelled</span>
            </div>
            <div className={styles.resCard}>
              <span className={styles.resValue}>{reservations.metrics.expired}</span>
              <span className={styles.resLabel}>Expired</span>
            </div>
            <div className={styles.resCard}>
              <span className={styles.resValue}>{reservations.metrics.conversionRate != null ? `${reservations.metrics.conversionRate}%` : "—"}</span>
              <span className={styles.resLabel}>Conversion Rate</span>
            </div>
          </div>
        )}
      </ErrorBoundary>

      <ErrorBoundary>
        <div className={styles.chartGrid}>
          {(stats.topProducts || []).length > 0 && (
            <ChartCard title="Top Products" description="Best-selling products by revenue" tall>
              <div className={styles.rankList}>
                {stats.topProducts.slice(0, 8).map((p: any, i: number) => (
                  <div key={i} className={styles.rankRow}>
                    <span className={styles.rankBadge}>{i + 1}</span>
                    <div className={styles.rankInfo}>
                      <span className={styles.rankName}>{p.name}</span>
                      <span className={styles.rankMeta}>x{p.quantity} sold</span>
                    </div>
                    <span className={styles.rankValue}>{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          {(stats.topSellers || []).length > 0 && (
            <ChartCard title="Top Sellers" description="Sellers with highest revenue" tall>
              <div className={styles.rankList}>
                {stats.topSellers.slice(0, 8).map((s: any, i: number) => (
                  <div key={i} className={styles.rankRow}>
                    <span className={styles.rankBadge}>{i + 1}</span>
                    <div className={styles.rankInfo}>
                      <span className={styles.rankName}>{s.email}</span>
                      <span className={styles.rankMeta}>{s.orders} orders</span>
                    </div>
                    <span className={styles.rankValue}>{formatCurrency(s.revenue)}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}
