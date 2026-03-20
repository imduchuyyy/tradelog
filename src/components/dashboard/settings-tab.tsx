"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  const toggleSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Language */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-blue-500" />
            Language
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
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    user.locale === lang.code
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-500"
                      : "border-border/40 bg-card/30 text-muted-foreground hover:bg-muted hover:text-foreground"
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
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4 text-indigo-500" />
            Theme
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
                    "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    currentTheme === t.code
                      ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-500"
                      : "border-border/40 bg-card/30 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Exchanges */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-purple-500" />
            Exchange Connections
          </CardTitle>
          <Dialog open={addExchangeOpen} onOpenChange={setAddExchangeOpen}>
            <DialogTrigger
              render={
                <Button
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
                />
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add Exchange
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Exchange</DialogTitle>
              </DialogHeader>
              <form
                action={async (formData) => {
                  await createExchange(formData);
                  setAddExchangeOpen(false);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="exchange-name">Exchange Name *</Label>
                  <select
                    id="exchange-name"
                    name="name"
                    required
                    className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm"
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
                  <Label htmlFor="api-key">API Key *</Label>
                  <Input
                    id="api-key"
                    name="apiKey"
                    type="password"
                    placeholder="Your API key"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-secret">API Secret *</Label>
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
                    Passphrase{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="passphrase"
                    name="passphrase"
                    type="password"
                    placeholder="Required by some exchanges"
                  />
                </div>
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    We recommend creating read-only API keys. Your keys are
                    stored securely and are never shared.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
                >
                  Connect Exchange
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
                No exchanges connected yet. Add your exchange API keys to import
                trades automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {exchanges.map((exchange: any) => (
                <div
                  key={exchange.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                      <Link2 className="h-4 w-4 text-purple-500" />
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
                      className="text-xs border-green-500/30 text-green-500"
                    >
                      Connected
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
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm">{user.email}</span>
          </div>
          <Separator className="bg-border/40" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Plan</span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                user.plan === "pro"
                  ? "border-green-500/30 text-green-500"
                  : user.plan === "trial"
                  ? "border-blue-500/30 text-blue-500"
                  : "border-border"
              )}
            >
              {user.plan === "pro"
                ? "Pro"
                : user.plan === "trial"
                ? "Trial"
                : "Free"}
            </Badge>
          </div>
          {user.plan === "trial" && user.trialEndsAt && (
            <>
              <Separator className="bg-border/40" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Trial ends
                </span>
                <span className="text-sm">
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
