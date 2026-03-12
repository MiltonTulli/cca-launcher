"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";
import { DEPLOYED_CHAIN_IDS } from "@launcher/sdk";

interface ViewChainContextValue {
  viewChainId: number;
  setViewChainId: (chainId: number) => void;
  supportedChainIds: number[];
}

const ViewChainContext = createContext<ViewChainContextValue | undefined>(undefined);

// Default to Sepolia (the only chain with a deployed factory for now)
const DEFAULT_CHAIN_ID = 11155111;

export function ViewChainProvider({ children }: { children: React.ReactNode }) {
  const [viewChainId, setViewChainId] = useState(
    DEPLOYED_CHAIN_IDS.includes(DEFAULT_CHAIN_ID)
      ? DEFAULT_CHAIN_ID
      : (DEPLOYED_CHAIN_IDS[0] ?? DEFAULT_CHAIN_ID),
  );

  return (
    <ViewChainContext.Provider
      value={{ viewChainId, setViewChainId, supportedChainIds: DEPLOYED_CHAIN_IDS }}
    >
      {children}
    </ViewChainContext.Provider>
  );
}

export function useViewChain() {
  const ctx = useContext(ViewChainContext);
  if (!ctx) throw new Error("useViewChain must be used within ViewChainProvider");
  return ctx;
}
