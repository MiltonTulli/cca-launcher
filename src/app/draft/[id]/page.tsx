"use client";

import { use } from "react";
import { DraftView } from "@/components/DraftView";
import { Rocket, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DraftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">Tally Launch</span>
          </div>
          <appkit-button balance="hide" />
        </div>
      </header>

      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
          <DraftView id={id} />
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
