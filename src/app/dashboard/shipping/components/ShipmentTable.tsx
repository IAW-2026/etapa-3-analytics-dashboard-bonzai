"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton/ExportCsvButton";
import type { PaginatedResponse, Shipment, ShipmentStatus } from "@/types/shipping";
import styles from "./ShipmentTable.module.css";

interface Props {
  shipments: PaginatedResponse<Shipment> | null;
  loading: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const STATUS_STYLE: Record<ShipmentStatus, string> = {
  PENDING: styles.statusPending,
  ASSIGNED: styles.statusAssigned,
  IN_TRANSIT: styles.statusInTransit,
  DELIVERED: styles.statusDelivered,
  CANCELLED: styles.statusCancelled,
};

const csvHeaders = ["Tracking ID", "Order ID", "Status", "Type", "Driver", "Created", "Address"];

function csvRows(shipments: Shipment[]): string[][] {
  return shipments.map((s) => [
    s.tracking_id,
    s.order_id,
    s.status,
    s.type,
    s.driver_id || "N/A",
    new Date(s.created_at).toLocaleDateString(),
    s.delivery_address,
  ]);
}

export default function ShipmentTable({ shipments, loading, currentPage, onPageChange }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.tableHeader}>
        <span className={styles.tableTitle}>
          {shipments ? `${shipments.meta.total_records} shipments` : "Recent Shipments"}
          {shipments && shipments.data.length > 0 && (
            <span className={styles.tableSubtitle}>
              {" "}showing {((shipments.meta.current_page - 1) * 10) + 1}-
              {Math.min(shipments.meta.current_page * 10, shipments.meta.total_records)}
            </span>
          )}
        </span>
        {shipments && shipments.data.length > 0 && (
          <ExportCsvButton
            filename="shipping-shipments.csv"
            headers={csvHeaders}
            rows={csvRows(shipments.data)}
          />
        )}
      </div>

      {loading ? (
        <div className={styles.table}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.tableRow}>
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className={styles.tableCell}>
                  <Skeleton height={16} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : !shipments || shipments.data.length === 0 ? (
        <div className={styles.empty}>No shipments found</div>
      ) : (
        <>
          <div className={styles.table}>
            <div className={styles.tableRow}>
              <div className={styles.tableHeaderCell}>Tracking ID</div>
              <div className={styles.tableHeaderCell}>Order ID</div>
              <div className={styles.tableHeaderCell}>Status</div>
              <div className={styles.tableHeaderCell}>Type</div>
              <div className={styles.tableHeaderCell}>Driver</div>
              <div className={styles.tableHeaderCell}>Created</div>
              <div className={styles.tableHeaderCell}>Address</div>
            </div>
            {shipments.data.map((s) => (
              <div key={s.id} className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <span className={styles.trackingId}>{s.tracking_id}</span>
                </div>
                <div className={styles.tableCell}>{s.order_id}</div>
                <div className={styles.tableCell}>
                  <span className={`${styles.statusBadge} ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                </div>
                <div className={styles.tableCell}>{s.type}</div>
                <div className={styles.tableCell}>{s.driver_id || "N/A"}</div>
                <div className={styles.tableCell}>{new Date(s.created_at).toLocaleDateString()}</div>
                <div className={styles.tableCell}>{s.delivery_address}</div>
              </div>
            ))}
          </div>

          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className={styles.pageInfo}>
              Page {shipments.meta.current_page} of {shipments.meta.total_pages}
            </span>
            <button
              className={styles.pageBtn}
              disabled={currentPage >= shipments.meta.total_pages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
