# Pretend Terminal

[![CI](https://github.com/teemoto/pretend-terminal/actions/workflows/ci.yml/badge.svg)](https://github.com/teemoto/pretend-terminal/actions/workflows/ci.yml)

**A safe, configurable pseudo-terminal for the web.**

Pretend Terminal lets people add a terminal-inspired interface to a website without embedding a real shell, server execution, or unsafe HTML rendering. It is designed for portfolios, documentation sites, product demos, onboarding flows, and playful developer experiences.

Pretend Terminal includes a framework-independent core package and a first-class React integration.

> **Project status:** `@pretend-terminal/core` and `@pretend-terminal/react` are published at `0.2.0`.

## Live demo

Explore the interactive configuration sandbox, nine-theme gallery, and integration snippets at [teemoto.github.io/pretend-terminal](https://teemoto.github.io/pretend-terminal/).

## Using Pretend Terminal with coding agents

For a short, copy-pasteable path that agents and developers can follow, use the [integration guide](docs/INTEGRATION_GUIDE.md). The repository root also provides [llms.txt](llms.txt), a concise map to the guide, reference documentation, examples, and the live demo.

## Why Pretend Terminal?

- **Safe by design.** Commands are application-defined; they never execute a system shell.
- **Configurable.** Static commands and responses can be provided as JSON, while JavaScript/TypeScript enables custom or asynchronous behavior.
- **Framework-friendly.** Use the core library in vanilla JavaScript or the React package in a React app.
- **Themeable.** Start from included themes or override semantic CSS variables to match your site.
- **Accessible.** The terminal will use real inputs and keyboard-first interactions rather than a canvas or contenteditable imitation.

## v1 features

- Vanilla JavaScript mounting API and React component.
- Configurable commands, aliases, descriptions, and structured responses.
- Built-in `help`, `clear`, and `history` commands that users can keep, override, or disable.
- Command echo, keyboard history, Tab completion, unknown-command feedback, click-to-focus, and output auto-scroll.
- Structured output: text, lines, status messages, tables, links, and ASCII blocks.
- Included `default`, `dracula`, `matrix`, `amber`, `light`, `nord`, `tokyo-night`, `solarized-light`, and `github-light` themes.
- CSS-variable theme overrides and consumer class names.
- Optional browser `localStorage` persistence for history and selected theme.
- TypeScript types, tests, examples, and an MIT license.

Read the complete scope, constraints, and success criteria in the [v1 product requirements document](docs/PRD.md).

For local visual testing, the repository includes vanilla and React Vite examples. See the [manual test plan](docs/MANUAL_TEST_PLAN.md).

## Verification

Before merging or preparing a release, install with `corepack pnpm install --frozen-lockfile`, then run the appropriate focused checks described in the [test strategy](docs/TEST_STRATEGY.md). Pull requests require formatting, linting, type checks, production builds, core/DOM tests, React integration tests, and Chromium E2E. Pushes to `main` and release preparation also require the packed-package consumer check plus Firefox and WebKit E2E. Browser runs use zero retries and preserve diagnostic artifacts only when they fail.

v2 work follows the [v2 development strategy](docs/V2_DEVELOPMENT_STRATEGY.md): it is isolated from the stable v1 line, test-first, and required to pass the v1 regression gate before merge.

## Releases and changelog

Published release notes live in [CHANGELOG.md](CHANGELOG.md). This monorepo uses [Changesets](https://github.com/changesets/changesets): consumer-visible package changes receive a Changeset, `corepack pnpm version-packages` applies the approved version bumps and generates package-specific changelogs, and `corepack pnpm release` publishes only after the repository owner explicitly approves it. Publishing is never part of CI.

## Install

Pretend Terminal requires Node.js `>=22.13.0` for installation and build tooling. The React package supports React `>=18.0.0`.

Install the package for your integration:

```sh
# Vanilla JavaScript
npm install @pretend-terminal/core

# React (installs the shared core package as a dependency)
npm install @pretend-terminal/react
```

## Usage

### Vanilla JavaScript

```ts
import { createTerminal } from '@pretend-terminal/core';
import '@pretend-terminal/core/styles.css';

const mount = document.querySelector('#terminal');

if (!mount) {
  throw new Error('Expected a terminal mount element.');
}

createTerminal(mount, {
  prompt: 'visitor@site:~ $',
  height: '28rem',
  theme: 'dracula',
  commands: [
    {
      name: 'about',
      description: 'Learn about this site',
      response: {
        type: 'lines',
        lines: ['Built with Pretend Terminal.', 'Safe and browser-only.'],
      },
    },
  ],
});
```

Set `height` to any CSS length when you want the terminal to stay a fixed size and scroll its transcript internally. Omit it for a naturally sized terminal.

### React

```tsx
import { PretendTerminal } from '@pretend-terminal/react';
import '@pretend-terminal/react/styles.css';

export function Terminal() {
  return (
    <PretendTerminal
      prompt="visitor@site:~ $"
      theme="matrix"
      commands={[
        {
          name: 'contact',
          description: 'Show contact details',
          response: { type: 'text', value: 'hello@example.com' },
        },
      ]}
    />
  );
}
```

`PretendTerminal` accepts the same configuration fields as the core API, plus `className`, `style`, and `ariaLabel`. In v1, treat command/theme/persistence configuration as initialization-time props; use the imperative APIs in a custom integration when those need to change at runtime.

### Vanilla imperative API

`createTerminal` returns an instance for application-triggered interactions:

```ts
const mount = document.querySelector('#terminal');

if (!mount) {
  throw new Error('Expected a terminal mount element.');
}

const terminal = createTerminal(mount, config);

await terminal.run('about');
terminal.setTheme('amber');
terminal.focus();
terminal.clear();
terminal.destroy();
```

The lower-level `createTerminalEngine` export is DOM-independent. It exposes state subscription, input, history, completion, theme, execution, clear, and destroy controls; focus belongs to a renderer with a real input.

## API reference

### Shared configuration

`TerminalConfig` is accepted by `createTerminal` and `PretendTerminal`.

| Field                     | Type                                       | Default / behavior                                                                            |
| ------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `prompt`                  | `string`                                   | `visitor@pretend-terminal:~ $`                                                                |
| `height`                  | CSS length string                          | Omit for natural height; set one to keep the terminal fixed-height and internally scrollable. |
| `commands`                | `Command[]`                                | No consumer commands.                                                                         |
| `includeBuiltIns`         | `boolean`                                  | `true`; set `false` to remove `help`, `clear`, and `history`.                                 |
| `theme`                   | built-in/custom theme name or token object | `default` theme.                                                                              |
| `themes`                  | `Record<string, ThemeTokens>`              | Additional named theme token sets.                                                            |
| `className`               | `string`                                   | Additional class on the terminal root.                                                        |
| `historyLimit`            | non-negative safe integer                  | `100`; `0` disables command-history retention.                                                |
| `storage`                 | persistence configuration                  | Disabled unless `enabled: true` and a non-blank `key` are supplied.                           |
| `messages.unknownCommand` | `string`                                   | Overrides the unknown-command message; `{command}` becomes the submitted text.                |
| `onCommand`               | `(command: string) => void`                | Called after every non-empty submission is recorded.                                          |
| `onUnknownCommand`        | `(command: string) => void`                | Called only for an unmatched non-empty command.                                               |

`storage` has the following shape:

```ts
{ enabled: false }
// or
{
  enabled: true,
  key: 'consumer-owned-terminal-key',
  persistHistory: true,
  persistTheme: true,
}
```

### Commands and output

Each command has a `name`, optional `aliases`, and optional `description`. It supplies exactly one of `response` or `handler`:

```ts
// JSON-compatible static command
{
  name: 'about',
  aliases: ['whoami'],
  description: 'Learn about Teemo',
  response: { type: 'text', value: 'Captain Teemo on duty.' },
}

// Application-owned dynamic command
{
  name: 'status',
  async handler({ rawInput, normalizedInput, commandName }) {
    return { type: 'success', value: `${commandName} is ready.` };
  },
}
```

Handlers may return one output block or an ordered array of blocks. They receive the original submitted text, its trimmed/lowercased matching form, and the canonical command name. A thrown or rejected handler produces the safe visitor-facing message `Command failed. Please try again.`

| Output `type`                         | Required fields                          | Rendering                                                  |
| ------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `text`                                | `value`                                  | One plain-text line.                                       |
| `lines`                               | `lines`                                  | Several plain-text lines.                                  |
| `success`, `error`, `muted`, `accent` | `value`                                  | Semantically styled plain text.                            |
| `table`                               | `rows`; optional `headers`               | Small text table.                                          |
| `link`                                | `label`, `href`; optional `openInNewTab` | Safe link, or non-interactive text for an unsafe protocol. |
| `ascii`                               | `value`                                  | Preformatted text block.                                   |

### Vanilla JavaScript

`createTerminal(element, config)` mounts into an existing DOM element. In addition to `TerminalConfig`, its `TerminalDomConfig` accepts `ariaLabel`, which defaults to `Pretend terminal`.

It returns a `MountedTerminal` with:

| Method            | Behavior                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| `run(input)`      | Submits input programmatically and resolves to its run result.          |
| `clear()`         | Clears the visible transcript without clearing command history.         |
| `focus()`         | Focuses the real command input.                                         |
| `setTheme(theme)` | Switches to a bundled, named custom, or token-object theme.             |
| `destroy()`       | Removes this terminal’s root and listeners; subsequent API calls throw. |

### React

`<PretendTerminal />` accepts every `TerminalConfig` field plus:

| Prop        | Type                  | Behavior                                                         |
| ----------- | --------------------- | ---------------------------------------------------------------- |
| `ariaLabel` | `string`              | Accessible terminal-region name; defaults to `Pretend terminal`. |
| `className` | `string`              | Additional class on the terminal root.                           |
| `style`     | `React.CSSProperties` | Inline styles, including public `--pt-*` CSS-variable overrides. |

Treat `TerminalConfig` props as initialization-time values in v1. The presentation props `className`, `style`, and `ariaLabel` update normally. To reconfigure an existing terminal dynamically, use a custom integration built on the core engine.

The TypeScript and TSX snippets in this README are type-checked in the public API test suites. The JSON and CSS examples are exercised by the built vanilla and React Vite examples.

## Configuration

The primary API is a configuration object. Static configurations can live in a JSON file; dynamic commands use JavaScript or TypeScript.

The [vanilla example configuration](examples/vanilla/src/terminal.config.json) is imported directly by Vite. Its static commands live in JSON, while the entry module adds the one async handler and callbacks that JSON cannot express.

```json
{
  "prompt": "teemo@portfolio:~ $",
  "theme": "amber",
  "commands": [
    {
      "name": "contact",
      "aliases": ["email"],
      "description": "Show contact details",
      "response": {
        "type": "table",
        "rows": [
          ["Email", "teemo@example.com"],
          ["GitHub", "github.com/teemo"]
        ]
      }
    }
  ]
}
```

## Command behavior

### Matching and aliases

Command names and aliases match case-insensitively after outer whitespace is trimmed. Internal whitespace is significant, and v1 treats the complete normalized input as the command key—it does not parse shell-style arguments.

Aliases resolve to their command’s canonical name for completion. Every active command name and alias must be non-blank and unique; a collision raises `CommandRegistryError` during initialization. For example, an alias cannot reuse another command’s name or alias.

### Built-ins and overrides

`help`, `clear`, and `history` are enabled by default. Set `includeBuiltIns: false` to remove all three, or define a consumer command with the same canonical name to replace just that built-in.

| Command   | Default behavior                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| `help`    | Shows all active commands in display order, including aliases and descriptions when supplied.                     |
| `clear`   | Clears the visible transcript but retains command history and any persisted history.                              |
| `history` | Shows retained session history oldest-first with one-based numbering, including the current `history` submission. |

Defining your own `help` command replaces generated help completely, which is useful when you want to control its wording or format.

### Keyboard interaction, completion, and history

- **Enter:** submits non-empty input and echoes it before output. Only one async handler runs per terminal; later submissions while it is pending are ignored rather than queued, and their input remains available to retry.
- **Arrow Up / Arrow Down:** browse retained history. A draft entered before browsing is restored after the newest history entry; editing or submitting input resets browsing.
- **Tab:** matches active names and aliases by a case-insensitive, trimmed prefix. One match replaces input with the canonical command name; multiple matches show ordered suggestions; no match leaves input and normal browser Tab behavior unchanged.
- **Ctrl+L / Cmd+L:** clears visible output on Windows/Linux and macOS respectively.

History retains submitted commands, including duplicates, up to `historyLimit` (100 by default; `0` disables retention). The visible transcript is separate: it remains for the current session until `clear` or `destroy`, is never persisted, and has no automatic v1 length cap.

For an unmatched command, the default response suggests `help`. Change that copy without a handler through the JSON-compatible `messages` configuration; `{command}` is replaced with the submitted input:

```json
{
  "messages": {
    "unknownCommand": "Teemo does not recognize: {command}."
  }
}
```

For application behavior beyond static content, commands may provide a handler:

```ts
{
  name: 'status',
  description: 'Check API status',
  async handler() {
    const response = await fetch('/api/status');
    return {
      type: 'success',
      value: `API status: ${response.ok ? 'online' : 'unavailable'}`,
    };
  },
}
```

## Theming

Set `theme` to one of the nine bundled presets, a consumer-defined name from `themes`, or a partial `ThemeTokens` object. A partial object inherits omitted values from the default preset.

| Preset            | Character                                     |
| ----------------- | --------------------------------------------- |
| `default`         | Muted dark terminal with cool accent colors.  |
| `dracula`         | The familiar purple Dracula palette.          |
| `matrix`          | High-contrast green-on-near-black terminal.   |
| `amber`           | Warm amber CRT-inspired palette.              |
| `light`           | Bright, readable light-surface terminal.      |
| `nord`            | Calm blue-gray dark palette.                  |
| `tokyo-night`     | Deep navy with vivid cyan and purple accents. |
| `solarized-light` | Warm, low-glare light palette.                |
| `github-light`    | Clean, familiar developer-tool light palette. |

Renderers apply the resolved theme through internal `--pt-theme-*` variables. Override the public `--pt-*` variables on the terminal root to take precedence over any selected preset:

```css
.my-terminal {
  --pt-background: #111827;
  --pt-surface: #1f2937;
  --pt-text: #f9fafb;
  --pt-accent: #60a5fa;
  --pt-success: #34d399;
}
```

Public variables are semantic, so overrides remain stable across theme palettes:

| Variables                                                                        | Meaning                                                                                                                           |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `--pt-background`                                                                | Terminal background.                                                                                                              |
| `--pt-surface`                                                                   | Raised/table-header surface.                                                                                                      |
| `--pt-text`                                                                      | Standard text.                                                                                                                    |
| `--pt-muted`                                                                     | Secondary text, completion suggestions, and pending status.                                                                       |
| `--pt-border`                                                                    | Terminal and table borders.                                                                                                       |
| `--pt-prompt-user`, `--pt-prompt-host`, `--pt-prompt-path`, `--pt-prompt-symbol` | Reserved semantic prompt tokens for custom integration styles. The v1 built-in renderers display `prompt` as one accented string. |
| `--pt-accent`                                                                    | Command echoes, prompt text, links, table headers, and focus outline.                                                             |
| `--pt-success`                                                                   | `success` output.                                                                                                                 |
| `--pt-error`                                                                     | `error` output.                                                                                                                   |
| `--pt-font-family`                                                               | Terminal font family.                                                                                                             |
| `--pt-font-size`                                                                 | Terminal font size.                                                                                                               |
| `--pt-line-height`                                                               | Terminal line height.                                                                                                             |
| `--pt-radius`                                                                    | Terminal border radius.                                                                                                           |
| `--pt-spacing`                                                                   | Terminal padding and internal spacing scale.                                                                                      |

The bundled themes meet the documented text and focus contrast thresholds; see the [theme contrast audit](docs/THEME_CONTRAST.md). Custom token overrides remain the consumer’s responsibility to review.

## Persistence and SSR

Persistence is off by default. Enable it only with a consumer-owned key, then choose history and/or named-theme persistence independently:

```ts
storage: {
  enabled: true,
  key: 'teemo-portfolio-terminal',
  persistHistory: true,
  persistTheme: true,
}
```

Pretend Terminal stores versioned `history` and `theme` records under that key in browser `localStorage`. Use a distinct key for each terminal that should retain separate state. History restores only valid string entries and still obeys `historyLimit`; the transcript is never stored. Selecting a named theme persists that name, while choosing a token object clears any persisted named-theme selection. Running `clear` clears visible output only, not history.

Browser storage is a best-effort enhancement. Missing storage, privacy/security restrictions, malformed records, and quota failures fall back to memory without interrupting command execution; data in that fallback lasts only for the current page lifetime.

The vanilla renderer accesses browser storage only when it mounts and persistence is enabled. `PretendTerminal` does not access `localStorage` during server rendering: it first renders from its supplied configuration, then hydrates opt-in persistence in a client-side effect. The headless `createTerminalEngine` never accesses storage unless you explicitly pass a storage adapter in its options.

## Security model

Pretend Terminal is a UI component, not a command runner. Its security boundary is deliberately narrow:

| Pretend Terminal guarantees                                                           | The consuming application remains responsible for                                                                         |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| It never executes a shell command or reads a host filesystem or environment variable. | Deciding which commands and static configuration are appropriate for visitors.                                            |
| Its packages never make network requests.                                             | Any request, authentication, authorization, rate limit, and privacy policy inside an application-owned handler.           |
| It renders command echoes and every structured-output string as text, not HTML.       | Avoiding sensitive data in handler responses; safe rendering does not make disclosed data private.                        |
| It accepts only structured output; arbitrary HTML and Markdown are outside v1.        | Treating remotely sourced configuration as application data and validating it according to the application’s trust model. |
| It permits only relative, `http:`, `https:`, `mailto:`, and `tel:` link targets.      | The destination and content of allowed links.                                                                             |
| Its only platform storage is opt-in history/theme persistence through `localStorage`. | Choosing an appropriate storage key and whether persistence is suitable for the site.                                     |

Command handlers are application-owned JavaScript or TypeScript. A handler may call an API, but that call belongs to the consuming application—not Pretend Terminal. Keep handlers explicit in source code; JSON configuration supports only static commands and cannot define executable behavior.

Unsafe link protocols such as `javascript:` and `data:` render as plain label text. Links stay in the current tab by default; `openInNewTab: true` adds `noopener noreferrer`. Handler failures render the generic `Command failed. Please try again.` message rather than exposing thrown error details.

## Accessibility

Both renderers use a real text input rather than `contenteditable` or a canvas. The terminal root is a labelled `region` (`ariaLabel` defaults to `Pretend terminal`); its transcript is a labelled, polite `log`; and the command field is named `Terminal command`.

New transcript additions are announced politely without re-announcing earlier output. Submitted command echoes, unknown-command responses, and safe handler-error responses all appear in that log. While completion suggestions are visible, they are announced as a `status` and associated with the command input; pending async work also appears as a `status`.

| Control                                 | Result                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| Click empty terminal space              | Focuses the command input without interfering with links or other interactive elements. |
| Enter                                   | Submits non-empty input.                                                                |
| Arrow Up / Arrow Down                   | Browse retained command history.                                                        |
| Tab                                     | Complete a unique command or announce multiple matching suggestions.                    |
| Ctrl+L (Windows/Linux) or Cmd+L (macOS) | Clear visible transcript output.                                                        |

Focus remains on the command input after output renders, so a keyboard visitor can continue typing. Built-in themes meet the documented text and focus contrast thresholds; review custom token overrides with your own accessibility requirements.

## Troubleshooting

| Symptom                                                                                    | Check                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The terminal has no terminal styling.                                                      | Import the package stylesheet once in the same client bundle: `@pretend-terminal/core/styles.css` for vanilla or `@pretend-terminal/react/styles.css` for React. Make sure the import is not removed by a route-only or server-only entry point.                                        |
| An upgraded package still shows previous terminal CSS during local Astro/Vite development. | Stop the dev server, then restart with `pnpm dev -- --force`. If the browser still serves the older package stylesheet, remove the disposable `node_modules/.vite` cache and restart with that command. See the [Astro integration guide](docs/INTEGRATION_GUIDE.md#astro).             |
| Initialization throws `CommandRegistryError`.                                              | Trim command names and aliases, then ensure each normalized name/alias is unique. Matching ignores outer whitespace and case, so `Info` and `info` collide. To replace a built-in, define a consumer command with that same canonical name; do not reuse it as another command’s alias. |
| Initialization throws `ThemeResolutionError`.                                              | Use a bundled preset, pass a token object directly, or define the named preset in `themes` before selecting it with `theme`.                                                                                                                                                            |
| History or theme does not survive a refresh.                                               | Confirm `storage.enabled` is `true`, `key` is non-blank and stable, and the matching `persistHistory` and/or `persistTheme` flag is enabled. Use one key per independent terminal.                                                                                                      |
| Persistence still does not survive a refresh in a private or restricted browser.           | This is expected when browser storage is unavailable or blocked. The terminal stays usable with an in-memory fallback, but that state ends when the page is closed or reloaded.                                                                                                         |

## Project roadmap

The immediate goal is a polished, documented v1. Advanced possibilities—such as richer content, localization helpers, plug-ins, and deeper terminal emulation—are tracked separately in the [future phases](docs/PRD.md#future-phases-not-v1).

## Contributing

Contributions and issue reports are welcome. Read the [contributing guide](CONTRIBUTING.md) for bug-report details, local setup, testing expectations, release-note guidance, and when to open an issue before starting work.

## License

[MIT](LICENSE) © 2026 Tanvir Aslam
