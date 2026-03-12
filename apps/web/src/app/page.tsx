"use client";

import { ArrowRight, Plus, Rocket, ShoppingCart, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { WalletButton } from "@/components/WalletButton";

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && resolvedTheme === "dark" ? "/tally-dark.svg" : "/tally.svg";

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Image
              src={logoSrc}
              alt="Tally Launch"
              width={100}
              height={23}
              className="h-6 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auctions"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Auctions
            </Link>
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center space-y-8 py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5" />
            Powered by Uniswap V4 & CCA
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Launch tokens with
              <br />
              <span className="text-primary">fair price discovery</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Run a Continuous Clearing Auction for your token with automated liquidity bootstrapping on Uniswap V4.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auctions"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-muted transition-colors w-full sm:w-auto"
            >
              <ShoppingCart className="h-4 w-4" />
              Explore Auctions
            </Link>
            <Link
              href="/launches/create"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Create Launch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
            <div className="rounded-xl border p-5 text-left space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Rocket className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">Fair Auctions</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Continuous clearing auctions ensure fair price discovery. No front-running, no sniping.
              </p>
            </div>
            <div className="rounded-xl border p-5 text-left space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">Auto Liquidity</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Uniswap V4 pool created automatically at clearing price with configurable LP lockup.
              </p>
            </div>
            <div className="rounded-xl border p-5 text-left space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold">On-chain & Transparent</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fully on-chain state machine. Immutable config per launch. No rug-pull vectors.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
