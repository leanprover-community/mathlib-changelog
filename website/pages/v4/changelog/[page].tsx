import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "../../../components/Layout";
import Pagination from "../../../components/Pagination";
import Pill from "../../../components/Pill";
import { getCommitPages, getCommits } from "../../../data/database";
import { CommitData, ItemType } from "../../../data/types";
import formatTimestamp from "../../../util/formatTimestamp";
import summarizeHeadline from "../../../util/summarizeHeadline";

const PER_PAGE = 50;

export const getStaticPaths: GetStaticPaths = () => {
  const commitPages = getCommitPages("v4");
  return {
    paths: commitPages.map((_, i) => ({ params: { page: String(i + 1) } })),
    fallback: false,
  };
};

interface CommitSummary {
  headline: string;
  sha: string;
  timestamp: number;
  changes: {
    files: number;
    theorems: number;
    structures: number;
    inductives: number;
    defs: number;
  };
}

interface ChangelogProps {
  commits: CommitSummary[];
  pageNum: number;
  maxPage: number;
  totalResults: number;
  pageStartItemNum: number;
  pageEndItemNum: number;
}

const countChangesOfType = (commit: CommitData, type: ItemType): number => {
  let count = 0;
  for (const diff of commit.changes) {
    count += diff.changes.filter((item) => item[1] === type).length;
  }
  return count;
};

export const getStaticProps: GetStaticProps<ChangelogProps> = (context) => {
  if (!context.params?.page || Array.isArray(context.params.page)) {
    return { notFound: true };
  }
  const pageNum = parseInt(context.params.page);
  if (!pageNum || pageNum <= 0) {
    return { notFound: true };
  }
  const allCommits = getCommits("v4");
  const commitPages = getCommitPages("v4");
  const commits = commitPages[pageNum - 1];

  if (!commits || commits.length === 0) return { notFound: true };
  const commitSummaries: CommitSummary[] = commits.map((commit) => ({
    sha: commit.sha,
    timestamp: commit.timestamp,
    headline: summarizeHeadline(commit.message),
    changes: {
      files: commit.changes.length,
      theorems: countChangesOfType(commit, "theorem"),
      defs: countChangesOfType(commit, "def"),
      inductives: countChangesOfType(commit, "inductive"),
      structures: countChangesOfType(commit, "structure"),
    },
  }));
  return {
    props: {
      maxPage: commitPages.length,
      commits: commitSummaries,
      totalResults: allCommits.length,
      pageStartItemNum: (pageNum - 1) * PER_PAGE + 1,
      pageEndItemNum: pageNum * PER_PAGE,
      pageNum,
    },
  };
};

const Changelog: NextPage<ChangelogProps> = ({
  commits,
  pageNum,
  maxPage,
  totalResults,
  pageStartItemNum,
  pageEndItemNum,
}) => {
  const router = useRouter();
  return (
    <Layout version="v4">
      <h1 className="text-xl">Changelog</h1>

      <Pagination
        pageNum={pageNum}
        maxPage={maxPage}
        totalResults={totalResults}
        pageStartItemNum={pageStartItemNum}
        pageEndItemNum={pageEndItemNum}
        onChangePage={(newPage) => router.push(`/v4/changelog/${newPage}`)}
      />
      {commits.map((commit) => (
        (<Link
          href={`/v4/commit/${commit.sha}`}
          key={commit.sha}
          className="p-2 border border-gray-200 my-1 rounded-md hover:border-gray-400 transition text-gray-800 block">

          <div className="pb-1">
            <span className="text-blue-600">
              {formatTimestamp(commit.timestamp)}
            </span>{" "}
            <span className="text-gray-400">{commit.sha}</span>
          </div>
          <div className="text-gray-800 text-sm pl-2 border-l border-right italic mb-2 truncate">
            {commit.headline}
          </div>
          <div>
            <span className="mr-1">
              <Pill color="blue">{commit.changes.files} files</Pill>
            </span>
            {commit.changes.theorems > 0 && (
              <span className="mr-1">
                <Pill color="blue">{commit.changes.theorems} theorems</Pill>
              </span>
            )}
            {commit.changes.defs > 0 && (
              <span className="mr-1">
                <Pill color="blue">{commit.changes.defs} defs</Pill>
              </span>
            )}
            {commit.changes.structures > 0 && (
              <span className="mr-1">
                <Pill color="blue">
                  {commit.changes.structures} structures
                </Pill>
              </span>
            )}
            {commit.changes.inductives > 0 && (
              <span className="mr-1">
                <Pill color="blue">
                  {commit.changes.inductives} inductives
                </Pill>
              </span>
            )}
          </div>

        </Link>)
      ))}
      <Pagination
        pageNum={pageNum}
        maxPage={maxPage}
        totalResults={totalResults}
        pageStartItemNum={pageStartItemNum}
        pageEndItemNum={pageEndItemNum}
        onChangePage={(newPage) => router.push(`/v4/changelog/${newPage}`)}
      />
    </Layout>
  );
};

export default Changelog;
