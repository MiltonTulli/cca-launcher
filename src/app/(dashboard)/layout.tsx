"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { TALLY_LAUNCH_FACTORY_ADDRESSES } from "@/config/contracts";
import { ZERO_ADDRESS } from "@/lib/utils";
import { AlertCircle, Plus, List, Globe, ShoppingCart, type LucideIcon } from "lucide-react";
import { NetworkBadge } from "@/components/NetworkBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";
import { WalletButton } from "@/components/WalletButton";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

type Mode = "launches" | "auctions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const contractAddress = TALLY_LAUNCH_FACTORY_ADDRESSES[chainId];
  const isDeployed = !!contractAddress && contractAddress !== ZERO_ADDRESS;

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark" ? "/tally-dark.svg" : "/tally.svg";

  // Auto-detect active mode from route
  const activeMode: Mode = pathname.startsWith("/auctions") ? "auctions" : "launches";

  const navItemsByMode: Record<Mode, NavItem[]> = {
    launches: [
      { label: "New Launch", href: "/launches/new", icon: Plus },
      { label: "All Launches", href: "/launches", icon: Globe },
      ...(isConnected
        ? [{ label: "My Launches", href: "/my-launches", icon: List }]
        : []),
    ],
    auctions: [
      { label: "All Auctions", href: "/auctions", icon: ShoppingCart },
    ],
  };

  const currentNavItems = navItemsByMode[activeMode];

  function isActive(href: string) {
    if (href === "/launches") {
      return (
        (pathname === "/launches" || pathname.startsWith("/launches/")) &&
        pathname !== "/launches/new"
      );
    }
    if (href === "/launches/new") {
      return pathname === "/launches/new";
    }
    if (href === "/auctions") {
      return pathname === "/auctions" || pathname.startsWith("/auctions/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  function handleToggle(mode: Mode) {
    if (mode === activeMode) return;
    router.push(mode === "launches" ? "/launches" : "/auctions");
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/launches" className="flex items-center">
            <Image
              src={logoSrc}
              alt="Tally"
              width={100}
              height={23}
              className="h-6 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            {!isDeployed && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                <AlertCircle className="h-3.5 w-3.5" />
                Unsupported network
              </div>
            )}
            <NetworkBadge />
            <WalletButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile: toggle + nav */}
      <div className="md:hidden w-full border-b">
        {/* Mode toggle */}
        <div className="flex justify-center px-3 pt-2.5 pb-1.5">
          <div className="inline-flex rounded-lg bg-muted p-1">
            <button
              onClick={() => handleToggle("launches")}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                activeMode === "launches"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Launches
            </button>
            <button
              onClick={() => handleToggle("auctions")}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                activeMode === "auctions"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Auctions
            </button>
          </div>
        </div>
        {/* Nav items */}
        <div className="flex overflow-x-auto">
          {currentNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                isActive(item.href)
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar - hidden on mobile */}
        <aside className="hidden md:flex w-56 flex-col border-r p-3">
          {/* Segmented toggle */}
          <div className="rounded-lg bg-muted p-1 flex mb-4">
            <button
              onClick={() => handleToggle("launches")}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                activeMode === "launches"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Launches
            </button>
            <button
              onClick={() => handleToggle("auctions")}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                activeMode === "auctions"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Auctions
            </button>
          </div>

          <nav className="space-y-0.5">
            {currentNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-6 sm:py-10 max-w-6xl">
            {/* Network Warning */}
            {!isDeployed && (
              <div className="max-w-2xl mx-auto mb-6">
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">Network Not Supported</h3>
                    <p className="text-xs text-amber-700 mt-1">
                      TallyLaunchFactory is not deployed on this network. Please switch to a supported network.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {children}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
