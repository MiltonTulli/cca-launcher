export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

export async function getComments(type: "draft" | "launch", id: string): Promise<Comment[]> {
  const params = new URLSearchParams({ type, id });
  const resp = await fetch(`/api/comments?${params}`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Failed to load comments");
  }
  return resp.json();
}

export async function postComment(
  type: "draft" | "launch",
  id: string,
  author: string,
  text: string,
): Promise<Comment> {
  const resp = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, id, author, text }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Failed to post comment");
  }
  return resp.json();
}
