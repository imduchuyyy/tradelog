"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isEmptyBlockNoteDocument, parseBlockNoteDocument } from "@/lib/blocknote-note";
import { parseSetupTags, serializeSetupTags } from "@/lib/trade-setup";
import { getSessionFromDate } from "@/lib/utils";

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

function readTradeForm(formData: FormData) {
  const symbol = String(formData.get("symbol") || "").trim().toUpperCase();
  const resultValue = String(formData.get("result") || "").trim();
  const result = Number(resultValue.replace(/,/g, ""));
  const noteValue = String(formData.get("note") || "").trim();
  const note = noteValue ? parseBlockNoteDocument(noteValue) : null;
  const setup = parseSetupTags(formData.get("setup"));
  const tradeDate = new Date(String(formData.get("tradeDate") || ""));

  if (!symbol) throw new Error("Symbol is required");
  if (!resultValue) throw new Error("Result is required");
  if (!Number.isFinite(result)) throw new Error("Result must be a number");
  if (Number.isNaN(tradeDate.getTime())) throw new Error("Timestamp is required");

  return {
    symbol,
    result,
    note: note && !isEmptyBlockNoteDocument(note) ? JSON.stringify(note) : null,
    setup: serializeSetupTags(setup),
    tradeDate,
    session: getSessionFromDate(tradeDate),
  };
}

export async function createTrade(formData: FormData) {
  const userId = await getAuthUserId();
  const data = readTradeForm(formData);

  await prisma.trade.create({
    data: {
      userId,
      ...data,
    },
  });

  revalidatePath("/dashboard");
}

export async function updateTrade(tradeId: string, formData: FormData) {
  const userId = await getAuthUserId();
  const data = readTradeForm(formData);

  await prisma.trade.updateMany({
    where: { id: tradeId, userId },
    data,
  });

  revalidatePath("/dashboard");
}

export async function deleteTrade(tradeId: string) {
  const userId = await getAuthUserId();

  await prisma.trade.deleteMany({
    where: { id: tradeId, userId },
  });

  revalidatePath("/dashboard");
}

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

export async function createChatSession() {
  const userId = await getAuthUserId();

  return prisma.chatSession.create({
    data: {
      userId,
      title: "New Chat",
    },
  });
}
