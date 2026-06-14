"use client";

import { Download } from "lucide-react";
import { exportCsv } from "@/lib/exportCsv";
import styles from "./ExportCsvButton.module.css";

interface ExportCsvButtonProps {
  filename: string;
  headers: string[];
  rows: string[][];
  label?: string;
}

export function ExportCsvButton({ filename, headers, rows, label }: ExportCsvButtonProps) {
  return (
    <button
      onClick={() => exportCsv(filename, headers, rows)}
      className={styles.button}
      title={`Export ${filename}`}
    >
      <Download size={12} />
      {label || "CSV"}
    </button>
  );
}
