"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Auth helpers ────────────────────────────────────────────────────────────

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

// ─── Trade actions ───────────────────────────────────────────────────────────

export async function createTrade(formData: FormData) {
  const userId = await getAuthUserId();

  const data = {
    userId,
    symbol: formData.get("symbol") as string,
    side: formData.get("side") as string,
    status: (formData.get("status") as string) || "open",
    entryPrice: parseFloat(formData.get("entryPrice") as string),
    exitPrice: formData.get("exitPrice")
      ? parseFloat(formData.get("exitPrice") as string)
      : null,
    quantity: parseFloat(formData.get("quantity") as string),
    leverage: formData.get("leverage")
      ? parseFloat(formData.get("leverage") as string)
      : 1,
    stopLoss: formData.get("stopLoss")
      ? parseFloat(formData.get("stopLoss") as string)
      : null,
    takeProfit: formData.get("takeProfit")
      ? parseFloat(formData.get("takeProfit") as string)
      : null,
    pnl: formData.get("pnl")
      ? parseFloat(formData.get("pnl") as string)
      : null,
    pnlPercent: formData.get("pnlPercent")
      ? parseFloat(formData.get("pnlPercent") as string)
      : null,
    fees: formData.get("fees")
      ? parseFloat(formData.get("fees") as string)
      : 0,
    setupReason: (formData.get("setupReason") as string) || null,
    psychology: (formData.get("psychology") as string) || null,
    marketCondition: (formData.get("marketCondition") as string) || null,
    confidenceLevel: formData.get("confidenceLevel")
      ? parseInt(formData.get("confidenceLevel") as string)
      : null,
    notes: (formData.get("notes") as string) || null,
    exchangeId: (formData.get("exchangeId") as string) || null,
    setupId: (formData.get("setupId") as string) || null,
    entryDate: formData.get("entryDate")
      ? new Date(formData.get("entryDate") as string)
      : new Date(),
    exitDate: formData.get("exitDate")
      ? new Date(formData.get("exitDate") as string)
      : null,
  };

  await prisma.trade.create({ data });
  revalidatePath("/dashboard");
}

export async function deleteTrade(tradeId: string) {
  const userId = await getAuthUserId();

  await prisma.trade.deleteMany({
    where: { id: tradeId, userId },
  });

  revalidatePath("/dashboard");
}

// ─── Setup actions ───────────────────────────────────────────────────────────

export async function createSetup(formData: FormData) {
  const userId = await getAuthUserId();

  await prisma.setup.create({
    data: {
      userId,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      rules: (formData.get("rules") as string) || null,
      color: (formData.get("color") as string) || "#3b82f6",
    },
  });

  revalidatePath("/dashboard");
}

export async function updateSetup(setupId: string, formData: FormData) {
  const userId = await getAuthUserId();

  await prisma.setup.updateMany({
    where: { id: setupId, userId },
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      rules: (formData.get("rules") as string) || null,
      color: (formData.get("color") as string) || "#3b82f6",
    },
  });

  revalidatePath("/dashboard");
}

export async function deleteSetup(setupId: string) {
  const userId = await getAuthUserId();

  await prisma.setup.deleteMany({
    where: { id: setupId, userId },
  });

  revalidatePath("/dashboard");
}

// ─── Exchange actions ────────────────────────────────────────────────────────

export async function createExchange(formData: FormData) {
  const userId = await getAuthUserId();

  await prisma.exchange.create({
    data: {
      userId,
      name: formData.get("name") as string,
      apiKey: formData.get("apiKey") as string,
      apiSecret: formData.get("apiSecret") as string,
      passphrase: (formData.get("passphrase") as string) || null,
    },
  });

  revalidatePath("/dashboard");
}

export async function deleteExchange(exchangeId: string) {
  const userId = await getAuthUserId();

  await prisma.exchange.deleteMany({
    where: { id: exchangeId, userId },
  });

  revalidatePath("/dashboard");
}

// ─── User settings ───────────────────────────────────────────────────────────

export async function updateUserSettings(formData: FormData) {
  const userId = await getAuthUserId();

  await prisma.user.update({
    where: { id: userId },
    data: {
      locale: (formData.get("locale") as string) || undefined,
      theme: (formData.get("theme") as string) || undefined,
    },
  });

  revalidatePath("/dashboard");
}

// ─── Chat actions ────────────────────────────────────────────────────────────

export async function createChatSession() {
  const userId = await getAuthUserId();

  const session = await prisma.chatSession.create({
    data: {
      userId,
      title: "New Chat",
    },
  });

  return session;
}

export async function sendChatMessage(
  chatSessionId: string,
  content: string
) {
  const userId = await getAuthUserId();

  // Verify session belongs to user
  const chatSession = await prisma.chatSession.findFirst({
    where: { id: chatSessionId, userId },
  });

  if (!chatSession) {
    throw new Error("Chat session not found");
  }

  // Save user message
  await prisma.chatMessage.create({
    data: {
      chatSessionId,
      role: "user",
      content,
    },
  });

  // Get user's recent trades for context
  const recentTrades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      symbol: true,
      side: true,
      status: true,
      entryPrice: true,
      exitPrice: true,
      pnl: true,
      pnlPercent: true,
      setupReason: true,
      psychology: true,
      marketCondition: true,
      confidenceLevel: true,
      entryDate: true,
      exitDate: true,
    },
  });

  // Generate AI response (placeholder - implement with actual AI API)
  const aiResponse = generateAIResponse(content, recentTrades);

  // Save AI response
  const assistantMessage = await prisma.chatMessage.create({
    data: {
      chatSessionId,
      role: "assistant",
      content: aiResponse,
    },
  });

  // Update session title if it's the first message
  const messageCount = await prisma.chatMessage.count({
    where: { chatSessionId },
  });

  if (messageCount <= 2) {
    await prisma.chatSession.update({
      where: { id: chatSessionId },
      data: { title: content.slice(0, 50) },
    });
  }

  revalidatePath("/dashboard");

  return assistantMessage;
}

// Simple AI response generator (replace with actual AI API integration)
function generateAIResponse(
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trades: any[]
): string {
  const lowerMessage = message.toLowerCase();

  if (trades.length === 0) {
    return "I don't see any trades recorded yet. Start by adding some trades to your journal, and I'll be able to provide insights about your trading performance, patterns, and areas for improvement.";
  }

  const totalTrades = trades.length;
  const closedTrades = trades.filter((t) => t.status === "closed");
  const winningTrades = closedTrades.filter((t) => t.pnl && t.pnl > 0);
  const winRate = closedTrades.length > 0
    ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1)
    : "N/A";
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  if (
    lowerMessage.includes("win rate") ||
    lowerMessage.includes("performance") ||
    lowerMessage.includes("how am i doing")
  ) {
    return `Based on your recent ${totalTrades} trades:\n\n- **Win Rate:** ${winRate}%\n- **Total PnL:** $${totalPnl.toFixed(2)}\n- **Winning Trades:** ${winningTrades.length}/${closedTrades.length}\n\n${parseFloat(winRate as string) >= 50
        ? "Your win rate is above 50%, which is a good foundation. Focus on improving your risk-reward ratio to maximize returns."
        : "Your win rate is below 50%. Consider reviewing your entry criteria and focusing on higher-probability setups."
      }`;
  }

  if (
    lowerMessage.includes("analyze") ||
    lowerMessage.includes("insight") ||
    lowerMessage.includes("review")
  ) {
    const symbols = [...new Set(trades.map((t) => t.symbol))];
    const sides = trades.reduce(
      (acc, t) => {
        acc[t.side] = (acc[t.side] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return `Here's a quick analysis of your recent trading:\n\n**Overview:**\n- ${totalTrades} trades across ${symbols.length} symbols (${symbols.slice(0, 5).join(", ")})\n- Win rate: ${winRate}%\n- Net PnL: $${totalPnl.toFixed(2)}\n- Long trades: ${sides["long"] || 0} | Short trades: ${sides["short"] || 0}\n\n**Recommendations:**\n1. Review your losing trades for common patterns\n2. Consider journaling your emotional state before each trade\n3. Track which setups have the highest win rate\n4. Set clear stop-loss levels before entering positions`;
  }

  return `I can help you analyze your trading performance! Here are some things you can ask me:\n\n- "How is my win rate?"\n- "Analyze my recent trades"\n- "What are my best performing setups?"\n- "Review my risk management"\n\nYou have ${totalTrades} trades recorded. Your current win rate is ${winRate}% with a total PnL of $${totalPnl.toFixed(2)}.`;
}

// ─── Journal trade (for synced trades) ───────────────────────────────────────

export async function journalTrade(data: {
  tradeId: string;
  setupId: string | null;
  customSetupName: string | null; // if user types a new setup name
  confidenceLevel: number | null;
  marketCondition: string | null;
  setupReason: string | null;
  psychology: string | null;
  notes: string | null;
}) {
  const userId = await getAuthUserId();

  // Verify trade belongs to user
  const trade = await prisma.trade.findFirst({
    where: { id: data.tradeId, userId },
  });

  if (!trade) {
    throw new Error("Trade not found");
  }

  let setupId = data.setupId;

  // If user typed a custom setup name, create it
  if (!setupId && data.customSetupName?.trim()) {
    const newSetup = await prisma.setup.create({
      data: {
        userId,
        name: data.customSetupName.trim(),
        color: "#3b82f6",
      },
    });
    setupId = newSetup.id;
  }

  await prisma.trade.update({
    where: { id: data.tradeId },
    data: {
      setupId: setupId || null,
      confidenceLevel: data.confidenceLevel,
      marketCondition: data.marketCondition,
      setupReason: data.setupReason,
      psychology: data.psychology,
      notes: data.notes,
      needsJournal: false,
    },
  });

  revalidatePath("/dashboard");
}

// ─── Skip journal (dismiss without journaling) ──────────────────────────────

export async function skipJournalTrade(tradeId: string) {
  const userId = await getAuthUserId();

  await prisma.trade.updateMany({
    where: { id: tradeId, userId },
    data: { needsJournal: false },
  });

  revalidatePath("/dashboard");
}

// ─── Close trade journal ────────────────────────────────────────────────────

export async function closeTradeJournal(data: {
  tradeId: string;
  exitReason: string | null;
  exitPsychology: string | null;
  mistakes: string | null;
  lessons: string | null;
}) {
  const userId = await getAuthUserId();

  const trade = await prisma.trade.findFirst({
    where: { id: data.tradeId, userId },
  });

  if (!trade) {
    throw new Error("Trade not found");
  }

  await prisma.trade.update({
    where: { id: data.tradeId },
    data: {
      exitReason: data.exitReason,
      exitPsychology: data.exitPsychology,
      mistakes: data.mistakes,
      lessons: data.lessons,
      status: "closed", // automatically mark as closed if journaling exit
    },
  });

  revalidatePath("/dashboard");
}
