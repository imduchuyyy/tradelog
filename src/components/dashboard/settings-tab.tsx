"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Globe,
  Moon,
  Monitor,
  Sun,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Link2,
} from "lucide-react";
import {
  createExchange,
  deleteExchange,
  updateUserSettings,
} from "@/app/actions";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
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
  exchanges: any[];
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "vi", label: "Tiếng Việt" },
];

const THEMES = [
  { code: "light", label: "Light", icon: Sun },
  { code: "dark", label: "Dark", icon: Moon },
  { code: "system", label: "System", icon: Monitor },
];

export function SettingsTab({ user, exchanges }: SettingsTabProps) {
  const { setTheme, theme: currentTheme } = useTheme();
  const [addExchangeOpen, setAddExchangeOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const t = useTranslations("dashboard.settingsTab");
  const tCommon = useTranslations("common");

  const toggleSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Language */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {t("language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              await updateUserSettings(formData);
            }}
          >
            <input type="hidden" name="theme" value={user.theme} />
            <div className="flex gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="submit"
                  name="locale"
                  value={lang.code}
                  className={cn(
                    "rounded-[5px] border px-4 py-2 text-sm font-medium transition-colors",
                    user.locale === lang.code
                      ? "border-foreground/30 bg-muted text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4 text-muted-foreground" />
            {t("theme")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {THEMES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.code}
                  onClick={() => setTheme(t.code)}
                  className={cn(
                    "flex items-center gap-2 rounded-[5px] border px-4 py-2 text-sm font-medium transition-colors",
                    currentTheme === t.code
                      ? "border-foreground/30 bg-muted text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tCommon(t.code)}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Exchanges */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            {t("exchanges")}
          </CardTitle>
          <Dialog open={addExchangeOpen} onOpenChange={setAddExchangeOpen}>
            <DialogTrigger
              render={
                <Button
                  size="sm"
                  className="gap-2 bg-foreground text-background hover:bg-foreground/90 border-0"
                />
              }
            >
              <Plus className="h-3.5 w-3.5" />
              {t("addExchange")}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("connectExchange")}</DialogTitle>
              </DialogHeader>
              <form
                action={async (formData) => {
                  await createExchange(formData);
                  setAddExchangeOpen(false);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="exchange-name">{t("exchangeName")} *</Label>
                  <select
                    id="exchange-name"
                    name="name"
                    required
                    className="flex h-8 w-full rounded-[5px] border border-border bg-background px-3 text-sm"
                  >
                    <option value="Binance">Binance</option>
                    <option value="Bybit">Bybit</option>
                    <option value="OKX">OKX</option>
                    <option value="Bitget">Bitget</option>
                    <option value="KuCoin">KuCoin</option>
                    <option value="Coinbase">Coinbase</option>
                    <option value="Kraken">Kraken</option>
                    <option value="dYdX">dYdX</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">{t("apiKey")} *</Label>
                  <Input
                    id="api-key"
                    name="apiKey"
                    type="password"
                    placeholder="Your API key"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-secret">{t("apiSecret")} *</Label>
                  <Input
                    id="api-secret"
                    name="apiSecret"
                    type="password"
                    placeholder="Your API secret"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passphrase">
                    {t("passphrase")}{" "}
                    <span className="text-muted-foreground">({t("passphraseOptional")})</span>
                  </Label>
                  <Input
                    id="passphrase"
                    name="passphrase"
                    type="password"
                    placeholder="Required by some exchanges"
                  />
                </div>
                <div className="rounded-[5px] border border-border bg-muted p-3">
                  <p className="text-xs text-muted-foreground">
                    {t("apiWarning")}
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-foreground text-background hover:bg-foreground/90 border-0"
                >
                  {t("connectButton")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {exchanges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Link2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {t("noExchanges")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {exchanges.map((exchange: any) => (
                <div
                  key={exchange.id}
                  className="flex items-center justify-between rounded-[5px] border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[5px] border border-border bg-card">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{exchange.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-xs text-muted-foreground font-mono">
                          {showSecrets[exchange.id]
                            ? exchange.apiKey
                            : `${exchange.apiKey.slice(0, 6)}${"*".repeat(12)}`}
                        </code>
                        <button
                          onClick={() => toggleSecret(exchange.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {showSecrets[exchange.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs border-success/30 text-success"
                    >
                      {t("connected")}
                    </Badge>
                    <form action={deleteExchange.bind(null, exchange.id)}>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        type="submit"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Info */}
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
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                user.plan === "pro"
                  ? "border-success/30 text-success"
                  : user.plan === "trial"
                  ? "border-border text-foreground"
                  : "border-border"
              )}
            >
              {user.plan === "pro"
                ? t("pro")
                : user.plan === "trial"
                ? "Trial"
                : t("free")}
            </Badge>
          </div>
          {user.plan === "trial" && user.trialEndsAt && (
            <>
              <Separator className="bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("trialEnds")}
                </span>
                <span className="text-sm font-mono">
                  {new Date(user.trialEndsAt).toLocaleDateString()}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
