export function LandingStats() {
  return (
    <section id="analytics" className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-success">
            Analytics
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Data-driven trading decisions
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Track the metrics that matter. Understand your edge and eliminate
            emotional trading.
          </p>
        </div>

        {/* Stats grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Performance Tracking",
              value: "Real-time",
              detail: "Instant PnL updates",
            },
            {
              label: "Trade Metrics",
              value: "20+",
              detail: "Fields per trade",
            },
            {
              label: "AI Insights",
              value: "24/7",
              detail: "Always available",
            },
            {
              label: "Exchanges",
              value: "10+",
              detail: "Supported platforms",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center"
            >
              <p className="text-4xl font-bold font-mono text-foreground">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium">{stat.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>

        {/* Feature showcase */}
        <div className="mt-20 grid gap-6 lg:grid-cols-2">
          {/* AI analysis card */}
          <div className="rounded-[6px] border border-border bg-card p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_10px_rgba(0,255,170,0.3)]" />
              <span className="text-sm font-medium">AI Trade Analysis</span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="rounded-[4px] bg-background border border-border p-3">
                <span className="text-muted-foreground">&gt; </span>
                <span>analyze my BTCUSDT trades this week</span>
              </div>
              <div className="rounded-[4px] bg-success/5 border border-success/10 p-3 text-muted-foreground leading-relaxed">
                <span className="text-success font-semibold">TradeLog AI:</span>{" "}
                You took 8 BTC trades this week with a 62.5% win rate. Your best
                entries were on pullbacks to the 4H EMA21 (3/3 wins). Consider
                avoiding counter-trend trades during high-volatility news
                events - your 2 largest losses came from those setups.
              </div>
            </div>
          </div>

          {/* Setup tracking card */}
          <div className="rounded-[6px] border border-border bg-card p-7">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Setup Performance</span>
              <span className="text-xs text-muted-foreground font-mono">Last 30 days</span>
            </div>
            <div className="space-y-3">
              {[
                {
                  name: "Breakout",
                  winRate: 72,
                  trades: 18,
                  color: "bg-success",
                },
                {
                  name: "EMA Pullback",
                  winRate: 65,
                  trades: 23,
                  color: "bg-foreground",
                },
                {
                  name: "Range S/R",
                  winRate: 58,
                  trades: 12,
                  color: "bg-muted-foreground",
                },
                {
                  name: "Counter Trend",
                  winRate: 35,
                  trades: 8,
                  color: "bg-destructive",
                },
              ].map((setup) => (
                <div key={setup.name} className="flex items-center gap-3">
                  <div className="w-28 text-sm">{setup.name}</div>
                  <div className="flex-1 h-2 rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${setup.color}`}
                      style={{ width: `${setup.winRate}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm font-mono font-medium">
                    {setup.winRate}%
                  </div>
                  <div className="w-16 text-right text-xs text-muted-foreground">
                    {setup.trades} trades
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
