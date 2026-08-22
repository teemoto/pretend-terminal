# Pretend Terminal

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

## Intended usage

### Vanilla JavaScript

```ts
import { createTerminal } from '@pretend-terminal/core';
import '@pretend-terminal/core/styles.css';

createTerminal(document.querySelector('#terminal'), {
  prompt: 'visitor@site:~ $',
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

## Configuration

The primary API is a configuration object. Static configurations can live in a JSON file; dynamic commands use JavaScript or TypeScript.

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

Themes will be built from semantic CSS variables, so a site can override individual tokens without recreating every style.

```css
.my-terminal {
  --pt-bg: #111827;
  --pt-surface: #1f2937;
  --pt-text: #f9fafb;
  --pt-accent: #60a5fa;
  --pt-success: #34d399;
}
```

## Security model

Pretend Terminal is a UI component, not a command runner. It does not access a machine’s shell, filesystem, environment variables, or network unless an application author deliberately writes a command handler that does so. Static text is rendered safely; arbitrary HTML and Markdown rendering are outside v1.

## Project roadmap

The immediate goal is a polished, documented v1. Advanced possibilities—such as richer content, localization helpers, plug-ins, and deeper terminal emulation—are tracked separately in the [future phases](docs/PRD.md#future-phases-not-v1).

## Contributing

Contributions and issue reports will be welcome once the initial package structure is in place. Until then, the most useful feedback is on the v1 requirements and API design in [docs/PRD.md](docs/PRD.md).

## License

[MIT](LICENSE) © 2026 Tanvir Aslam
