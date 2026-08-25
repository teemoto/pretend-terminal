# @pretend-terminal/core

A safe, configurable pseudo-terminal engine and Vanilla JavaScript API.

## Install

```sh
npm install @pretend-terminal/core
```

Requires Node.js `>=22.13.0` for installation and build tooling.

## Usage

```ts
import { createTerminal } from '@pretend-terminal/core';
import '@pretend-terminal/core/styles.css';

const mount = document.querySelector('#terminal');

if (!mount) {
  throw new Error('Expected a terminal mount element.');
}

createTerminal(mount, {
  prompt: 'teemo@portfolio:~ $',
  theme: 'amber',
  commands: [
    {
      name: 'about',
      response: { type: 'text', value: 'Captain Teemo on duty.' },
    },
  ],
});
```

See the [repository README](https://github.com/teemoto/pretend-terminal#readme) for the full API, JSON configuration, theming, persistence, accessibility, and safety guidance.

## License

[MIT](LICENSE) © 2026 Tanvir Aslam
