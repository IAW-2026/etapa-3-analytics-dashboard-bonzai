import type { DeliveryStats } from "./shipping";


export interface BuyerOverview {
  total_buyers?: number;
  active_buyers?: number;
  new_buyers_this_month?: number;
  checkout_preparation_rate?: number;
  average_basket_size?: number;
  buyer_retention_rate?: number;
}

export interface CartOverview {
  total_carts?: number;
  active_carts?: number;
  abandoned_carts?: number;
  abandonment_rate?: number;
  completed_checkouts?: number;
  cart_to_checkout_conversion?: number;
  average_time_to_checkout_hours?: number;
}


export interface SellerAnalytics {
  total_sellers?: number;
  total_products?: number;
  total_orders?: number;
  total_revenue?: number;
  average_order_value?: number;
  top_categories?: { name: string; revenue: number; orders: number }[];
  revenue_trend?: { date: string; value: number }[];
  orders_trend?: { date: string; value: number }[];
}


export interface PaymentDisputes {
  total_disputes?: number;
  active_disputes?: number;
  resolved_disputes?: number;
  dispute_rate_percentage?: number;
  average_resolution_hours?: number;
  disputes_by_reason?: { reason: string; count: number }[];
  total_disputed_amount?: number;
}


export interface ServiceResult<T> {
  status: "ok" | "unavailable";
  data: T | null;
  error?: string;
}

export interface ConsolidatedMetrics {
  generated_at: string;
  services: {
    buyer: {
      status: "ok" | "unavailable";
      buyers_overview: BuyerOverview | null;
      carts_overview: CartOverview | null;
    };
    seller: {
      status: "ok" | "unavailable";
      analytics: SellerAnalytics | null;
    };
    shipping: {
      status: "ok" | "unavailable";
      delivery_stats: DeliveryStats | null;
    };
    payments: {
      status: "ok" | "unavailable";
      disputes: PaymentDisputes | null;
    };
  };
}


export interface AIInsight {
  title: string;
  description: string;
  severity: "positive" | "warning" | "critical";
  services_involved: string[];
}

export interface AIAdvisorResponse {
  insights: AIInsight[];
  partial: boolean;
  error?: string;
}
