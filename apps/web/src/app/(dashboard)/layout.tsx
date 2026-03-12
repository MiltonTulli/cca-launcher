"use client";

import { List, type LucideIcon, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WalletButton } from "@/components/WalletButton";
import { useHasLaunches } from "@/hooks/useHasLaunches";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { hasLaunches } = useHasLaunches();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted && resolvedTheme === "dark" ? "/tally-dark.svg" : "/tally.svg";

  const navItems: NavItem[] = [
    { label: "Auctions", href: "/auctions", icon: ShoppingCart },
    { label: "Create", href: "/launches/create", icon: Plus },
    ...(hasLaunches ? [{ label: "My Launches", href: "/my-launches", icon: List }] : []),
  ];

  function isActive(href: string) {
    if (href === "/auctions") {
      return pathname === "/auctions" || pathname.startsWith("/auctions/");
    }
    if (href === "/launches/create") {
      return pathname === "/launches/create" || pathname === "/launches/new";
    }
    if (href === "/my-launches") {
      return pathname === "/my-launches";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src={logoSrc}
                alt="Tally"
                width={100}
                height={23}
                className="h-6 w-auto"
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Wallet + Theme */}
          <div className="flex items-center gap-3">
            <WalletButton />
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden border-t">
          <div className="flex overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
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
      </header>

      {/* Content — full width, no sidebar */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:py-10 max-w-6xl">{children}</div>
      </div>

      <Footer />
    </main>
  );
}
