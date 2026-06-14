"use client";

import { useEffect, useState } from "react";
import { BarChart3, Store, CreditCard, Users, Truck, TrendingUp } from "lucide-react";
import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Analytics Dashboard</h1>
          <p className={styles.description}>Consolidated metrics across all Bonzai applications.</p>
        </div>
      </header>

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
