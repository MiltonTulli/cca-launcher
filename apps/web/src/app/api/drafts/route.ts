import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/kv";

export interface DraftRecord {
  id: string;
  owner: string;
  formValues: Record<string, string>;
  chainId: number;
  createdAt: number;
  updatedAt: number;
}

export interface DraftIndexEntry {
  id: string;
  createdAt: number;
  updatedAt: number;
  chainId: number;
}

// POST /api/drafts — Create a new draft
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { owner, formValues, chainId } = body;

    if (!owner || !formValues || chainId == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const id = nanoid(12);
    const now = Date.now();
    const draft: DraftRecord = {
      id,
      owner: owner.toLowerCase(),
      formValues,
      chainId,
      createdAt: now,
      updatedAt: now,
    };

    // Store draft (upstash auto-serializes objects)
    await redis.set(`draft:${id}`, draft);

    // Update user index
    const ownerKey = `user-drafts:${draft.owner}`;
    const index = (await redis.get<DraftIndexEntry[]>(ownerKey)) ?? [];
    index.push({ id, createdAt: now, updatedAt: now, chainId });
    await redis.set(ownerKey, index);

    return NextResponse.json(draft, { status: 201 });
  } catch (err) {
    console.error("POST /api/drafts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/drafts?owner=0x... — List drafts by owner
export async function GET(req: NextRequest) {
  try {
    const owner = req.nextUrl.searchParams.get("owner");
    if (!owner) {
      return NextResponse.json({ error: "Missing owner parameter" }, { status: 400 });
    }

    const ownerKey = `user-drafts:${owner.toLowerCase()}`;
    const index = (await redis.get<DraftIndexEntry[]>(ownerKey)) ?? [];

    // Sort newest first
    index.sort((a, b) => b.updatedAt - a.updatedAt);

    return NextResponse.json(index);
  } catch (err) {
    console.error("GET /api/drafts error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
