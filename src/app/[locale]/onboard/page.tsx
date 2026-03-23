import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardConnect } from "@/components/onboard/onboard-chat";

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

  if (user.onboarded) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <OnboardConnect
      user={{ id: user.id, name: user.name, image: user.image }}
      locale={locale}
    />
  );
}
