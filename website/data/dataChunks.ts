import { ItemType, LeanVersion } from "./types";

/**
 * Layout of the pre-built data chunks in public/data, shared by the script that
 * writes them (scripts/buildDataChunks.ts) and the code that reads them
 * (data/changelogStore.ts), so the two can't drift apart.
 *
 * Commits are bucketed by the first 3 hex chars of their sha, items by a hash
 * of their name. Each chunk is a JSON object keyed by commit sha, or by
 * `${type}:${name}` for items, since a def and a structure can share a name.
 */

export const DATA_CHUNKS_DIR = "data";

const ITEM_BUCKETS = 1024;
const COMMIT_SHA_PREFIX_LENGTH = 3;

// FNV-1a: tiny, synchronous and deterministic in every JS runtime.
const fnv1a = (input: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

export const isCommitShaLookup = (sha: string): boolean =>
  /^[0-9a-f]+$/.test(sha) && sha.length >= COMMIT_SHA_PREFIX_LENGTH;

export const commitChunkPath = (version: LeanVersion, sha: string): string =>
  `${DATA_CHUNKS_DIR}/${version}/commits/${sha.slice(
    0,
    COMMIT_SHA_PREFIX_LENGTH
  )}.json`;

export const itemChunkPath = (version: LeanVersion, name: string): string =>
  `${DATA_CHUNKS_DIR}/${version}/items/${(fnv1a(name) % ITEM_BUCKETS)
    .toString(16)
    .padStart(3, "0")}.json`;

export const itemEntryKey = (type: ItemType, name: string): string =>
  `${type}:${name}`;
