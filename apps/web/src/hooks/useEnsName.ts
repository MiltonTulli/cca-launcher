"use client";

import { useEffect, useState } from "react";
import { type Address, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { ZERO_ADDRESS } from "@/lib/utils";

const CACHE_TTL = 300_000; // 5 minutes
const cache = new Map<string, { name: string | null; ts: number }>();

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

/**
 * Resolve an ENS name for a given address.
 * Always resolves against mainnet regardless of the current chain.
 * Returns null for ZERO_ADDRESS or if no ENS name is found.
 */
export function useEnsName(address: string | undefined): string | null {
  const [ensName, setEnsName] = useState<string | null>(null);

  useEffect(() => {
    if (!address || address === ZERO_ADDRESS) {
      setEnsName(null);
      return;
    }

    const cached = cache.get(address);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setEnsName(cached.name);
      return;
    }

    let cancelled = false;

    mainnetClient
      .getEnsName({ address: address as Address })
      .then((name) => {
        if (!cancelled) {
          cache.set(address, { name, ts: Date.now() });
          setEnsName(name);
        }
      })
      .catch(() => {
        if (!cancelled) {
          cache.set(address, { name: null, ts: Date.now() });
          setEnsName(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  return ensName;
}
