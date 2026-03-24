"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionFromDate } from "@/lib/utils";

// ─── Auth helpers ────────────────────────────────────────────────────────────

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export async function deleteTrade(tradeId: string) {
  const userId = await getAuthUserId();

  await prisma.trade.deleteMany({
    where: { id: tradeId, userId },
  });

  revalidatePath("/dashboard");
}

// ─── Journal trade (for synced trades) ───────────────────────────────────────

export async function journalTrade(data: {
  tradeId: string;
  setupIds: string[]; // M:N setup IDs
  newSetupNames: string[]; // new setups to create
  confidenceLevel: number | null;
  disciplineLevel: number | null;
  marketCondition: string | null;
  session: string | null;
  entryTimeframe: string | null;
  riskRewardRatio: number | null;
  notes: string | null;
  exitReason: string | null;
  lessons: string | null;
  mae: number | null;
  mfe: number | null;
}) {
  const userId = await getAuthUserId();

  // Verify trade belongs to user
  const trade = await prisma.trade.findFirst({
    where: { id: data.tradeId, userId },
  });

  if (!trade) {
    throw new Error("Trade not found");
  }

  const setupIds = [...data.setupIds];

  // Create any new setups the user typed in
  const DEFAULT_COLORS = [
    "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
    "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#6366f1",
  ];
  for (let i = 0; i < data.newSetupNames.length; i++) {
    const name = data.newSetupNames[i].trim();
    if (!name) continue;
    const newSetup = await prisma.setup.create({
      data: {
        userId,
        name,
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      },
    });
    setupIds.push(newSetup.id);
  }

  // Auto-compute holdingTime from entryDate and exitDate
  let holdingTime: number | null = null;
  if (trade.entryDate && trade.exitDate) {
    holdingTime = Math.round(
      (trade.exitDate.getTime() - trade.entryDate.getTime()) / (1000 * 60)
    );
  }

  await prisma.trade.update({
    where: { id: data.tradeId },
    data: {
      confidenceLevel: data.confidenceLevel,
      disciplineLevel: data.disciplineLevel,
      marketCondition: data.marketCondition,
      session: data.session || (trade.entryDate ? getSessionFromDate(trade.entryDate) : null),
      entryTimeframe: data.entryTimeframe,
      riskRewardRatio: data.riskRewardRatio,
      notes: data.notes,
      exitReason: data.exitReason,
      lessons: data.lessons,
      mae: data.mae,
      mfe: data.mfe,
      holdingTime,
      needsJournal: false,
      isNew: false,
      // Replace all setup connections
      setups: {
        set: setupIds.map((id) => ({ id })),
      },
    },
  });

  revalidatePath("/dashboard");
}

// ─── Skip journal (dismiss without journaling) ──────────────────────────────

export async function skipJournalTrade(tradeId: string) {
  const userId = await getAuthUserId();

  await prisma.trade.updateMany({
    where: { id: tradeId, userId },
    data: { needsJournal: false, isNew: false },
  });

  revalidatePath("/dashboard");
}

// ─── Close trade journal ────────────────────────────────────────────────────

export async function closeTradeJournal(data: {
  tradeId: string;
  exitReason: string | null;
  lessons: string | null;
  disciplineLevel: number | null;
}) {
  const userId = await getAuthUserId();

  const trade = await prisma.trade.findFirst({
    where: { id: data.tradeId, userId },
  });

  if (!trade) {
    throw new Error("Trade not found");
  }

  // Auto-compute holding time from entryDate to now
  let holdingTime: number | null = null;
  const exitDate = new Date();
  if (trade.entryDate) {
    holdingTime = Math.round(
      (exitDate.getTime() - trade.entryDate.getTime()) / (1000 * 60)
    );
  }

  await prisma.trade.update({
    where: { id: data.tradeId },
    data: {
      exitReason: data.exitReason,
      lessons: data.lessons,
      disciplineLevel: data.disciplineLevel,
      holdingTime,
      exitDate,
      status: "closed",
    },
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
