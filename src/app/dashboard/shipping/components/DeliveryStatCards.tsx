"use client";

import { Package, Truck, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import type { DeliveryStats } from "@/types/shipping";
import styles from "./DeliveryStatCards.module.css";

interface Props {
  stats: DeliveryStats | null;
  loading: boolean;
}

export default function DeliveryStatCards({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className={styles.statGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={100} />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { icon: Package, value: stats.total_shipments.toLocaleString(), label: "Total Shipments", variant: "default" as const },
    { icon: Truck, value: stats.active_shipments.toLocaleString(), label: "Active Shipments", variant: "default" as const },
    { icon: CheckCircle, value: `${stats.success_rate_percentage}%`, label: "Success Rate", variant: stats.success_rate_percentage >= 90 ? "success" as const : "warning" as const },
    { icon: XCircle, value: stats.by_status.CANCELLED.toLocaleString(), label: "Cancelled", variant: stats.by_status.CANCELLED > 0 ? "danger" as const : "default" as const },
  ];

  return (
    <div className={styles.statGrid}>
      {cards.map(({ icon: Icon, value, label, variant }) => {
        const cardClass = variant === "danger" ? styles.statCardDanger : variant === "warning" ? styles.statCardWarning : styles.statCard;
        const iconClass = variant === "danger" ? styles.statIconDanger : variant === "warning" ? styles.statIconWarning : styles.statIcon;
        const valueClass = variant === "danger" ? styles.statValueDanger : variant === "warning" ? styles.statValueWarning : styles.statValue;

        return (
          <div key={label} className={cardClass}>
            <Icon size={16} className={iconClass} />
            <span className={valueClass}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
