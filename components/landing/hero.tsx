import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function LandingHero() {
  const t = await getTranslations("landing.hero");

  return (
    <section className="relative px-4 pt-20 pb-16 sm:px-6 sm:pt-32 sm:pb-24 lg:px-8">
      <div className="mx-auto max-w-5xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
          <Sparkles className="h-3.5 w-3.5 text-success" />
          <span className="text-muted-foreground">
            {t("badge")}
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          <span className="block">{t("titleLine1")}</span>
          <span className="block mt-1 text-foreground">
            {t("titleLine2")}
          </span>
        </h1>

        {/* Subheading */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {t("description")}
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/login">
            <Button
              size="lg"
              className="h-12 px-8 text-base bg-foreground text-background hover:bg-foreground/90 border-0"
            >
              {t("cta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              {t("secondaryCta")}
            </Button>
          </a>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-sm text-muted-foreground">
          {t("socialProof")}
        </p>

        {/* Dashboard preview */}
        <div className="mt-16 overflow-hidden rounded-[6px] border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-[#333333]" />
            <div className="h-3 w-3 rounded-full bg-[#333333]" />
            <div className="h-3 w-3 rounded-full bg-[#333333]" />
            <span className="ml-2 text-xs text-muted-foreground font-mono">
              {t("previewUrl")}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3 p-6">
            {/* Mini analytics cards */}
            <div className="rounded-[5px] border border-border bg-background p-4 text-left">
              <p className="text-xs text-muted-foreground">{t("previewWinRate")}</p>
              <p className="mt-1 text-2xl font-bold font-mono text-success">68.4%</p>
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div className="h-full w-[68%] rounded-full bg-success" />
              </div>
            </div>
            <div className="rounded-[5px] border border-border bg-background p-4 text-left">
              <p className="text-xs text-muted-foreground">{t("previewTotalPnl")}</p>
              <p className="mt-1 text-2xl font-bold font-mono text-success">+$12,847</p>
              <p className="mt-2 text-xs text-success">{t("previewThisMonth")}</p>
            </div>
            <div className="rounded-[5px] border border-border bg-background p-4 text-left">
              <p className="text-xs text-muted-foreground">{t("previewTotalTrades")}</p>
              <p className="mt-1 text-2xl font-bold font-mono">142</p>
              <p className="mt-2 text-xs text-muted-foreground">{t("previewLast30Days")}</p>
            </div>
            <div className="rounded-[5px] border border-border bg-background p-4 text-left">
              <p className="text-xs text-muted-foreground">{t("previewAvgRR")}</p>
              <p className="mt-1 text-2xl font-bold font-mono text-foreground">2.4:1</p>
              <p className="mt-2 text-xs text-muted-foreground">{t("previewAboveTarget")}</p>
            </div>

            {/* Chart placeholder */}
            <div className="col-span-3 rounded-[5px] border border-border bg-background p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">{t("previewEquityCurve")}</p>
                <span className="text-xs text-muted-foreground font-mono">30D</span>
              </div>
              <div className="flex items-end gap-1 h-32">
                {[40, 45, 35, 50, 48, 55, 52, 60, 58, 65, 62, 70, 68, 72, 75, 73, 78, 80, 76, 82, 85, 83, 88, 90, 87, 92, 95, 93, 97, 100].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-success/30 transition-all"
                      style={{ height: `${h}%` }}
                    />
                  )
                )}
              </div>
            </div>

            {/* AI chat preview */}
            <div className="col-span-1 rounded-[5px] border border-border bg-background p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-success" />
                <p className="text-sm font-medium">{t("previewAiChat")}</p>
              </div>
              <div className="space-y-2">
                <div className="rounded-[4px] bg-muted p-2 text-[10px] text-muted-foreground">
                  {t("previewAnalyze")}
                </div>
                <div className="rounded-[4px] bg-success/5 border border-success/10 p-2 text-[10px] text-muted-foreground">
                  {t("previewAiResponse")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
