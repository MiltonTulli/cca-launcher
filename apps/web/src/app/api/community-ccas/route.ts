import { type NextRequest, NextResponse } from "next/server";
import { type Address, type Chain, createPublicClient, http, isAddress } from "viem";
import { arbitrum, arbitrumSepolia, mainnet, sepolia } from "viem/chains";
import { CHAIN_METADATA } from "@/config/chains";
import { CCA_AUCTION_ABI, STANDALONE_CCA_ADDRESSES } from "@/config/contracts";
import { redis } from "@/lib/kv";

export interface CommunityAuction {
  ccaAddress: string;
  chainId: number;
  submittedBy: string;
  submittedAt: number;
}

const REDIS_KEY = "community-ccas";

const CHAINS: Record<number, Chain> = {
  1: mainnet,
  11155111: sepolia,
  42161: arbitrum,
  421614: arbitrumSepolia,
};

function getPublicClient(chainId: number) {
  const chain = CHAINS[chainId];
  if (!chain) return null;
  return createPublicClient({ chain, transport: http() });
}

async function validateCCA(address: Address, chainId: number): Promise<boolean> {
  const client = getPublicClient(chainId);
  if (!client) return false;

  try {
    const results = await client.multicall({
      contracts: [
        { address, abi: CCA_AUCTION_ABI, functionName: "token" },
        { address, abi: CCA_AUCTION_ABI, functionName: "currency" },
        { address, abi: CCA_AUCTION_ABI, functionName: "startBlock" },
      ],
    });

    // All three calls must succeed (no error/revert)
    return results.every((r) => r.status === "success");
  } catch {
    return false;
  }
}

// GET /api/community-ccas
export async function GET() {
  try {
    const entries = (await redis.get<CommunityAuction[]>(REDIS_KEY)) ?? [];
    return NextResponse.json(entries);
  } catch (err) {
    console.error("GET /api/community-ccas error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/community-ccas
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ccaAddress, chainId, submittedBy } = body;

    // Validate fields
    if (!ccaAddress || chainId == null || !submittedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!isAddress(ccaAddress)) {
      return NextResponse.json({ error: "Invalid address format" }, { status: 400 });
    }

    if (!isAddress(submittedBy)) {
      return NextResponse.json({ error: "Invalid submitter address" }, { status: 400 });
    }

    if (!CHAIN_METADATA[chainId]) {
      return NextResponse.json({ error: "Unsupported chain" }, { status: 400 });
    }

    const normalizedAddress = ccaAddress.toLowerCase();

    // Check hardcoded standalone addresses
    const hardcoded = STANDALONE_CCA_ADDRESSES[chainId] ?? [];
    if (hardcoded.some((a) => a.toLowerCase() === normalizedAddress)) {
      return NextResponse.json({ error: "This auction is already listed" }, { status: 409 });
    }

    // Check existing community auctions
    const existing = (await redis.get<CommunityAuction[]>(REDIS_KEY)) ?? [];
    const isDuplicate = existing.some(
      (e) => e.ccaAddress.toLowerCase() === normalizedAddress && e.chainId === chainId,
    );
    if (isDuplicate) {
      return NextResponse.json({ error: "This auction is already listed" }, { status: 409 });
    }

    // On-chain validation
    const isValid = await validateCCA(ccaAddress as Address, chainId);
    if (!isValid) {
      return NextResponse.json(
        {
          error:
            "Not a valid CCA contract. The address must implement token(), currency(), and startBlock().",
        },
        { status: 422 },
      );
    }

    // Store in Redis
    const entry: CommunityAuction = {
      ccaAddress: normalizedAddress,
      chainId,
      submittedBy: submittedBy.toLowerCase(),
      submittedAt: Date.now(),
    };
    existing.push(entry);
    await redis.set(REDIS_KEY, existing);

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("POST /api/community-ccas error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
