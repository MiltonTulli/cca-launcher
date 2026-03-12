import { NextRequest, NextResponse } from "next/server";

const COINGECKO_PLATFORM: Record<number, string> = {
  1: "ethereum",
  8453: "base",
};

const COINGECKO_NATIVE_ID: Record<number, string> = {
  1: "ethereum",
  8453: "ethereum",
};

const TESTNETS = new Set([11155111, 84532]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const address = searchParams.get("address");
  const chainId = Number(searchParams.get("chainId"));

  if (!address || !chainId) {
    return NextResponse.json({ usdPrice: null }, { status: 400 });
  }

  if (TESTNETS.has(chainId)) {
    return NextResponse.json({ usdPrice: null });
  }

  try {
    const isNative =
      address === "native" ||
      address === "0x0000000000000000000000000000000000000000";

    let usdPrice: number | null = null;

    if (isNative) {
      const nativeId = COINGECKO_NATIVE_ID[chainId];
      if (!nativeId) return NextResponse.json({ usdPrice: null });

      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${nativeId}&vs_currencies=usd`,
        { next: { revalidate: 60 } },
      );
      if (res.ok) {
        const data = await res.json();
        usdPrice = data[nativeId]?.usd ?? null;
      }
    } else {
      const platform = COINGECKO_PLATFORM[chainId];
      if (!platform) return NextResponse.json({ usdPrice: null });

      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/${platform}?contract_addresses=${address.toLowerCase()}&vs_currencies=usd`,
        { next: { revalidate: 60 } },
      );
      if (res.ok) {
        const data = await res.json();
        usdPrice = data[address.toLowerCase()]?.usd ?? null;
      }
    }

    return NextResponse.json(
      { usdPrice },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json({ usdPrice: null });
  }
}
