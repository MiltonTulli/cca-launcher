/**
 * Client-side API for draft CRUD operations.
 * All drafts are stored server-side via /api/drafts routes (Upstash Redis).
 */

export interface Draft {
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

export async function createDraft(data: {
  owner: string;
  formValues: Record<string, string>;
  chainId: number;
}): Promise<Draft> {
  const resp = await fetch("/api/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create draft");
  }
  return resp.json();
}

export async function getDraft(id: string): Promise<Draft> {
  const resp = await fetch(`/api/drafts/${id}`);
  if (!resp.ok) {
    if (resp.status === 404) throw new Error("Draft not found");
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Failed to load draft");
  }
  return resp.json();
}

export async function updateDraft(
  id: string,
  data: { owner: string; formValues: Record<string, string>; chainId: number },
): Promise<Draft> {
  const resp = await fetch(`/api/drafts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update draft");
  }
  return resp.json();
}

export async function deleteDraft(id: string, owner: string): Promise<void> {
  const resp = await fetch(`/api/drafts/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete draft");
  }
}

export async function listDrafts(owner: string): Promise<DraftIndexEntry[]> {
  const resp = await fetch(`/api/drafts?owner=${encodeURIComponent(owner)}`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Failed to list drafts");
  }
  return resp.json();
}
