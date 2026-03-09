import { BLOCK_TIME_SECONDS, DEFAULT_BLOCK_TIME, Q96 } from "@/config/constants";
import { CCAPhase } from "@/config/enums";

const ZERO = BigInt(0);
const DISPLAY_PRECISION = BigInt("1000000000000000000"); // 1e18

/**
 * Decode a Q96-encoded bigint back to a raw bigint (integer division).
 */
export function q96Decode(q96Value: bigint): bigint {
  return q96Value / Q96;
}

/**
 * Display a CCA price (Q96-encoded base-unit ratio) as a human-readable string.
 *
 * On-chain prices are: (currencyBaseUnits / tokenBaseUnits) * 2^96
 * To show "human currency per whole token" we multiply by 10^(tokenDec - currencyDec).
 */
export function q96PriceToDisplay(
  priceQ96: bigint,
  tokenDecimals: number,
  currencyDecimals: number,
  displayDecimals = 6,
): string {
  if (priceQ96 === ZERO) return "0";

  const decimalDiff = tokenDecimals - currencyDecimals;
  let scaled: bigint;
  if (decimalDiff >= 0) {
    scaled = (priceQ96 * BigInt(10 ** decimalDiff) * DISPLAY_PRECISION) / Q96;
  } else {
    scaled = (priceQ96 * DISPLAY_PRECISION) / (Q96 * BigInt(10 ** -decimalDiff));
  }

  const num = Number(scaled) / 1e18;
  if (num === 0) return "0";
  // For very small numbers, show full decimal instead of scientific notation
  if (num < 0.000001) {
    const sigFigs = num.toPrecision(4);
    // If toPrecision returns scientific notation, convert to fixed
    if (sigFigs.includes("e")) {
      const match = sigFigs.match(/e[+-]?(\d+)/);
      const exp = match ? parseInt(match[1], 10) : 10;
      return num
        .toFixed(Math.min(exp + 2, 20))
        .replace(/0+$/, "")
        .replace(/\.$/, "");
    }
    return sigFigs;
  }
  return num.toFixed(displayDecimals).replace(/\.?0+$/, "");
}

/**
 * Align a Q96 price down to the nearest tick boundary.
 * tickSpacing is the raw uint256 from the CCA contract (e.g. 2).
 * The contract enforces: maxPrice % tickSpacing == 0.
 */
export function alignPriceToTick(priceQ96: bigint, tickSpacing: bigint): bigint {
  if (tickSpacing === ZERO) return priceQ96;
  return (priceQ96 / tickSpacing) * tickSpacing;
}

/**
 * Convert a human-readable price to a tick-aligned Q96 value.
 *
 * The user enters a price in "currency per token" (e.g. "0.5 tUSDC per token").
 * The contract stores prices as (currencyBase / tokenBase) * Q96, so we
 * divide by 10^(tokenDec - currencyDec) when encoding.
 */
export function decimalToTickAlignedQ96(
  priceDecimal: string,
  tickSpacing: bigint,
  tokenDecimals: number,
  currencyDecimals: number,
): bigint {
  const price = parseFloat(priceDecimal);
  if (Number.isNaN(price) || price <= 0) return ZERO;

  // priceQ96 = humanPrice * (10^currencyDec / 10^tokenDec) * Q96
  const SCALE = BigInt("1000000000000000000"); // 1e18
  const priceScaled = BigInt(Math.round(price * 1e18));
  const currencyFactor = BigInt(10 ** currencyDecimals);
  const tokenFactor = BigInt(10 ** tokenDecimals);
  const priceQ96 = (priceScaled * currencyFactor * Q96) / (tokenFactor * SCALE);

  return alignPriceToTick(priceQ96, tickSpacing);
}

/**
 * Determine the current CCA phase from block numbers and graduation status.
 */
export function getCCAPhase(
  currentBlock: bigint,
  startBlock: bigint,
  endBlock: bigint,
  claimBlock: bigint,
  isGraduated: boolean,
): CCAPhase {
  if (currentBlock < startBlock) return CCAPhase.COMING_SOON;
  if (currentBlock < endBlock) return CCAPhase.LIVE;
  if (currentBlock < claimBlock) return CCAPhase.ENDED;
  if (isGraduated) return CCAPhase.CLAIMABLE;
  return CCAPhase.FAILED;
}

/**
 * Estimate time remaining in human-readable format from block count.
 * Uses chain-specific block times (e.g. ~12s for Ethereum, ~0.25s for Arbitrum).
 */
export function blocksToTimeEstimate(blocks: number, chainId?: number): string {
  if (blocks <= 0) return "0s";
  const blockTime = chainId
    ? (BLOCK_TIME_SECONDS[chainId] ?? DEFAULT_BLOCK_TIME)
    : DEFAULT_BLOCK_TIME;
  const seconds = Math.round(blocks * blockTime);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `~${h}h ${m}m`;
  if (m > 0) return `~${m}m`;
  return `~${seconds}s`;
}
