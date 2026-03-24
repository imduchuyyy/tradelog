import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function LandingCTA() {
  return (
    <section id="pricing" className="relative px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[6px] border border-border bg-card p-8 sm:p-12 text-center">
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Start improving your trading today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join traders who use TradeLog to track their performance, learn
              from their mistakes, and consistently improve their results.
            </p>

            {/* Pricing card */}
            <div className="mx-auto mt-10 max-w-sm rounded-[6px] border border-border bg-background p-7">
              <p className="text-sm font-medium text-muted-foreground">
                Start with
              </p>
              <p className="mt-2 text-4xl font-bold font-mono">
                Free
                <span className="text-lg font-normal font-sans text-muted-foreground">
                  {" "}
                  / 3 days
                </span>
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-left">
                {[
                  "Unlimited trade logging",
                  "AI-powered analytics",
                  "PnL calendar view",
                  "Custom trade setups",
                  "Exchange integration",
                  "Chat with AI assistant",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-success" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block mt-6">
                <Button className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 border-0">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <p className="mt-3 text-xs text-muted-foreground">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
