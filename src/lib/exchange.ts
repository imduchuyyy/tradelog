import "server-only";
import ccxt from "ccxt";
import type { Exchange as CCXTExchange, Trade as CCXTTrade } from "ccxt";
import { prisma } from "@/lib/prisma";

const isDev = process.env.NODE_ENV === "development";

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

  const exchange = new ExchangeClass(config);

  // In development, use sandbox/testnet endpoints instead of production
  if (isDev) {
    try {
      exchange.enableDemoTrading(true);
      console.log(
        `[exchange] Sandbox mode enabled for ${exchangeName} (development)`
      );
    } catch {
      console.warn(
        `[exchange] ${exchangeName} does not support sandbox mode, using production endpoints`
      );
    }
  }

  return exchange;
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
        if (contracts === 0) continue;

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

// ─── Main sync logic (one-shot, used on page load) ──────────────────────────

export async function syncUserTrades(userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    newTrades: [],
    closedTrades: [],
    errors: [],
  };

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

      // 1. Fetch open positions and detect NEW trades
      const openPositions = await fetchOpenPositions(ccxtExchange);

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

      for (const pos of openPositions) {
        const key = `${pos.symbol}:${pos.side}`;
        if (!existingSymbolSideMap.has(key)) {
          const externalId = `${dbExchange.name}:${pos.symbol}:${pos.side}:${pos.timestamp || Date.now()}`;

          const existing = await prisma.trade.findUnique({
            where: { externalTradeId: externalId },
          });

          if (!existing) {
            let entryFees = 0;
            let actualEntryDate = pos.timestamp ? new Date(pos.timestamp) : new Date();

            try {
              if (ccxtExchange.has["fetchMyTrades"]) {
                const recentTrades = await ccxtExchange.fetchMyTrades(pos.symbol, undefined, 50);
                const orderSide = pos.side === "long" ? "buy" : "sell";
                let accumulatedQty = 0;

                for (let i = recentTrades.length - 1; i >= 0; i--) {
                  const t = recentTrades[i];
                  if (t.side === orderSide) {
                    accumulatedQty += t.amount || 0;
                    entryFees += (t.fee?.cost || 0);
                    if (t.timestamp) actualEntryDate = new Date(t.timestamp);
                    if (accumulatedQty >= pos.contracts * 0.99) break;
                  } else if (accumulatedQty > 0) {
                    break;
                  }
                }
              }
            } catch (err) {
              console.error(`[exchange] Error fetching entry trades for ${pos.symbol}:`, err);
            }

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
                entryDate: actualEntryDate,
                fees: entryFees,
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
              fees: entryFees,
              entryDate: trade.entryDate,
              exchangeId: dbExchange.id,
              exchangeName: dbExchange.name,
            });
          }
        }
      }

      // 2. Detect CLOSED positions
      const openPositionKeys = new Set(
        openPositions.map((p) => `${p.symbol}:${p.side}`)
      );

      for (const dbTrade of existingOpenTrades) {
        const key = `${dbTrade.symbol}:${dbTrade.side}`;

        if (!openPositionKeys.has(key)) {
          const sinceTs = dbTrade.entryDate.getTime();
          let closingTrades: CCXTTrade[] = [];
          let allFetchedTrades: CCXTTrade[] = [];

          try {
            if (ccxtExchange.has["fetchMyTrades"]) {
              const fetched = await ccxtExchange.fetchMyTrades(
                dbTrade.symbol,
                sinceTs,
                100
              );
              allFetchedTrades = fetched.filter(
                (t) => t.timestamp !== undefined && t.timestamp !== null && t.timestamp >= sinceTs
              );
              closingTrades = fetched.filter(
                (t) =>
                  t.timestamp !== undefined &&
                  t.timestamp !== null &&
                  t.timestamp > sinceTs
              );
            }
          } catch (err) {
            console.error(
              `[exchange] Error fetching closing trades for ${dbTrade.symbol}:`,
              err
            );
          }

          let exitPrice = dbTrade.entryPrice;
          
          let totalFees = dbTrade.fees || 0;
          if (closingTrades.length > 0) {
            totalFees += closingTrades.reduce((sum, t) => sum + (t.fee?.cost || 0), 0);
          }

          let exitDate = new Date();
          let pnl = 0;
          let exchangeProvidedPnl = false;

          if (closingTrades.length > 0) {
            const lastTrade = closingTrades[closingTrades.length - 1];
            exitPrice = lastTrade.price;
            exitDate = lastTrade.timestamp ? new Date(lastTrade.timestamp) : new Date();

            let sumRealizedPnl = 0;
            let foundRealizedPnl = false;
            
            for (const t of closingTrades) {
              const rawPnl = t.info?.realizedPnl !== undefined ? t.info.realizedPnl : t.info?.realized_pnl;
              if (rawPnl !== undefined && rawPnl !== null) {
                sumRealizedPnl += parseFloat(rawPnl);
                foundRealizedPnl = true;
              }
            }

            if (foundRealizedPnl) {
              // CCXT/Binance realizedPnl aligns with their gross Realized Profit metric.
              // To get accurate Net PnL as desired, subtract all transaction fees across the full cycle.
              pnl = sumRealizedPnl - totalFees;
              exchangeProvidedPnl = true;
            }
          }

          const direction = dbTrade.side === "long" ? 1 : -1;
          const priceDiff = (exitPrice - dbTrade.entryPrice) * direction;

          if (!exchangeProvidedPnl) {
            const rawPnl = priceDiff * dbTrade.quantity;
            pnl = rawPnl - totalFees;
          }
          const pnlPercent =
            dbTrade.entryPrice > 0
              ? (priceDiff / dbTrade.entryPrice) *
                100 *
                (dbTrade.leverage || 1)
              : 0;

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
