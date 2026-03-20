import { setRequestLocale } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";
import { BarChart3 } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="relative flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 text-white">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <BarChart3 className="h-5 w-5 text-white" />
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
          <p className="max-w-md text-lg text-white/80">
            Join traders who use AI-powered analytics to understand their edge
            and consistently improve their trading performance.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pt-4">
            <div>
              <p className="text-3xl font-bold">20+</p>
              <p className="text-sm text-white/60">Trade metrics</p>
            </div>
            <div>
              <p className="text-3xl font-bold">AI</p>
              <p className="text-sm text-white/60">Powered insights</p>
            </div>
            <div>
              <p className="text-3xl font-bold">10+</p>
              <p className="text-sm text-white/60">Exchanges</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-white/40">
          &copy; {new Date().getFullYear()} TradeLog. All rights reserved.
        </p>
      </div>

      {/* Right side - login form */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <BarChart3 className="h-5 w-5 text-white" />
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
