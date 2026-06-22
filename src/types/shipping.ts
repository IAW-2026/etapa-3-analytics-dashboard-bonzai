export type ShipmentStatus = 'PENDING' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type DriverStatus = 'AVAILABLE' | 'ASSIGNED' | 'SUSPENDED' | 'INACTIVE';

export interface DeliveryStats {
  total_shipments: number;
  active_shipments: number;
  success_rate_percentage: number;
  by_status: Record<ShipmentStatus, number>;
}

export interface Shipment {
  id: string;
  tracking_id: string;
  order_id: string;
  seller_id: string;
  buyer_id: string;
  status: ShipmentStatus;
  type: string;
  operator_id: string | null;
  driver_id: string | null;
  created_at: string;
  delivery_address: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total_records: number;
    current_page: number;
    total_pages: number;
  };
}

export interface Driver {
  id: string;
  clerk_user_id: string;
  name: string;
  email: string;
  status: DriverStatus;
}

export interface TrackingEvent {
  id: string;
  shipment_id: string;
  tracking_id: string;
  status: string;
  timestamp: string;
  location?: string;
}

export interface ShipmentByType {
  type: string;
  count: number;
}

export interface FunnelLevel {
  label: string;
  value: number;
  percentage: number;
  color: string;
}
