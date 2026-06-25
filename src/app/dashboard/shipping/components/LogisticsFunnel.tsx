"use client";

import { ChartCard } from "@/components/charts/ChartCard/ChartCard";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import type { DeliveryStats, FunnelLevel } from "@/types/shipping";
import styles from "./LogisticsFunnel.module.css";

interface Props {
  stats: DeliveryStats | null;
  loading: boolean;
}

function computeFunnel(stats: DeliveryStats): FunnelLevel[] {
  const byStatus = stats.by_status;
  const total =
    (byStatus.PENDING || 0) +
    (byStatus.ASSIGNED || 0) +
    (byStatus.IN_TRANSIT || 0) +
    (byStatus.DELIVERED || 0) +
    (byStatus.CANCELLED || 0);

  const inProcess =
    (byStatus.PENDING || 0) +
    (byStatus.ASSIGNED || 0) +
    (byStatus.IN_TRANSIT || 0);

  const success = byStatus.DELIVERED || 0;

  if (total === 0) return [];

  return [
    { label: "Total Inflow", value: total, percentage: 100, color: "var(--color-secondary)" },
    { label: "In Process", value: inProcess, percentage: Math.round((inProcess / total) * 100), color: "var(--color-primary)" },
    { label: "Success (Delivered)", value: success, percentage: Math.round((success / total) * 100), color: "#03271a" },
  ];
}

export default function LogisticsFunnel({ stats, loading }: Props) {
  return (
    <ChartCard title="Logistics Funnel" description="Efficiency flow through stages" tall>
      {loading ? (
        <div className={styles.funnel}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={36} />
          ))}
        </div>
      ) : !stats ? (
        <div className={styles.funnel}>
          <span className={styles.empty}>Logistics data unavailable</span>
        </div>
      ) : (
        <div className={styles.funnel}>
          {computeFunnel(stats).map((level) => (
            <div key={level.label} className={styles.level}>
              <div className={styles.levelHeader}>
                <span className={styles.levelLabel}>{level.label}</span>
                <span className={styles.levelValue}>{level.value.toLocaleString()}</span>
                <span className={styles.levelPct}>{level.percentage}%</span>
              </div>
              <div className={styles.levelBar}>
                <div
                  className={styles.levelFill}
                  style={{ width: `${level.percentage}%`, backgroundColor: level.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
