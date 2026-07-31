import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [user, trades, chatSessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        locale: true,
        theme: true,
        plan: true,
        trialEndsAt: true,
        onboarded: true,
      },
    }),
    prisma.trade.findMany({
      where: { userId },
      orderBy: { tradeDate: "desc" },
    }),
    prisma.chatSession.findMany({
      where: { userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  // Redirect non-onboarded users to onboarding flow
  if (!user.onboarded) {
    redirect(`/${locale}/onboard`);
  }

  return (
    <DashboardShell
      user={user}
      trades={trades}
      chatSessions={chatSessions}
    />
  );
}
