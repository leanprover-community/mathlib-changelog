import { createHash } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { cwd } from "node:process";
import { chunk } from "lodash";
import loadRawCommitData from "../data/loadRawCommitData";
import { extractItemsData } from "../data/extractDataFromChangelog";
import { CommitData, DiffData, LeanVersion } from "../data/types";
import summarizeHeadline from "../util/summarizeHeadline";

const PUBLIC_DATA_DIR = path.join(cwd(), "public/data");
const COMMITS_PAGE_SIZE = 50;

const VERSIONS: LeanVersion[] = ["v3", "v4"];

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

function sha256Prefix(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 2);
}

function buildVersionData(version: LeanVersion) {
  console.log(`Building static data for ${version}...`);
  const raw = loadRawCommitData(version);

  // Build commits with pathSha (same computation as database.ts)
  const commits: CommitData[] = raw.commits.map((rawCommit) => ({
    ...rawCommit,
    changes: rawCommit.changes.map((rawChange) => ({
      ...rawChange,
      pathSha: createHash("sha256")
        .update(rawChange.newPath || rawChange.oldPath || "")
        .digest("hex"),
    })),
  }));

  // --- Commit chunks (by first 2 hex chars of SHA) ---
  const commitsDir = path.join(PUBLIC_DATA_DIR, version, "commits");
  ensureDir(commitsDir);

  const commitBuckets: Record<string, Record<string, CommitData>> = {};
  for (const commit of commits) {
    const prefix = commit.sha.slice(0, 2);
    if (!commitBuckets[prefix]) commitBuckets[prefix] = {};
    commitBuckets[prefix][commit.sha] = commit;
  }
  for (const [prefix, bucket] of Object.entries(commitBuckets)) {
    writeFileSync(
      path.join(commitsDir, `${prefix}.json`),
      JSON.stringify(bucket)
    );
  }
  console.log(
    `  Wrote ${Object.keys(commitBuckets).length} commit chunk files`
  );

  // --- Item chunks (by SHA256 hash of item name, first 2 hex chars) ---
  const itemsDir = path.join(PUBLIC_DATA_DIR, version, "items");
  ensureDir(itemsDir);

  const changelogData = { commits };
  const items = extractItemsData(changelogData);

  const itemBuckets: Record<string, Record<string, object>> = {};
  for (const item of items) {
    const prefix = sha256Prefix(item.name);
    if (!itemBuckets[prefix]) itemBuckets[prefix] = {};
    itemBuckets[prefix][item.name] = item;
  }
  for (const [prefix, bucket] of Object.entries(itemBuckets)) {
    writeFileSync(
      path.join(itemsDir, `${prefix}.json`),
      JSON.stringify(bucket)
    );
  }
  console.log(`  Wrote ${Object.keys(itemBuckets).length} item chunk files`);

  // --- Manifest ---
  const commitPages = chunk(commits, COMMITS_PAGE_SIZE);
  const manifest = {
    totalCommits: commits.length,
    totalPages: commitPages.length,
  };
  writeFileSync(
    path.join(PUBLIC_DATA_DIR, version, "manifest.json"),
    JSON.stringify(manifest)
  );
  console.log(
    `  ${version}: ${commits.length} commits, ${items.length} items, ${commitPages.length} pages`
  );
}

if (require.main === module) {
  ensureDir(PUBLIC_DATA_DIR);
  for (const version of VERSIONS) {
    buildVersionData(version);
  }
  console.log("Done building static data.");
}
