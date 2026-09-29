import type { AppKitNetwork } from "@reown/appkit/networks";
import { arbitrum, arbitrumSepolia, baseSepolia, mainnet, sepolia } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage, http } from "@wagmi/core";
import { DEPLOYED_CHAIN_IDS } from "@launcher/sdk";
import { STANDALONE_CCA_ADDRESSES } from "@/config/addresses";

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo";

if (!projectId || projectId === "demo") {
  console.warn("WalletConnect projectId not set. Get one at https://cloud.reown.com");
}

/** All AppKit network objects keyed by chain ID */
const ALL_NETWORKS: Record<number, AppKitNetwork> = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
  [arbitrum.id]: arbitrum,
  [arbitrumSepolia.id]: arbitrumSepolia,
  [baseSepolia.id]: baseSepolia,
};

/** Public RPCs so multi-chain reads work without a WalletConnect project ID */
const PUBLIC_RPCS: Record<number, string> = {
  [mainnet.id]: "https://ethereum.publicnode.com",
  [sepolia.id]: "https://ethereum-sepolia-rpc.publicnode.com",
  [arbitrum.id]: "https://arb1.arbitrum.io/rpc",
  [arbitrumSepolia.id]: "https://sepolia-rollup.arbitrum.io/rpc",
  [baseSepolia.id]: "https://sepolia.base.org",
};

/** Chains needed for wallet + viewing standalone auctions */
const viewChainIds = new Set<number>([
  ...DEPLOYED_CHAIN_IDS,
  ...Object.keys(STANDALONE_CCA_ADDRESSES).map(Number),
]);

const viewNetworks = [...viewChainIds]
  .map((id) => ALL_NETWORKS[id])
  .filter((net): net is AppKitNetwork => Boolean(net));

export const networks: [AppKitNetwork, ...AppKitNetwork[]] =
  viewNetworks.length > 0
    ? [viewNetworks[0], ...viewNetworks.slice(1)]
    : [sepolia];

const transports = Object.fromEntries(
  networks.map((net) => [net.id, http(PUBLIC_RPCS[net.id])]),
) as Record<number, ReturnType<typeof http>>;

// Create wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  transports,
});

export const config = wagmiAdapter.wagmiConfig;
