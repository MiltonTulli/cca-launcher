import { LAUNCH_FACTORY_ADDRESSES } from "../addresses";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

/**
 * Get the LaunchFactory address for a chain.
 * Returns undefined if not deployed on that chain.
 */
export function getFactoryAddress(chainId: number): `0x${string}` | undefined {
  const addr = LAUNCH_FACTORY_ADDRESSES[chainId];
  if (!addr || addr === ZERO_ADDRESS) return undefined;
  return addr;
}

/** Check if a chain has a deployed LaunchFactory */
export function isChainSupported(chainId: number): boolean {
  return getFactoryAddress(chainId) !== undefined;
}
