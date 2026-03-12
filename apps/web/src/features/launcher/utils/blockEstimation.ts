import { BLOCK_TIME_SECONDS, DEFAULT_BLOCK_TIME } from "@launcher/sdk";

/**
 * Estimates the block number for a given future timestamp, based on
 * the current block number and the average block time for the chain.
 */
export function estimateBlockAtTimestamp(
  targetTimestamp: number,
  currentBlock: bigint,
  currentTimestamp: number,
  chainId: number,
): bigint {
  const blockTime = BLOCK_TIME_SECONDS[chainId] ?? DEFAULT_BLOCK_TIME;
  const secondsUntil = targetTimestamp - currentTimestamp;
  if (secondsUntil <= 0) return currentBlock;
  const blocksUntil = Math.ceil(secondsUntil / blockTime);
  return currentBlock + BigInt(blocksUntil);
}

/**
 * Estimates the timestamp for a given future block number.
 */
export function estimateTimestampAtBlock(
  targetBlock: bigint,
  currentBlock: bigint,
  currentTimestamp: number,
  chainId: number,
): number {
  const blockTime = BLOCK_TIME_SECONDS[chainId] ?? DEFAULT_BLOCK_TIME;
  const blocksDiff = Number(targetBlock - currentBlock);
  return currentTimestamp + blocksDiff * blockTime;
}

/**
 * Formats a datetime-local input value to a unix timestamp (seconds).
 */
export function datetimeLocalToTimestamp(value: string): number {
  return Math.floor(new Date(value).getTime() / 1000);
}

/**
 * Formats a unix timestamp to a datetime-local input value.
 */
export function timestampToDatetimeLocal(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Encodes auction steps data for the CCA.
 * Each step is 8 bytes: uint24 mps (3 bytes) + uint40 blockDelta (5 bytes).
 * Constraints: sum(mps * blockDelta) == 10_000_000, sum(blockDelta) == auctionDuration.
 *
 * For a single linear step: mps = 10_000_000 / duration, blockDelta = duration.
 * If duration doesn't divide evenly, uses two steps to satisfy the exact sum.
 */
export function encodeAuctionStepsData(startBlock: bigint, endBlock: bigint): `0x${string}` {
  const MPS_TOTAL = 10_000_000;
  const duration = Number(endBlock - startBlock);
  if (duration <= 0) throw new Error("Auction duration must be positive");

  const mps = Math.floor(MPS_TOTAL / duration);
  const remainder = MPS_TOTAL - mps * duration;

  if (remainder === 0) {
    // Single step: mps * duration == 10_000_000 exactly
    return encodeStep(mps, duration);
  }

  // Two steps to handle the remainder:
  // Step 1: (mps+1) for `remainder` blocks  → contributes (mps+1)*remainder
  // Step 2: mps for (duration-remainder) blocks → contributes mps*(duration-remainder)
  // Total: mps*remainder + remainder + mps*duration - mps*remainder = mps*duration + remainder = 10_000_000
  const step1 = encodeStepBytes(mps + 1, remainder);
  const step2 = encodeStepBytes(mps, duration - remainder);
  return `0x${step1}${step2}` as `0x${string}`;
}

function encodeStep(mps: number, blockDelta: number): `0x${string}` {
  return `0x${encodeStepBytes(mps, blockDelta)}` as `0x${string}`;
}

function encodeStepBytes(mps: number, blockDelta: number): string {
  // uint24 mps = 3 bytes, uint40 blockDelta = 5 bytes
  const mpsHex = mps.toString(16).padStart(6, "0");
  const deltaHex = blockDelta.toString(16).padStart(10, "0");
  return `${mpsHex}${deltaHex}`;
}
