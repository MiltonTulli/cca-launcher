"use client";

import { use } from "react";
import { isAddress } from "viem";
import { LaunchDetail } from "@/components/LaunchDetail";
import { Rocket, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LaunchPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);

  // Invalid address
  if (!isAddress(address)) {
    return (
      <main className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Tally Launch</span>
            </div>
            <appkit-button />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Invalid Address</h1>
            <p className="text-muted-foreground mb-6 max-w-sm">
              &quot;{address}&quot; is not a valid Ethereum address.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Tally Launch</span>
          </div>
          <appkit-button />
        </div>
      </header>

      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <LaunchDetail address={address as `0x${string}`} />
        </div>
      </div>

      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Built with TallyLaunchFactory &amp; Uniswap V4
          </p>
        </div>
      </footer>
    </main>
  );
}
