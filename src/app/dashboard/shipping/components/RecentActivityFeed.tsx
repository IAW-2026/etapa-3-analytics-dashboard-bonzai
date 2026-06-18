"use client";

import { Activity } from "lucide-react";
import { ChartCard } from "@/components/charts/ChartCard/ChartCard";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import type { TrackingEvent } from "@/types/shipping";
import styles from "./RecentActivityFeed.module.css";

interface Props {
  events: TrackingEvent[] | null;
  loading: boolean;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export default function RecentActivityFeed({ events, loading }: Props) {
  return (
    <ChartCard title="Recent Activity" description="Latest tracking events across all shipments">
      {loading ? (
        <div className={styles.feed}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.feedItem}>
              <Skeleton width={8} height={8} />
              <Skeleton width="60%" height={16} />
            </div>
          ))}
        </div>
      ) : !events || events.length === 0 ? (
        <div className={styles.feed}>
          <div className={styles.feedItem}>
            <Activity size={14} className={styles.feedIcon} />
            <span className={styles.feedEmpty}>No recent activity</span>
          </div>
        </div>
      ) : (
        <div className={styles.feed}>
          {(Array.isArray(events) ? events : []).slice(0, 10).map((event, i) => (
            <div key={event.id} className={styles.feedItem}>
              <div className={styles.feedDot} />
              {i < events.length - 1 && <div className={styles.feedLine} />}
              <div className={styles.feedContent}>
                <span className={styles.feedTracker}>{event.tracking_id}</span>
                <span className={styles.feedStatus}>{event.status}</span>
                <span className={styles.feedTime}>{formatTime(event.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
