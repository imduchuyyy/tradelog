import { setRequestLocale } from "next-intl/server";
import { LandingHero } from "@/components/landing/hero";
import { LandingFeatures } from "@/components/landing/features";
import { LandingStats } from "@/components/landing/stats";
import { LandingCTA } from "@/components/landing/cta";
import { LandingNav } from "@/components/landing/nav";
import { LandingFooter } from "@/components/landing/footer";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative min-h-screen">
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingStats />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
