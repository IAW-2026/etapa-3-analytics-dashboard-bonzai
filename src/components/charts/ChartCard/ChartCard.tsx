import type { ReactNode } from "react";
import styles from "./ChartCard.module.css";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  tall?: boolean;
}

export function ChartCard({ title, description, children, tall }: ChartCardProps) {
  const bodyClasses = [styles.body, tall && styles.bodyTall].filter(Boolean).join(" ");
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.description}>{description}</p>}
        </div>
      </div>
      <div className={bodyClasses}>{children}</div>
    </div>
  );
}
