"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, CreditCard, Users, Truck, TrendingUp, ShoppingCart, DollarSign, Package, Star, AlertTriangle, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import styles from "./page.module.css";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatARS(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [paymentsStats, setPaymentsStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getStatistics().catch(() => null),
      fetch("/api/payments/overview")
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ])
      .then(([s, p]) => {
        setStats(s);
        setPaymentsStats(p);
      })
      .finally(() => setLoading(false));
  }, []);

  const s = stats?.summary || {};

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics Dashboard</h1>
          <p className={styles.description}>Consolidated metrics across all Bonzai applications.</p>
        </div>
      </header>

      {/* ── Seller App section ── */}
      <h2 className={styles.sectionLabel}>
        <Store size={14} /> Seller App
      </h2>
      {loading ? (
        <div className={styles.statGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.statCard}>
              <Skeleton width={14} height={14} className={styles.statIcon} />
              <Skeleton width={80} height={20} />
              <Skeleton width={60} height={10} className={styles.statLabel} />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <Users size={14} className={styles.statIcon} />
            <span className={styles.statValue}>{s.totalSellers ?? "—"}</span>
            <span className={styles.statLabel}>Sellers</span>
          </div>
          <div className={styles.statCard}>
            <Package size={14} className={styles.statIcon} />
            <span className={styles.statValue}>{s.totalProducts ?? "—"}</span>
            <span className={styles.statLabel}>Products</span>
          </div>
          <div className={styles.statCard}>
            <ShoppingCart size={14} className={styles.statIcon} />
            <span className={styles.statValue}>{s.totalOrders ?? "—"}</span>
            <span className={styles.statLabel}>Orders</span>
          </div>
          <div className={styles.statCard}>
            <DollarSign size={14} className={styles.statIcon} />
            <span className={styles.statValue}>{s.totalRevenue != null ? formatCurrency(s.totalRevenue) : "—"}</span>
            <span className={styles.statLabel}>Revenue</span>
          </div>
          <div className={styles.statCard}>
            <Star size={14} className={styles.statIcon} />
            <span className={styles.statValue}>{s.averageRating ?? "—"}</span>
            <span className={styles.statLabel}>Avg Rating</span>
          </div>
          <div className={styles.statCard}>
            <TrendingUp size={14} className={styles.statIcon} />
            <span className={styles.statValue}>{s.reservationConversionRate != null ? `${s.reservationConversionRate}%` : "—"}</span>
            <span className={styles.statLabel}>Conversion</span>
          </div>
        </div>
      ) : (
        <div className={styles.empty}>Could not connect to Seller App. Verify the API endpoint.</div>
      )}

      {/* ── Payments App section ── */}
      <h2 className={styles.sectionLabel} style={{ marginTop: "2rem" }}>
        <CreditCard size={14} /> Payments App
      </h2>
      {loading ? (
        <div className={styles.statGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.statCard}>
              <Skeleton width={14} height={14} className={styles.statIcon} />
              <Skeleton width={80} height={20} />
              <Skeleton width={60} height={10} className={styles.statLabel} />
            </div>
          ))}
        </div>
      ) : paymentsStats ? (
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <CreditCard size={14} className={styles.statIcon} />
            <span className={styles.statValue}>{paymentsStats.totalTransactions ?? "—"}</span>
            <span className={styles.statLabel}>Transactions</span>
          </div>
          <div className={styles.statCard}>
            <DollarSign size={14} className={styles.statIcon} />
            <span className={styles.statValue}>{paymentsStats.totalVolume != null ? formatARS(paymentsStats.totalVolume) : "—"}</span>
            <span className={styles.statLabel}>Volume</span>
          </div>
          <div className={styles.statCard}>
            <TrendingUp size={14} className={styles.statIcon} />
            <span className={styles.statValue}>{paymentsStats.totalCommissions != null ? formatARS(paymentsStats.totalCommissions) : "—"}</span>
            <span className={styles.statLabel}>Commissions</span>
          </div>
          <div className={styles.statCard}>
            <AlertTriangle size={14} className={styles.statIcon} style={{ color: "#DC2626" }} />
            <span className={styles.statValue}>{paymentsStats.activeDisputes ?? "—"}</span>
            <span className={styles.statLabel}>Active Disputes</span>
          </div>
          <div className={styles.statCard}>
            <Wallet size={14} className={styles.statIcon} />
            <span className={styles.statValue}>{paymentsStats.activeWallets ?? "—"}</span>
            <span className={styles.statLabel}>Active Wallets</span>
          </div>
          <div className={styles.statCard}>
            <DollarSign size={14} className={styles.statIcon} />
            <span className={styles.statValue}>{paymentsStats.avgTransactionAmount != null ? formatARS(paymentsStats.avgTransactionAmount) : "—"}</span>
            <span className={styles.statLabel}>Avg Transaction</span>
          </div>
        </div>
      ) : (
        <div className={styles.placeholderCard}>
          <p className={styles.placeholderText}>Could not load Payments App data. Verify the API is running.</p>
        </div>
      )}

      {/* ── Buyer App section ── */}
      <h2 className={styles.sectionLabel} style={{ marginTop: "1.5rem" }}>
        <Users size={14} /> Buyer App
      </h2>
      <div className={styles.placeholderCard}>
        <p className={styles.placeholderText}>Coming soon — integrate the Buyer App API to see user behavior metrics.</p>
      </div>

      {/* ── Shipping App section ── */}
      <h2 className={styles.sectionLabel} style={{ marginTop: "1.5rem" }}>
        <Truck size={14} /> Shipping App
      </h2>
      <div className={styles.placeholderCard}>
        <p className={styles.placeholderText}>Coming soon — integrate the Shipping App API to see logistics metrics.</p>
      </div>

      {/* ── App navigation cards ── */}
      <h2 className={styles.sectionLabel} style={{ marginTop: "2rem" }}>
        Explore
      </h2>
      <div className={styles.grid}>
        <AppCard
          icon={<Store size={20} />}
          label="Seller App"
          description="Orders, products, users, reviews & more"
          href="/dashboard/seller"
          color="#1B3D2F"
        />
        <AppCard
          icon={<CreditCard size={20} />}
          label="Payments App"
          description="Transaction metrics & payment analytics"
          href="/dashboard/payments"
          color="#6B7D5F"
        />
        <AppCard
          icon={<Users size={20} />}
          label="Buyer App"
          description="User behavior & purchase patterns"
          href="/dashboard/buyer"
          color="#8A9B7E"
        />
        <AppCard
          icon={<Truck size={20} />}
          label="Shipping App"
          description="Delivery times & logistics"
          href="/dashboard/shipping"
          color="#D4A853"
        />
      </div>
    </div>
  );
}

function AppCard({ icon, label, description, href, color }: {
  icon: React.ReactNode; label: string; description: string; href: string; color: string;
}) {
  return (
    <Link href={href} className={styles.card}>
      <div className={styles.cardIcon} style={{ color }}>
        {icon}
      </div>
      <div>
        <h3 className={styles.cardLabel}>{label}</h3>
        <p className={styles.cardDesc}>{description}</p>
      </div>
      <TrendingUp size={16} className={styles.cardArrow} />
    </Link>
  );
}
