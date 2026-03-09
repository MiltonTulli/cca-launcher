import { type NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/kv";

function launchDraftKey(address: string) {
  return `launch-draft:${address.toLowerCase()}`;
}

// POST /api/launch-draft — { orchestratorAddress, draftId }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orchestratorAddress, draftId } = body;

    if (!orchestratorAddress || !draftId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await redis.set(launchDraftKey(orchestratorAddress), draftId);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/launch-draft error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/launch-draft?address={orchestratorAddress}
export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address) {
      return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
    }

    const draftId = await redis.get<string>(launchDraftKey(address));
    return NextResponse.json({ draftId: draftId ?? null });
  } catch (err) {
    console.error("GET /api/launch-draft error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
