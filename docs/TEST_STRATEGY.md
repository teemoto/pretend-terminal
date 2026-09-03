# Pretend Terminal v1 test strategy

**Status:** v1 production-test baseline

**Scope:** `@pretend-terminal/core`, `@pretend-terminal/react`, and their published-example consumer journeys

## Purpose

This document defines the evidence required to treat Pretend Terminal v1 as a reliable public UI-library release. It supplements the [v1 PRD](PRD.md) and [manual test plan](MANUAL_TEST_PLAN.md); it does not replace either.

The suite should test what a website author or visitor can rely on. It must not couple tests to private helpers, closure state, incidental class names, or internal call order.

## Test principles

1. **Use the lowest credible layer.** Test framework-neutral behavior in core, mounted browser-like behavior in DOM integration, React adapter behavior in React integration, and only real-browser concerns in E2E.
2. **Protect the safety boundary.** Tests must continue to prove that visitor input is matched only against author-defined commands; no output renders as arbitrary HTML; and unsafe link protocols are non-interactive.
3. **Prefer deterministic application-owned data.** Tests must not depend on external APIs, timing races, or real user storage. Async test commands use controlled local promises/timers.
4. **Treat accessibility as observable behavior.** Assert the documented region, log, input, keyboard, focus, and announcement contracts at the layer where each is meaningful.
5. **Do not chase line coverage.** A focused regression test for a public failure mode is more valuable than a percentage target.

## Test layers

### Core unit tests

Run the DOM-independent engine and configuration logic under Vitest. These tests are the source of truth for command resolution, state transitions, persistence adapters, output validation, and theme resolution.

They must not require a browser, server, network, or renderer.

### Vanilla DOM integration tests

Run the mounted `@pretend-terminal/core` public API in jsdom. Exercise real inputs and browser-like events to verify the visitor-facing terminal contract: focus, keyboard controls, transcript updates, output rendering, links, scrolling, cleanup, and accessible semantics.

Use roles, labels, and documented `data-pt-*` hooks where selection is needed; do not select presentation classes or unpromised DOM nesting.

### React integration tests

Run `PretendTerminal` through its public React props and visitor interactions. Cover React-specific concerns—callbacks, initialization-time configuration, presentation-prop updates, and unmount/remount cleanup—without duplicating core-engine cases.

### Browser E2E tests

Run built, production-like Vanilla and React examples in Playwright. E2E proves behavior jsdom cannot: real focus/caret flow, keyboard interaction, browser navigation/reload, responsive layout smoke coverage, console errors, and true local-storage persistence.

### Package-consumer checks

Install packed artifacts into a clean temporary consumer. Type-check the exact documented Vanilla and React quick starts, resolve root and stylesheet exports, and build the consumer. This validates the package boundary rather than workspace-only source resolution.

### Manual verification

Keep human review for evidence automation cannot credibly establish: visual theme quality and contrast across all presets, subjective responsive polish, favicon/branding appearance, and assistive-technology experience beyond semantic/announcement assertions. The manual plan remains the authoritative checklist for those checks.

## v1 evidence matrix

| v1 behavior or release criterion                                                        | Primary evidence          | Supporting evidence                                   |
| --------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------- |
| Command lookup, aliases, built-ins, overrides, unknown commands, static/dynamic results | Core unit                 | DOM/React integration, E2E command journey            |
| Async success, rejection, and ignored concurrent submission                             | Core unit                 | DOM/React integration, E2E async journey              |
| History, draft restoration, limits, and disabled persistence                            | Core unit                 | DOM integration, E2E reload journey                   |
| Tab completion: unique, ambiguous, and no match                                         | Core unit                 | DOM/React integration, E2E keyboard journey           |
| Structured output validation and safe link protocols                                    | Core unit                 | DOM integration, E2E allowed/unsafe-link journey      |
| Themes, custom tokens, and browser-storage fallback                                     | Core unit                 | DOM integration, manual visual review                 |
| Focus, input behavior, echo, output rendering, auto-scroll, and cleanup                 | Vanilla DOM integration   | E2E                                                   |
| Region/log/input semantics and completion announcements                                 | DOM and React integration | Keyboard-only E2E; manual assistive-technology review |
| React component props, callbacks, presentation updates, and cleanup                     | React integration         | E2E React journey                                     |
| Consumer installability, ESM/type/CSS exports, and documented quick starts              | Package-consumer check    | Build CI                                              |
| Vanilla and React visitor journeys in a real browser                                    | Browser E2E               | Manual test plan                                      |
| All built-in theme contrast and visual readability                                      | Manual review             | Theme token/unit tests                                |

## Required E2E journeys

Each journey runs against an independently built example and starts from a fresh browser context.

### Vanilla example

1. Load the page with no browser-console errors.
2. Focus the real command input by clicking terminal space; execute a built-in and a configured command; assert echoed command and structured output.
3. Exercise Arrow Up/Down draft restoration, unique and ambiguous Tab completion, and Ctrl/Cmd+L transcript clearing.
4. Execute the controlled async command and observe its pending then successful state; enter an unknown command and observe safe feedback.
5. Verify an allowed link is interactive and an unsafe link is rendered as non-interactive text.
6. Persist history/theme where enabled, reload, and verify the documented restoration behavior.
7. Complete a keyboard-only smoke path and a narrow-viewport smoke check without horizontal overflow.

### React example

1. Repeat the shared command, history, completion, clear-shortcut, async, unknown-command, keyboard-only, and narrow-viewport journey.
2. Verify React-specific configured output and callback-visible behavior through the example page's public feedback.
3. Reload after a persisted command and verify the documented history behavior.

## E2E operating policy

- **Runner:** Playwright. It owns browser installation, local serving, and browser diagnostics.
- **Browsers:** Chromium is required on every pull request. Firefox and WebKit run on pushes to `main` and before a release, once their runtime remains within the stated CI budget.
- **Selectors:** Prefer accessible roles/names and stable public `data-pt-*` hooks. Example-specific selectors must describe stable user-facing controls.
- **Isolation:** Create a fresh browser context per test. Use a unique storage key/context or clear only the test-owned key before and after each persistence case. Never depend on test execution order.
- **Timing:** Use event/state assertions, not arbitrary sleeps. Default test timeout is 15 seconds; navigation and web-server startup limits are 30 seconds unless a documented exception needs review.
- **Retries:** Zero retries locally and in CI. A failure must be diagnosed, not hidden; any temporary exception requires an issue linking the flaky behavior.
- **Artifacts:** Retain Playwright trace, screenshot, and video on failure in CI. Include the browser-console output in a failing test report when possible.
- **Network:** E2E examples use only local/static application behavior. Block or fail unexpected third-party network requests.

## Required CI evidence

Every pull request must run formatting, linting, type checks, core/DOM/React tests, production builds, and Chromium E2E. A failure in any required layer blocks merging.

Pushes to `main` and release preparation additionally run the supported cross-browser E2E matrix and the clean packed-consumer check. Failure artifacts must be uploaded for browser failures.

CI job names and local scripts should identify the layer they run—for example `test:unit`, `test:integration`, `test:e2e`, and `test:consumer`—so a contributor can reproduce one failure without rerunning unrelated checks.

## Completion standard

The v1 testing epic can close only when the matrix has evidence for every v1 PRD release criterion, all required automated layers are enforced in CI, and the manual plan contains only human-verification work that cannot be replaced credibly by automation.
