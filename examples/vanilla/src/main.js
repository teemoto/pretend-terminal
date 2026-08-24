import { createTerminal } from '@pretend-terminal/core';
import '@pretend-terminal/core/styles.css';

import './style.css';
import terminalConfig from './terminal.config.json';

const eventLog = document.querySelector('.event-log');
const mount = document.querySelector('#terminal');

if (!mount || !eventLog) {
  throw new Error('The example page is missing its terminal mount point.');
}

const terminal = createTerminal(mount, {
  ...terminalConfig,
  commands: [
    ...terminalConfig.commands,
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
