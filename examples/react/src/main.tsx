import { BUILT_IN_THEMES, type BuiltInThemeName } from '@pretend-terminal/core';
import { PretendTerminal, type PretendTerminalProps } from '@pretend-terminal/react';
import { type CSSProperties, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '@pretend-terminal/react/styles.css';
import './style.css';

const terminalConfig = {
  prompt: 'teemo@portfolio:~ $',
  height: '30rem',
  storage: {
    enabled: true,
    key: 'pretend-terminal-react-example',
    persistHistory: true,
  },
  theme: 'default',
  commands: [
    {
      name: 'about',
      description: 'Learn about Teemo',
      response: {
        type: 'lines',
        lines: [
          'Teemo is building a friendly portfolio experience.',
          'This React component shares its behavior with the vanilla package.',
        ],
      },
    },
    {
      name: 'stack',
      description: 'Show the example’s stack',
      response: {
        type: 'table',
        headers: ['Layer', 'Choice'],
        rows: [
          ['UI', 'React'],
          ['Terminal behavior', '@pretend-terminal/core'],
          ['Build tool', 'Vite'],
        ],
      },
    },
    {
      name: 'status',
      description: 'Run a simulated asynchronous check',
      async handler() {
        await new Promise((resolve) => window.setTimeout(resolve, 800));
        return { type: 'success', value: 'React example is ready.' };
      },
    },
    {
      name: 'showcase',
      description: 'Show every built-in output style',
      response: [
        {
          type: 'text',
          value:
            'A long line confirms that terminal output wraps without creating horizontal page overflow.',
        },
        { type: 'muted', value: 'Muted detail for secondary information.' },
        { type: 'accent', value: 'Accent text and links share the interactive color.' },
        { type: 'success', value: 'Success: the scout report is ready.' },
        { type: 'error', value: 'Error: this is a safely rendered example message.' },
        {
          type: 'table',
          headers: ['Output', 'Purpose'],
          rows: [
            ['Text', 'Primary response'],
            ['Table', 'Structured detail'],
          ],
        },
        {
          type: 'link',
          label: 'Teemo profile',
          href: 'https://example.com/teemo',
          openInNewTab: true,
        },
        { type: 'ascii', value: ' /\\_/\\\n( o.o )\n > ^ <' },
      ],
    },
  ],
} satisfies PretendTerminalProps;

const themeNames: readonly BuiltInThemeName[] = [
  'default',
  'dracula',
  'matrix',
  'amber',
  'light',
  'nord',
  'tokyo-night',
  'solarized-light',
  'github-light',
];

function toThemeStyle(theme: BuiltInThemeName): CSSProperties {
  return Object.fromEntries(
    Object.entries(BUILT_IN_THEMES[theme]).map(([token, value]) => [
      `--pt-${token.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
      value,
    ]),
  ) as CSSProperties;
}

function App() {
  const [eventMessage, setEventMessage] = useState('No command submitted yet.');
  const [selectedTheme, setSelectedTheme] = useState<BuiltInThemeName>('default');

  return (
    <main className="demo-page">
      <header className="demo-header">
        <p className="eyebrow">@pretend-terminal/react</p>
        <h1>React example</h1>
        <p>
          Try <code>help</code>, <code>stack</code>, <code>showcase</code>, or <code>status</code>.
        </p>
        <div className="theme-controls" aria-label="Theme controls">
          {themeNames.map((theme) => (
            <button
              aria-pressed={selectedTheme === theme}
              key={theme}
              onClick={() => setSelectedTheme(theme)}
              type="button"
            >
              {theme}
            </button>
          ))}
        </div>
      </header>
      <PretendTerminal
        {...terminalConfig}
        ariaLabel="Teemo portfolio terminal"
        className="teemo-terminal"
        onCommand={(command) => setEventMessage(`Submitted: ${command}`)}
        onUnknownCommand={(command) => setEventMessage(`Unknown command: ${command}`)}
        style={toThemeStyle(selectedTheme)}
      />
      <p className="event-log" aria-live="polite">
        {eventMessage}
      </p>
    </main>
  );
}

const rootElement = document.querySelector('#root');
if (!rootElement) {
  throw new Error('The example page is missing its React root.');
}

createRoot(rootElement).render(<App />);
