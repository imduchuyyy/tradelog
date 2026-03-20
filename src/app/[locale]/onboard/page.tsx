import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardChat } from "@/components/onboard/onboard-chat";

export default async function OnboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      onboarded: true,
    },
  });

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Already onboarded, go to dashboard
  if (user.onboarded) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <OnboardChat
      user={{ id: user.id, name: user.name, image: user.image }}
      locale={locale}
    />
  );
}
