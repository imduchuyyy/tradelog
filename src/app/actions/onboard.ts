"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function getAuthUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

// ─── Onboard: Connect Exchange ──────────────────────────────────────────────

export async function onboardConnectExchange(data: {
  name: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
}) {
  const userId = await getAuthUserId();

  const exchange = await prisma.exchange.create({
    data: {
      userId,
      name: data.name,
      apiKey: data.apiKey,
      apiSecret: data.apiSecret,
      passphrase: data.passphrase || null,
    },
  });

  return { id: exchange.id, name: exchange.name };
}

// ─── Onboard: Create Setup ──────────────────────────────────────────────────

export async function onboardCreateSetup(data: {
  name: string;
  description?: string;
  rules?: string;
  color?: string;
}) {
  const userId = await getAuthUserId();

  const setup = await prisma.setup.create({
    data: {
      userId,
      name: data.name,
      description: data.description || null,
      rules: data.rules || null,
      color: data.color || "#3b82f6",
    },
  });

  return { id: setup.id, name: setup.name, color: setup.color };
}

// ─── Onboard: Complete ──────────────────────────────────────────────────────

export async function completeOnboarding() {
  const userId = await getAuthUserId();

  await prisma.user.update({
    where: { id: userId },
    data: { onboarded: true },
  });

  revalidatePath("/dashboard");
}
