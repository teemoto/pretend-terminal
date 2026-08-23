import { createTerminal } from '@pretend-terminal/core';
import '@pretend-terminal/core/styles.css';

import './style.css';

const eventLog = document.querySelector('.event-log');
const mount = document.querySelector('#terminal');

if (!mount || !eventLog) {
  throw new Error('The example page is missing its terminal mount point.');
}

const terminal = createTerminal(mount, {
  ariaLabel: 'Teemo portfolio terminal',
  prompt: 'teemo@portfolio:~ $',
  height: '30rem',
  theme: 'amber',
  storage: {
    enabled: true,
    key: 'pretend-terminal-vanilla-example',
    persistHistory: true,
    persistTheme: true,
  },
  commands: [
    {
      name: 'about',
      description: 'Learn about Teemo',
      response: {
        type: 'lines',
        lines: [
          'Teemo is a curious front-end developer.',
          'This terminal is a safe browser UI, not a shell.',
        ],
      },
    },
    {
      name: 'projects',
      description: 'List current projects',
      response: {
        type: 'table',
        headers: ['Project', 'Focus'],
        rows: [
          ['Pretend Terminal', 'A reusable pseudo-terminal'],
          ['Portfolio', 'Small, thoughtful web experiences'],
        ],
      },
    },
    {
      name: 'contact',
      description: 'Open Teemo’s contact page',
      response: {
        type: 'link',
        label: 'teemo@example.com',
        href: 'mailto:teemo@example.com',
      },
    },
    {
      name: 'map',
      description: 'Show an ASCII map',
      response: { type: 'ascii', value: '  /\\\n /__\\\n |  |  Teemo’s trail' },
    },
    {
      name: 'status',
      description: 'Run a simulated asynchronous check',
      async handler() {
        await new Promise((resolve) => window.setTimeout(resolve, 800));
        return { type: 'success', value: 'All systems are ready.' };
      },
    },
  ],
  onCommand(command) {
    eventLog.textContent = `Submitted: ${command}`;
  },
  onUnknownCommand(command) {
    eventLog.textContent = `No configured command named “${command}”. Try help.`;
  },
});

for (const button of document.querySelectorAll('[data-theme]')) {
  button.addEventListener('click', () => {
    terminal.setTheme(button.dataset.theme);
  });
}

terminal.focus();
