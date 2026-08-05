export const TRADE_DIRECTIONS = ["long", "short"] as const;

export type TradeDirection = (typeof TRADE_DIRECTIONS)[number];

export interface Trade {
  id: string;
  symbol: string;
  result: number;
  note: unknown;
  setup: string | null;
  session: string | null;
  direction: string | null;
  tradeDate: Date | string;
}

/** Entries created before the direction field existed have no direction, so this returns null. */
export function parseTradeDirection(value: unknown): TradeDirection | null {
  if (typeof value !== "string") return null;

  const normalizedValue = value.trim().toLowerCase();

  return TRADE_DIRECTIONS.includes(normalizedValue as TradeDirection) ? (normalizedValue as TradeDirection) : null;
}

export function getTradeResult(trade: Pick<Trade, "result">) {
  return Number(trade.result || 0);
}

export function getTradeDateKey(trade: Pick<Trade, "tradeDate">) {
  return new Date(trade.tradeDate).toISOString().split("T")[0];
}
