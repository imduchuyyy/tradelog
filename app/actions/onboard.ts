"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function completeOnboarding() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboarded: true },
  });

  revalidatePath("/dashboard");
}
