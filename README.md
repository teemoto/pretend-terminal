# Pretend Terminal

[![CI](https://github.com/teemoto/pretend-terminal/actions/workflows/ci.yml/badge.svg)](https://github.com/teemoto/pretend-terminal/actions/workflows/ci.yml)

**A safe, configurable pseudo-terminal for the web.**

Pretend Terminal lets people add a terminal-inspired interface to a website without embedding a real shell, server execution, or unsafe HTML rendering. It is designed for portfolios, documentation sites, product demos, onboarding flows, and playful developer experiences.

The project will ship as a framework-independent core package and a first-class React integration:

```sh
npm install @pretend-terminal/core
npm install @pretend-terminal/react
```

> **Project status:** pre-release. The public API and examples below describe the intended v1 experience; packages are not yet published.

## Why Pretend Terminal?

- **Safe by design.** Commands are application-defined; they never execute a system shell.
- **Configurable.** Static commands and responses can be provided as JSON, while JavaScript/TypeScript enables custom or asynchronous behavior.
- **Framework-friendly.** Use the core library in vanilla JavaScript or the React package in a React app.
- **Themeable.** Start from included themes or override semantic CSS variables to match your site.
- **Accessible.** The terminal will use real inputs and keyboard-first interactions rather than a canvas or contenteditable imitation.

## Planned v1 features

- Vanilla JavaScript mounting API and React component.
- Configurable commands, aliases, descriptions, and structured responses.
- Built-in `help`, `clear`, and `history` commands that users can keep, override, or disable.
- Command echo, keyboard history, Tab completion, unknown-command feedback, click-to-focus, and output auto-scroll.
- Structured output: text, lines, status messages, tables, links, and ASCII blocks.
- Included `default`, `dracula`, `matrix`, `amber`, and `light` themes.
- CSS-variable theme overrides and consumer class names.
- Optional browser `localStorage` persistence for history and selected theme.
- TypeScript types, tests, examples, and an MIT license.

Read the complete scope, constraints, and success criteria in the [v1 product requirements document](docs/PRD.md).

For local visual testing, the repository includes vanilla and React Vite examples. See the [manual test plan](docs/MANUAL_TEST_PLAN.md).

## Intended usage

### Vanilla JavaScript

```ts
import { createTerminal } from '@pretend-terminal/core';
import '@pretend-terminal/core/styles.css';

createTerminal(document.querySelector('#terminal'), {
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
const terminal = createTerminal(document.querySelector('#terminal'), config);

await terminal.run('about');
terminal.setTheme('amber');
terminal.focus();
terminal.clear();
terminal.destroy();
```

The lower-level `createTerminalEngine` export is DOM-independent. It exposes state subscription, input, history, completion, theme, execution, clear, and destroy controls; focus belongs to a renderer with a real input.

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

The built-in `help` command generates its content from currently enabled commands. Supply your own command named `help` to replace that behavior and fully control its copy.

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

The core already resolves the `default`, `dracula`, `matrix`, `amber`, and `light` presets into semantic tokens. A renderer will apply those tokens as CSS variables, so a site can override individual values without recreating every style.

```css
.my-terminal {
  --pt-background: #111827;
  --pt-surface: #1f2937;
  --pt-text: #f9fafb;
  --pt-accent: #60a5fa;
  --pt-success: #34d399;
}
```

Public tokens are semantic, so overrides remain stable across theme palettes:

| Tokens                                                                                  | Meaning                                      |
| --------------------------------------------------------------------------------------- | -------------------------------------------- |
| `--pt-background`, `--pt-surface`, `--pt-text`, `--pt-muted`, `--pt-border`             | Terminal surfaces and standard text.         |
| `--pt-prompt-user`, `--pt-prompt-host`, `--pt-prompt-path`, `--pt-prompt-symbol`        | Prompt segments for custom prompt renderers. |
| `--pt-accent`, `--pt-success`, `--pt-error`                                             | Interactive, positive, and error states.     |
| `--pt-font-family`, `--pt-font-size`, `--pt-line-height`, `--pt-radius`, `--pt-spacing` | Typography and layout scale.                 |

The bundled themes meet the documented text and focus contrast thresholds; see the [theme contrast audit](docs/THEME_CONTRAST.md). Custom token overrides remain the consumer’s responsibility to review.

## Security model

Pretend Terminal is a UI component, not a command runner. Its packages do not execute a shell command, read a filesystem or environment variable, or make network requests. The only browser storage access is opt-in history/theme persistence through `localStorage`.

Command handlers are application-owned code. A handler may choose to call an API, but that request belongs to the consuming application—not Pretend Terminal—and should follow the application’s own security and privacy rules. Static text is rendered safely; arbitrary HTML and Markdown rendering are outside v1.

Every string in the structured output model—including command echoes, lines, table cells, link labels, and ASCII—renders as text rather than markup in both integrations.

Link output accepts relative URLs and `http:`, `https:`, `mailto:`, and `tel:` URLs. Unsafe protocols such as `javascript:` and `data:` render as plain label text. Links stay in the current tab by default; `openInNewTab: true` adds the usual `noopener noreferrer` protection.

## Project roadmap

The immediate goal is a polished, documented v1. Advanced possibilities—such as richer content, localization helpers, plug-ins, and deeper terminal emulation—are tracked separately in the [future phases](docs/PRD.md#future-phases-not-v1).

## Contributing

Contributions and issue reports will be welcome once the initial package structure is in place. Until then, the most useful feedback is on the v1 requirements and API design in [docs/PRD.md](docs/PRD.md).

## License

[MIT](LICENSE) © 2026 Tanvir Aslam
