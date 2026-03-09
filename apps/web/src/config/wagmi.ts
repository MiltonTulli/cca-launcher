import type { AppKitNetwork } from "@reown/appkit/networks";
import { arbitrum, arbitrumSepolia, mainnet, sepolia } from "@reown/appkit/networks";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { cookieStorage, createStorage, http } from "@wagmi/core";

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo";

if (!projectId || projectId === "demo") {
  console.warn("WalletConnect projectId not set. Get one at https://cloud.reown.com");
}

// Define networks — all supported chains
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  sepolia,
  mainnet,
  arbitrum,
  arbitrumSepolia,
];

// Create wagmi adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});

export const config = wagmiAdapter.wagmiConfig;
