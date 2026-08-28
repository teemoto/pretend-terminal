import type { TerminalConfig } from '@pretend-terminal/core';

/** Creates command behavior that makes asynchronous and failure states observable without external work. */
export function createFeatureDemoConfig(delayMs = 650): TerminalConfig {
  return {
    prompt: 'teemo@features:~ $',
    height: '24rem',
    theme: 'tokyo-night',
    commands: [
      {
        name: 'status',
        description: 'Run a safe asynchronous status check.',
        handler: () =>
          new Promise((resolve) => {
            setTimeout(
              () => resolve({ type: 'success', value: 'All systems are ready.' }),
              delayMs,
            );
          }),
      },
      {
        name: 'mishap',
        description: 'Show the friendly safe-error response.',
        handler: () => {
          throw new Error('Demonstration-only failure detail');
        },
      },
    ],
  };
}
