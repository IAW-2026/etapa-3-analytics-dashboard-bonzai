"use client";

import { Download } from "lucide-react";
import { exportCsv } from "@/lib/exportCsv";
import styles from "./ExportCsvButton.module.css";

interface ExportCsvButtonProps {
  filename: string;
  headers: string[];
  rows: string[][];
  label?: string;
  disabled?: boolean;
}

export function ExportCsvButton({ filename, headers, rows, label, disabled }: ExportCsvButtonProps) {
  return (
    <button
      onClick={() => exportCsv(filename, headers, rows)}
      className={styles.button}
      title={`Export ${filename}`}
      disabled={disabled}
    >
      <Download size={12} />
      {label || "CSV"}
    </button>
  );
}
