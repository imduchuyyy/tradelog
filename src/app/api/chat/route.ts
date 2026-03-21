import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
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

  const { messages, context } = await req.json();

  let systemPrompt = `You are the TradeLog AI Trading Assistant. Your goal is to help the user become a highly disciplined, statistical trader. 
You speak in a concise, authoritative, yet supportive tone. You never use excessive markdown formatting unless appropriate.`;

  if (context === "onboarding") {
    systemPrompt += `\n\nCONTEXT: ONBOARDING.
The user is just setting up their account. You should:
1. Ask them what Exchange they use and use the 'connectExchange' tool to prompt them for API keys.
2. Ask them about their favorite trading strategy/setup (like "EMA Pullback", "Sweep & Reclaim", etc).
3. Extract explicit conditions (like "H4 Bullish", "RSI Oversold") from their description and use the 'createSetup' tool.
4. Tell them they are ready to go to the dashboard once they have built a setup.`;
  } else if (context === "dashboard") {
    systemPrompt += `\n\nCONTEXT: DASHBOARD JOURNALING.
You are helping the user analyze their trades and journal them. 
Use the 'getStats' tool if they ask about their performance (Win Rate, PnL, Risk/Reward).
If they are talking about a specific trade, ask them poignant psychological questions (e.g. "Why did you exit here?", "Were you feeling FOMO?").
Use the 'journalTrade' tool to log their exit reasons, psychology, mistakes, or market conditions precisely.`;
  }

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages,
    tools: {
      connectExchange: tool({
        description: "Prompts the UI to render the Exchange API connection form. Ask the user if they'd like to connect Binance, Bybit, OKX, etc. The UI takes over once triggered.",
        parameters: z.object({
          exchangeNameSuggestion: z.string().describe("The exchange the user mentioned"),
        }),
        // @ts-ignore
        execute: async ({ exchangeNameSuggestion }: { exchangeNameSuggestion: string }) => {
          return { status: "RENDER_EXCHANGE_FORM", exchangeNameSuggestion };
        },
      }),

      createSetup: tool({
        description: "Creates a Trading Setup alongside specific atomic Conditions in the database. Use this when the user explains their trading strategy.",
        parameters: z.object({
          setupName: z.string().describe("Name of the setup, e.g. 'Breakout ReTest'"),
          description: z.string().optional().describe("A brief description of the strategy"),
          conditions: z.array(z.string()).describe("A list of explicit rules/conditions e.g. ['H4 Bullish', 'RSI Oversold']"),
        }),
        // @ts-ignore
        execute: async ({ setupName, description, conditions }: { setupName: string; description?: string; conditions: string[] }) => {
          try {
            const conditionRecords = [];
            for (const c of conditions) {
              const cond = await prisma.condition.upsert({
                where: { id: "new" }, // Upsert by name + userId
                update: {}, // We actually can't upsert without a unique field on name+userId.
                create: { name: c, userId },
              });
              conditionRecords.push(cond.id);
            }
            // Real create logic for conditions. Let's do it safely:
            const actualConditionIds = [];
            for (const c of conditions) {
              let existing = await prisma.condition.findFirst({ where: { name: c, userId }});
              if (!existing) {
                existing = await prisma.condition.create({ data: { name: c, userId }});
              }
              actualConditionIds.push(existing.id);
            }

            const setup = await prisma.setup.create({
              data: {
                name: setupName,
                description: description || null,
                userId,
                color: "#10b981",
                conditions: {
                  connect: actualConditionIds.map((id) => ({ id })),
                },
              },
            });
            return { success: true, setupName: setup.name, addedConditions: conditions };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        },
      }),

      getStats: tool({
        description: "Retrieves the user's trading statistics: Total PnL, Win Rate, Risk/Reward.",
        parameters: z.object({}),
        // @ts-ignore
        execute: async () => {
          const trades = await prisma.trade.findMany({ where: { userId, status: "closed" }});
          if (trades.length === 0) return { error: "No closed trades to compute stats." };

          const wins = trades.filter((t: any) => t.pnl > 0);
          const losses = trades.filter((t: any) => t.pnl <= 0);
          const totalPnl = trades.reduce((sum: number, t: any) => sum + Number(t.pnl || 0), 0);
          const winRate = (wins.length / trades.length) * 100;
          
          const avgWin = wins.length > 0 ? wins.reduce((sum: number, t: any) => sum + Number(t.pnl), 0) / wins.length : 0;
          const avgLoss = losses.length > 0 ? losses.reduce((sum: number, t: any) => sum + Number(t.pnl), 0) / losses.length : 0;
          const riskReward = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

          return { totalTrades: trades.length, totalPnl, winRate, riskReward, avgWin, avgLoss };
        },
      }),

      journalTrade: tool({
        description: "Updates an existing Trade record with journaling metrics.",
        parameters: z.object({
          tradeId: z.string(),
          exitReason: z.string().optional().describe("Why the user exited"),
          psychology: z.string().optional().describe("What the user felt"),
          mistakes: z.string().optional().describe("Mistakes made"),
          lessons: z.string().optional().describe("Lessons learned"),
          confidenceLevel: z.number().optional().describe("1-10 rating of how confident they were"),
        }),
        // @ts-ignore
        execute: async ({ tradeId, exitReason, psychology, mistakes, lessons, confidenceLevel }: { tradeId: string; exitReason?: string; psychology?: string; mistakes?: string; lessons?: string; confidenceLevel?: number }) => {
          try {
            const t = await prisma.trade.update({
              where: { id: tradeId, userId },
              data: {
                ...(exitReason && { exitReason }),
                ...(psychology && { exitPsychology: psychology }),
                ...(mistakes && { mistakes }),
                ...(lessons && { lessons }),
                ...(confidenceLevel && { confidenceLevel }),
              },
            });
            return { success: true, updatedFields: { exitReason, psychology, mistakes, lessons, confidenceLevel } };
          } catch (e: any) {
            return { success: false, error: e.message };
          }
        },
      }),
    },
  });

  return result.toTextStreamResponse();
}
