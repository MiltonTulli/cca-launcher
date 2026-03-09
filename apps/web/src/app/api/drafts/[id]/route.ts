import { type NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/kv";
import type { DraftIndexEntry, DraftRecord } from "../route";

// GET /api/drafts/[id] — Get a draft (public, anyone can view)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const draft = await redis.get<DraftRecord>(`draft:${id}`);
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    return NextResponse.json(draft);
  } catch (err) {
    console.error("GET /api/drafts/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/drafts/[id] — Update a draft (owner only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { owner, formValues, chainId } = body;

    if (!owner || !formValues) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await redis.get<DraftRecord>(`draft:${id}`);
    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (existing.owner !== owner.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = Date.now();
    const updated: DraftRecord = {
      ...existing,
      formValues,
      chainId: chainId ?? existing.chainId,
      updatedAt: now,
    };

    await redis.set(`draft:${id}`, updated);

    // Update index entry timestamp
    const ownerKey = `user-drafts:${existing.owner}`;
    const index = await redis.get<DraftIndexEntry[]>(ownerKey);
    if (index) {
      const entry = index.find((e) => e.id === id);
      if (entry) {
        entry.updatedAt = now;
        if (chainId != null) entry.chainId = chainId;
        await redis.set(ownerKey, index);
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT /api/drafts/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/drafts/[id] — Delete a draft (owner only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { owner } = await req.json();

    if (!owner) {
      return NextResponse.json({ error: "Missing owner" }, { status: 400 });
    }

    const existing = await redis.get<DraftRecord>(`draft:${id}`);
    if (!existing) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (existing.owner !== owner.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete draft
    await redis.del(`draft:${id}`);

    // Remove from index
    const ownerKey = `user-drafts:${existing.owner}`;
    const index = await redis.get<DraftIndexEntry[]>(ownerKey);
    if (index) {
      const filtered = index.filter((e) => e.id !== id);
      await redis.set(ownerKey, filtered);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/drafts/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
