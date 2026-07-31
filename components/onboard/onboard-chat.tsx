"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { completeOnboarding } from "@/app/actions/onboard";

interface OnboardConnectProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  locale: string;
}

export function OnboardConnect({ user, locale }: OnboardConnectProps) {
  const t = useTranslations("onboard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-border bg-card">
        <CardContent className="space-y-6 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-border bg-muted text-lg font-bold">
            {(user.name || "T").charAt(0).toUpperCase()}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{t("simpleJournalTitle")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("simpleJournalDescription")}
            </p>
          </div>
          <Button
            className="w-full"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await completeOnboarding();
                router.replace("/dashboard", { locale });
              });
            }}
          >
            {isPending ? t("preparing") : t("goToJournal")}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
