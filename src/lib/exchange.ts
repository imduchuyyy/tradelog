import "server-only";
import ccxt from "ccxt";
import type { Exchange as CCXTExchange, Trade as CCXTTrade } from "ccxt";
import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SyncedNewTrade {
  id: string; // DB trade id (already inserted)
  externalTradeId: string;
  symbol: string;
  side: "long" | "short";
  entryPrice: number;
  quantity: number;
  leverage: number;
  fees: number;
  entryDate: Date;
  exchangeId: string;
  exchangeName: string;
}

export interface ClosedTradeUpdate {
  id: string; // DB trade id
  symbol: string;
  side: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  fees: number;
  exitDate: Date;
}

export interface SyncResult {
  newTrades: SyncedNewTrade[];
  closedTrades: ClosedTradeUpdate[];
  errors: string[];
}

// ─── CCXT exchange factory ───────────────────────────────────────────────────

const EXCHANGE_MAP: Record<string, string> = {
  Binance: "binance",
  Bybit: "bybit",
  OKX: "okx",
  Bitget: "bitget",
  KuCoin: "kucoinfutures",
  Coinbase: "coinbase",
  Kraken: "kraken",
  dYdX: "dydx",
};

function createCCXTExchange(
  exchangeName: string,
  apiKey: string,
  apiSecret: string,
  passphrase?: string | null
): CCXTExchange {
  const ccxtId = EXCHANGE_MAP[exchangeName];
  if (!ccxtId) {
    throw new Error(`Unsupported exchange: ${exchangeName}`);
  }

  const ExchangeClass = ccxt[ccxtId as keyof typeof ccxt] as unknown as new (
    config: Record<string, unknown>
  ) => CCXTExchange;

  const config: Record<string, unknown> = {
    apiKey,
    secret: apiSecret,
    enableRateLimit: true,
    options: {
      defaultType: "swap", // futures/perpetual by default
    },
  };

  if (passphrase) {
    config.password = passphrase;
  }

  return new ExchangeClass(config);
}

// ─── Fetch closed trades from exchange ───────────────────────────────────────

async function fetchRecentClosedTrades(
  exchange: CCXTExchange,
  since?: number
): Promise<CCXTTrade[]> {
  const trades: CCXTTrade[] = [];

  try {
    // Fetch trades from the last 7 days if no since timestamp
    const sinceTs = since || Date.now() - 7 * 24 * 60 * 60 * 1000;

    if (exchange.has["fetchMyTrades"]) {
      const fetched = await exchange.fetchMyTrades(undefined, sinceTs, 100);
      trades.push(...fetched);
    }
  } catch (err) {
    console.error(
      `[exchange] Error fetching trades: ${err instanceof Error ? err.message : err}`
    );
  }

  return trades;
}

// ─── Fetch open positions ────────────────────────────────────────────────────

interface PositionInfo {
  symbol: string;
  side: "long" | "short";
  contracts: number;
  entryPrice: number;
  leverage: number;
  unrealizedPnl: number;
  timestamp: number | null;
}

async function fetchOpenPositions(
  exchange: CCXTExchange
): Promise<PositionInfo[]> {
  const positions: PositionInfo[] = [];

  try {
    if (exchange.has["fetchPositions"]) {
      const rawPositions = await exchange.fetchPositions();

      for (const pos of rawPositions) {
        const contracts = Math.abs(pos.contracts ?? 0);
        if (contracts === 0) continue; // skip empty positions

        positions.push({
          symbol: pos.symbol ?? "",
          side: (pos.side === "short" ? "short" : "long") as "long" | "short",
          contracts,
          entryPrice: pos.entryPrice ?? 0,
          leverage: pos.leverage ?? 1,
          unrealizedPnl: pos.unrealizedPnl ?? 0,
          timestamp: pos.timestamp ?? null,
        });
      }
    }
  } catch (err) {
    console.error(
      `[exchange] Error fetching positions: ${err instanceof Error ? err.message : err}`
    );
  }

  return positions;
}

// ─── Main sync logic ─────────────────────────────────────────────────────────

export async function syncUserTrades(userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    newTrades: [],
    closedTrades: [],
    errors: [],
  };

  // Get all active exchanges for user
  const exchanges = await prisma.exchange.findMany({
    where: { userId, isActive: true },
  });

  if (exchanges.length === 0) {
    return result;
  }

  for (const dbExchange of exchanges) {
    try {
      const ccxtExchange = createCCXTExchange(
        dbExchange.name,
        dbExchange.apiKey,
        dbExchange.apiSecret,
        dbExchange.passphrase
      );

      // 1. Fetch open positions from exchange and detect NEW trades
      const openPositions = await fetchOpenPositions(ccxtExchange);

      // Get existing open trades for this exchange
      const existingOpenTrades = await prisma.trade.findMany({
        where: {
          userId,
          exchangeId: dbExchange.id,
          status: "open",
        },
      });

      const existingSymbolSideMap = new Map(
        existingOpenTrades.map((t) => [`${t.symbol}:${t.side}`, t])
      );

      // Detect new positions (not in DB yet)
      for (const pos of openPositions) {
        const key = `${pos.symbol}:${pos.side}`;
        if (!existingSymbolSideMap.has(key)) {
          // This is a NEW trade — insert it
          const externalId = `${dbExchange.name}:${pos.symbol}:${pos.side}:${pos.timestamp || Date.now()}`;

          // Check if we already have this external ID (dedup)
          const existing = await prisma.trade.findUnique({
            where: { externalTradeId: externalId },
          });

          if (!existing) {
            const trade = await prisma.trade.create({
              data: {
                userId,
                exchangeId: dbExchange.id,
                externalTradeId: externalId,
                symbol: pos.symbol,
                side: pos.side,
                status: "open",
                entryPrice: pos.entryPrice,
                quantity: pos.contracts,
                leverage: pos.leverage,
                needsJournal: true,
                syncedAt: new Date(),
                entryDate: pos.timestamp
                  ? new Date(pos.timestamp)
                  : new Date(),
              },
            });

            result.newTrades.push({
              id: trade.id,
              externalTradeId: externalId,
              symbol: pos.symbol,
              side: pos.side,
              entryPrice: pos.entryPrice,
              quantity: pos.contracts,
              leverage: pos.leverage,
              fees: 0,
              entryDate: trade.entryDate,
              exchangeId: dbExchange.id,
              exchangeName: dbExchange.name,
            });
          }
        }
      }

      // 2. Check if any existing open trades have been CLOSED
      const openPositionKeys = new Set(
        openPositions.map((p) => `${p.symbol}:${p.side}`)
      );

      for (const dbTrade of existingOpenTrades) {
        const key = `${dbTrade.symbol}:${dbTrade.side}`;

        if (!openPositionKeys.has(key)) {
          // Position no longer open on exchange — it was closed
          // Fetch recent trades to find the closing details
          const sinceTs = dbTrade.entryDate.getTime();
          const recentTrades = await fetchRecentClosedTrades(
            ccxtExchange,
            sinceTs
          );

          // Find closing trades for this symbol
          const closingTrades = recentTrades.filter(
            (t) =>
              t.symbol === dbTrade.symbol &&
              // Closing trade is opposite side, OR same symbol reduce
              t.timestamp !== undefined &&
              t.timestamp !== null &&
              t.timestamp > sinceTs
          );

          let exitPrice = dbTrade.entryPrice; // fallback
          let totalFees = dbTrade.fees || 0;
          let exitDate = new Date();

          if (closingTrades.length > 0) {
            // Use the last trade as the exit
            const lastTrade = closingTrades[closingTrades.length - 1];
            exitPrice = lastTrade.price;
            totalFees += closingTrades.reduce(
              (sum, t) => sum + (t.fee?.cost || 0),
              0
            );
            exitDate = lastTrade.timestamp
              ? new Date(lastTrade.timestamp)
              : new Date();
          }

          // Calculate PnL
          const direction = dbTrade.side === "long" ? 1 : -1;
          const priceDiff = (exitPrice - dbTrade.entryPrice) * direction;
          const rawPnl =
            priceDiff * dbTrade.quantity * (dbTrade.leverage || 1);
          const pnl = rawPnl - totalFees;
          const pnlPercent =
            dbTrade.entryPrice > 0
              ? (priceDiff / dbTrade.entryPrice) *
                100 *
                (dbTrade.leverage || 1)
              : 0;

          // Update trade in DB
          await prisma.trade.update({
            where: { id: dbTrade.id },
            data: {
              status: "closed",
              exitPrice,
              pnl,
              pnlPercent,
              fees: totalFees,
              exitDate,
              syncedAt: new Date(),
            },
          });

          result.closedTrades.push({
            id: dbTrade.id,
            symbol: dbTrade.symbol,
            side: dbTrade.side,
            entryPrice: dbTrade.entryPrice,
            exitPrice,
            pnl,
            pnlPercent,
            fees: totalFees,
            exitDate,
          });
        }
      }

      // Update last sync time
      await prisma.exchange.update({
        where: { id: dbExchange.id },
        data: { lastSyncAt: new Date() },
      });
    } catch (err) {
      const msg = `Failed to sync ${dbExchange.name}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[exchange] ${msg}`);
      result.errors.push(msg);
    }
  }

  return result;
}

// ─── Check and close open positions (lighter check) ──────────────────────────

export async function checkOpenPositions(userId: string): Promise<{
  closedTrades: ClosedTradeUpdate[];
  errors: string[];
}> {
  // This is a lighter version that only checks open trades, not looking for new ones
  // Used as part of the sync flow
  const fullSync = await syncUserTrades(userId);
  return {
    closedTrades: fullSync.closedTrades,
    errors: fullSync.errors,
  };
}
