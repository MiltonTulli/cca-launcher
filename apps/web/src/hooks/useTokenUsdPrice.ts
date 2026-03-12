"use client";

import { useEffect, useRef, useState } from "react";
import { ZERO_ADDRESS } from "@/lib/utils";

const CACHE_TTL = 60_000; // 60 seconds
const cache = new Map<string, { price: number | null; ts: number }>();

export function useTokenUsdPrice(
  tokenAddress: string | undefined,
  chainId: number,
): { usdPrice: number | null; isLoading: boolean } {
  const [usdPrice, setUsdPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isNative = !tokenAddress || tokenAddress === ZERO_ADDRESS;
  const address = isNative ? "native" : tokenAddress;
  const cacheKey = `${chainId}:${address}`;

  useEffect(() => {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setUsdPrice(cached.price);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);

    fetch(`/api/token-price?address=${address}&chainId=${chainId}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: { usdPrice: number | null }) => {
        cache.set(cacheKey, { price: data.usdPrice, ts: Date.now() });
        setUsdPrice(data.usdPrice);
      })
      .catch(() => {
        // Aborted or network error — ignore
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [cacheKey, address, chainId]);

  return { usdPrice, isLoading };
}
