import {
  BarChart3,
  Brain,
  Calendar,
  FileText,
  Link2,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Comprehensive Trade Journal",
    description:
      "Record every detail of your trades - entry/exit prices, PnL, setup reasons, psychology, market conditions, and more.",
  },
  {
    icon: Brain,
    title: "AI-Powered Analytics",
    description:
      "Chat with AI to get insights about your trading patterns, identify weaknesses, and receive personalized improvement suggestions.",
  },
  {
    icon: BarChart3,
    title: "Advanced Dashboard",
    description:
      "Visualize your performance with real-time analytics, equity curves, win rates, and risk-reward ratios at a glance.",
  },
  {
    icon: Calendar,
    title: "PnL Calendar",
    description:
      "See your daily profits and losses on an intuitive calendar view. Spot winning and losing streaks instantly.",
  },
  {
    icon: Link2,
    title: "Exchange Integration",
    description:
      "Connect multiple exchanges via API keys. Import trades automatically from Binance, Bybit, OKX, and more.",
  },
  {
    icon: Shield,
    title: "Custom Trade Setups",
    description:
      "Create and manage your favorite trading setups. Tag trades with setups to track which strategies perform best.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-blue-500">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to
            <br />
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
              master your trading
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A complete toolkit designed for serious traders who want to track,
            analyze, and continuously improve their performance.
          </p>
        </div>

        {/* Features grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-xl border border-border/40 bg-card/30 p-6 backdrop-blur-sm transition-all hover:border-border/80 hover:bg-card/60"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-500">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
