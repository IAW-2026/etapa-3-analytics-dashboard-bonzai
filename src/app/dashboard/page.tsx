"use client";

import { useEffect, useState } from "react";
import { Store, CreditCard, Users, Truck, TrendingUp, ShoppingCart, DollarSign, Package, Star } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import styles from "./page.module.css";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStatistics()
      .then(setStats)
      .catch(() => setStats(null))
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

      {loading ? (
        <div className={styles.sectionLabel} style={{ marginBottom: "0.75rem" }}>
          <Skeleton width={140} height={18} />
        </div>
      ) : stats ? (
        <>
          <h2 className={styles.sectionLabel}>
            <Store size={14} /> Seller App
          </h2>
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
        </>
      ) : (
        <div className={styles.empty}>Could not connect to Seller App. Verify the API endpoint.</div>
      )}

      {/* ── Placeholder sections for other apps ── */}
      {!loading && (
        <>
          <h2 className={styles.sectionLabel} style={{ marginTop: "2rem" }}>
            <CreditCard size={14} /> Payments App
          </h2>
          <div className={styles.placeholderCard}>
            <p className={styles.placeholderText}>Coming soon — integrate the Payments App API to see transaction metrics.</p>
          </div>

          <h2 className={styles.sectionLabel} style={{ marginTop: "1.5rem" }}>
            <Users size={14} /> Buyer App
          </h2>
          <div className={styles.placeholderCard}>
            <p className={styles.placeholderText}>Coming soon — integrate the Buyer App API to see user behavior metrics.</p>
          </div>

          <h2 className={styles.sectionLabel} style={{ marginTop: "1.5rem" }}>
            <Truck size={14} /> Shipping App
          </h2>
          <div className={styles.placeholderCard}>
            <p className={styles.placeholderText}>Coming soon — integrate the Shipping App API to see logistics metrics.</p>
          </div>
        </>
      )}

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
    <a href={href} className={styles.card}>
      <div className={styles.cardIcon} style={{ color }}>
        {icon}
      </div>
      <div>
        <h3 className={styles.cardLabel}>{label}</h3>
        <p className={styles.cardDesc}>{description}</p>
      </div>
      <TrendingUp size={16} className={styles.cardArrow} />
    </a>
  );
}
