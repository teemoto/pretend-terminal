# Contributing to Pretend Terminal

Thanks for helping improve Pretend Terminal. Contributions that make the library safer, clearer, more accessible, or more reliable are especially welcome.

Pretend Terminal is a browser-based pseudo-terminal. It only runs commands explicitly configured by the site author; it must never execute a host, server, or browser shell command.

## Before you begin

For a small, reproducible bug fix, you are welcome to open a pull request directly.

Please open an issue before investing in a larger change, including a new feature, public API change, behavior change, dependency addition, or work that may expand the v1 scope. This lets us confirm the problem, approach, and fit before implementation.

The [v1 product requirements document](docs/PRD.md) defines the intended scope. In particular, v1 does not include shell emulation, raw HTML or Markdown output, built-in networking, or framework adapters beyond vanilla JavaScript and React.

## Reporting a bug

Search open and closed issues first. A useful bug report includes:

- A clear description of the expected and actual behavior.
- A minimal reproduction, repository, or small code sample.
- The package and version involved (`@pretend-terminal/core` or `@pretend-terminal/react`).
- Browser, operating system, Node.js, and React versions where relevant.
- Steps to reproduce, plus screenshots or recordings for visual issues.
- Whether the issue affects keyboard use, screen-reader feedback, focus, contrast, or another accessibility outcome.

Please do not include secrets, tokens, or private application data in an issue or reproduction.

## Local setup

This repository is a pnpm workspace. It requires Node.js `>=22.13.0`; the pinned pnpm version is declared in `package.json`.

```sh
corepack enable
corepack pnpm install --frozen-lockfile
```

Useful local commands:

```sh
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

These are the checks run by continuous integration. For a visual or interaction change, also use the relevant Vite example and follow the applicable checks in the [manual test plan](docs/MANUAL_TEST_PLAN.md):

```sh
corepack pnpm dev:vanilla
corepack pnpm dev:react
corepack pnpm dev:demo
```

## Working in the codebase

- Put shared command behavior, state, types, and browser-agnostic logic in `@pretend-terminal/core`.
- Keep React-specific rendering and integration in `@pretend-terminal/react`; do not duplicate core behavior there.
- Preserve structured, safely rendered output. Do not add raw HTML or Markdown rendering as a shortcut.
- Treat public TypeScript configuration as a product surface: validate input deliberately and keep documentation aligned with exported behavior.
- Keep changes focused. Avoid drive-by formatting or broad stylistic refactors unrelated to the problem being solved.
- Avoid adding dependencies unless the benefit is clear and has been discussed for non-trivial additions.

## Tests and accessibility

Test observable behavior at the lowest appropriate layer:

- Engine tests for command resolution, output, history, completion, persistence, and error behavior.
- DOM integration tests for mounting and browser interaction.
- React tests for the public component contract.

When fixing a regression, add a focused behavior-level test where practical. For UI changes, preserve the real command input, keyboard controls, focus behavior, accessible labels and live announcements, and readable theme contrast. The [manual test plan](docs/MANUAL_TEST_PLAN.md) covers the interaction checks that require a browser.

## Pull requests

Please open a focused PR against `main` and include:

- A concise explanation of the problem and the solution.
- A link to the related issue, if there is one.
- Tests for changed behavior, or a brief explanation when a test is not applicable.
- Documentation, examples, or manual-test-plan updates when the public behavior changes.
- A Changeset for consumer-visible changes to `@pretend-terminal/core` or `@pretend-terminal/react`.

Use `corepack pnpm changeset` to create a Changeset. Do not run `version-packages`, `release`, publish packages, or modify external services; releases are prepared and published only by the repository owner after review.

Maintainers may ask for changes related to API design, v1 scope, safety, accessibility, documentation, or test coverage. Small commits are fine; they can be squashed when the PR is merged.

## License

By submitting a contribution, you agree that it may be distributed under this repository's [MIT License](LICENSE).
