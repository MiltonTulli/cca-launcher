"use client";

import { LaunchList } from "../components/LaunchList";
import { useSearchParams } from "next/navigation";

export function LaunchListPage() {
  const searchParams = useSearchParams();
  const chainId = searchParams.get("chain") ? Number(searchParams.get("chain")) : undefined;

  return (
    <div className="container mx-auto p-6">
      <LaunchList chainId={chainId} />
    </div>
  );
}
