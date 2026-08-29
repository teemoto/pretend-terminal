# Pretend Terminal integration guide

This guide is the shortest safe path to adding Pretend Terminal to a site. It is written for people and coding agents; the [README](../README.md) remains the complete v1 reference.

## Choose an integration

| Your site                                       | Install                   | Public API            |
| ----------------------------------------------- | ------------------------- | --------------------- |
| Vanilla JavaScript, Astro, or another framework | `@pretend-terminal/core`  | `createTerminal()`    |
| React 18 or later                               | `@pretend-terminal/react` | `<PretendTerminal />` |

Do not install both packages for a single integration unless the site genuinely needs both rendering approaches. The React package brings in the shared core package itself.

## Safety boundary

Pretend Terminal is a browser UI component, not a shell. Its commands are application-defined and it never executes a system command. It renders every command echo and output string as text, not HTML.

Use a static `response` when content can be defined as data. Use a JavaScript or TypeScript `handler` only when the application needs dynamic behavior. A handler is owned by the application: any network request, authentication, authorization, rate limiting, privacy policy, and sensitive-data decision remains the application's responsibility.

## Vanilla JavaScript

Install the core package:

```sh
npm install @pretend-terminal/core
```

Add a mount element to the page:

```html
<div id="terminal"></div>
```

Mount the terminal from a client-side module and import the stylesheet once:

```ts
import { createTerminal } from '@pretend-terminal/core';
import '@pretend-terminal/core/styles.css';

const mount = document.querySelector('#terminal');

if (!mount) {
  throw new Error('Expected a terminal mount element.');
}

createTerminal(mount, {
  prompt: 'teemo@site:~ $',
  height: '26rem',
  theme: 'nord',
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

Set `height` to a CSS length to keep the terminal fixed-height and scroll its transcript internally. Omit it for natural height.

`createTerminal()` returns an instance when the host application needs imperative control:

```ts
const terminal = createTerminal(mount, config);

await terminal.run('about');
terminal.setTheme('amber');
terminal.focus();
terminal.clear();
terminal.destroy();
```

## Astro

Use the core package in an Astro client-side `<script>`. Import its stylesheet alongside the terminal module, then mount the terminal after locating its container.

```astro
<div id="about-terminal"></div>

<script>
  import { createTerminal } from '@pretend-terminal/core';
  import '@pretend-terminal/core/styles.css';

  const mount = document.querySelector('#about-terminal');

  if (mount) {
    createTerminal(mount, {
      prompt: 'teemo@site:~ $',
      commands: [
        {
          name: 'about',
          response: { type: 'text', value: 'Built with Pretend Terminal.' },
        },
      ],
    });
  }
</script>
```

You can instead import the stylesheet from component or shared-layout frontmatter when that suits the site's organization. The package CSS is globally loaded but every library rule is scoped to `.pt-terminal`.

After upgrading Pretend Terminal, stop the dev server and start Astro with a forced dependency rebuild if the browser still shows old terminal CSS:

```sh
pnpm dev -- --force
```

If that does not refresh the stylesheet, remove only Vite's disposable cache while the server is stopped, then restart with the same command:

```sh
rm -rf node_modules/.vite
pnpm dev -- --force
```

## React

Install the React package:

```sh
npm install @pretend-terminal/react
```

Render the component and import its stylesheet once in a client-rendered entry:

```tsx
import { PretendTerminal } from '@pretend-terminal/react';
import '@pretend-terminal/react/styles.css';

export function AboutTerminal() {
  return (
    <PretendTerminal
      ariaLabel="About this site"
      prompt="teemo@site:~ $"
      height="26rem"
      theme="nord"
      commands={[
        {
          name: 'about',
          description: 'Learn about this site',
          response: { type: 'text', value: 'Built with Pretend Terminal.' },
        },
      ]}
    />
  );
}
```

The React component accepts the shared configuration plus `ariaLabel`, `className`, and `style`. In v1, treat commands, theme, and persistence as initialization-time values. If they must change while the page is running, build that experience with the core API instead of assuming that prop changes reconfigure an existing terminal.

## Static JSON configuration

Static configuration can live in JSON. JSON commands use `response`; JSON cannot define executable handlers.

```json
{
  "prompt": "teemo@portfolio:~ $",
  "theme": "github-light",
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
  ],
  "storage": {
    "enabled": true,
    "key": "teemo-portfolio-terminal",
    "persistHistory": true,
    "persistTheme": true
  }
}
```

Import this data with the site's normal JSON mechanism and pass it to the selected API. Use a unique, stable `storage.key` for each terminal whose history or theme should persist. Persistence is best-effort browser `localStorage`; the transcript itself is never stored.

## Dynamic commands

For application behavior, define an explicit handler in JavaScript or TypeScript. It can return one output block or an ordered array. Do not expose thrown error details to visitors; the component already shows a generic safe failure message when a handler rejects.

```ts
{
  name: 'status',
  description: 'Check application status',
  async handler({ commandName }) {
    const response = await fetch('/api/status');

    return {
      type: response.ok ? 'success' : 'error',
      value: `${commandName}: ${response.ok ? 'ready' : 'unavailable'}`,
    };
  },
}
```

Available structured output types are `text`, `lines`, `success`, `error`, `muted`, `accent`, `table`, `link`, and `ascii`. Arbitrary HTML and Markdown are not v1 output formats. Links allow relative, `http:`, `https:`, `mailto:`, and `tel:` targets; unsafe protocols render as plain text.

## Theme and styling

Bundled themes are `default`, `dracula`, `matrix`, `amber`, `light`, `nord`, `tokyo-night`, `solarized-light`, and `github-light`.

Override semantic public CSS variables on the terminal root to match a site while retaining the component's structure:

```css
.my-terminal {
  --pt-background: #111827;
  --pt-surface: #1f2937;
  --pt-text: #f9fafb;
  --pt-accent: #60a5fa;
  --pt-success: #34d399;
}
```

In React, pass the same values with `style`; in either integration, use `className` to attach the class. Review the contrast and focus treatment after applying custom tokens.

## Agent implementation checklist

- Choose exactly one renderer: `createTerminal()` for vanilla JavaScript or `<PretendTerminal />` for React.
- Import the matching package stylesheet in a client-side bundle.
- Configure only visitor-safe commands and output. Never represent this component as a shell or give it access to a shell.
- Prefer JSON-compatible `response` data. Keep dynamic `handler` code explicit and under the host application's security controls.
- Set `height` when a fixed, scrollable terminal is desired.
- Give persistent terminals distinct consumer-owned storage keys; omit `storage` when persistence is unnecessary.
- Verify keyboard basics: Enter submits, Up/Down navigate command history, Tab completes, and Ctrl/Cmd+L clears visible output.
- Build and test the host site after integration.

## More detail

- [Full API, output, accessibility, and security reference](../README.md)
- [Vanilla example](../examples/vanilla)
- [React example](../examples/react)
- [Interactive demo and sandbox](https://teemoto.github.io/pretend-terminal/)
