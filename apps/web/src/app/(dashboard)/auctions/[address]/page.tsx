"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use } from "react";
import { isAddress } from "viem";
import { AuctionDetail } from "@/components/auction-detail";

export default function AuctionDetailPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const searchParams = useSearchParams();
  const chainParam = searchParams.get("chain");
  const chainId = chainParam ? Number(chainParam) : undefined;

  if (!isAddress(address)) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Invalid Address</h1>
        <p className="text-muted-foreground mb-6 max-w-sm text-center">
          &quot;{address}&quot; is not a valid Ethereum address.
        </p>
        <Link
          href="/auctions"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Auctions
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/auctions"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to All Auctions
      </Link>
      <AuctionDetail address={address as `0x${string}`} chainId={chainId} />
    </>
  );
}
