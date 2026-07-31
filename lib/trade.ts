export interface Trade {
  id: string;
  symbol: string;
  result: number;
  note: unknown;
  setup: string | null;
  session: string | null;
  tradeDate: Date | string;
}

export function getTradeResult(trade: Pick<Trade, "result">) {
  return Number(trade.result || 0);
}

export function getTradeDateKey(trade: Pick<Trade, "tradeDate">) {
  return new Date(trade.tradeDate).toISOString().split("T")[0];
}
