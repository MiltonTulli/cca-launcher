import { type NextRequest, NextResponse } from "next/server";
import { type Address, encodeAbiParameters, type Hex, parseAbiParameters } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export async function POST(req: NextRequest) {
  const privateKey = process.env.PERMIT_SIGNER_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json(
      { error: "Server misconfigured: missing signer key" },
      { status: 500 },
    );
  }

  let body: { bidder: string; permitterAddress: string; chainId: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { bidder, permitterAddress, chainId } = body;
  if (!bidder || !permitterAddress || !chainId) {
    return NextResponse.json(
      { error: "Missing required fields: bidder, permitterAddress, chainId" },
      { status: 400 },
    );
  }

  const account = privateKeyToAccount(privateKey as Hex);

  const expiry = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 min window

  const domain = {
    name: "Permitter",
    version: "1",
    chainId: BigInt(chainId),
    verifyingContract: permitterAddress as Address,
  } as const;

  const types = {
    Permit: [
      { name: "bidder", type: "address" },
      { name: "expiry", type: "uint256" },
    ],
  } as const;

  const message = {
    bidder: bidder as Address,
    expiry,
  };

  const signature = await account.signTypedData({
    domain,
    types,
    primaryType: "Permit",
    message,
  });

  // Encode as (Permit, bytes) — what the Permitter's validate() expects via abi.decode
  const hookData = encodeAbiParameters(
    parseAbiParameters("(address bidder, uint256 expiry), bytes"),
    [{ bidder: bidder as Address, expiry }, signature],
  );

  return NextResponse.json({ hookData });
}
