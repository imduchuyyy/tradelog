"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Globe, Loader2, Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { updateUserSettings } from "@/app/actions";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";

interface SettingsTabProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    locale: string;
    theme: string;
    plan: string;
    trialEndsAt: Date | null;
  };
}

const languages: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
];

const themes = [
  { code: "light", label: "Light", icon: Sun },
  { code: "dark", label: "Dark", icon: Moon },
  { code: "system", label: "System", icon: Monitor },
];

export function SettingsTab({ user }: SettingsTabProps) {
  const t = useTranslations("dashboard.settingsTab");
  const commonT = useTranslations("common");
  const toastT = useTranslations("toast");
  const { setTheme, theme: currentTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {t("language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                disabled={pendingLocale !== null}
                onClick={async () => {
                  setPendingLocale(language.code);
                  try {
                    const formData = new FormData();
                    formData.set("locale", language.code);
                    formData.set("theme", user.theme);
                    await toast.promise(updateUserSettings(formData), {
                      loading: toastT("settingsSaving"),
                      success: toastT("settingsSaved"),
                      error: toastT("settingsError"),
                    });
                    router.replace(pathname, { locale: language.code });
                  } catch {
                    // Reported by the toast above.
                  } finally {
                    setPendingLocale(null);
                  }
                }}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                  user.locale === language.code
                    ? "border-foreground/30 bg-muted text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {pendingLocale === language.code && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {language.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4 text-muted-foreground" />
            {t("theme")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {themes.map((theme) => {
              const Icon = theme.icon;
              return (
                <button
                  key={theme.code}
                  type="button"
                  onClick={() => setTheme(theme.code)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                    currentTheme === theme.code
                      ? "border-foreground/30 bg-muted text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {commonT(theme.code)}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("account")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("email")}</span>
            <span className="text-sm">{user.email}</span>
          </div>
          <Separator className="bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{t("plan")}</span>
            <Badge variant="outline" className="text-xs capitalize">{user.plan}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
