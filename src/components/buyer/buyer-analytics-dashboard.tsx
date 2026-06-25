"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Home,
  MapPinned,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/charts/ChartCard/ChartCard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary/ErrorBoundary";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton/ExportCsvButton";
import type {
  BuyerAnalyticsSnapshot,
  BuyerSummary,
  CartSummary,
} from "@/types/buyer-analytics";
import styles from "@/app/dashboard/payments/page.module.css";

const COLORS = ["#1B3D2F", "#2D5A46", "#6B7D5F", "#8A9B7E", "#D4A853", "#E2C47A", "#8B7355", "#C5C0B0"];

export function BuyerAnalyticsDashboard({ snapshot }: { snapshot: BuyerAnalyticsSnapshot }) {
  const router = useRouter();
  const [from, setFrom] = useState(snapshot.filters.from);
  const [to, setTo] = useState(snapshot.filters.to);
  const [inactiveDays, setInactiveDays] = useState(String(snapshot.filters.inactiveDays));

  useEffect(() => {
    setFrom(snapshot.filters.from);
    setTo(snapshot.filters.to);
    setInactiveDays(String(snapshot.filters.inactiveDays));
  }, [snapshot.filters.from, snapshot.filters.to, snapshot.filters.inactiveDays]);

  const overview = snapshot.buyerOverview.data;
  const newBuyers = snapshot.newBuyers.data;
  const cartOverview = snapshot.cartOverview.data;
  const activeCarts = snapshot.activeCarts.data;
  const abandonedCarts = snapshot.abandonedCarts.data;
  const averageCartItems = snapshot.averageCartItems.data;
  const topProducts = snapshot.topCartProducts.data;
  const cartsByBuyer = snapshot.cartsByBuyer.data;
  const addressOverview = snapshot.shippingAddressOverview.data;
  const addressesByCity = snapshot.shippingAddressesByCity.data;
  const addressesByProvince = snapshot.shippingAddressesByProvince.data;
  const addressCompleteness = snapshot.shippingAddressCompleteness.data;
  const buyersWithAddress = snapshot.buyersWithAddress.data;
  const buyersWithoutAddress = snapshot.buyersWithoutAddress.data;

  const newBuyerTrend = useMemo(() => (
    (newBuyers?.buckets ?? []).map((bucket) => ({
      date: bucket.date ?? bucket.value ?? "Unknown",
      buyers: bucket.count,
    }))
  ), [newBuyers]);
  const hasNewBuyerTrend = newBuyerTrend.some((bucket) => bucket.buyers > 0);

  const readinessData = overview
    ? [
        { name: "Checkout ready", value: overview.checkoutReadyBuyers },
        { name: "Not ready", value: Math.max(overview.totalBuyers - overview.checkoutReadyBuyers, 0) },
      ].filter((item) => item.value > 0)
    : [];

  const addressCoverageData = overview
    ? [
        { name: "With address", count: overview.buyersWithShippingAddress },
        { name: "Without address", count: overview.buyersWithoutShippingAddress },
        { name: "With cart items", count: overview.buyersWithCartItems },
        { name: "Checkout ready", count: overview.checkoutReadyBuyers },
      ].filter((item) => item.count > 0)
    : [];

  const cartStatusData = cartOverview
    ? [
        { name: "Active", count: cartOverview.activeCarts },
        { name: "Empty", count: cartOverview.emptyCarts },
        { name: "Abandoned", count: cartOverview.abandonedCarts },
      ].filter((item) => item.count > 0)
    : [];

  const addressCompletenessData = addressCompleteness
    ? [
        { name: "Complete", value: addressCompleteness.completeRequiredFields },
        { name: "Incomplete", value: addressCompleteness.incompleteRequiredFields },
      ].filter((item) => item.value > 0)
    : [];

  const topCityData = (addressesByCity?.cities ?? []).filter((item) => item.count > 0).slice(0, 8).map((item) => ({ name: item.value, count: item.count }));
  const topProvinceData = (addressesByProvince?.provinces ?? []).filter((item) => item.count > 0).slice(0, 8).map((item) => ({ name: item.value, count: item.count }));
  const topProductData = (topProducts?.products ?? [])
    .filter((product) => product.totalQuantity > 0 || product.cartCount > 0 || product.lineCount > 0)
    .slice(0, 8);

  const loadedSections = [
    overview,
    newBuyers,
    cartOverview,
    activeCarts,
    abandonedCarts,
    averageCartItems,
    topProducts,
    cartsByBuyer,
    addressOverview,
    addressesByCity,
    addressesByProvince,
    addressCompleteness,
    buyersWithAddress,
    buyersWithoutAddress,
  ];
  const hasLoadedData = loadedSections.some(Boolean);
  const hasMeaningfulData = Boolean(
    (overview?.totalBuyers ?? 0) > 0
      || (overview?.buyersWithShippingAddress ?? 0) > 0
      || (overview?.buyersWithCartItems ?? 0) > 0
      || (newBuyers?.total ?? 0) > 0
      || hasNewBuyerTrend
      || (cartOverview?.totalCarts ?? 0) > 0
      || (activeCarts?.carts ?? []).length > 0
      || (abandonedCarts?.carts ?? []).length > 0
      || (averageCartItems?.totalCarts ?? 0) > 0
      || topProductData.length > 0
      || (cartsByBuyer?.buyers ?? []).length > 0
      || (addressOverview?.totalAddresses ?? 0) > 0
      || (addressOverview?.totalBuyers ?? 0) > 0
      || topCityData.length > 0
      || topProvinceData.length > 0
      || (addressCompleteness?.totalAddresses ?? 0) > 0
      || (buyersWithAddress?.buyers ?? []).length > 0
      || (buyersWithoutAddress?.buyers ?? []).length > 0,
  );
  const showNoDataState = hasLoadedData && snapshot.errors.length === 0 && !hasMeaningfulData;

  const overviewCsvRows = [
    ["Total buyers", formatCsvNumber(overview?.totalBuyers)],
    ["Checkout ready buyers", formatCsvNumber(overview?.checkoutReadyBuyers)],
    ["Checkout readiness rate", overview ? formatRate(overview.checkoutReadinessRate) : ""],
    ["Buyers with shipping address", formatCsvNumber(overview?.buyersWithShippingAddress)],
    ["Buyers with cart items", formatCsvNumber(overview?.buyersWithCartItems)],
    ["Active carts", formatCsvNumber(cartOverview?.activeCarts)],
    ["Abandoned carts", formatCsvNumber(cartOverview?.abandonedCarts)],
    ["Total addresses", formatCsvNumber(addressOverview?.totalAddresses)],
  ];

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (inactiveDays) params.set("inactiveDays", inactiveDays);
    router.push(`/dashboard/buyer?${params.toString()}`);
  };

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Buyer App Analytics</h1>
          <p className={styles.description}>Buyer intent, cart health, shipping address coverage, and checkout readiness.</p>
        </div>
        <div className={styles.headerActions}>
          <ExportCsvButton
            filename="buyer-analytics-overview.csv"
            headers={["Metric", "Value"]}
            rows={overviewCsvRows}
            label="Export CSV"
            disabled={!hasLoadedData}
          />
          <button onClick={() => router.refresh()} className={styles.refreshBtn} title="Refresh data">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </header>

      <div className={styles.filterBar}>
        <div className={styles.dateGroup}>
          <label className={styles.filterLabel}>From</label>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={styles.dateInput} />
        </div>
        <div className={styles.dateGroup}>
          <label className={styles.filterLabel}>To</label>
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={styles.dateInput} />
        </div>
        <div className={styles.dateGroup}>
          <label className={styles.filterLabel}>Abandoned after days</label>
          <input
            type="number"
            min="1"
            max="90"
            value={inactiveDays}
            onChange={(event) => setInactiveDays(event.target.value)}
            className={styles.dateInput}
          />
        </div>
        <button onClick={applyFilters} className={styles.refreshBtn}>Apply</button>
      </div>

      {snapshot.errors.length > 0 && (
        <div className={styles.empty} style={{ marginBottom: "1rem", padding: "1rem" }}>
          <strong>{snapshot.errors.length === 1 ? "1 endpoint failed" : `${snapshot.errors.length} endpoints failed`}.</strong>{" "}
          {snapshot.errors[0]?.message}
        </div>
      )}

      {!hasLoadedData ? (
        <div className={styles.empty}>
          <AlertTriangle size={24} />
          <p>Could not load Buyer App analytics.</p>
          <small>Verify BUYER_API_URL, BUYER_SERVICE_KEY, and buyer service availability.</small>
        </div>
      ) : (
        <>
          {showNoDataState && (
            <div className={styles.empty} style={{ marginBottom: "1rem", padding: "1rem" }}>
              <p>No buyer analytics data yet.</p>
              <small>Buyer profiles, carts, and shipping address coverage will appear here after activity is available.</small>
            </div>
          )}

          <div className={styles.statGrid}>
            <MetricCard icon={<Users size={16} />} label="Total buyers" value={formatNumber(overview?.totalBuyers)} />
            <MetricCard icon={<CheckCircle size={16} />} label="Checkout readiness" value={overview ? formatRate(overview.checkoutReadinessRate) : "—"} warning />
            <MetricCard icon={<Home size={16} />} label="With address" value={formatNumber(overview?.buyersWithShippingAddress)} />
            <MetricCard icon={<ShoppingCart size={16} />} label="With cart items" value={formatNumber(overview?.buyersWithCartItems)} />
            <MetricCard icon={<ShoppingCart size={16} />} label="Active carts" value={formatNumber(cartOverview?.activeCarts)} />
            <MetricCard icon={<Clock size={16} />} label="Abandoned carts" value={formatNumber(cartOverview?.abandonedCarts)} warning />
            <MetricCard icon={<TrendingUp size={16} />} label="Avg items/cart" value={formatDecimal(cartOverview?.averageDistinctItemsPerCart)} />
            <MetricCard icon={<MapPinned size={16} />} label="Address completeness" value={addressCompleteness ? formatRate(addressCompleteness.completeRequiredFieldsRate) : "—"} />
          </div>

          <ErrorBoundary>
            <div className={styles.chartGrid}>
              {hasNewBuyerTrend && (
                <ChartCard title="New Buyers" description="New buyer profiles in the selected date range" tall>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={newBuyerTrend}>
                      <defs>
                        <linearGradient id="buyerNewGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1B3D2F" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#1B3D2F" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="buyers" stroke="#1B3D2F" strokeWidth={2} fill="url(#buyerNewGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {readinessData.length > 0 && (
                <ChartCard title="Checkout Readiness" description="Buyers with address and cart items" tall>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={readinessData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={88} label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {readinessData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Legend items={readinessData.map((item, index) => ({ label: item.name, color: COLORS[index % COLORS.length] }))} />
                </ChartCard>
              )}
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <div className={styles.chartGrid}>
              {addressCoverageData.length > 0 && (
                <ChartCard title="Buyer Readiness Signals" description="Address and cart coverage across buyers" tall>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={addressCoverageData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#2D5A46" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {cartStatusData.length > 0 && (
                <ChartCard title="Cart Health" description={`Abandoned carts use a ${snapshot.filters.inactiveDays}-day inactivity threshold`} tall>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={cartStatusData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                        {cartStatusData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <p className={styles.sectionLabel}><ShoppingCart size={13} /> Cart Intelligence</p>
            <div className={styles.miniStatGrid}>
              <MiniMetric label="All carts" value={formatNumber(averageCartItems?.totalCarts)} />
              <MiniMetric label="Active carts" value={formatNumber(averageCartItems?.activeCarts)} />
              <MiniMetric label="Avg distinct all" value={formatDecimal(averageCartItems?.averageDistinctItemsAcrossAllCarts)} />
              <MiniMetric label="Avg distinct active" value={formatDecimal(averageCartItems?.averageDistinctItemsAcrossActiveCarts)} />
              <MiniMetric label="Avg quantity active" value={formatDecimal(averageCartItems?.averageQuantityAcrossActiveCarts)} />
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <div className={styles.chartGrid}>
              {topProductData.length > 0 && (
                <ChartCard title="Top Products in Carts" description="Products most frequently added before checkout" tall>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProductData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis dataKey="productId" type="category" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} width={90} tickFormatter={compactId} />
                      <Tooltip formatter={(value: any, name: any) => [value, humanizeLabel(String(name))]} contentStyle={tooltipStyle} />
                      <Bar dataKey="totalQuantity" fill="#1B3D2F" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {(cartsByBuyer?.buyers ?? []).length > 0 && (
                <ChartCard title="Carts by Buyer" description="Buyers with cart items and address count" tall>
                  <div className={styles.rankList}>
                    {cartsByBuyer?.buyers.slice(0, 6).map((buyer, index) => (
                      <div key={buyer.rowId} className={styles.rankRow}>
                        <span className={styles.rankBadge}>{index + 1}</span>
                        <div className={styles.rankInfo}>
                          <span className={styles.rankName}>{buyer.displayName}</span>
                          <span className={styles.rankMeta}>{buyer.addressCount} addresses · {buyer.cart?.itemCount ?? 0} distinct items</span>
                        </div>
                        <span className={styles.rankValue}>{buyer.cart?.totalQuantity ?? 0} units</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              )}
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <div className={styles.chartGrid}>
              {topCityData.length > 0 && (
                <ChartCard title="Shipping Addresses by City" description="Top cities by saved shipping addresses" tall>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={topCityData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#6B7D5F" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {topProvinceData.length > 0 && (
                <ChartCard title="Shipping Addresses by Province" description="Top provinces by saved shipping addresses" tall>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={topProvinceData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" fill="#D4A853" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <div className={styles.chartGrid}>
              {addressCompletenessData.length > 0 && (
                <ChartCard title="Address Completeness" description="Required shipping fields completeness" tall>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={addressCompletenessData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={82} label={({ percent }: any) => `${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {addressCompletenessData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Legend items={addressCompletenessData.map((item, index) => ({ label: item.name, color: COLORS[index % COLORS.length] }))} />
                </ChartCard>
              )}

              {addressOverview && (
                <ChartCard title="Address Coverage" description="Saved addresses across buyers" tall>
                  <div className={styles.walletGrid}>
                    <MiniMetric label="Total addresses" value={formatNumber(addressOverview.totalAddresses)} />
                    <MiniMetric label="Avg per buyer" value={formatDecimal(addressOverview.averageAddressesPerBuyer)} />
                    <MiniMetric label="Top city" value={addressOverview.topCity?.value ?? "—"} />
                    <MiniMetric label="Top province" value={addressOverview.topProvince?.value ?? "—"} />
                  </div>
                </ChartCard>
              )}
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <div className={styles.chartGrid}>
              {(activeCarts?.carts ?? []).length > 0 && (
                <CartList title="Active Carts" description="Recent buyers with cart items" carts={activeCarts?.carts ?? []} />
              )}
              {(abandonedCarts?.carts ?? []).length > 0 && (
                <CartList title="Abandoned Carts" description={`Inactive for at least ${abandonedCarts?.abandonedAfterDays ?? snapshot.filters.inactiveDays} days`} carts={abandonedCarts?.carts ?? []} />
              )}
            </div>
          </ErrorBoundary>

          <ErrorBoundary>
            <div className={styles.chartGrid}>
              {(buyersWithAddress?.buyers ?? []).length > 0 && (
                <BuyerList title="Buyers with Address" description="Sample of buyers ready for shipping details" buyers={buyersWithAddress?.buyers ?? []} />
              )}
              {(buyersWithoutAddress?.buyers ?? []).length > 0 && (
                <BuyerList title="Buyers Missing Address" description="Checkout blockers to follow up" buyers={buyersWithoutAddress?.buyers ?? []} />
              )}
            </div>
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, warning }: { icon: React.ReactNode; label: string; value: string; warning?: boolean }) {
  return (
    <div className={`${styles.statCard} ${warning ? styles.statCardWarning : ""}`}>
      <span className={warning ? styles.statIconWarning : styles.statIcon}>{icon}</span>
      <span className={warning ? styles.statValueWarning : styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.walletCard}>
      <span className={styles.walletValue}>{value}</span>
      <span className={styles.walletLabel}>{label}</span>
    </div>
  );
}

function CartList({ title, description, carts }: { title: string; description: string; carts: CartSummary[] }) {
  return (
    <ChartCard title={title} description={description} tall>
      <div className={styles.rankList}>
        {carts.slice(0, 6).map((cart, index) => (
          <div key={cart.id} className={styles.rankRow}>
            <span className={styles.rankBadge}>{index + 1}</span>
            <div className={styles.rankInfo}>
              <span className={styles.rankName}>{cart.buyer?.displayName ?? compactId(cart.id)}</span>
              <span className={styles.rankMeta}>{cart.itemCount} distinct items · last activity {formatDate(cart.lastItemActivityAt ?? cart.updatedAt)}</span>
            </div>
            <span className={styles.rankValue}>{cart.totalQuantity} units</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function BuyerList({ title, description, buyers }: { title: string; description: string; buyers: BuyerSummary[] }) {
  return (
    <ChartCard title={title} description={description} tall>
      <div className={styles.rankList}>
        {buyers.slice(0, 6).map((buyer, index) => (
          <div key={buyer.rowId} className={styles.rankRow}>
            <span className={styles.rankBadge}>{index + 1}</span>
            <div className={styles.rankInfo}>
              <span className={styles.rankName}>{buyer.displayName}</span>
              <span className={styles.rankMeta}>Created {formatDate(buyer.createdAt)}</span>
            </div>
            <span className={styles.rankValue}>{formatAddressCount(buyer.addressCount)}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className={styles.pieLegend}>
      {items.map((item) => (
        <div key={item.label} className={styles.pieLegendItem}>
          <span className={styles.pieLegendDot} style={{ background: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

const tooltipStyle = {
  fontSize: 12,
  border: "1px solid #E5E7EB",
  borderRadius: 4,
};

function formatNumber(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCsvNumber(value?: number | null) {
  return value == null ? "" : String(value);
}

function formatDecimal(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function formatRate(value?: number | null) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function formatDate(value?: string | null) {
  if (!value) return "unknown";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" }).format(date);
}

function formatAddressCount(value: number) {
  return value === 1 ? "1 address" : `${value} addresses`;
}

function compactId(value: string) {
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function humanizeLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
}
