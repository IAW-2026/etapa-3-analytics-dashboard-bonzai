"use client";

import { useEffect, useState } from "react";
import { BarChart3, ShoppingCart, DollarSign, Package, Users as UsersIcon, TrendingUp } from "lucide-react";
import styles from "./page.module.css";

export default function SellerAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/statistics").then(r => r.json()),
      fetch("/api/admin/analytics").then(r => r.json()),
    ])
      .then(([stats, analytics]) => setData({ stats, analytics }))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Seller App Analytics</h1>
          <p className={styles.description}>Metrics and reports from the Seller App.</p>
        </div>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : !data ? (
        <div className={styles.empty}>No data available. Connect to the Seller App API to see metrics.</div>
      ) : (
        <>
          <div className={styles.statGrid}>
            {data.stats?.totalOrders != null && (
              <div className={styles.statCard}>
                <ShoppingCart size={16} className={styles.statIcon} />
                <span className={styles.statValue}>{data.stats.totalOrders}</span>
                <span className={styles.statLabel}>Total Orders</span>
              </div>
            )}
            {data.stats?.totalRevenue != null && (
              <div className={styles.statCard}>
                <DollarSign size={16} className={styles.statIcon} />
                <span className={styles.statValue}>${Number(data.stats.totalRevenue).toLocaleString()}</span>
                <span className={styles.statLabel}>Revenue</span>
              </div>
            )}
            {data.stats?.totalProducts != null && (
              <div className={styles.statCard}>
                <Package size={16} className={styles.statIcon} />
                <span className={styles.statValue}>{data.stats.totalProducts}</span>
                <span className={styles.statLabel}>Products</span>
              </div>
            )}
            {data.stats?.totalSellers != null && (
              <div className={styles.statCard}>
                <UsersIcon size={16} className={styles.statIcon} />
                <span className={styles.statValue}>{data.stats.totalSellers}</span>
                <span className={styles.statLabel}>Sellers</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
