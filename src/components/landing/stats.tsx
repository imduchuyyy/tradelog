import { getTranslations } from "next-intl/server";

export async function LandingStats() {
  const t = await getTranslations("landing.stats");

  const stats = [
    {
      label: t("performanceTracking"),
      value: t("realTime"),
      detail: t("instantPnl"),
    },
    {
      label: t("tradeMetrics"),
      value: "20+",
      detail: t("fieldsPerTrade"),
    },
    {
      label: t("aiInsights"),
      value: "24/7",
      detail: t("alwaysAvailable"),
    },
    {
      label: t("exchanges"),
      value: "10+",
      detail: t("supportedPlatforms"),
    },
  ];

  return (
    <section id="analytics" className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-success">
            {t("sectionLabel")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Stats grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
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
              <span className="text-sm font-medium">{t("aiTradeAnalysis")}</span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="rounded-[4px] bg-background border border-border p-3">
                <span className="text-muted-foreground">&gt; </span>
                <span>{t("aiPrompt")}</span>
              </div>
              <div className="rounded-[4px] bg-success/5 border border-success/10 p-3 text-muted-foreground leading-relaxed">
                <span className="text-success font-semibold">{t("aiResponseLabel")}</span>{" "}
                {t("aiResponseText")}
              </div>
            </div>
          </div>

          {/* Setup tracking card */}
          <div className="rounded-[6px] border border-border bg-card p-7">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">{t("setupPerformance")}</span>
              <span className="text-xs text-muted-foreground font-mono">{t("last30Days")}</span>
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
                    {setup.trades} {t("trades")}
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
