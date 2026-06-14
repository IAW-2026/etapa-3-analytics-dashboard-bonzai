"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  ShoppingCart, DollarSign, Package, Users, Star, BookMarked,
  TrendingUp, Award,
} from "lucide-react";
import { api } from "@/lib/api";
import { ChartCard } from "@/components/charts/ChartCard/ChartCard";
import styles from "./page.module.css";

const COLORS = ["#1B3D2F", "#2D5A46", "#6B7D5F", "#8A9B7E", "#D4A853", "#E2C47A", "#C5C0B0", "#A0B09A"];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatMonth(m: string) {
  const [y, mo] = m.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(mo, 10) - 1]} ${y}`;
}

export default function SellerAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [reviews, setReviews] = useState<any>(null);
  const [reservations, setReservations] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getStatistics(),
      api.getAnalyticsReviews(),
      api.getAnalyticsReservations(),
    ])
      .then(([s, r, res]) => {
        setStats(s);
        setReviews(r);
        setReservations(res);
      })
      .catch(() => { setStats(null); setReviews(null); setReservations(null); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Loading analytics data…</div>;
  if (!stats) return <div className={styles.empty}>Could not load Seller App data. Verify the API is running and NEXT_PUBLIC_API_URL is correct.</div>;

  const s = stats.summary || {};
  const revenueData = (stats.revenueTrend || stats.monthlyRevenue || []).map((d: any) => ({ ...d, month: formatMonth(d.month) }));
  const ordersData = (stats.monthlyOrders || []).map((d: any) => ({ ...d, month: formatMonth(d.month) }));
  const catData = (stats.topCategories || []).slice(0, 8);
  const topProducts = stats.topProducts || [];
  const topSellers = stats.topSellers || [];
  const reviewDist = reviews?.metrics?.distribution ? Object.entries(reviews.metrics.distribution).map(([k, v]) => ({ rating: `${k} ★`, count: v as number })).reverse() : [];
  const resMetrics = reservations?.metrics;

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Seller App Analytics</h1>
          <p className={styles.description}>Consolidated metrics and reports from the Seller App.</p>
        </div>
      </header>

      {/* ── Stat cards ── */}
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
        </div>
        <div className={styles.statCard}>
          <DollarSign size={16} className={styles.statIcon} />
          <span className={styles.statValue}>{s.totalRevenue != null ? formatCurrency(s.totalRevenue) : "—"}</span>
          <span className={styles.statLabel}>Revenue</span>
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

      {/* ── Revenue & Orders charts ── */}
      <div className={styles.chartGrid}>
        {revenueData.length > 0 && (
          <ChartCard title="Revenue Trend" description="Monthly revenue over time" tall>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1B3D2F" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#1B3D2F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                <Area type="monotone" dataKey="revenue" stroke="#1B3D2F" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {ordersData.length > 0 && (
          <ChartCard title="Orders Over Time" description="Monthly order count" tall>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ordersData}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                <Bar dataKey="orders" fill="#2D5A46" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* ── Categories & Review Distribution ── */}
      <div className={styles.chartGrid}>
        {catData.length > 0 && (
          <ChartCard title="Revenue by Category" description="Top categories by revenue" tall>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={catData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                  label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {catData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {reviewDist.length > 0 && (
          <ChartCard title="Review Distribution" description="Rating breakdown" tall>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={reviewDist} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="rating" type="category" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={50} />
                <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                <Bar dataKey="count" fill="#6B7D5F" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* ── Reservation metrics ── */}
      {resMetrics && (
        <div className={styles.resGrid}>
          <div className={styles.resCard}>
            <span className={styles.resValue}>{resMetrics.total}</span>
            <span className={styles.resLabel}>Total</span>
          </div>
          <div className={styles.resCard}>
            <span className={styles.resValue}>{resMetrics.active}</span>
            <span className={styles.resLabel}>Active</span>
          </div>
          <div className={styles.resCard}>
            <span className={styles.resValue}>{resMetrics.completed}</span>
            <span className={styles.resLabel}>Completed</span>
          </div>
          <div className={styles.resCard}>
            <span className={styles.resValue}>{resMetrics.cancelled}</span>
            <span className={styles.resLabel}>Cancelled</span>
          </div>
          <div className={styles.resCard}>
            <span className={styles.resValue}>{resMetrics.expired}</span>
            <span className={styles.resLabel}>Expired</span>
          </div>
          <div className={styles.resCard}>
            <span className={styles.resValue}>{resMetrics.conversionRate != null ? `${resMetrics.conversionRate}%` : "—"}</span>
            <span className={styles.resLabel}>Conversion Rate</span>
          </div>
        </div>
      )}

      {/* ── Top Products & Top Sellers ── */}
      <div className={styles.chartGrid}>
        {topProducts.length > 0 && (
          <ChartCard title="Top Products" description="Best-selling products by revenue" tall>
            <div className={styles.rankList}>
              {topProducts.slice(0, 8).map((p: any, i: number) => (
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

        {topSellers.length > 0 && (
          <ChartCard title="Top Sellers" description="Sellers with highest revenue" tall>
            <div className={styles.rankList}>
              {topSellers.slice(0, 8).map((s: any, i: number) => (
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
    </div>
  );
}
