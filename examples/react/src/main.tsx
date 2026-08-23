import { PretendTerminal, type PretendTerminalProps } from '@pretend-terminal/react';
import { useState } from 'react';
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
  theme: {
    background: '#12151b',
    surface: '#1c212b',
    accent: '#7dd3fc',
    success: '#86efac',
  },
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
  ],
} satisfies PretendTerminalProps;

function App() {
  const [eventMessage, setEventMessage] = useState('No command submitted yet.');

  return (
    <main className="demo-page">
      <header className="demo-header">
        <p className="eyebrow">@pretend-terminal/react</p>
        <h1>React example</h1>
        <p>
          Try <code>help</code>, <code>stack</code>, or <code>status</code>.
        </p>
      </header>
      <PretendTerminal
        {...terminalConfig}
        ariaLabel="Teemo portfolio terminal"
        className="teemo-terminal"
        style={{ '--pt-radius': '0.875rem', '--pt-font-size': '1rem' } as never}
        onCommand={(command) => setEventMessage(`Submitted: ${command}`)}
        onUnknownCommand={(command) => setEventMessage(`Unknown command: ${command}`)}
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
