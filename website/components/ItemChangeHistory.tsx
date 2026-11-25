import Link from "next/link";
import { FC } from "react";
import { ChangelogItemData } from "../data/extractDataFromChangelog";
import { PlusIcon, MinusIcon, CodeBracketIcon } from "@heroicons/react/20/solid";
import { ChangeType, LeanVersion } from "../data/types";
import formatTimestamp from "../util/formatTimestamp";
import { uniqBy } from "lodash";
import versionPrefix from "../util/versionPrefix";

export interface ChangeHistoryProps {
  item: ChangelogItemData;
  version: LeanVersion;
}

const getLabel = (changeType: ChangeType) => {
  if (changeType === "add") {
    return (
      <span className="text-sm text-green-600">
        <PlusIcon className="w-4 h-4 inline" /> Added
      </span>
    );
  }
  if (changeType === "del") {
    return (
      <span className="text-sm text-red-600">
        <MinusIcon className="w-4 h-4 inline" /> Deleted
      </span>
    );
  }
  return (
    <span className="text-sm text-blue-600">
      <CodeBracketIcon className="w-4 h-4 inline" /> Modified
    </span>
  );
};

export const ItemChangeHistory: FC<ChangeHistoryProps> = ({
  item,
  version,
}) => (
  <div>
    <div className="py-2 flex flex-col">
      {uniqBy(item.history, (event) => `${event.commitSha}-${event.type}`).map(
        (event, i) => (
          <div key={i} className="relative">
            <Link
              href={`${versionPrefix(version)}/commit/${event.commitSha}`}
              className="p-2 border border-gray-200 my-1 rounded-md hover:border-gray-400 transition-all text-gray-800 block">

              <div className="pb-1">
                <span className="text-blue-600">
                  {formatTimestamp(event.commitTimestamp)}
                </span>
              </div>
              <div className="text-gray-400 pb-2 text-xs">
                {event.diffPath}
              </div>
              <div className="text-gray-800 text-sm pl-2 border-l border-right italic mb-2 truncate">
                {event.commitHeadline}
              </div>
              {getLabel(event.type)} {item.name}

            </Link>
            <a
              className="text-blue-600 text-xs block absolute right-1 top-2 p-2 rounded-md border hover:border-gray-200 border-white transition-all"
              href={`https://github.com/leanprover-community/${
                version == "v3" ? "mathlib" : "mathlib4"
              }/commit/${event.commitSha}#diff-${event.diffPathSha}`}
            >
              View on Github →
            </a>
          </div>
        )
      )}
    </div>
  </div>
);
