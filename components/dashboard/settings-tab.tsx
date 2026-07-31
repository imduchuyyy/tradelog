"use client";

import { useTheme } from "next-themes";
import { Globe, Monitor, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  const { setTheme, theme: currentTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Language
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={async () => {
                  const formData = new FormData();
                  formData.set("locale", language.code);
                  formData.set("theme", user.theme);
                  await updateUserSettings(formData);
                  router.replace(pathname, { locale: language.code });
                }}
                className={cn(
                  "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                  user.locale === language.code
                    ? "border-foreground/30 bg-muted text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
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
            Theme
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
                  {theme.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm">{user.email}</span>
          </div>
          <Separator className="bg-border" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <Badge variant="outline" className="text-xs capitalize">{user.plan}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
