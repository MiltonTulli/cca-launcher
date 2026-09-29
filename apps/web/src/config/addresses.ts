import type { Address } from "viem";

// ============================================
// SEPOLIA TEST CONTRACTS
// ============================================
const DEPLOYMENTS = {
  V1: {
    TestUSDC: "0x0B50239E3731956F90fC52eF07c55C0631A004D2" as Address,
    AuctionToken: "0x39BBeB53c8e9c2A1dE04644FBcF9Ebf5dF396080" as Address,
    PermitterFactory: "0x1CAc31307b284a18c59437Df1dF4b90ABa0c0c99" as Address,
    LockupContract: "0xe5b496e97F364f6f1567D67D8523Bb6d89dc4413" as Address,
    TallyLaunchFactory: "0x6f32468767bBb1BC4516fA50420FD14C75c26d60" as Address,
  },
  V2: {
    TestUSDC: "0x5578B6F76fa18fb9E76091a9e60D190fC6045f18" as Address,
    AuctionToken: "0x585ef9558aFd1c9eeDCe9FeD6fdf990Ea9Ffe123" as Address,
    PermitterFactory: "0xfC3F4E31Fc5d46FD8D8eb74b17dBc60Bb02daED4" as Address,
    LockupContract: "0xB45707e755cec36c0013aBA68FeA6A54753606d1" as Address,
    TallyLaunchFactory: "0xDfe0F10dFA7c05423752b2AEfa6eD7Bad58fF084" as Address,
  },
  V3: {
    TestUSDC: "0x71cd6f71b8c6d0f12514b83b381b9b1618accd3b" as Address,
    AuctionToken: "0xe6b2ae6d6eee3d2b8225ce54962b3ae4fc653fa4" as Address,
    PermitterFactory: "0x7a102f1d5646ddb6cc2fe7b74559f706a42491ea" as Address,
    LockupContract: "0xe847b376e81806430c856726c46d0b9d028c1454" as Address,
    TallyLaunchFactory: "0xf30ae684807a41e9bd14e93b2aaeb2adcd0a1c12" as Address,
  },
};

export const SEPOLIA_CONTRACTS = {
  ...DEPLOYMENTS.V3,
} as const;

// ============================================
// CONTRACT ADDRESSES PER NETWORK
// ============================================
export const TALLY_LAUNCH_FACTORY_ADDRESSES: Record<number, Address> = {
  1: "0x0000000000000000000000000000000000000000", // Mainnet - TBD
  11155111: SEPOLIA_CONTRACTS.TallyLaunchFactory, // Sepolia
  42161: "0x0000000000000000000000000000000000000000", // Arbitrum - TBD
  421614: "0x0000000000000000000000000000000000000000", // Arbitrum Sepolia - TBD
};

// ============================================
// STANDALONE CCA ADDRESSES (not deployed via factory)
// ============================================
export const STANDALONE_CCA_ADDRESSES: Record<number, Address[]> = {
  1: [
    "0xddb66737e2a2f3952765d51296e9112223fb5a4f",
  ],
  42161: [
    "0xc27f8a94df88c4f57b09067e07ea6bc11ca47e11",
    "0x9edb12f2f0fd79dafdc71a72b4d40595554b3e0e",
  ],
};

/** All chain IDs we support in the UI (regardless of deployment status). */
export const SUPPORTED_CHAIN_IDS: number[] = Object.keys(TALLY_LAUNCH_FACTORY_ADDRESSES).map(
  Number,
);
