import { BarChart3 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function LandingFooter() {
  const t = await getTranslations("landing.footer");

  return (
    <footer className="border-t border-border px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-border bg-card">
              <BarChart3 className="h-3.5 w-3.5 text-foreground" />
            </div>
            <span className="text-sm font-semibold">TradeLog</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              {t("terms")}
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              {t("privacy")}
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              {t("contact")}
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} TradeLog. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
