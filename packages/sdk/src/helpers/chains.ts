export interface ChainMeta {
  name: string;
  shortName: string;
  explorerUrl: string;
}

export const CHAIN_METADATA: Record<number, ChainMeta> = {
  1: {
    name: "Ethereum",
    shortName: "ETH",
    explorerUrl: "https://etherscan.io",
  },
  11155111: {
    name: "Sepolia",
    shortName: "SEP",
    explorerUrl: "https://sepolia.etherscan.io",
  },
  42161: {
    name: "Arbitrum",
    shortName: "ARB",
    explorerUrl: "https://arbiscan.io",
  },
  421614: {
    name: "Arbitrum Sepolia",
    shortName: "ARB-SEP",
    explorerUrl: "https://sepolia.arbiscan.io",
  },
};

/** Get explorer URL for an address on a given chain */
export function getExplorerAddressUrl(chainId: number, address: string): string | undefined {
  const meta = CHAIN_METADATA[chainId];
  if (!meta) return undefined;
  return `${meta.explorerUrl}/address/${address}`;
}

/** Get explorer URL for a transaction on a given chain */
export function getExplorerTxUrl(chainId: number, txHash: string): string | undefined {
  const meta = CHAIN_METADATA[chainId];
  if (!meta) return undefined;
  return `${meta.explorerUrl}/tx/${txHash}`;
}
