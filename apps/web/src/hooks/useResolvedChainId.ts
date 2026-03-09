"use client";

import { useViewChain } from "@/context/ViewChainProvider";

/**
 * Returns `explicit` if provided, otherwise falls back to the current
 * view-chain ID (the chain the user is *browsing*, which may differ
 * from the wallet chain).
 */
export function useResolvedChainId(explicit?: number): number {
  const { viewChainId } = useViewChain();
  return explicit ?? viewChainId;
}
