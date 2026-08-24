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
  prompt: 'teemo@portfolio:~/interface-experiments/pretend-terminal $',
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
    {
      name: 'showcase',
      description: 'Show every built-in output style',
      response: [
        {
          type: 'text',
          value:
            'A deliberately long line confirms that terminal output wraps without creating horizontal page overflow.',
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
