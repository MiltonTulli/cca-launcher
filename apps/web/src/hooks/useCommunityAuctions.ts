"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";

interface CommunityAuction {
  ccaAddress: string;
  chainId: number;
  submittedBy: string;
  submittedAt: number;
}

export interface CommunityAddress {
  address: Address;
  chainId: number;
}

export function useCommunityAuctions() {
  const [entries, setEntries] = useState<CommunityAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/community-ccas");
      if (res.ok) {
        const data: CommunityAuction[] = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error("Failed to fetch community auctions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Convert to the format useStandaloneAuctions expects
  const addresses: CommunityAddress[] = entries.map((e) => ({
    address: e.ccaAddress as Address,
    chainId: e.chainId,
  }));

  return { entries, addresses, isLoading, refetch: fetchEntries };
}
