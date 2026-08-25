# @pretend-terminal/react

React components for the safe, configurable Pretend Terminal pseudo-terminal.

## Install

```sh
npm install @pretend-terminal/react
```

Requires Node.js `>=22.13.0` for installation and build tooling, plus React `>=18.0.0`.

## Usage

```tsx
import { PretendTerminal } from '@pretend-terminal/react';
import '@pretend-terminal/react/styles.css';

export function Terminal() {
  return (
    <PretendTerminal
      prompt="teemo@portfolio:~ $"
      theme="matrix"
      commands={[
        {
          name: 'about',
          response: { type: 'text', value: 'Captain Teemo on duty.' },
        },
      ]}
    />
  );
}
```

See the [repository README](https://github.com/teemoto/pretend-terminal#readme) for the full API, JSON configuration, theming, persistence, accessibility, and safety guidance.

## License

[MIT](LICENSE) © 2026 Tanvir Aslam
