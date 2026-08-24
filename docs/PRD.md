# Pretend Terminal — Product Requirements Document

**Version:** v1.0 draft  
**Status:** Approved implementation scope  
**Last updated:** August 22, 2026

## 1. Product summary

Pretend Terminal is an open-source, installable UI library that lets website builders embed an interactive, terminal-inspired experience. It simulates a terminal’s interaction model but is explicitly not a system terminal: it executes only commands provided by the website author.

The project will be published as free npm packages under the `@pretend-terminal` scope and licensed under MIT.

## 2. Problem and opportunity

Developers often want a terminal-like interaction for portfolios, docs, demos, or product experiences. Existing approaches are commonly bespoke, tied to one framework, difficult to theme, or unsafe because they render arbitrary HTML or imply that user input reaches a shell.

Pretend Terminal provides a small, reusable alternative: authors define a set of safe commands and responses, visitors interact with familiar terminal controls, and the component fits the author’s visual system.

## 3. Goals

- Provide a safe pseudo-terminal that runs entirely in the browser.
- Make static terminal experiences configurable from JSON or a JavaScript/TypeScript config object.
- Support vanilla JavaScript and React without duplicating terminal behavior.
- Make themes and visual customization straightforward for non-library authors.
- Deliver a reliable, accessible v1 that is easy to document, test, and install.

## 4. Non-goals for v1

- Running OS, server, container, or browser shell commands.
- Filesystem or Unix-shell emulation, pipes, redirection, environment variables, or process management.
- Rich Markdown rendering, arbitrary HTML rendering, or a rich-text parser.
- Built-in networking, authentication, analytics, or data storage beyond optional local browser persistence.
- A visual terminal builder, hosted dashboard, or command marketplace.
- Support for frameworks other than vanilla JavaScript and React.

## 5. Users and primary use cases

### Website builders

They install the package, provide a config, choose a theme, and embed a terminal in a site without writing interaction logic from scratch.

### Portfolio and documentation visitors

They discover information by typing commands such as `help`, `about`, `projects`, or `contact`, using the keyboard in a familiar way.

### Application developers

They add dynamic commands that call their own approved application APIs, navigate a site, or show application state.

## 6. Product principles

1. **Simulated, never implied execution.** A command is a user-defined handler or a static response; it is not a shell command.
2. **Configuration first.** Common experiences require no custom renderer or application code.
3. **Framework-neutral core.** Terminal behavior lives in a core engine. Renderers adapt it to the DOM or React.
4. **Safe defaults.** Text is escaped and output is structured. Rich HTML is not the default extension mechanism.
5. **Customizable without a fork.** Prompt, commands, themes, tokens, classes, and callbacks are public configuration.
6. **Accessible keyboard interaction.** The terminal remains usable without a mouse and without relying on visual-only cues.

## 7. Package plan

| Package                   | Purpose                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| `@pretend-terminal/core`  | Framework-independent engine, types, built-in commands, themes, and a vanilla-JS mounting API. |
| `@pretend-terminal/react` | React component and hooks backed by `@pretend-terminal/core`.                                  |

Both packages use TypeScript, publish ESM builds, and expose their relevant type definitions. The React package depends on a compatible core version rather than reimplementing command behavior.

## 8. Functional requirements

### 8.1 Terminal interface

- Render a terminal container, output region, prompt, and real text input.
- Echo submitted commands before their result.
- Focus the input when the terminal body is clicked.
- Keep the most recent output visible by auto-scrolling after output is added.
- Display a clear unknown-command response with guidance to use `help`.
- Support synchronous and asynchronous command results.
- Show `Command failed. Please try again.` as a non-breaking error response if a command handler throws or rejects; do not expose the thrown error to visitors.

### 8.2 Input and keyboard behavior

- **Enter:** execute the non-empty input and clear the input afterward.
- **Arrow Up / Arrow Down:** navigate command history.
- **Tab:** complete a unique matching command; if several commands match, reveal suggestions without execution.
- **Ctrl/Cmd + L:** clear visible terminal output.
- **Escape:** no required behavior in v1.

Command history retains submitted commands in chronological order, including duplicates. It keeps up to `historyLimit` entries (100 by default; `0` disables retention). When a visitor begins browsing history, Pretend Terminal preserves their current draft; Arrow Down restores that draft after the newest history entry. Editing input or submitting a command resets the history-navigation position.

Tab completion matches active command names and aliases by a case-insensitive, trimmed prefix. One match replaces input with the command’s canonical name; multiple matches leave input unchanged and expose active commands in registry order; zero matches leave input unchanged. v1 does not apply common-prefix completion.

The default unknown-command response is `Command not found: {command}. Type help for available commands.` Consumers may override it with the JSON-compatible `messages.unknownCommand` string; every `{command}` placeholder is replaced with the submitted command. The `messages` object is intentionally extensible for future localization-ready strings.

### 8.3 Commands and configuration

Every command defines exactly one execution form: a static `response` or a JavaScript/TypeScript `handler`. It may also define:

- A required `name`.
- Optional `aliases`.
- An optional `description` used by generated help.
- A static `response` or a JavaScript/TypeScript `handler`.

The command matcher is case-insensitive and trims leading/trailing whitespace. v1 treats a full normalized line as the command key: it does not parse shell-like positional arguments. Application authors who need arguments may supply explicit command names or a handler that receives the raw input once that extension is introduced in a compatible minor release.

#### Static configuration

Static commands must be expressible in JSON. They enable content-only customization, such as changing the exact text that `help`, `about`, or `contact` displays.

#### Dynamic configuration

JavaScript/TypeScript commands may use handlers for application-owned behavior, including async API calls. Handlers return the same structured output format as static commands.

### 8.4 Built-in commands

The core package includes `help`, `clear`, and `history`.

- Built-ins are included by default.
- Consumers may disable all built-ins using config.
- A consumer command with the same name replaces its built-in counterpart.
- Default `help` is generated from all active, described commands.
- `clear` clears the visible output but does not delete persisted history.
- `history` shows the current session’s retained command history, oldest first, with one-based numbering.

### 8.5 Output model

v1 supports structured output only:

| Type                                  | Intended use                              |
| ------------------------------------- | ----------------------------------------- |
| `text`                                | A single plain text response.             |
| `lines`                               | Multiple lines of text.                   |
| `success`, `error`, `muted`, `accent` | Semantically styled text.                 |
| `table`                               | Small label/value or tabular data.        |
| `link`                                | A labelled, safe browser link.            |
| `ascii`                               | Preformatted ASCII art or code-like text. |

Implementations must safely render strings as text. Raw HTML and Markdown are not accepted as v1 output types.

Links accept relative URLs plus `http:`, `https:`, `mailto:`, and `tel:` URLs. Unsupported protocols, including `javascript:` and `data:`, render their label as non-interactive text. A link opens in the current tab by default. Setting `openInNewTab: true` adds `target="_blank"` and `rel="noopener noreferrer"`.

### 8.6 Theme and styling

- Include the `default`, `dracula`, `matrix`, `amber`, and `light` theme presets.
- Define themes through semantic CSS variables, including background, surface, text, muted text, prompt segments, accent, success, error, border, and font family tokens.
- Accept a preset name or a custom theme-token object.
- Resolve custom token objects and named custom themes against the complete default token set; reject unknown named themes rather than silently changing appearance.
- Allow consumers to override CSS variables in their own stylesheet.
- Allow consumer-supplied class names on the root terminal element.
- Ship a standalone CSS entry point; do not require Tailwind, CSS-in-JS, or a UI framework.

The vanilla renderer uses the stable `pt-` class prefix (`pt-terminal`, `pt-output`, `pt-prompt`, and `pt-input`) and exposes `data-pt-root`, `data-pt-output`, and `data-pt-input` as testing hooks. These attributes are not required styling hooks.

### 8.7 Persistence

Persistence is opt-in and browser-only.

- Use `localStorage` only after the terminal has mounted.
- Support separate toggles for persisted command history and selected theme.
- Require a consumer-defined `storageKey` when persistence is enabled.
- Enforce a configurable maximum command-history length.
- Silently fall back to in-memory behavior when storage is unavailable or blocked.
- Do not persist command outputs in v1.
- Do not include a built-in `theme` command in v1; consumers change themes through configuration or the imperative API.

### 8.8 Accessibility

- Use a real `<input>` for command entry.
- Expose the terminal as a labelled `region`, its transcript as a labelled `log`, and the real input as `Terminal command`.
- Announce new transcript additions politely. Do not re-announce unchanged transcript history when later commands add output.
- Preserve standard input editing and focus behavior.
- Make all documented keyboard controls usable without a mouse.
- Respect `prefers-reduced-motion` if animated scrolling, cursors, or transitions are introduced.
- Maintain sufficient contrast in the built-in themes.

### 8.9 Public API (target shape)

```ts
type TerminalConfig = {
  prompt?: string;
  commands?: Command[];
  includeBuiltIns?: boolean;
  theme?: ThemeName | ThemeTokens;
  themes?: Record<string, ThemeTokens>;
  className?: string;
  historyLimit?: number;
  messages?: {
    unknownCommand?: string;
  };
  storage?: {
    enabled: boolean;
    key: string;
    persistHistory?: boolean;
    persistTheme?: boolean;
  };
  onCommand?: (command: string) => void;
  onUnknownCommand?: (command: string) => void;
};

type Command = {
  name: string;
  aliases?: string[];
  description?: string;
  response?: TerminalOutput;
  handler?: (context: CommandHandlerContext) => TerminalOutput | Promise<TerminalOutput>;
};
```

The final names may change during implementation, but behavior must remain aligned with this document.

## 9. Technical approach

1. Build a DOM-independent core engine with state transitions for input, history, execution, completion, themes, and persistence adapters.
2. Build a vanilla renderer that mounts the core engine into an element and returns an imperative instance (`run`, `clear`, `focus`, `setTheme`, `destroy`).
3. Build a React adapter that uses the core engine and exposes a `PretendTerminal` component plus a lower-level hook for custom rendering.
4. Render structured output with first-party renderer functions; React-specific custom children are not a v1 requirement.

For v1, `PretendTerminal` treats terminal configuration as initialization-time input. Presentation props such as `className`, `style`, and `ariaLabel` may update normally; changing commands, theme configuration, or persistence settings requires mounting a new terminal instance.

The headless engine exposes `getState`, `subscribe`, `setInput`, history navigation, completion, `setTheme`, `run`, `clear`, and `destroy`. It has no `focus` method because it is browser-independent; the mounted vanilla terminal adds `focus()` for its real input element.

## 10. Quality requirements

- TypeScript must type-check with no errors.
- Core behavior must have automated unit tests: command lookup, aliases, built-in overrides, history, completion, storage fallback, and async/error paths.
- Vanilla integration tests must cover keyboard input, focus, output, and cleanup.
- React tests must cover component rendering and callbacks.
- Examples must build using the published-package API shape.
- The repository must include linting, formatting, and CI checks before the first public release.

## 11. Documentation requirements

Before v1 publication, documentation must include:

- Installation instructions for vanilla JavaScript and React.
- A minimal working example for each.
- Static JSON configuration and dynamic handler examples.
- Built-in-command behavior and override instructions.
- Theme preset and CSS-variable guidance.
- Persistence setup and browser/SSR behavior.
- The security model and explicit statement that no shell commands run.
- API reference generated from or aligned with exported TypeScript types.

## 12. Release criteria

v1 is ready when:

- `@pretend-terminal/core` and `@pretend-terminal/react` build and can be installed into their respective examples.
- All v1 functional and quality requirements pass in CI.
- The five built-in themes are visually verified in both example applications.
- JSON configuration can customize a built-in command response without source changes.
- Opt-in persistence works and degrades safely when unavailable.
- The README and API documentation enable a new user to add a terminal in under ten minutes.

## 13. Future phases (not v1)

These are intentionally excluded from v1 and should not shape its timeline unless they preserve the core’s extension points.

### Phase 2: richer authoring and rendering

- Optional, sanitized Markdown output.
- Command arguments and a small parser API.
- Command groups, categories, richer `help`, and suggestion UI.
- Localization helpers for built-ins and UI labels.
- More output primitives, such as lists, badges, progress bars, and images.

### Phase 3: ecosystem and advanced UX

- Plug-in API for command packs and output renderers.
- Additional framework adapters (for example Vue, Svelte, and Web Components).
- Theme package ecosystem and a visual theme preview.
- Optional command palette, searchable history, and mobile-specific input affordances.
- Persisted sessions and output transcript export.

### Phase 4: advanced simulation

- Optional virtual filesystem or curated terminal simulation, clearly isolated from any host execution.
- Scripted tutorials, multi-step command flows, and guided onboarding.
- Collaborative or remotely configured terminal content, subject to a separate security review.

### Phase 5: public demo website

Create a dedicated website that acts as both a product showcase and a hands-on sandbox for Pretend Terminal.

- A live terminal with the default commands and approachable onboarding.
- Interactive configuration controls for prompt text, built-ins, commands, persistence, and output types.
- Theme gallery and side-by-side theme preview for every bundled theme.
- Copyable vanilla JavaScript, React, JSON configuration, and CSS-variable examples that update with the selected configuration.
- Focused demonstrations of keyboard navigation, Tab completion, async handlers, error output, and accessible behavior.
- Links to npm, GitHub, documentation, changelog, and contribution guidance.

The demo site is a post-v1 deliverable. It must consume the public packages as an external user would, so it also serves as an integration and regression environment rather than a separate implementation.

## 14. Open implementation questions

These do not block the v1 scope, but should be decided while scaffolding:

- The exact monorepo tooling and release/versioning workflow.
- Whether the vanilla renderer is exported directly from `core` or as a small sibling package.
- The final names of output-type discriminators and public configuration fields.
- Whether `Cmd + L` maps to clear in addition to `Ctrl + L` on macOS (recommended).
