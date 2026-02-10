"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { TALLY_LAUNCH_FACTORY_ADDRESSES } from "@/config/contracts";
import { ZERO_ADDRESS } from "@/lib/utils";
import { AlertCircle, Plus, List, Globe, ShoppingCart, type LucideIcon } from "lucide-react";
import { NetworkBadge } from "@/components/NetworkBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const contractAddress = TALLY_LAUNCH_FACTORY_ADDRESSES[chainId];
  const isDeployed = !!contractAddress && contractAddress !== ZERO_ADDRESS;

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark" ? "/tally-dark.svg" : "/tally.svg";

  const navSections: NavSection[] = [
    {
      label: "LAUNCH",
      items: [
        { label: "New Launch", href: "/new", icon: Plus },
        { label: "All Launches", href: "/launches", icon: Globe },
        ...(isConnected
          ? [{ label: "My Launches", href: "/my-launches", icon: List }]
          : []),
      ],
    },
    {
      label: "SALE",
      items: [
        { label: "All Sales", href: "/sales", icon: ShoppingCart },
      ],
    },
  ];

  const allNavItems = navSections.flatMap((s) => s.items);

  function isActive(href: string) {
    if (href === "/launches") {
      return pathname === "/launches" || pathname.startsWith("/launches/");
    }
    if (href === "/sales") {
      return pathname === "/sales" || pathname.startsWith("/sales/");
    }
    return pathname === href || pathname.startsWith(href + "/");
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
            <appkit-button balance="hide" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden w-full border-b">
        <div className="flex overflow-x-auto">
          {allNavItems.map((item) => (
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
          <nav className="space-y-4">
            {navSections.map((section) => (
              <div key={section.label}>
                <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
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
                </div>
              </div>
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
