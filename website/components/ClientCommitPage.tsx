import { CodeIcon, MinusIcon, PlusIcon } from "@heroicons/react/solid";
import Link from "next/link";
import { FC } from "react";
import { useQuery } from "react-query";
import { fetchCommit } from "../data/clientDatabase";
import { ChangeType, DiffData, LeanVersion } from "../data/types";
import formatTimestamp from "../util/formatTimestamp";
import Layout from "./Layout";
import MathlibGithubMarkdown from "./MathlibGithubMarkdown";
import Spinner from "./Spinner";

interface Props {
  version: LeanVersion;
  sha: string;
}

const getLabel = (changeType: ChangeType) => {
  if (changeType === "add") {
    return (
      <span className="text-sm text-green-400">
        <PlusIcon className="w-4 h-4 inline" /> added
      </span>
    );
  }
  if (changeType === "del") {
    return (
      <span className="text-sm text-red-400">
        <MinusIcon className="w-4 h-4 inline" /> deleted
      </span>
    );
  }
  return (
    <span className="text-sm text-blue-400">
      <CodeIcon className="w-4 h-4 inline" /> modified
    </span>
  );
};

const getFileChangeLabel = (diff: DiffData) => {
  if (diff.oldPath && diff.newPath && diff.oldPath !== diff.newPath) {
    return (
      <span>
        Renamed <span className="italic">{diff.oldPath}</span> to{" "}
        <span className="italic">{diff.newPath}</span>
      </span>
    );
  }
  if (diff.oldPath && diff.newPath) {
    return (
      <span>
        Modified <span className="italic">{diff.oldPath}</span>
      </span>
    );
  }
  if (diff.oldPath && !diff.newPath) {
    return (
      <span>
        Deleted <span className="italic">{diff.oldPath}</span>
      </span>
    );
  }
  if (!diff.oldPath && diff.newPath) {
    return (
      <span>
        Created <span className="italic">{diff.newPath}</span>
      </span>
    );
  }
};

const repoName = (version: LeanVersion) =>
  version === "v3" ? "mathlib" : "mathlib4";

const ClientCommitPage: FC<Props> = ({ version, sha }) => {
  const { data: commit, isLoading } = useQuery(
    ["commit", version, sha],
    () => fetchCommit(version, sha),
    { staleTime: Infinity }
  );

  if (isLoading) {
    return (
      <Layout version={version}>
        <div className="flex justify-center py-12">
          <Spinner size={10} />
        </div>
      </Layout>
    );
  }

  if (!commit) {
    return (
      <Layout version={version}>
        <h1 className="text-xl">Commit not found</h1>
        <p className="text-gray-500 mt-2">
          No commit found with SHA {sha}.
        </p>
      </Layout>
    );
  }

  return (
    <Layout version={version}>
      <h1 className="text-xl">
        <span className="text-gray-400">Commit</span>{" "}
        {formatTimestamp(commit.timestamp)}{" "}
        <span className="text-gray-400">{commit.sha}</span>
      </h1>
      <a
        href={`https://github.com/leanprover-community/${repoName(version)}/commit/${commit.sha}`}
        className="text-blue-600 text-xs"
      >
        View on Github →
      </a>

      <div>
        <MathlibGithubMarkdown contents={commit.message} version={version} />
      </div>
      <h4 className="mt-4 mb-2 font-bold text-sm">Estimated changes</h4>
      <div>
        {commit.changes.map((diff, i) => (
          <div className="my-1" key={i}>
            <div>
              <a
                className="text-gray-800 hover:underline"
                href={`https://github.com/leanprover-community/${repoName(version)}/commit/${commit.sha}#diff-${diff.pathSha}`}
              >
                {getFileChangeLabel(diff)}
              </a>
            </div>
            <div className="pl-2 text-sm">
              {diff.changes.map(
                ([changeType, itemType, itemName, namespace], j) => {
                  const fullName = [...namespace, itemName].join(".");
                  return (
                    <div key={j}>
                      <span className="inline-block min-w-[100px] text-right">
                        {getLabel(changeType)}
                      </span>{" "}
                      <span className="font-semibold">{itemType}</span>{" "}
                      <Link
                        href={`/${version}/${itemType}/${encodeURIComponent(fullName)}`}
                      >
                        {fullName}
                      </Link>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ClientCommitPage;
