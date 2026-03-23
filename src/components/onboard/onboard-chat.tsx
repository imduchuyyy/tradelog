"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  Link2,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Shield,
  Plus,
  Zap,
} from "lucide-react";
import { onboardConnectExchange, completeOnboarding } from "@/app/actions/onboard";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface OnboardConnectProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  locale: string;
}

const EXCHANGES = ["Binance", "Bybit", "OKX", "Bitget", "KuCoin", "Coinbase", "Kraken", "dYdX"];

interface ConnectedExchange {
  id: string;
  name: string;
}

export function OnboardConnect({ user, locale }: OnboardConnectProps) {
  const router = useRouter();
  const [finishing, setFinishing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<ConnectedExchange[]>([]);

  // Form state
  const [exchangeName, setExchangeName] = useState("Binance");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [showForm, setShowForm] = useState(true);

  const needsPassphrase = ["OKX", "KuCoin"].includes(exchangeName);

  const handleConnect = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const result = await onboardConnectExchange({
        name: exchangeName,
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        passphrase: needsPassphrase ? passphrase.trim() : undefined,
      });
      setConnected((prev) => [...prev, { id: result.id, name: result.name }]);
      setApiKey("");
      setApiSecret("");
      setPassphrase("");
      setShowForm(false);
    } catch (e: any) {
      setError(e.message || "Failed to connect exchange");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    await completeOnboarding();
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden font-sans">
      {/* Header */}
      <header className="shrink-0 border-b border-border/40 bg-card/30 backdrop-blur-sm z-30">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2.5 px-4 justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              TradeLog
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-12">
          {/* Welcome */}
          <div className="text-center mb-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/20 mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Welcome, {user.name?.split(" ")[0] || "Trader"}!
            </h1>
            <p className="text-muted-foreground">
              Connect your exchange to start syncing and journaling your trades automatically.
            </p>
          </div>

          {/* Connected exchanges */}
          {connected.length > 0 && (
            <div className="space-y-2 mb-6">
              {connected.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">Connected successfully</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Exchange form */}
          {showForm ? (
            <div className="rounded-2xl border border-border/60 bg-card/50 p-6 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Link2 className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-semibold">Connect Exchange</h2>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Exchange</Label>
                <select
                  value={exchangeName}
                  onChange={(e) => setExchangeName(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-border/60 bg-background px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                >
                  {EXCHANGES.map((ex) => (
                    <option key={ex} value={ex}>{ex}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">API Key</Label>
                <Input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                  placeholder="Paste your API key"
                  className="h-10 bg-background border-border/60"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">API Secret</Label>
                <Input
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  type="password"
                  placeholder="Paste your API secret"
                  className="h-10 bg-background border-border/60"
                />
              </div>

              {needsPassphrase && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Passphrase</Label>
                  <Input
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    type="password"
                    placeholder="API passphrase"
                    className="h-10 bg-background border-border/60"
                  />
                </div>
              )}

              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  We recommend read-only API keys. Your credentials are encrypted and stored securely.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-xs text-red-500">{error}</p>
                </div>
              )}

              <Button
                onClick={handleConnect}
                disabled={loading || !apiKey.trim() || !apiSecret.trim()}
                className="w-full gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 h-11"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Connect {exchangeName}
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setShowForm(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Connect Another Exchange
              </Button>
            </div>
          )}

          {/* Finish button */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button
              onClick={handleFinish}
              disabled={finishing}
              size="lg"
              className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 px-8"
            >
              {finishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {connected.length > 0 ? "Go to Dashboard" : "Skip & Go to Dashboard"}
            </Button>
            {connected.length === 0 && (
              <p className="text-xs text-muted-foreground">
                You can always connect your exchange later from Settings.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
