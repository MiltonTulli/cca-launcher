import type { AppKitNetwork } from "@reown/appkit/networks";
import { arbitrum, arbitrumSepolia, baseSepolia, mainnet, sepolia } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage, http } from "@wagmi/core";
import { DEPLOYED_CHAIN_IDS } from "@launcher/sdk";

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

/** Only networks with a deployed LaunchFactory */
const deployedNetworks = DEPLOYED_CHAIN_IDS
  .map((id) => ALL_NETWORKS[id])
  .filter(Boolean);

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = deployedNetworks.length > 0
  ? [deployedNetworks[0], ...deployedNetworks.slice(1)]
  : [sepolia]; // fallback

// Build transports only for deployed networks
const transports = Object.fromEntries(
  deployedNetworks.map((net) => [net.id, http()])
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
