"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from "recharts";
import {
  CreditCard, DollarSign, TrendingUp, AlertTriangle,
  Wallet, RefreshCw, Users, BarChart2,
} from "lucide-react";
import { ChartCard } from "@/components/charts/ChartCard/ChartCard";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton/ExportCsvButton";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary/ErrorBoundary";
import styles from "./page.module.css";

// ── Paleta de colores ──────────────────────────────────────────────────────────
const COLORS = ["#1B3D2F", "#2D5A46", "#6B7D5F", "#8A9B7E", "#D4A853", "#E2C47A", "#8B7355", "#C5C0B0"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#D4A853",
  HELD: "#2D5A46",
  DELIVERED: "#6B7D5F",
  COMPLETED: "#1B3D2F",
  DISPUTED: "#DC2626",
  REFUNDED: "#8B7355",
};

const REASON_COLORS: Record<string, string> = {
  ITEM_DAMAGED: "#DC2626",
  ITEM_NOT_RECEIVED: "#D4A853",
  INCORRECT_ITEM: "#6B7D5F",
  OTHER: "#C5C0B0",
};

const RESOLUTION_COLORS: Record<string, string> = {
  REFUNDED: "#1B3D2F",
  FAVOR_SELLER: "#2D5A46",
  FAVOR_BUYER: "#6B7D5F",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function formatCompact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

function humanizeLabel(s: string) {
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Fetch helper (calls our internal Route Handler) ────────────────────────────
async function paymentsApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`/api/payments/${path}${qs}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Error ${res.status}`);
  }
  return res.json();
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function ARSTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 4, padding: "0.5rem 0.75rem", fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: "#1A1A1A" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color || "#1B3D2F" }}>
          {humanizeLabel(p.dataKey)}: {formatARS(p.value)}
        </div>
      ))}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PaymentsAnalyticsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(searchParams.get("from") || thirtyDaysAgo);
  const [to, setTo] = useState(searchParams.get("to") || today);
  const [interval, setInterval] = useState<"day" | "week" | "month">(
    (searchParams.get("interval") as "day" | "week" | "month") || "day"
  );

  // Data state
  const [overview, setOverview] = useState<any>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any>(null);
  const [txStatus, setTxStatus] = useState<any[]>([]);
  const [txDay, setTxDay] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any>(null);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const urlRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doFetch = useCallback(() => {
    setLoading(true);
    setError(null);

    const dateParams = { from, to };

    Promise.all([
      paymentsApi<any>("overview"),
      paymentsApi<any>("revenue", { ...dateParams, interval }),
      paymentsApi<any>("commissions", { ...dateParams, interval }),
      paymentsApi<any>("transactions", { ...dateParams, groupBy: "status" }),
      paymentsApi<any>("transactions", { ...dateParams, groupBy: "day" }),
      paymentsApi<any>("disputes", dateParams),
      paymentsApi<any>("sellers/top", { limit: "10", ...dateParams }),
      paymentsApi<any>("wallets"),
    ])
      .then(([ov, rev, comm, txSt, txD, disp, sellers, wall]) => {
        setOverview(ov);
        setRevenue(rev.data || []);
        setCommissions(comm);
        setTxStatus(txSt.data || []);
        setTxDay(txD.data || []);
        setDisputes(disp);
        setTopSellers(sellers.sellers || []);
        setWallets(wall);
      })
      .catch((e) => {
        setError(e.message || "Error al cargar los datos.");
        setOverview(null);
      })
      .finally(() => setLoading(false));
  }, [from, to, interval]);

  // Debounce fetch
  useEffect(() => {
    clearTimeout(fetchRef.current);
    fetchRef.current = setTimeout(doFetch, 400);
    return () => clearTimeout(fetchRef.current);
  }, [doFetch]);

  // Sync URL
  useEffect(() => {
    clearTimeout(urlRef.current);
    urlRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (from !== thirtyDaysAgo) params.set("from", from);
      if (to !== today) params.set("to", to);
      if (interval !== "day") params.set("interval", interval);
      const qs = params.toString();
      router.replace(`/dashboard/payments${qs ? `?${qs}` : ""}`, { scroll: false });
    }, 400);
    return () => clearTimeout(urlRef.current);
  }, [from, to, interval]);

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) return (
    <div>
      <div className={styles.header}>
        <div><Skeleton width={260} height={28} /><Skeleton width={340} height={16} className={styles.skelGap} /></div>
        <Skeleton width={120} height={32} />
      </div>
      <div className={styles.filterBar}>
        <Skeleton width={120} height={28} />
        <Skeleton width={120} height={28} />
        <Skeleton width={180} height={28} />
      </div>
      <div className={styles.statGrid}>
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={100} className={styles.skelCard} />)}
      </div>
      <div className={styles.chartGrid}>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={300} className={styles.skelCard} />)}
      </div>
      <div className={styles.miniStatGrid}>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={80} className={styles.skelCard} />)}
      </div>
    </div>
  );

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) return (
    <div>
      <PageHeader from={from} to={to} interval={interval}
        setFrom={setFrom} setTo={setTo} setInterval={setInterval}
        onRefresh={doFetch} exportRows={[]} />
      <div className={styles.empty}>
        ⚠️ {error}<br />
        <small>Verificá que la Payments API esté disponible y que la API key sea correcta.</small>
      </div>
    </div>
  );

  // ── CSV data ─────────────────────────────────────────────────────────────────
  const csvOverview = overview ? [
    ["Total Transactions", String(overview.totalTransactions ?? "")],
    ["Total Volume (ARS)", String(overview.totalVolume ?? "")],
    ["Total Commissions (ARS)", String(overview.totalCommissions ?? "")],
    ["Total Disputes", String(overview.totalDisputes ?? "")],
    ["Active Disputes", String(overview.activeDisputes ?? "")],
    ["Dispute Rate %", String(overview.disputeRate ?? "")],
    ["Active Wallets", String(overview.activeWallets ?? "")],
    ["Avg Transaction", String(overview.avgTransactionAmount ?? "")],
  ] : [];

  const csvRevenue = revenue.map((d) => [d.date, String(d.revenue || 0), String(d.commissions || 0), String(d.count || 0)]);
  const csvSellers = topSellers.map((s, i) => [String(i + 1), s.sellerId, String(s.totalRevenue || 0), String(s.transactionCount || 0), String(s.avgAmount || 0)]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <PageHeader
        from={from} to={to} interval={interval}
        setFrom={setFrom} setTo={setTo} setInterval={setInterval}
        onRefresh={doFetch}
        exportRows={csvOverview}
      />

      {/* ── 1. KPI Stat Cards ── */}
      {overview && (
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <CreditCard size={16} className={styles.statIcon} />
            <span className={styles.statValue}>{overview.totalTransactions ?? "—"}</span>
            <span className={styles.statLabel}>Transacciones</span>
          </div>
          <div className={styles.statCard}>
            <DollarSign size={16} className={styles.statIcon} />
            <span className={styles.statValue}>{overview.totalVolume != null ? formatCompact(overview.totalVolume) : "—"}</span>
            <span className={styles.statLabel}>Volumen Total</span>
          </div>
          <div className={styles.statCard}>
            <TrendingUp size={16} className={styles.statIcon} />
            <span className={styles.statValue}>{overview.totalCommissions != null ? formatCompact(overview.totalCommissions) : "—"}</span>
            <span className={styles.statLabel}>Comisiones</span>
          </div>
          <div className={styles.statCard}>
            <DollarSign size={16} className={styles.statIcon} />
            <span className={styles.statValue}>{overview.avgTransactionAmount != null ? formatCompact(overview.avgTransactionAmount) : "—"}</span>
            <span className={styles.statLabel}>Ticket Promedio</span>
          </div>
          <div className={styles.statCard}>
            <Wallet size={16} className={styles.statIcon} />
            <span className={styles.statValue}>{overview.activeWallets ?? "—"}</span>
            <span className={styles.statLabel}>Wallets Activas</span>
          </div>
          <div className={styles.statCard}>
            <AlertTriangle size={16} className={styles.statIconWarning} />
            <span className={styles.statValueWarning}>{overview.totalDisputes ?? "—"}</span>
            <span className={styles.statLabel}>Disputas Totales</span>
          </div>
          <div className={styles.statCard}>
            <AlertTriangle size={16} className={styles.statIconDanger} />
            <span className={styles.statValueDanger}>{overview.activeDisputes ?? "—"}</span>
            <span className={styles.statLabel}>Disputas Activas</span>
          </div>
          <div className={`${styles.statCard} ${overview.disputeRate > 5 ? styles.statCardDanger : styles.statCardWarning}`}>
            <BarChart2 size={16} className={overview.disputeRate > 5 ? styles.statIconDanger : styles.statIconWarning} />
            <span className={overview.disputeRate > 5 ? styles.statValueDanger : styles.statValueWarning}>
              {overview.disputeRate != null ? `${overview.disputeRate}%` : "—"}
            </span>
            <span className={styles.statLabel}>Tasa de Disputas</span>
          </div>
        </div>
      )}

      {/* ── 2. Status breakdown (overview) ── */}
      {overview?.statusBreakdown && (
        <ErrorBoundary>
          <p className={styles.sectionLabel}><CreditCard size={13} /> Distribución por Estado</p>
          <div className={styles.walletGrid} style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: "2rem" }}>
            {Object.entries(overview.statusBreakdown as Record<string, number>).map(([status, count]) => (
              <div key={status} className={styles.walletCard} style={{ borderLeft: `3px solid ${STATUS_COLORS[status] || "#C5C0B0"}` }}>
                <span className={styles.walletValue}>{count}</span>
                <span className={styles.walletLabel}>{humanizeLabel(status)}</span>
              </div>
            ))}
          </div>
        </ErrorBoundary>
      )}

      {/* ── 3. Revenue & Commissions Charts ── */}
      <ErrorBoundary>
        <div className={styles.chartGrid}>
          {revenue.length > 0 && (
            <ChartCard title="Revenue en el Tiempo" description={`Ingresos totales por ${interval}`} tall>
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 1rem 0.5rem" }}>
                <ExportCsvButton filename="payments-revenue.csv" headers={["Fecha", "Revenue", "Comisiones", "Transacciones"]} rows={csvRevenue} label="CSV" />
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenue}>
                  <defs>
                    <linearGradient id="revGradP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B3D2F" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#1B3D2F" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="commGradP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4A853" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#D4A853" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
                  <Tooltip content={<ARSTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#1B3D2F" strokeWidth={2} fill="url(#revGradP)" />
                  <Area type="monotone" dataKey="commissions" stroke="#D4A853" strokeWidth={1.5} fill="url(#commGradP)" strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
              <div className={styles.pieLegend}>
                <div className={styles.pieLegendItem}><span className={styles.pieLegendDot} style={{ background: "#1B3D2F" }} />Revenue</div>
                <div className={styles.pieLegendItem}><span className={styles.pieLegendDot} style={{ background: "#D4A853" }} />Comisiones</div>
              </div>
            </ChartCard>
          )}

          {commissions?.data?.length > 0 && (
            <ChartCard title="Comisiones por Período" description={`Comisiones agrupadas por ${interval}`} tall>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={commissions.data}>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
                  <Tooltip content={<ARSTooltip />} />
                  <Bar dataKey="commissions" fill="#D4A853" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {commissions.totalCommissions != null && (
                <div style={{ padding: "0 1rem 1rem", fontSize: "0.75rem", color: "#6B7280" }}>
                  Total: <strong style={{ color: "#1B3D2F" }}>{formatARS(commissions.totalCommissions)}</strong>
                  {" · "}Tasa promedio: <strong style={{ color: "#D4A853" }}>{commissions.avgCommissionRate}%</strong>
                </div>
              )}
            </ChartCard>
          )}
        </div>
      </ErrorBoundary>

      {/* ── 4. Transaction Distribution ── */}
      <ErrorBoundary>
        <div className={styles.chartGrid}>
          {txStatus.length > 0 && (
            <ChartCard title="Transacciones por Estado" description="Distribución porcentual de estados" tall>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={txStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    label={({ status, percent }: any) => `${humanizeLabel(status)} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {txStatus.map((d, i) => (
                      <Cell key={i} fill={STATUS_COLORS[d.status] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, _: any, entry: any) => [
                      `${v} txns · ${formatARS(entry.payload?.volume || 0)}`,
                      humanizeLabel(entry.payload?.status || ""),
                    ]}
                    contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.pieLegend}>
                {txStatus.map((d) => (
                  <div key={d.status} className={styles.pieLegendItem}>
                    <span className={styles.pieLegendDot} style={{ background: STATUS_COLORS[d.status] || "#C5C0B0" }} />
                    {humanizeLabel(d.status)}
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          {txDay.length > 0 && (
            <ChartCard title="Transacciones por Día" description="Volumen diario de transacciones" tall>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={txDay}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: any, k: any) => k === "volume" ? [formatARS(v as number), "Volumen"] : [v, "Transacciones"]}
                    contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#1B3D2F" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      </ErrorBoundary>

      {/* ── 5. Dispute Intelligence ── */}
      {disputes && (
        <ErrorBoundary>
          <p className={styles.sectionLabel}><AlertTriangle size={13} /> Inteligencia de Disputas</p>

          <div className={styles.miniStatGrid}>
            <div className={styles.disputeCard}>
              <span className={styles.disputeValue}>{disputes.totalDisputes ?? "—"}</span>
              <span className={styles.disputeLabel}>Total</span>
            </div>
            <div className={styles.disputeCard}>
              <span className={styles.disputeValue} style={{ color: "#16A34A" }}>{disputes.resolvedCount ?? "—"}</span>
              <span className={styles.disputeLabel}>Resueltas</span>
            </div>
            <div className={styles.disputeCard}>
              <span className={styles.disputeValue} style={{ color: "#DC2626" }}>{disputes.pendingCount ?? "—"}</span>
              <span className={styles.disputeLabel}>Pendientes</span>
            </div>
            <div className={styles.disputeCard}>
              <span className={styles.disputeValue}>{disputes.resolutionRate != null ? `${disputes.resolutionRate}%` : "—"}</span>
              <span className={styles.disputeLabel}>Tasa Resolución</span>
            </div>
            <div className={styles.disputeCard}>
              <span className={styles.disputeValue}>{disputes.avgResolutionTimeHours != null ? `${disputes.avgResolutionTimeHours.toFixed(1)}h` : "—"}</span>
              <span className={styles.disputeLabel}>Tiempo Promedio</span>
            </div>
          </div>

          <div className={styles.chartGrid}>
            {(disputes.byReason || []).length > 0 && (
              <ChartCard title="Motivos de Disputa" description="Distribución por tipo de reclamo" tall>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={disputes.byReason}
                      dataKey="count"
                      nameKey="reason"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {disputes.byReason.map((d: any, i: number) => (
                        <Cell key={i} fill={REASON_COLORS[d.reason] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any, _: any, entry: any) => [v, humanizeLabel(entry.payload?.reason || "")]}
                      contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.pieLegend}>
                  {disputes.byReason.map((d: any, i: number) => (
                    <div key={d.reason} className={styles.pieLegendItem}>
                      <span className={styles.pieLegendDot} style={{ background: REASON_COLORS[d.reason] || COLORS[i % COLORS.length] }} />
                      {humanizeLabel(d.reason)}
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}

            {(disputes.byResolution || []).length > 0 && (
              <ChartCard title="Resoluciones" description="Distribución de resultados de disputas resueltas" tall>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={disputes.byResolution} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      dataKey="resolution"
                      type="category"
                      tick={{ fontSize: 10, fill: "#6B7280" }}
                      axisLine={false}
                      tickLine={false}
                      width={110}
                      tickFormatter={humanizeLabel}
                    />
                    <Tooltip
                      formatter={(v: any, _: any, entry: any) => [v, humanizeLabel(entry.payload?.resolution || "")]}
                      contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }}
                    />
                    <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                      {disputes.byResolution.map((d: any, i: number) => (
                        <Cell key={i} fill={RESOLUTION_COLORS[d.resolution] || COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        </ErrorBoundary>
      )}

      {/* ── 6. Top Sellers ── */}
      {topSellers.length > 0 && (
        <ErrorBoundary>
          <p className={styles.sectionLabel}><Users size={13} /> Top Vendedores por Volumen</p>
          <div className={styles.chartGrid}>
            <ChartCard title="Top 10 Sellers" description="Vendedores con mayor volumen de ventas" tall>
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 1rem 0.5rem" }}>
                <ExportCsvButton
                  filename="payments-top-sellers.csv"
                  headers={["#", "Seller ID", "Revenue (ARS)", "Transacciones", "Avg Amount"]}
                  rows={csvSellers}
                  label="CSV"
                />
              </div>
              <div className={styles.rankList}>
                {topSellers.map((s, i) => (
                  <div key={s.sellerId} className={styles.rankRow}>
                    <span className={styles.rankBadge}>{i + 1}</span>
                    <div className={styles.rankInfo}>
                      <span className={styles.rankName}>{s.sellerId}</span>
                      <span className={styles.rankMeta}>
                        {s.transactionCount} txns · avg {formatARS(s.avgAmount || 0)}
                      </span>
                    </div>
                    <span className={styles.rankValue}>{formatARS(s.totalRevenue || 0)}</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            {topSellers.length > 0 && (
              <ChartCard title="Revenue por Seller" description="Visualización comparativa de revenue" tall>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topSellers.slice(0, 8)} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
                    <YAxis
                      dataKey="sellerId"
                      type="category"
                      tick={{ fontSize: 9, fill: "#6B7280" }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                      tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v}
                    />
                    <Tooltip content={<ARSTooltip />} />
                    <Bar dataKey="totalRevenue" fill="#1B3D2F" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>
        </ErrorBoundary>
      )}

      {/* ── 7. Wallet Distribution ── */}
      {wallets && (
        <ErrorBoundary>
          <p className={styles.sectionLabel}><Wallet size={13} /> Distribución de Wallets</p>

          <div className={styles.walletGrid} style={{ marginBottom: "1rem" }}>
            <div className={styles.walletCard}>
              <span className={styles.walletValue}>{wallets.totalWallets ?? "—"}</span>
              <span className={styles.walletLabel}>Total Wallets</span>
            </div>
            <div className={styles.walletCard}>
              <span className={styles.walletValue}>{wallets.aggregated?.totalAvailable != null ? formatCompact(wallets.aggregated.totalAvailable) : "—"}</span>
              <span className={styles.walletLabel}>Disponible</span>
            </div>
            <div className={styles.walletCard}>
              <span className={styles.walletValue}>{wallets.aggregated?.totalHeld != null ? formatCompact(wallets.aggregated.totalHeld) : "—"}</span>
              <span className={styles.walletLabel}>Retenido</span>
            </div>
            <div className={styles.walletCard}>
              <span className={styles.walletValue}>{wallets.aggregated?.totalBalance != null ? formatCompact(wallets.aggregated.totalBalance) : "—"}</span>
              <span className={styles.walletLabel}>Balance Total</span>
            </div>
          </div>

          <div className={styles.chartGrid}>
            {wallets.distribution && (
              <ChartCard title="Distribución por Saldo" description="Cantidad de wallets por rango de saldo total">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={[
                      { label: "$0", count: wallets.distribution.zeroBalance },
                      { label: "< $10k", count: wallets.distribution.under10k },
                      { label: "$10k–$100k", count: wallets.distribution.between10kAnd100k },
                      { label: "> $100k", count: wallets.distribution.over100k },
                    ]}
                  >
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 4 }} />
                    <Bar dataKey="count" fill="#2D5A46" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {(wallets.topWallets || []).length > 0 && (
              <ChartCard title="Top 5 Wallets" description="Vendedores con mayor saldo total">
                <div className={styles.rankList} style={{ paddingTop: "0.75rem" }}>
                  {wallets.topWallets.map((w: any, i: number) => (
                    <div key={w.userId} className={styles.rankRow}>
                      <span className={styles.rankBadge}>{i + 1}</span>
                      <div className={styles.rankInfo}>
                        <span className={styles.rankName}>{w.userId}</span>
                        <span className={styles.rankMeta}>
                          Disponible: {formatARS(w.availableBalance || 0)} · Retenido: {formatARS(w.heldBalance || 0)}
                        </span>
                      </div>
                      <span className={styles.rankValue}>{formatARS(w.totalBalance || 0)}</span>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
}

// ── Sub-componente Header + FilterBar ─────────────────────────────────────────
function PageHeader({
  from, to, interval, setFrom, setTo, setInterval, onRefresh, exportRows,
}: {
  from: string; to: string; interval: string;
  setFrom: (v: string) => void; setTo: (v: string) => void;
  setInterval: (v: "day" | "week" | "month") => void;
  onRefresh: () => void; exportRows: string[][];
}) {
  return (
    <>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Payments App Analytics</h1>
          <p className={styles.description}>Métricas financieras, comisiones y disputas de la plataforma de pagos.</p>
        </div>
        <div className={styles.headerActions}>
          <ExportCsvButton
            filename="payments-overview.csv"
            headers={["Métrica", "Valor"]}
            rows={exportRows}
            label="Export CSV"
          />
          <button onClick={onRefresh} className={styles.refreshBtn} title="Actualizar datos">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </header>

      <div className={styles.filterBar}>
        <div className={styles.dateGroup}>
          <label className={styles.filterLabel}>Desde</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={styles.dateInput} />
        </div>
        <div className={styles.dateGroup}>
          <label className={styles.filterLabel}>Hasta</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={styles.dateInput} />
        </div>
        <div className={styles.groupToggle}>
          {(["day", "week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setInterval(v)}
              className={`${styles.toggleBtn} ${interval === v ? styles.toggleActive : ""}`}
            >
              {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
