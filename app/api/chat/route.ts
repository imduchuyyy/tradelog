import { openai } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages, stepCountIs } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages: uiMessages, locale } = await req.json();

  const languageNames: Record<string, string> = {
    en: "English",
    vi: "Vietnamese",
  };
  const languageName = languageNames[locale] || "English";

  const systemPrompt = `You are the Zennote AI Analytics Assistant. You help traders analyze their manual trading journal using SQL queries.

IMPORTANT: You MUST respond in ${languageName}. All your analysis, explanations, and advice should be written in ${languageName}.

CONTEXT: The user has a PostgreSQL database with their trading data. You have one tool:
1. **queryTrades** — Run READ-ONLY SQL queries against the database

DATABASE SCHEMA (PostgreSQL):
- **"Trade"** table: id, "userId", symbol (TEXT tag, e.g. "BTCUSDT"), result (DOUBLE PRECISION money result, positive or negative), note (TEXT BlockNote JSON), setup (TEXT JSON array of setup tags), session (TEXT: "sydney"|"tokyo"|"london"|"new_york"), direction (TEXT: "long"|"short", NULL when the trader did not record it), "tradeDate" (TIMESTAMP), "createdAt" (TIMESTAMP), "updatedAt" (TIMESTAMP)

IMPORTANT RULES:
- ALWAYS query the quoted table name "Trade" and quoted camelCase columns like "userId" and "tradeDate".
- ALWAYS filter by "userId" = '${userId}' in your queries to ensure data isolation
- ONLY use SELECT statements — never INSERT, UPDATE, DELETE, DROP, ALTER, etc.
- Dates are stored as ISO strings; use date functions carefully
- result is the money result of each trade. Positive values are wins, negative values are losses.
- Provide thoughtful analysis, not just raw numbers. Tell the user what patterns you see and what they could improve.
- When showing statistics, explain the implications for their trading strategy.
- Be concise but insightful. Focus on actionable advice.

COMMON QUERIES YOU SHOULD KNOW:
- Win rate: COUNT trades where result > 0 / COUNT trades
- Total result: SUM(result)
- Expectancy: AVG(result)
- Profit Factor: SUM(winning result) / ABS(SUM(losing result))
- Max Drawdown: calculate running cumulative result and find the biggest peak-to-trough decline
- Symbol performance: GROUP BY symbol
- Setup performance: parse setup JSON tags and group by setup tag
- Session performance: GROUP BY session
- Long vs short performance: GROUP BY direction (exclude NULL direction, it means "not recorded" rather than a third category)
- Streak analysis: order by tradeDate, count consecutive wins/losses`;

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
      queryTrades: tool({
        description:
          "Execute a READ-ONLY SQL query against the user's trade database. Use this to fetch trading data for analysis. Always include WHERE userId = '<userId>' in your queries. Only SELECT statements are allowed.",
        inputSchema: z.object({
          sql: z
            .string()
            .describe(
              "The SQL SELECT query to run. Must be read-only and include userId filter."
            ),
          description: z
            .string()
            .describe(
              "Brief description of what this query is fetching, e.g. 'Win rate by session'"
            ),
        }),
        execute: async ({ sql, description }: { sql: string; description: string }) => {
          try {
            // Security: only allow one read-only statement scoped to the current user.
            const trimmed = sql.trim().toUpperCase();
            if (
              !trimmed.startsWith("SELECT") &&
              !trimmed.startsWith("WITH")
            ) {
              return {
                error: "Only SELECT queries are allowed.",
                description,
              };
            }

            if (sql.replace(/;\s*$/, "").includes(";")) {
              return {
                error: "Only one SQL statement is allowed.",
                description,
              };
            }

            if (!sql.includes(userId)) {
              return {
                error: "Query must filter by the current userId.",
                description,
              };
            }

            // Block dangerous statements
            const dangerous = [
              "INSERT",
              "UPDATE",
              "DELETE",
              "DROP",
              "ALTER",
              "CREATE",
              "TRUNCATE",
              "REPLACE",
              "ATTACH",
              "DETACH",
              "PRAGMA",
            ];
            for (const keyword of dangerous) {
              // Check for the keyword as a standalone word (not inside a string)
              const regex = new RegExp(`\\b${keyword}\\b`, "i");
              if (regex.test(sql)) {
                return {
                  error: `Forbidden SQL keyword: ${keyword}`,
                  description,
                };
              }
            }

            const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql);
            return {
              success: true,
              description,
              rowCount: rows.length,
              rows: rows.slice(0, 200), // limit to 200 rows
              truncated: rows.length > 200,
            };
          } catch (e: unknown) {
            return {
              error: e instanceof Error ? e.message : String(e),
              description,
            };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
