import { ChangelogItemData } from "./extractDataFromChangelog";
import { CommitData, ItemType, LeanVersion } from "./types";

async function sha256Prefix(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 2);
}

const chunkCache: Record<string, unknown> = {};

async function fetchChunk<T>(url: string): Promise<T> {
  if (chunkCache[url]) return chunkCache[url] as T;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const data = await res.json();
  chunkCache[url] = data;
  return data as T;
}

export async function fetchCommit(
  version: LeanVersion,
  sha: string
): Promise<CommitData | null> {
  const prefix = sha.slice(0, 2).toLowerCase();
  const url = `/data/${version}/commits/${prefix}.json`;
  try {
    const bucket = await fetchChunk<Record<string, CommitData>>(url);
    // Try full SHA match first, then 8-char prefix match
    if (bucket[sha]) return bucket[sha];
    const shortSha = sha.slice(0, 8);
    for (const [key, commit] of Object.entries(bucket)) {
      if (key.startsWith(shortSha)) return commit;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchItem(
  version: LeanVersion,
  itemType: ItemType,
  name: string
): Promise<ChangelogItemData | null> {
  const prefix = await sha256Prefix(name);
  const url = `/data/${version}/items/${prefix}.json`;
  try {
    const bucket = await fetchChunk<Record<string, ChangelogItemData>>(url);
    const item = bucket[name];
    if (!item || item.type !== itemType) return null;
    return item;
  } catch {
    return null;
  }
}
