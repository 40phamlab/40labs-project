export type StockAnalyticsRange = '7d' | '30d' | '90d';

export interface StockAnalytics {
  range: StockAnalyticsRange;
  generated_at: string;
  kpis: {
    total_skus: number;
    stock_value_buy: number; // integer TZS
    stock_value_sell: number; // integer TZS
    low_stock_count: number;
    out_of_stock_count: number;
    expiring_30d_count: number;
    expiring_30d_value: number; // integer TZS
  };
  by_category: {
    category: string;
    units: number;
    value: number; // integer TZS
    sku_count: number;
  }[];
  status_breakdown: {
    in_stock: number;
    low: number;
    out: number;
    expired: number;
  };
  movement: {
    date: string;
    units_in: number;
    units_out: number;
  }[];
  top_moving: {
    item_id: string;
    name: string;
    units_out: number;
    avg_daily_out: number;
  }[];
  best_performers: {
    item_id: string;
    name: string;
    revenue: number; // integer TZS
    gross_profit: number; // integer TZS
    margin_pct: number;
  }[];
  slow_movers: {
    item_id: string;
    name: string;
    on_hand: number;
    units_out: number;
    days_since_last_sale: number;
  }[];
  expiry_buckets: {
    bucket: '0-30' | '31-60' | '61-90';
    units: number;
    value: number; // integer TZS
  }[];
  cover: {
    item_id: string;
    name: string;
    on_hand: number;
    avg_daily_out: number;
    days_of_cover: number | null;
  }[];
}
