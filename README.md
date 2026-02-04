# mathlib-changelog

[![cron](https://img.shields.io/github/actions/workflow/status/leanprover-community/mathlib-changelog/crawl.yaml?label=cron&branch=main)](https://github.com/leanprover-community/mathlib-changelog)
[![ci](https://img.shields.io/github/actions/workflow/status/leanprover-community/mathlib-changelog/ci.yaml?branch=main)](https://github.com/leanprover-community/mathlib-changelog)
[![website](https://img.shields.io/github/deployments/leanprover-community/mathlib-changelog/production?label=website&logo=vercel)](https://mathlib-changelog.org)

### Explore the changelog at [mathlib-changelog.org](https://mathlib-changelog.org/)

This Repo maintains an auto-updating list of the commits to [mathlib](https://github.com/leanprover-community/mathlib) for [Lean](https://leanprover.github.io/) to have these in a searchable, indexable location.

Currently this pulls in git commit messages, and attempts to parse out the changed `lemma`, `def`, `theorem`, `inductive`, `abbreviation`, and `structure` in the commit. This is just based on looking at the file in the commit, and doesn't load a full lean/mathlib environment, so it's not guaranteed to catch every change (but it should be pretty close!).

The full changelog in the following formats:

- JSON is available in [CHANGELOG.v3.full.json](https://raw.githubusercontent.com/leanprover-community/mathlib-changelog/main/CHANGELOG.v3.full.json) and [CHANGELOG.v4.full.json](https://raw.githubusercontent.com/leanprover-community/mathlib-changelog/main/CHANGELOG.v4.full.json)
- plaintext is available in [CHANGELOG.v3.full.txt](https://raw.githubusercontent.com/leanprover-community/mathlib-changelog/main/CHANGELOG.v3.full.txt) and [CHANGELOG.v4.full.txt](https://raw.githubusercontent.com/leanprover-community/mathlib-changelog/main/CHANGELOG.v4.full.txt)
- web is available at [mathlib-changelog.org/changelog](https://mathlib-changelog.org/changelog)

## Project structure

This project consists of 3 components:

- The exported changelogs, in the base directory
- A crawler written in Python, which scans the `mathlib` git repo and builds the changelogs. This lives in the `crawler` directory
- A static site for viewing the changelog, written in Typescript and Next.js/React. This lives in the `website` directory

### Website

To build the website, change into the `website` directory.

- To install dependencies, run `yarn install`
- To build the search index used on the main page of the site, run `yarn build:search`
- To run a development environment, run `yarn dev`
- To build a production version of the site, run `yarn build`

### Crawler

To use the crawler, change into the `crawler` directory. The crawler is a Python project and uses Poetry to manage dependencies and build environment. Flake8 is used for linting, MyPy is used for type-checking, and Black is used for code formatting.

- To install dependencies, run `poetry install`
- To run tests, run `poetry run pytest`
- To run linting and type checks, run `poetry run flake8 .` and `poetry run mypy .`
- To run the crawler, run `poetry run python -m crawler.crawl`

## Contributing

Contributions are welcome! If you have an idea for an improvement or want to report a bug, feel free to open an issue. If you want to work on a fix or improvement directly, open up a pull request in this repo.

## License

This code is released under an MIT license
