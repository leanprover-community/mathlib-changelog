import { createHash } from "crypto";
import { chunk, get, keyBy, memoize, set } from "lodash";
import {
  ChangelogItemData,
  extractDefsData,
  extractInductivesData,
  extractItemsData,
  extractStructuresData,
  extractTheoremsData,
} from "./extractDataFromChangelog";
import loadRawCommitData from "./loadRawCommitData";
import { ChangelogData, CommitData, ItemType, LeanVersion } from "./types";

/**
 * Data lookup methods
 * NOTE: These should only be called during static site generation!
 */

const COMMITS_PAGE_SIZE = 50;

const loadCommitData = memoize(
  (version: LeanVersion): ChangelogData => ({
    commits: loadRawCommitData(version).commits.map((rawCommit) => ({
      ...rawCommit,
      changes: rawCommit.changes.map((rawChange) => ({
        ...rawChange,
        pathSha: createHash("sha256")
          .update(rawChange.newPath || rawChange.oldPath || "")
          .digest("hex"),
      })),
    })),
  })
);

export const getItems = memoize((version: LeanVersion) =>
  extractItemsData(loadCommitData(version))
);
export const getTheorems = memoize((version: LeanVersion) =>
  extractTheoremsData(loadCommitData(version))
);
export const getInductives = memoize((version: LeanVersion) =>
  extractInductivesData(loadCommitData(version))
);
export const getDefs = memoize((version: LeanVersion) =>
  extractDefsData(loadCommitData(version))
);
export const getStructures = memoize((version: LeanVersion) =>
  extractStructuresData(loadCommitData(version))
);
export const getCommits = memoize(
  (version: LeanVersion) => loadCommitData(version).commits
);

interface ItemsLookupTable {
  [itemType: string]: { [itemName: string]: ChangelogItemData };
}

const getItemsLookupTable: (version: LeanVersion) => ItemsLookupTable = memoize(
  (version: LeanVersion) => {
    const itemsData = extractItemsData(loadCommitData(version));
    const lookupTable: ItemsLookupTable = {};
    for (const item of itemsData) {
      set(lookupTable, [item.type, item.name], item);
    }
    return lookupTable;
  }
);

interface CommitsLookupTable {
  [sha: string]: CommitData;
}
export const getCommitsLookupTable: (
  version: LeanVersion
) => CommitsLookupTable =
  memoize((version: LeanVersion) => {
    const commits = getCommits(version);
    return {
      ...keyBy(commits, "sha"),
      ...keyBy(commits, (commit) => commit.sha.slice(0, 8)),
    };
  });

export const getItem = (
  version: LeanVersion,
  type: ItemType,
  name: string
): ChangelogItemData | undefined =>
  get(getItemsLookupTable(version), [type, name]);

export const getCommit = (
  version: LeanVersion,
  sha: string
): CommitData | undefined => getCommitsLookupTable(version)[sha];

export const getCommitPages = (version: LeanVersion) => {
  const allCommits = getCommits(version);
  return chunk(allCommits, COMMITS_PAGE_SIZE);
};
