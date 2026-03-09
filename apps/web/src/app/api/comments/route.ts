import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/kv";

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

function commentsKey(type: string, id: string) {
  return `comments:${type}:${id}`;
}

// GET /api/comments?type={draft|launch}&id={resourceId}
export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type");
    const id = req.nextUrl.searchParams.get("id");

    if (!type || !id || !["draft", "launch"].includes(type)) {
      return NextResponse.json({ error: "Missing or invalid type/id parameter" }, { status: 400 });
    }

    const comments = (await redis.get<Comment[]>(commentsKey(type, id))) ?? [];
    return NextResponse.json(comments);
  } catch (err) {
    console.error("GET /api/comments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/comments — { type, id, author, text }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, id, author, text } = body;

    if (!type || !id || !author || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["draft", "launch"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (text.length > 1000) {
      return NextResponse.json({ error: "Comment text exceeds 1000 characters" }, { status: 400 });
    }

    const comment: Comment = {
      id: nanoid(12),
      author: author.toLowerCase(),
      text,
      timestamp: Date.now(),
    };

    const key = commentsKey(type, id);
    const existing = (await redis.get<Comment[]>(key)) ?? [];
    existing.push(comment);
    await redis.set(key, existing);

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error("POST /api/comments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
