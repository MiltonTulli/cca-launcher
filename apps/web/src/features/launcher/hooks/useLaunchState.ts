"use client";

import { useBlockNumber } from "wagmi";
import { LaunchState } from "@launcher/sdk";
import { useMemo } from "react";
import { getEffectiveState, type EffectiveLaunchState } from "../utils/displayState";
import type { LaunchData } from "../utils/fromLaunchData";

export function useLaunchState(launchData: LaunchData | undefined, chainId?: number) {
  const { data: blockNumber } = useBlockNumber({
    chainId,
    watch: true,
    query: { refetchInterval: 12_000 },
  });

  const effectiveState: EffectiveLaunchState | undefined = useMemo(() => {
    if (!launchData || blockNumber === undefined) return undefined;
    return getEffectiveState(
      launchData.state,
      blockNumber,
      launchData.auctionStartBlock,
      launchData.auctionEndBlockConfig,
    );
  }, [launchData, blockNumber]);

  const isAuctionActive = effectiveState === "AUCTION_ACTIVE";

  const blocksUntilAuctionStart = useMemo(() => {
    if (!launchData || !blockNumber) return undefined;
    if (launchData.auctionStartBlock > blockNumber) {
      return launchData.auctionStartBlock - blockNumber;
    }
    return BigInt(0);
  }, [launchData, blockNumber]);

  const blocksUntilAuctionEnd = useMemo(() => {
    if (!launchData || !blockNumber) return undefined;
    if (launchData.auctionEndBlockConfig > blockNumber) {
      return launchData.auctionEndBlockConfig - blockNumber;
    }
    return BigInt(0);
  }, [launchData, blockNumber]);

  return {
    effectiveState,
    isAuctionActive,
    blockNumber,
    blocksUntilAuctionStart,
    blocksUntilAuctionEnd,
    liquidityState: launchData?.liquidityInfo.state,
  };
}
