import {
  BarChart3,
  Brain,
  Calendar,
  FileText,
  Link2,
  Shield,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

const featureIcons = [FileText, Brain, BarChart3, Calendar, Link2, Shield];
const featureKeys = [
  "journal",
  "analytics",
  "dashboard",
  "calendar",
  "exchanges",
  "setups",
] as const;

export async function LandingFeatures() {
  const t = await getTranslations("landing.features");

  return (
    <section id="features" className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-success">
            {t("sectionLabel")}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("title")}
            <br />
            <span className="text-foreground">
              {t("titleHighlight")}
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Features grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((key, index) => {
            const Icon = featureIcons[index];
            return (
              <div
                key={key}
                className="group relative rounded-[6px] border border-border bg-card p-7 transition-all hover:border-[#333333]"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-[5px] border border-border bg-background text-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{t(key)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`${key}Desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
