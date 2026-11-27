import {
  getCommit as getCommitFromChangelog,
  getItem as getItemFromChangelog,
} from "./database";
import {
  commitChunkPath,
  isCommitShaLookup,
  itemChunkPath,
  itemEntryKey,
} from "./dataChunks";
import { ChangelogItemData } from "./extractDataFromChangelog";
import { CommitData, ItemType, LeanVersion } from "./types";

/**
 * Request-time lookups for commit and item pages.
 *
 * On Cloudflare Workers there is no filesystem, and the changelog JSON is far
 * too large to bundle into the Worker, so lookups read the small chunks written
 * by scripts/buildDataChunks.ts from the Worker's static assets. The Worker
 * config sets CHANGELOG_DATA_SOURCE=assets to select this.
 *
 * Everywhere else (Vercel, `next dev`, `next start`) lookups read the full
 * changelog JSON through database.ts, as before.
 */
const readsFromAssetChunks = (): boolean =>
  process.env.CHANGELOG_DATA_SOURCE === "assets";

const readAssetChunk = async <T>(path: string): Promise<T | undefined> => {
  const { getCloudflareContext } =
    await import("@opennextjs/cloudflare/cloudflare-context");
  const { env } = await getCloudflareContext({ async: true });
  if (!env.ASSETS) {
    throw new Error("CHANGELOG_DATA_SOURCE=assets needs an ASSETS binding");
  }
  // Static asset reads through the binding stay inside the Worker: any origin
  // works, only the path is used.
  const res = await env.ASSETS.fetch(
    new URL(`/${path}`, "http://assets.local")
  );
  if (!res.ok) {
    await res.body?.cancel();
    return undefined;
  }
  return (await res.json()) as T;
};

export const getCommit = async (
  version: LeanVersion,
  sha: string
): Promise<CommitData | undefined> => {
  if (!readsFromAssetChunks()) return getCommitFromChangelog(version, sha);
  if (!isCommitShaLookup(sha)) return undefined;
  const chunk = await readAssetChunk<Record<string, CommitData>>(
    commitChunkPath(version, sha)
  );
  return chunk?.[sha];
};

export const getItem = async (
  version: LeanVersion,
  type: ItemType,
  name: string
): Promise<ChangelogItemData | undefined> => {
  if (!readsFromAssetChunks()) return getItemFromChangelog(version, type, name);
  const chunk = await readAssetChunk<Record<string, ChangelogItemData>>(
    itemChunkPath(version, name)
  );
  return chunk?.[itemEntryKey(type, name)];
};
