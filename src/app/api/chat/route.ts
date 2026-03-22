import { openai } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages, stepCountIs } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages: uiMessages, context } = await req.json();

  let systemPrompt = `You are the TradeLog AI Trading Coach. Your goal is to help the user become a highly disciplined, statistical trader.
You speak in a concise, authoritative, yet supportive tone. You never use excessive markdown formatting unless appropriate.
You deeply understand trading psychology, risk management, and market analysis.`;

  if (context === "onboarding") {
    systemPrompt += `\n\nCONTEXT: ONBOARDING.
The user is just setting up their account. Follow this flow STRICTLY in order:

STEP 1 - WELCOME & MARKET CONDITIONS:
- Greet the user warmly and welcome them to TradeLog.
- Ask them: "What are the market conditions you usually look for before entering a trade?"
- Examples: "H4 Bullish trend", "Liquidity sweep", "RSI oversold", "Break of structure", "DOM USDT rising", etc.
- Have a natural conversation about their trading style. Ask follow-up questions.
- Once you understand their conditions, use the 'createMarketConditions' tool to save them.
- You can call this tool multiple times if user wants to add more conditions.
- After creating conditions, ask if they want to group conditions into a Setup (trading strategy).
- If yes, use the 'createSetup' tool.

STEP 2 - EXCHANGE CONNECTION:
- After market conditions are set up, ask the user if they want to connect their exchange via API to sync trades automatically.
- Use the 'connectExchange' tool to prompt the UI for API key input.
- If they skip, that's fine — tell them they can do it later from Settings.

STEP 3 - FINISH:
- Summarize what they've set up and tell them they're ready.
- Let them know the dashboard will show analytics filtered by their market conditions.

IMPORTANT: Always start with market conditions FIRST, not exchange connection.`;
  } else if (context === "dashboard") {
    systemPrompt += `\n\nCONTEXT: DASHBOARD JOURNALING & ANALYTICS.
You help the user analyze trades and journal them. You have powerful tools:

WHEN A NEW TRADE IS DETECTED (you'll receive a system message about it):
- Alert the user about the new trade.
- Ask them WHY they entered this trade.
- Ask about the risk/reward ratio they planned.
- Ask which market conditions were present.
- Use 'addTradeJournal' to log their entry reasons and link market conditions.

WHEN A TRADE IS CLOSED (you'll receive a system message about it):
- Alert the user about the closed trade and its PnL.
- Ask them: Why did the trade hit stop loss / take profit?
- Ask about the lesson from this trade.
- Ask for a post-trade review.
- Use 'journalTrade' tool to log exit reasons, psychology, mistakes, and lessons.

FOR ANALYTICS QUESTIONS:
- Use 'getStats' for overall stats.
- Use 'getConditionAnalytics' for per-condition performance analysis.
- Use 'getDetailedAnalytics' for comprehensive breakdown.
- Provide thoughtful analysis — not just numbers. Tell them WHAT to improve.

FOR MANAGING CONDITIONS:
- Use 'createMarketConditions' to create new conditions.
- Use 'createSetup' to create new setups with conditions.

Always be proactive. Don't just answer — guide. If they have a losing streak, dig into the psychology. If a condition performs poorly, suggest they reconsider it.`;
  }

  // Convert UIMessage[] from useChat client to ModelMessage[] for streamText
  const messages = await convertToModelMessages(uiMessages, {
    ignoreIncompleteToolCalls: true,
  });

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages,
    maxRetries: 5,
    stopWhen: stepCountIs(5),
    tools: {
      connectExchange: tool({
        description:
          "Prompts the UI to render the Exchange API connection form. Use this when the user is ready to connect their exchange account.",
        inputSchema: z.object({
          exchangeNameSuggestion: z
            .string()
            .describe("The exchange the user mentioned, e.g. Binance, Bybit"),
        }),
        // @ts-ignore
        execute: async ({
          exchangeNameSuggestion,
        }: {
          exchangeNameSuggestion: string;
        }) => {
          return { status: "RENDER_EXCHANGE_FORM", exchangeNameSuggestion };
        },
      }),

      createMarketConditions: tool({
        description:
          "Creates market conditions (atomic trading rules) for the user. Use this when the user describes the conditions they look for before entering a trade. Each condition should be a specific, atomic rule like 'H4 Bullish', 'RSI Oversold', 'Liquidity Swept', etc.",
        inputSchema: z.object({
          conditions: z
            .array(z.string())
            .describe(
              "A list of atomic market conditions, e.g. ['H4 Bullish', 'RSI Oversold', 'Break of Structure']"
            ),
        }),
        // @ts-ignore
        execute: async ({ conditions }: { conditions: string[] }) => {
          try {
            const created: string[] = [];
            const existing: string[] = [];

            for (const condName of conditions) {
              const trimmed = condName.trim();
              if (!trimmed) continue;

              const existingCond = await prisma.condition.findFirst({
                where: { name: trimmed, userId },
              });

              if (existingCond) {
                existing.push(trimmed);
              } else {
                await prisma.condition.create({
                  data: { name: trimmed, userId },
                });
                created.push(trimmed);
              }
            }

            return {
              success: true,
              created,
              alreadyExisted: existing,
              totalConditions: created.length + existing.length,
            };
          } catch (e: unknown) {
            return {
              success: false,
              error: e instanceof Error ? e.message : String(e),
            };
          }
        },
      }),

      createSetup: tool({
        description:
          "Creates a Trading Setup (strategy) that groups market conditions together. Use this when the user describes a complete trading strategy.",
        inputSchema: z.object({
          setupName: z
            .string()
            .describe("Name of the setup, e.g. 'Breakout ReTest'"),
          description: z
            .string()
            .optional()
            .describe("A brief description of the strategy"),
          conditions: z
            .array(z.string())
            .describe(
              "List of condition names to link with this setup. They will be created if they don't exist."
            ),
          rules: z
            .string()
            .optional()
            .describe("Entry/exit rules in text format"),
        }),
        // @ts-ignore
        execute: async ({
          setupName,
          description,
          conditions,
          rules,
        }: {
          setupName: string;
          description?: string;
          conditions: string[];
          rules?: string;
        }) => {
          try {
            const conditionIds: string[] = [];
            for (const c of conditions) {
              const trimmed = c.trim();
              if (!trimmed) continue;

              let cond = await prisma.condition.findFirst({
                where: { name: trimmed, userId },
              });
              if (!cond) {
                cond = await prisma.condition.create({
                  data: { name: trimmed, userId },
                });
              }
              conditionIds.push(cond.id);
            }

            const setup = await prisma.setup.create({
              data: {
                name: setupName,
                description: description || null,
                rules: rules || null,
                userId,
                color: "#10b981",
                conditions: {
                  connect: conditionIds.map((id) => ({ id })),
                },
              },
            });

            return {
              success: true,
              setupName: setup.name,
              setupId: setup.id,
              linkedConditions: conditions,
            };
          } catch (e: unknown) {
            return {
              success: false,
              error: e instanceof Error ? e.message : String(e),
            };
          }
        },
      }),

      getStats: tool({
        description:
          "Retrieves the user's overall trading statistics: Total PnL, Win Rate, Risk/Reward, etc.",
        inputSchema: z.object({}),
        // @ts-ignore
        execute: async () => {
          const trades = await prisma.trade.findMany({
            where: { userId, status: "closed" },
            include: { conditions: true, setup: true },
          });

          if (trades.length === 0) {
            return { error: "No closed trades to compute stats." };
          }

          const wins = trades.filter(
            (t) => t.pnl !== null && Number(t.pnl) > 0
          );
          const losses = trades.filter(
            (t) => t.pnl !== null && Number(t.pnl) <= 0
          );
          const totalPnl = trades.reduce(
            (sum, t) => sum + Number(t.pnl || 0),
            0
          );
          const winRate = (wins.length / trades.length) * 100;

          const avgWin =
            wins.length > 0
              ? wins.reduce((sum, t) => sum + Number(t.pnl), 0) / wins.length
              : 0;
          const avgLoss =
            losses.length > 0
              ? losses.reduce((sum, t) => sum + Number(t.pnl), 0) /
              losses.length
              : 0;
          const riskReward =
            avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

          const bestTrade = Math.max(
            ...trades.map((t) => Number(t.pnl || 0))
          );
          const worstTrade = Math.min(
            ...trades.map((t) => Number(t.pnl || 0))
          );

          return {
            totalTrades: trades.length,
            totalPnl: Math.round(totalPnl * 100) / 100,
            winRate: Math.round(winRate * 100) / 100,
            wins: wins.length,
            losses: losses.length,
            riskReward: Math.round(riskReward * 100) / 100,
            avgWin: Math.round(avgWin * 100) / 100,
            avgLoss: Math.round(avgLoss * 100) / 100,
            bestTrade: Math.round(bestTrade * 100) / 100,
            worstTrade: Math.round(worstTrade * 100) / 100,
          };
        },
      }),

      getConditionAnalytics: tool({
        description:
          "Analyzes trading performance broken down by specific market conditions. Shows which conditions lead to winning/losing trades.",
        inputSchema: z.object({
          conditionName: z
            .string()
            .optional()
            .describe(
              "Optional: specific condition name to analyze. If omitted, analyzes all conditions."
            ),
        }),
        // @ts-ignore
        execute: async ({ conditionName }: { conditionName?: string }) => {
          const conditions = conditionName
            ? await prisma.condition.findMany({
              where: {
                userId,
                name: { contains: conditionName },
              },
              include: {
                trades: {
                  where: { status: "closed" },
                  select: { pnl: true, side: true, symbol: true },
                },
              },
            })
            : await prisma.condition.findMany({
              where: { userId },
              include: {
                trades: {
                  where: { status: "closed" },
                  select: { pnl: true, side: true, symbol: true },
                },
              },
            });

          if (conditions.length === 0) {
            return { error: "No conditions found." };
          }

          const analytics = conditions
            .map((cond) => {
              const trades = cond.trades;
              if (trades.length === 0)
                return {
                  name: cond.name,
                  totalTrades: 0,
                  winRate: 0,
                  totalPnl: 0,
                  avgPnl: 0,
                };

              const wins = trades.filter(
                (t) => Number(t.pnl || 0) > 0
              ).length;
              const totalPnl = trades.reduce(
                (sum, t) => sum + Number(t.pnl || 0),
                0
              );

              return {
                name: cond.name,
                totalTrades: trades.length,
                winRate:
                  Math.round((wins / trades.length) * 100 * 100) / 100,
                totalPnl: Math.round(totalPnl * 100) / 100,
                avgPnl:
                  Math.round((totalPnl / trades.length) * 100) / 100,
              };
            })
            .sort((a, b) => b.totalPnl - a.totalPnl);

          const best = analytics[0];
          const worst = analytics[analytics.length - 1];

          return {
            conditions: analytics,
            bestCondition: best,
            worstCondition: worst,
            totalConditions: analytics.length,
          };
        },
      }),

      getDetailedAnalytics: tool({
        description:
          "Gets comprehensive trading analytics including streaks, time-based analysis, and per-setup performance.",
        inputSchema: z.object({}),
        // @ts-ignore
        execute: async () => {
          const trades = await prisma.trade.findMany({
            where: { userId, status: "closed" },
            include: { conditions: true, setup: true },
            orderBy: { entryDate: "asc" },
          });

          if (trades.length === 0) {
            return { error: "No closed trades found." };
          }

          // Streaks
          let currentStreak = 0;
          let maxWinStreak = 0;
          let maxLossStreak = 0;
          let tempStreak = 0;

          for (const t of trades) {
            const isWin = Number(t.pnl || 0) > 0;
            if (isWin) {
              if (tempStreak > 0) tempStreak++;
              else tempStreak = 1;
              maxWinStreak = Math.max(maxWinStreak, tempStreak);
            } else {
              if (tempStreak < 0) tempStreak--;
              else tempStreak = -1;
              maxLossStreak = Math.max(
                maxLossStreak,
                Math.abs(tempStreak)
              );
            }
            currentStreak = tempStreak;
          }

          // Per setup
          const setupMap = new Map<
            string,
            { pnl: number; wins: number; total: number }
          >();
          for (const t of trades) {
            const sName = t.setup?.name || "No Setup";
            const s = setupMap.get(sName) || {
              pnl: 0,
              wins: 0,
              total: 0,
            };
            s.pnl += Number(t.pnl || 0);
            s.total++;
            if (Number(t.pnl || 0) > 0) s.wins++;
            setupMap.set(sName, s);
          }

          const setupPerformance = Array.from(setupMap.entries())
            .map(([name, s]) => ({
              name,
              totalPnl: Math.round(s.pnl * 100) / 100,
              winRate:
                Math.round((s.wins / s.total) * 100 * 100) / 100,
              trades: s.total,
            }))
            .sort((a, b) => b.totalPnl - a.totalPnl);

          // Day of week performance
          const dayMap = new Map<
            string,
            { pnl: number; wins: number; total: number }
          >();
          const dayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
          for (const t of trades) {
            const day = dayNames[new Date(t.entryDate).getDay()];
            const d = dayMap.get(day) || { pnl: 0, wins: 0, total: 0 };
            d.pnl += Number(t.pnl || 0);
            d.total++;
            if (Number(t.pnl || 0) > 0) d.wins++;
            dayMap.set(day, d);
          }

          const dayPerformance = Array.from(dayMap.entries())
            .map(([day, d]) => ({
              day,
              totalPnl: Math.round(d.pnl * 100) / 100,
              winRate:
                Math.round((d.wins / d.total) * 100 * 100) / 100,
              trades: d.total,
            }))
            .sort((a, b) => b.totalPnl - a.totalPnl);

          return {
            currentStreak,
            maxWinStreak,
            maxLossStreak,
            setupPerformance,
            dayPerformance,
            totalTrades: trades.length,
          };
        },
      }),

      addTradeJournal: tool({
        description:
          "Journals a trade entry: logs why the user entered, links market conditions, sets confidence level. Use this when a new trade is opened and the user tells you about it.",
        inputSchema: z.object({
          tradeId: z.string().describe("The trade ID to journal"),
          setupReason: z
            .string()
            .optional()
            .describe("Why the user entered this trade"),
          psychology: z
            .string()
            .optional()
            .describe("Emotional state when entering"),
          confidenceLevel: z
            .number()
            .optional()
            .describe("1-10 confidence rating"),
          conditionNames: z
            .array(z.string())
            .optional()
            .describe(
              "Market condition names present when entering (will be linked to trade)"
            ),
          setupId: z
            .string()
            .optional()
            .describe("Setup/strategy ID if applicable"),
          notes: z.string().optional().describe("Additional notes"),
        }),
        execute: async ({
          tradeId,
          setupReason,
          psychology,
          confidenceLevel,
          conditionNames,
          setupId,
          notes,
        }: {
          tradeId: string;
          setupReason?: string;
          psychology?: string;
          confidenceLevel?: number;
          conditionNames?: string[];
          setupId?: string;
          notes?: string;
        }) => {
          try {
            // Link conditions
            const conditionIds: string[] = [];
            if (conditionNames && conditionNames.length > 0) {
              for (const name of conditionNames) {
                let cond = await prisma.condition.findFirst({
                  where: { name: name.trim(), userId },
                });
                if (!cond) {
                  cond = await prisma.condition.create({
                    data: { name: name.trim(), userId },
                  });
                }
                conditionIds.push(cond.id);
              }
            }

            await prisma.trade.update({
              where: { id: tradeId, userId },
              data: {
                ...(setupReason && { setupReason }),
                ...(psychology && { psychology }),
                ...(confidenceLevel && { confidenceLevel }),
                ...(setupId && { setupId }),
                ...(notes && { notes }),
                needsJournal: false,
                ...(conditionIds.length > 0 && {
                  conditions: {
                    connect: conditionIds.map((id) => ({ id })),
                  },
                }),
              },
            });

            return {
              success: true,
              linkedConditions: conditionNames || [],
              updatedFields: {
                setupReason,
                psychology,
                confidenceLevel,
                notes,
              },
            };
          } catch (e: unknown) {
            return {
              success: false,
              error: e instanceof Error ? e.message : String(e),
            };
          }
        },
      }),

      journalTrade: tool({
        description:
          "Updates an existing Trade record with exit/closing journaling: exit reasons, psychology, mistakes, lessons. Use this when a trade is closed.",
        inputSchema: z.object({
          tradeId: z.string(),
          exitReason: z
            .string()
            .optional()
            .describe("Why the user exited / why SL/TP hit"),
          psychology: z
            .string()
            .optional()
            .describe("What the user felt during/after trade"),
          mistakes: z
            .string()
            .optional()
            .describe("Mistakes made during this trade"),
          lessons: z
            .string()
            .optional()
            .describe("Lessons learned from this trade"),
          confidenceLevel: z
            .number()
            .optional()
            .describe("1-10 rating post-trade"),
        }),
        // @ts-ignore
        execute: async ({
          tradeId,
          exitReason,
          psychology,
          mistakes,
          lessons,
          confidenceLevel,
        }: {
          tradeId: string;
          exitReason?: string;
          psychology?: string;
          mistakes?: string;
          lessons?: string;
          confidenceLevel?: number;
        }) => {
          try {
            await prisma.trade.update({
              where: { id: tradeId, userId },
              data: {
                ...(exitReason && { exitReason }),
                ...(psychology && { exitPsychology: psychology }),
                ...(mistakes && { mistakes }),
                ...(lessons && { lessons }),
                ...(confidenceLevel && { confidenceLevel }),
              },
            });
            return {
              success: true,
              updatedFields: {
                exitReason,
                psychology,
                mistakes,
                lessons,
                confidenceLevel,
              },
            };
          } catch (e: unknown) {
            return {
              success: false,
              error: e instanceof Error ? e.message : String(e),
            };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
