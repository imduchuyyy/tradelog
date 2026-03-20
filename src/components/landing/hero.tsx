import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative px-4 pt-20 pb-16 sm:px-6 sm:pt-32 sm:pb-24 lg:px-8">
      <div className="mx-auto max-w-5xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-1.5 text-sm backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-muted-foreground">
            AI-Powered Trade Analytics
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="block">Turn Your Trades</span>
          <span className="block mt-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Into Insights
          </span>
        </h1>

        {/* Subheading */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Track, analyze, and improve your trading performance with AI-powered
          analytics. Record every trade, understand your patterns, and make
          data-driven decisions.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/login">
            <Button
              size="lg"
              className="h-12 px-8 text-base bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 border-0 shadow-lg shadow-blue-500/20"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              See How It Works
            </Button>
          </a>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-sm text-muted-foreground">
          3-day free trial &middot; No credit card required
        </p>

        {/* Dashboard preview */}
        <div className="mt-16 overflow-hidden rounded-xl border border-border/60 bg-card/50 shadow-2xl shadow-black/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-500/60" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <div className="h-3 w-3 rounded-full bg-green-500/60" />
            <span className="ml-2 text-xs text-muted-foreground font-mono">
              tradelog.app/dashboard
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3 p-6">
            {/* Mini analytics cards */}
            <div className="rounded-lg border border-border/40 bg-background/60 p-4 text-left">
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className="mt-1 text-2xl font-bold text-green-500">68.4%</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
              </div>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/60 p-4 text-left">
              <p className="text-xs text-muted-foreground">Total PnL</p>
              <p className="mt-1 text-2xl font-bold text-green-500">+$12,847</p>
              <p className="mt-2 text-xs text-green-500">+23.5% this month</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/60 p-4 text-left">
              <p className="text-xs text-muted-foreground">Total Trades</p>
              <p className="mt-1 text-2xl font-bold">142</p>
              <p className="mt-2 text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/60 p-4 text-left">
              <p className="text-xs text-muted-foreground">Avg R:R</p>
              <p className="mt-1 text-2xl font-bold text-blue-500">2.4:1</p>
              <p className="mt-2 text-xs text-blue-500">Above target</p>
            </div>

            {/* Chart placeholder */}
            <div className="col-span-3 rounded-lg border border-border/40 bg-background/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Equity Curve</p>
                <span className="text-xs text-muted-foreground">30D</span>
              </div>
              <div className="flex items-end gap-1 h-32">
                {[40, 45, 35, 50, 48, 55, 52, 60, 58, 65, 62, 70, 68, 72, 75, 73, 78, 80, 76, 82, 85, 83, 88, 90, 87, 92, 95, 93, 97, 100].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-blue-500/60 to-blue-400/30 transition-all"
                      style={{ height: `${h}%` }}
                    />
                  )
                )}
              </div>
            </div>

            {/* AI chat preview */}
            <div className="col-span-1 rounded-lg border border-border/40 bg-background/60 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                <p className="text-sm font-medium">AI Chat</p>
              </div>
              <div className="space-y-2">
                <div className="rounded-lg bg-muted/50 p-2 text-[10px] text-muted-foreground">
                  Analyze my recent trades...
                </div>
                <div className="rounded-lg bg-blue-500/10 p-2 text-[10px] text-blue-400">
                  Your win rate improved 12% this week. Best setup: breakout on 4H...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
