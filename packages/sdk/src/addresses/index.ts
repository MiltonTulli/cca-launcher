export { sepoliaAddresses } from "./sepolia";
export { baseSepoliaAddresses } from "./baseSepolia";
export { localhostAddresses } from "./localhost";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/**
 * LaunchFactory address per chain.
 * Use getFactoryAddress() from helpers for safer access.
 */
export const LAUNCH_FACTORY_ADDRESSES: Record<number, `0x${string}`> = {
  1: ZERO_ADDRESS, // Mainnet — TBD
  11155111: "0xf30ae684807a41e9bd14e93b2aaeb2adcd0a1c12", // Sepolia
  42161: ZERO_ADDRESS, // Arbitrum — TBD
  421614: ZERO_ADDRESS, // Arbitrum Sepolia — TBD
};

/** Chain IDs with non-zero factory addresses (i.e. actually deployed) */
export const DEPLOYED_CHAIN_IDS: number[] = Object.entries(LAUNCH_FACTORY_ADDRESSES)
  .filter(([, addr]) => addr !== ZERO_ADDRESS)
  .map(([id]) => Number(id));

/** All chain IDs registered (including TBD) */
export const SUPPORTED_CHAIN_IDS: number[] = Object.keys(LAUNCH_FACTORY_ADDRESSES).map(Number);
