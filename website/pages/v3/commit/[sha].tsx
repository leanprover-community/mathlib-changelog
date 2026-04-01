import { CodeIcon, MinusIcon, PlusIcon } from "@heroicons/react/solid";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Layout from "../../../components/Layout";
import MathlibGithubMarkdown from "../../../components/MathlibGithubMarkdown";
import { getCommitEdge } from "../../../data/edgeDatabase";
import { ChangeType, CommitData, DiffData } from "../../../data/types";
import formatTimestamp from "../../../util/formatTimestamp";

export const runtime = "experimental-edge";

export const getStaticPaths: GetStaticPaths = () => ({
  paths: [],
  fallback: "blocking",
});

interface CommitProps {
  commit: CommitData;
}

export const getStaticProps: GetStaticProps<CommitProps> = async (context) => {
  if (!context.params?.sha || Array.isArray(context.params.sha)) {
    return { notFound: true };
  }
  const commit = await getCommitEdge("v3", context.params.sha);
  if (!commit) return { notFound: true };
  return { props: { commit } };
};

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

const Commit: NextPage<CommitProps> = ({ commit }) => {
  return (
    <Layout version="v3">
      <h1 className="text-xl">
        <span className="text-gray-400">Commit</span>{" "}
        {formatTimestamp(commit.timestamp)}{" "}
        <span className="text-gray-400">{commit.sha}</span>
      </h1>
      <a
        href={`https://github.com/leanprover-community/mathlib/commit/${commit.sha}`}
        className="text-blue-600 text-xs"
      >
        View on Github →
      </a>

      <div>
        <MathlibGithubMarkdown contents={commit.message} version="v3" />
      </div>
      <h4 className="mt-4 mb-2 font-bold text-sm">Estimated changes</h4>
      <div>
        {commit.changes.map((diff, i) => (
          <div className="my-1" key={i}>
            <div>
              <a
                className="text-gray-800 hover:underline"
                href={`https://github.com/leanprover-community/mathlib/commit/${commit.sha}#diff-${diff.pathSha}`}
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
                        href={`/v3/${itemType}/${encodeURIComponent(fullName)}`}
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

export default Commit;
