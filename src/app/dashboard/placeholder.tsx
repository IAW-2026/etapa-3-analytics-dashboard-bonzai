import { BarChart3 } from "lucide-react";
import styles from "./placeholder.module.css";

export function PlaceholderPage({ app, description }: { app: string; description: string }) {
  return (
    <div className={styles.wrapper}>
      <BarChart3 size={32} className={styles.icon} />
      <h1 className={styles.title}>{app}</h1>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
