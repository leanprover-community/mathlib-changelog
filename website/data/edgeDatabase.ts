/**
 * Edge-compatible data loading for Cloudflare Workers.
 * Fetches pre-built JSON chunks from static assets via HTTP.
 */
import { ChangelogItemData } from "./extractDataFromChangelog";
import { CommitData, ItemType, LeanVersion } from "./types";

function getSiteUrl(): string {
  return (
    process.env.SITE_URL ||
    process.env.CF_PAGES_URL ||
    "http://localhost:3000"
  );
}

async function sha256Prefix(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 2);
}

export async function getCommitEdge(
  version: LeanVersion,
  sha: string
): Promise<CommitData | null> {
  const prefix = sha.slice(0, 2).toLowerCase();
  try {
    const res = await fetch(
      `${getSiteUrl()}/data/${version}/commits/${prefix}.json`
    );
    if (!res.ok) return null;
    const bucket = (await res.json()) as Record<string, CommitData>;
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

export async function getItemEdge(
  version: LeanVersion,
  itemType: ItemType,
  name: string
): Promise<ChangelogItemData | null> {
  const prefix = await sha256Prefix(name);
  try {
    const res = await fetch(
      `${getSiteUrl()}/data/${version}/items/${prefix}.json`
    );
    if (!res.ok) return null;
    const bucket = (await res.json()) as Record<string, ChangelogItemData>;
    const item = bucket[name];
    if (!item || item.type !== itemType) return null;
    return item;
  } catch {
    return null;
  }
}
