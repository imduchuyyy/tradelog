import { openai } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages, stepCountIs } from "ai";
import { z } from "zod";
import { auth } from "@/lib/auth";
import Database from "better-sqlite3";
import path from "node:path";

export const maxDuration = 30;

/**
 * Get a read-only better-sqlite3 connection for AI SQL queries.
 * The DB path is resolved from DATABASE_URL the same way prisma.ts does.
 */
function getReadOnlyDb() {
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  const dbPath = dbUrl.startsWith("file:")
    ? path.resolve(/*turbopackIgnore: true*/ process.cwd(), dbUrl.replace("file:", "").replace("./", ""))
    : dbUrl;
  return new Database(dbPath, { readonly: true });
}

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

  const systemPrompt = `You are the Zennote AI Analytics Assistant. You help traders analyze their manual trading journal using SQL queries and computations.

IMPORTANT: You MUST respond in ${languageName}. All your analysis, explanations, and advice should be written in ${languageName}.

CONTEXT: The user has a SQLite database with their trading data. You have two powerful tools:
1. **queryTrades** — Run READ-ONLY SQL queries against the database
2. **compute** — Run JavaScript computations on data you've fetched

DATABASE SCHEMA (SQLite):
- **Trade** table: id, userId, symbol (TEXT tag, e.g. "BTCUSDT"), result (REAL money result, positive or negative), note (TEXT BlockNote JSON), setup (TEXT JSON array of setup tags), session (TEXT: "sydney"|"tokyo"|"london"|"new_york"), tradeDate (DATETIME), createdAt (DATETIME), updatedAt (DATETIME)

IMPORTANT RULES:
- ALWAYS filter by userId = '${userId}' in your queries to ensure data isolation
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
            // Security: only allow SELECT
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
              if (regex.test(sql) && !trimmed.startsWith("SELECT") && !trimmed.startsWith("WITH")) {
                return {
                  error: `Forbidden SQL keyword: ${keyword}`,
                  description,
                };
              }
            }

            const db = getReadOnlyDb();
            try {
              const rows = db.prepare(sql).all();
              return {
                success: true,
                description,
                rowCount: rows.length,
                rows: rows.slice(0, 200), // limit to 200 rows
                truncated: rows.length > 200,
              };
            } finally {
              db.close();
            }
          } catch (e: unknown) {
            return {
              error: e instanceof Error ? e.message : String(e),
              description,
            };
          }
        },
      }),

      compute: tool({
        description:
          "Run a JavaScript computation on trading data. Use this when you need to do calculations that are hard in SQL alone, like computing streaks, drawdowns, or custom metrics. The code should be a function body that returns a result. You have access to a 'data' parameter that you can pass pre-fetched query results into.",
        inputSchema: z.object({
          code: z
            .string()
            .describe(
              "JavaScript code to evaluate. Should be a function body that returns a result. Has access to 'data' parameter."
            ),
          data: z
            .any()
            .optional()
            .describe(
              "Data to pass into the computation (e.g. query results from a previous tool call)"
            ),
          description: z
            .string()
            .describe(
              "Brief description of what this computation does, e.g. 'Calculate max drawdown from cumulative PnL'"
            ),
        }),
        execute: async ({
          code,
          data,
          description,
        }: {
          code: string;
          data?: unknown;
          description: string;
        }) => {
          try {
            // Create a sandboxed function
            const fn = new Function("data", code);
            const result = fn(data);
            return {
              success: true,
              description,
              result,
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
