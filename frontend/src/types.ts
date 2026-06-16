export type DashboardResponse = {
  status: string;
  cycle_count: number;
  success_rate: number;
  avg_execution_ms: number;
  last_successful_cycle_at?: string | null;
  last_error?: string | null;
  config: Record<string, unknown>;
  totals: {
    realized_pnl: number;
    unrealized_pnl: number;
    net_pnl: number;
  };
  pools: Array<{
    pool: string;
    inventory: number;
    avg_entry_price: number;
    realized_pnl: number;
    unrealized_pnl: number;
    net_pnl: number;
    latest_snapshot?: {
      mid_price: number;
      spread: number;
      bids: Array<{ price: number; size: number }>;
      asks: Array<{ price: number; size: number }>;
    } | null;
    latest_signals?: {
      obi: number;
      realized_volatility: number;
      momentum: number;
      spread_zscore: number;
    } | null;
    latest_quote?: {
      bid_price: number;
      ask_price: number;
      bid_size: number;
      ask_size: number;
      reservation_price: number;
      optimal_spread: number;
      spread_multiplier: number;
      notes: string[];
    } | null;
    fills: Array<{
      side: string;
      price: number;
      size: number;
      realized_pnl_delta: number;
      timestamp: string;
    }>;
    pnl_history: Array<{ timestamp: string; value: number }>;
    inventory_history: Array<{ timestamp: string; value: number }>;
  }>;
  execution_logs: Array<Record<string, unknown>>;
  risk_logs: Array<Record<string, unknown>>;
  mode?: string;
};
