import { mkdirSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { cwd } from "node:process";
import { getCommitsLookupTable, getItems } from "../data/database";
import {
  DATA_CHUNKS_DIR,
  commitChunkPath,
  itemChunkPath,
  itemEntryKey,
} from "../data/dataChunks";
import { LeanVersion } from "../data/types";

/**
 * Writes the commit and item data as small JSON chunks under public/data, for
 * the Cloudflare Worker to read from its static assets (see
 * data/changelogStore.ts). Not needed for Vercel or `next dev`.
 */

const PUBLIC_DIR = path.join(cwd(), "public");
const VERSIONS: LeanVersion[] = ["v3", "v4"];

const writeChunks = (chunks: Map<string, Record<string, unknown>>) => {
  for (const [chunkPath, entries] of chunks) {
    const file = path.join(PUBLIC_DIR, chunkPath);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(entries));
  }
};

const addEntry = (
  chunks: Map<string, Record<string, unknown>>,
  chunkPath: string,
  key: string,
  value: unknown
) => {
  const entries = chunks.get(chunkPath) ?? {};
  if (key in entries) throw new Error(`Duplicate key ${key} in ${chunkPath}`);
  entries[key] = value;
  chunks.set(chunkPath, entries);
};

const buildDataChunks = () => {
  rmSync(path.join(PUBLIC_DIR, DATA_CHUNKS_DIR), {
    recursive: true,
    force: true,
  });
  for (const version of VERSIONS) {
    // Use database.ts's own sha lookup, so the chunks resolve shas exactly as
    // the Vercel deploy does (including which commit wins when two commits
    // share a short sha).
    const commitChunks = new Map<string, Record<string, unknown>>();
    const commitsBySha = Object.entries(getCommitsLookupTable(version));
    for (const [sha, commit] of commitsBySha) {
      addEntry(commitChunks, commitChunkPath(version, sha), sha, commit);
    }
    writeChunks(commitChunks);

    const itemChunks = new Map<string, Record<string, unknown>>();
    const items = getItems(version);
    for (const item of items) {
      addEntry(
        itemChunks,
        itemChunkPath(version, item.name),
        itemEntryKey(item.type, item.name),
        item
      );
    }
    writeChunks(itemChunks);

    console.log(
      `${version}: ${commitsBySha.length} commit shas in ${commitChunks.size} chunks, ` +
        `${items.length} items in ${itemChunks.size} chunks`
    );
  }
};

if (require.main === module) {
  buildDataChunks();
}
