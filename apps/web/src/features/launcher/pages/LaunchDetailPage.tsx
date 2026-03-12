"use client";

import { LaunchDetail } from "../components/LaunchDetail";
import { useSearchParams } from "next/navigation";
import type { Address } from "viem";

interface LaunchDetailPageProps {
  address: string;
}

export function LaunchDetailPage({ address }: LaunchDetailPageProps) {
  const searchParams = useSearchParams();
  const chainId = searchParams.get("chain") ? Number(searchParams.get("chain")) : undefined;

  return (
    <div className="container mx-auto p-6">
      <LaunchDetail launchAddress={address as Address} chainId={chainId} />
    </div>
  );
}
