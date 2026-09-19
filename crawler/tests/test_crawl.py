from pathlib import Path

from git import Repo

from crawler.crawl import find_commits_to_crawl


def make_repo(tmp_path: Path, n_commits: int) -> Repo:
    repo = Repo.init(tmp_path)
    with repo.config_writer() as config:
        config.set_value("user", "name", "test")
        config.set_value("user", "email", "test@example.com")
    for i in range(n_commits):
        (tmp_path / "A.lean").write_text(f"theorem t{i} : True := trivial\n")
        repo.index.add(["A.lean"])
        repo.index.commit(f"commit {i}")
    return repo


def messages(commits: list) -> list:  # type: ignore[type-arg]
    return [commit.message for commit in commits]


def test_find_commits_to_crawl_returns_everything_without_a_changelog(
    tmp_path: Path,
) -> None:
    repo = make_repo(tmp_path, 3)
    commits, base_commit = find_commits_to_crawl(repo, None)
    assert messages(commits) == ["commit 2", "commit 1", "commit 0"]
    assert base_commit is None


def test_find_commits_to_crawl_returns_only_new_commits(tmp_path: Path) -> None:
    repo = make_repo(tmp_path, 3)
    known_commit = list(repo.iter_commits())[1]
    commits, base_commit = find_commits_to_crawl(repo, known_commit.hexsha[:8])
    assert messages(commits) == ["commit 2"]
    assert base_commit == known_commit


def test_find_commits_to_crawl_is_a_noop_when_up_to_date(tmp_path: Path) -> None:
    repo = make_repo(tmp_path, 2)
    commits, base_commit = find_commits_to_crawl(repo, repo.head.commit.hexsha[:8])
    assert commits == []
    assert base_commit == repo.head.commit


def test_find_commits_to_crawl_falls_back_to_full_crawl_for_unknown_sha(
    tmp_path: Path,
) -> None:
    repo = make_repo(tmp_path, 2)
    commits, base_commit = find_commits_to_crawl(repo, "deadbeef")
    assert messages(commits) == ["commit 1", "commit 0"]
    assert base_commit is None


def test_find_commits_to_crawl_falls_back_to_full_crawl_after_history_rewrite(
    tmp_path: Path,
) -> None:
    repo = make_repo(tmp_path, 3)
    orphaned_commit = repo.head.commit
    repo.git.reset("--hard", "HEAD~1")
    commits, base_commit = find_commits_to_crawl(repo, orphaned_commit.hexsha[:8])
    assert messages(commits) == ["commit 1", "commit 0"]
    assert base_commit is None
