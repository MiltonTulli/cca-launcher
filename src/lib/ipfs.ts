/**
 * IPFS Draft Storage
 *
 * Uses IPFS primitives (dag-json codec + sha-256 hashing) for
 * content-addressed draft storage. Produces real IPFS-compatible CIDs.
 *
 * - Local persistence via IndexedDB
 * - Reading falls back to a public IPFS HTTP gateway
 * - If content is later pinned to IPFS, the CID remains identical
 */

import { CID } from "multiformats/cid";
import * as dagJson from "@ipld/dag-json";
import { sha256 } from "multiformats/hashes/sha2";

const DB_NAME = "tally-drafts";
const STORE_NAME = "blocks";
const INDEX_STORE = "draft-index";
const DB_VERSION = 2;

export interface DraftPayload {
  formValues: Record<string, string>;
  chainId: number;
  createdAt: number;
  creator?: string;
}

// ============================================
// IndexedDB helpers
// ============================================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(INDEX_STORE)) {
        db.createObjectStore(INDEX_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: Uint8Array): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key: string): Promise<Uint8Array | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as Uint8Array | undefined);
    req.onerror = () => reject(req.error);
  });
}

// ============================================
// CID computation (dag-json + sha-256)
// ============================================

// dag-json codec code
const DAG_JSON_CODE = 0x0129;

async function computeCid(data: unknown): Promise<{ cid: CID; bytes: Uint8Array }> {
  const bytes = dagJson.encode(data);
  const hash = await sha256.digest(bytes);
  const cid = CID.createV1(DAG_JSON_CODE, hash);
  return { cid, bytes };
}

// ============================================
// Draft index helpers (address → CID[])
// ============================================

export interface DraftIndexEntry {
  cid: string;
  createdAt: number;
  chainId: number;
}

async function getIndex(address: string): Promise<DraftIndexEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INDEX_STORE, "readonly");
    const req = tx.objectStore(INDEX_STORE).get(address.toLowerCase());
    req.onsuccess = () => resolve((req.result as DraftIndexEntry[] | undefined) ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function putIndex(address: string, entries: DraftIndexEntry[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INDEX_STORE, "readwrite");
    tx.objectStore(INDEX_STORE).put(entries, address.toLowerCase());
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============================================
// Public API
// ============================================

/**
 * Save a draft. Encodes as dag-json, computes CID, persists to IndexedDB.
 * Also updates the per-address draft index.
 * Returns the CID string.
 */
export async function saveDraft(payload: DraftPayload): Promise<string> {
  const { cid, bytes } = await computeCid(payload);
  const cidStr = cid.toString();
  await idbPut(cidStr, bytes);

  // Update index for the creator
  if (payload.creator) {
    const entries = await getIndex(payload.creator);
    if (!entries.some((e) => e.cid === cidStr)) {
      entries.push({
        cid: cidStr,
        createdAt: payload.createdAt,
        chainId: payload.chainId,
      });
      await putIndex(payload.creator, entries);
    }
  }

  return cidStr;
}

/**
 * Load a draft by CID. Tries IndexedDB first, then a public IPFS gateway.
 */
export async function loadDraft(cidStr: string): Promise<DraftPayload> {
  // 1. Try local IndexedDB
  try {
    const bytes = await idbGet(cidStr);
    if (bytes) {
      return dagJson.decode<DraftPayload>(bytes);
    }
  } catch {
    // fall through
  }

  // 2. Fallback: IPFS HTTP gateway (dag-json endpoint)
  const gatewayUrl = `https://dweb.link/api/v0/dag/get?arg=${cidStr}`;
  const resp = await fetch(gatewayUrl, { signal: AbortSignal.timeout(15000) });
  if (!resp.ok) throw new Error("Draft not found");
  return (await resp.json()) as DraftPayload;
}

/**
 * List all drafts saved by a given address (from local index).
 */
export async function listDrafts(address: string): Promise<DraftIndexEntry[]> {
  const entries = await getIndex(address);
  // Return newest first
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Delete a draft from the local index (does not remove the block).
 */
export async function deleteDraft(address: string, cid: string): Promise<void> {
  const entries = await getIndex(address);
  await putIndex(
    address,
    entries.filter((e) => e.cid !== cid)
  );
}
