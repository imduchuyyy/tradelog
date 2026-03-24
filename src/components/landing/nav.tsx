"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-border bg-card">
              <BarChart3 className="h-4 w-4 text-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              TradeLog
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#analytics"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Analytics
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </a>
          </div>

          {/* Actions */}
          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 border-0">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-4 py-4">
            <a
              href="#features"
              className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              Features
            </a>
            <a
              href="#analytics"
              className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              Analytics
            </a>
            <a
              href="#pricing"
              className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
            >
              Pricing
            </a>
            <div className="flex items-center gap-2 pt-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="w-full">
                  Log In
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90 border-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
