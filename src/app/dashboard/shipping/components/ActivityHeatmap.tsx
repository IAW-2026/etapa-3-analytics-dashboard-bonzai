"use client";

import { useState } from "react";
import { ChartCard } from "@/components/charts/ChartCard/ChartCard";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import type { TrackingEvent } from "@/types/shipping";
import styles from "./ActivityHeatmap.module.css";

interface Props {
  events: TrackingEvent[] | null;
  loading: boolean;
}

function shortId(trackingId: string): string {
  const parts = trackingId.split("-");
  return parts[parts.length - 1] || trackingId;
}

function relativeTime(iso: string): string {
  const age = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(age / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function getAlpha(iso: string): number {
  const age = Date.now() - new Date(iso).getTime();
  const hours = age / 3600000;
  if (hours < 1) return 1;
  if (hours < 6) return 0.85;
  if (hours < 24) return 0.55;
  if (hours < 72) return 0.35;
  return 0.2;
}

export default function ActivityHeatmap({ events, loading }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <ChartCard title="Activity Density" description="Recent tracking events timeline">
      {loading ? (
        <div className={styles.strip}>
          <Skeleton height={56} />
        </div>
      ) : !events || events.length === 0 ? (
        <div className={styles.strip}>
          <span className={styles.empty}>No recent activity</span>
        </div>
      ) : (
        <div className={styles.strip}>
          {events.slice(0, 10).map((event) => {
            const isActive = activeId === event.id;
            return (
              <div
                key={event.id}
                className={`${styles.block} ${isActive ? styles.blockActive : ""}`}
                style={{ backgroundColor: `rgba(3, 39, 26, ${getAlpha(event.timestamp)})` }}
                onMouseEnter={() => setActiveId(event.id)}
                onMouseLeave={() => setActiveId(null)}
              >
                <span className={styles.blockId}>{shortId(event.tracking_id)}</span>
                <span className={styles.blockTime}>{relativeTime(event.timestamp)}</span>
                {isActive && (
                  <div className={styles.tooltip}>
                    <span className={styles.tooltipTracker}>{event.tracking_id}</span>
                    <span className={styles.tooltipStatus}>{event.status}</span>
                    <span className={styles.tooltipTime}>{new Date(event.timestamp).toLocaleString()}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}
