import argparse
import json
import logging
import pickle
from dataclasses import asdict
from pathlib import Path
from shutil import rmtree
from typing import Any, Literal, Optional

from git import Git, Repo
from git.objects import Commit
from tqdm import tqdm

from crawler.formatters.format_commit_json import format_commit_json
from crawler.formatters.format_commit_txt import format_commit_txt
from crawler.parser.DiffParser import DiffParser, ParseCache

logging.basicConfig(level=logging.INFO)

CUR_DIR = Path(__file__).parent.resolve()
ROOT_DIR = CUR_DIR / "../.."

LeanVersion = Literal["v3", "v4"]

REPO_URLS: dict[LeanVersion, str] = {
    "v3": "https://github.com/leanprover-community/mathlib.git",
    "v4": "https://github.com/leanprover-community/mathlib4.git",
}
CLONE_DIRS: dict[LeanVersion, str] = {"v3": "mathlib", "v4": "mathlib4"}

# The changelog stores short shas, see format_commit_json
SHORT_SHA_LEN = 8


def full_txt_output_file(lean_version: LeanVersion) -> Path:
    return ROOT_DIR / f"CHANGELOG.{lean_version}.full.txt"


def full_json_output_file(lean_version: LeanVersion) -> Path:
    return ROOT_DIR / f"CHANGELOG.{lean_version}.full.json"


def parse_cache_file(lean_version: LeanVersion) -> Path:
    return CUR_DIR / f"../parse_cache.{lean_version}.pkl"


def load_existing_changelog(lean_version: LeanVersion) -> list[dict[str, Any]]:
    json_file = full_json_output_file(lean_version)
    if not json_file.exists():
        return []
    with open(json_file) as f:
        return json.load(f)["commits"]


def latest_changelog_sha(existing_commits: list[dict[str, Any]]) -> str | None:
    if not existing_commits:
        return None
    return existing_commits[0]["sha"]


def remote_head_sha(repo_url: str) -> str:
    "Look up the sha of the remote's default branch without cloning"
    return Git().ls_remote(repo_url, "HEAD").split()[0]


def find_commits_to_crawl(
    repo: Repo, latest_sha: str | None
) -> tuple[list[Commit], Optional[Commit]]:
    """
    Return the commits not yet in the changelog, newest first, along with the
    newest commit that is already in the changelog (None means a full crawl).

    The changelog only stores a short sha, so it is matched against the full
    shas reachable from HEAD rather than resolved by git, which considers every
    object in the repo and could find the prefix ambiguous.
    """
    if latest_sha is None:
        return list(repo.iter_commits()), None
    for index, sha in enumerate(repo.git.rev_list("HEAD").splitlines()):
        if sha.startswith(latest_sha):
            # max_count=0 would be dropped by GitPython and list every commit
            new_commits = list(repo.iter_commits(max_count=index)) if index else []
            return new_commits, repo.commit(sha)
    logging.warning(
        f"Changelog commit {latest_sha} is not reachable from HEAD, "
        "doing a full crawl"
    )
    return list(repo.iter_commits()), None


def crawl(
    mathlib_repo: Repo,
    lean_version: LeanVersion,
    full: bool = False,
) -> None:
    """
    Update the changelog files for lean_version. Unless `full` is set, only
    commits newer than the latest one already in the changelog are parsed and
    the results are prepended to the existing changelog.
    """
    logging.info(f"Starting crawl for {lean_version}")
    existing_commits = [] if full else load_existing_changelog(lean_version)
    commits, base_commit = find_commits_to_crawl(
        mathlib_repo, latest_changelog_sha(existing_commits)
    )
    if len(commits) == 0:
        logging.info(f"Changelog for {lean_version} is already up to date")
        return
    logging.info(f"Parsing {len(commits)} new commits for {lean_version}")

    parse_cache: ParseCache = {}
    cache_file = parse_cache_file(lean_version)
    if cache_file.exists():
        logging.info("Parser cache found")
        with open(cache_file, "rb") as f:
            parse_cache = pickle.load(f)

    diff_parser = DiffParser(
        mathlib_repo, lean_version=lean_version, parse_cache=parse_cache
    )

    commits_info_txt: list[str] = []
    commits_info_json: list[dict[Any, Any]] = []
    for index, commit in enumerate(tqdm(commits)):
        older_commit = commits[index + 1] if index + 1 < len(commits) else base_commit
        diffs = (
            diff_parser.diff_commits(older_commit, commit)
            if older_commit is not None
            else []
        )
        commits_info_txt.append(format_commit_txt(commit, diffs))
        commits_info_json.append(asdict(format_commit_json(commit, diffs)))

    logging.info("writing outputs")

    with open(cache_file, "wb") as f:
        pickle.dump(diff_parser.parse_cache, f, pickle.HIGHEST_PROTOCOL)

    txt_file = full_txt_output_file(lean_version)
    existing_txt = txt_file.read_text() if existing_commits else ""
    txt_parts = ["\n\n\n".join(commits_info_txt)]
    if existing_txt:
        txt_parts.append(existing_txt)
    txt_file.write_text("\n\n\n".join(txt_parts))

    with open(full_json_output_file(lean_version), "w") as f:
        f.write(
            json.dumps(
                {"commits": commits_info_json + existing_commits},
                ensure_ascii=False,
            )
        )
    logging.info(f"Added {len(commits)} commits to the {lean_version} changelog")


def clone_or_update_repo(lean_version: LeanVersion, reuse_clone: bool) -> Repo:
    clone_dir = CLONE_DIRS[lean_version]
    if reuse_clone and Path(clone_dir).exists():
        logging.info(f"Updating existing clone in {clone_dir}")
        repo = Repo(clone_dir)
        repo.git.fetch("origin")
        repo.git.reset("--hard", "origin/HEAD")
        return repo
    logging.info(f"Cloning {REPO_URLS[lean_version]}")
    rmtree(clone_dir, ignore_errors=True)
    return Repo.clone_from(REPO_URLS[lean_version], clone_dir)


def update_changelog(lean_version: LeanVersion, full: bool, reuse_clone: bool) -> None:
    if not full:
        latest_sha = latest_changelog_sha(load_existing_changelog(lean_version))
        remote_sha = remote_head_sha(REPO_URLS[lean_version])
        if latest_sha is not None and remote_sha.startswith(latest_sha):
            logging.info(f"Changelog for {lean_version} is already up to date")
            return
    repo = clone_or_update_repo(lean_version, reuse_clone)
    crawl(repo, lean_version, full=full)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Crawl mathlib git repos to update changelog"
    )
    parser.add_argument("--skip-v3", action="store_true")
    parser.add_argument("--skip-v4", action="store_true")
    parser.add_argument(
        "--full",
        action="store_true",
        help="Re-crawl the whole history instead of only new commits",
    )
    parser.add_argument(
        "--reuse-clone",
        action="store_true",
        help="Fetch into an existing mathlib clone instead of re-cloning",
    )
    args = parser.parse_args()

    if not args.skip_v3:
        update_changelog("v3", full=args.full, reuse_clone=args.reuse_clone)
    if not args.skip_v4:
        update_changelog("v4", full=args.full, reuse_clone=args.reuse_clone)
