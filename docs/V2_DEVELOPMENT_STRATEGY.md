# v2 development strategy

## Purpose

Keep `main` a stable, releasable v1 line while v2 evolves deliberately. v2 must extend Pretend Terminal without weakening its safe pseudo-terminal boundary or regressing documented v1 behavior.

## Branch and review model

- `main` contains only accepted v1 maintenance and release work until v2 is ready to merge.
- `v2` is the long-lived integration branch for v2 work.
- Each GitHub issue uses a focused branch from `v2` (for example, `v2/issue-3-command-schemas`). A task merges into `v2` only after its acceptance tests, review, and required checks pass.
- `v2` merges into `main` only through an explicit release-preparation review, with migration, compatibility, security, accessibility, and package-boundary evidence complete.
- Commits and branches remain local until the owner explicitly authorizes a push or pull request.

## Test-first and compatibility gates

For every v2 task, first add or update behavior-level acceptance tests at the lowest credible layer. Then implement the behavior, run the focused task suite, and run the v1 regression gate before merge.

Every v2 task branch must pass:

```sh
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test:core
corepack pnpm test:react
corepack pnpm build
corepack pnpm test:consumer
corepack pnpm test:e2e
```

Before merging a v2 milestone or preparing a release, also run:

```sh
corepack pnpm test:e2e:cross-browser
```

The required checks protect v1 command matching, structured safe output and link handling, keyboard/accessibility contracts, persistence, Vanilla/React parity, package exports, and packed-consumer installation. New v2 tests supplement these checks; they never replace or loosen v1 coverage without an explicit migration decision.

## Tags and release evidence

- `v0.2.2` remains the tag for the published package version.
- `v1-test-gate` is an annotated, non-release milestone tag at the commit that completed the v1 production-test gate. It identifies the baseline used for v2 compatibility checks.
- Use semver prerelease tags only for cohesive releasable v2 milestones, such as `v2.0.0-alpha.1`; do not tag individual task commits as releases.
- Every prerelease/release tag must reference passing CI, package-consumer validation, browser evidence, and the applicable migration/security documentation.

## Current transition

The initial v2 parser and command-schema design commits were made on `main` before this policy existed. They are preserved on the new `v2` branch and reverted from `main`, so future v2 work follows this strategy without losing completed work.
