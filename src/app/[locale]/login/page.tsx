import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { BarChart3 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user?.id) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-card border-r border-border p-12">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[5px] border border-border bg-background">
              <BarChart3 className="h-5 w-5 text-foreground" />
            </div>
            <span className="text-xl font-bold">TradeLog</span>
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Track. Analyze.
            <br />
            Improve.
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Join traders who use AI-powered analytics to understand their edge
            and consistently improve their trading performance.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold font-mono">20+</p>
              <p className="text-sm text-muted-foreground">Trade metrics</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono">AI</p>
              <p className="text-sm text-muted-foreground">Powered insights</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-mono">10+</p>
              <p className="text-sm text-muted-foreground">Exchanges</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} TradeLog. All rights reserved.
        </p>
      </div>

      {/* Right side - login form */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[5px] border border-border bg-card">
                <BarChart3 className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-xl font-bold">TradeLog</span>
            </Link>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your account to continue trading
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="#" className="underline hover:text-foreground">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-foreground">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
