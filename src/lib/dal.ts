import "server-only";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { redirect } from "next/navigation";

export const verifySession = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return { isAuth: true, userId: session.user.id, user: session.user };
});

export const getUser = cache(async () => {
  const session = await verifySession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        locale: true,
        theme: true,
        plan: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });

    return user;
  } catch {
    console.error("Failed to fetch user");
    return null;
  }
});

export const getCurrentSession = cache(async () => {
  const session = await auth();
  return session;
});
