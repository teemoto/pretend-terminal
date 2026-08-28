import { createTerminalEngine } from '@pretend-terminal/core';
import { describe, expect, it } from 'vitest';

import { onboardingTerminalConfig } from './onboarding.js';

describe('demo onboarding terminal', () => {
  it('lets a visitor discover the product, themes, installation, documentation, and agent guidance through help', async () => {
    const engine = createTerminalEngine(onboardingTerminalConfig);

    await engine.run('help');

    expect(engine.getState().transcript.at(-1)).toEqual({
      kind: 'output',
      output: expect.objectContaining({
        type: 'table',
        rows: expect.arrayContaining([
          ['about', 'Learn what Pretend Terminal is.'],
          ['themes', 'See the bundled theme names.'],
          ['install', 'Show the package installation command.'],
          ['examples', 'Open the documentation and examples.'],
          ['agents', 'Get the agent-friendly integration guide.'],
        ]),
      }),
    });
  });

  it('explains that the demo is a safe simulation when visitors ask about it', async () => {
    const engine = createTerminalEngine(onboardingTerminalConfig);

    await engine.run('about');

    expect(engine.getState().transcript.at(-1)).toEqual({
      kind: 'output',
      output: {
        type: 'muted',
        value: 'It is a simulation: it never runs a visitor command on your machine or a server.',
      },
    });
  });
});
