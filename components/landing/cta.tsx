import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

const featureKeys = [
  "unlimitedTradeLogging",
  "aiPoweredAnalytics",
  "pnlCalendarView",
  "customTradeSetups",
  "exchangeIntegration",
  "chatWithAi",
] as const;

export async function LandingCTA() {
  const t = await getTranslations("landing.cta");

  return (
    <section id="pricing" className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[6px] border border-border bg-card p-8 sm:p-12 text-center">
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {t("subtitle")}
            </p>

            {/* Pricing card */}
            <div className="mx-auto mt-10 max-w-sm rounded-[6px] border border-border bg-background p-7">
              <p className="text-sm font-medium text-muted-foreground">
                {t("startWith")}
              </p>
              <p className="mt-2 text-4xl font-bold font-mono">
                {t("free")}
                <span className="text-lg font-normal font-sans text-muted-foreground">
                  {" "}
                  {t("perDays")}
                </span>
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-left">
                {featureKeys.map((key) => (
                  <li key={key} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-success" />
                    {t(key)}
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block mt-6">
                <Button className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 border-0">
                  {t("button")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <p className="mt-3 text-xs text-muted-foreground">
                {t("noCreditCard")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
