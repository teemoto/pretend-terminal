import { createTerminalEngine } from '@pretend-terminal/core';
import { describe, expect, it } from 'vitest';

import { createFeatureDemoConfig } from './feature-demo.js';

describe('feature demonstration terminal', () => {
  it('shows a pending state before a configured asynchronous command completes', async () => {
    const engine = createTerminalEngine(createFeatureDemoConfig(0));

    const result = engine.run('status');

    expect(engine.getState().isExecuting).toBe(true);
    await expect(result).resolves.toMatchObject({ status: 'executed' });
    expect(engine.getState().transcript.at(-1)).toEqual({
      kind: 'output',
      output: { type: 'success', value: 'All systems are ready.' },
    });
  });

  it('keeps handler failures friendly rather than exposing implementation detail', async () => {
    const engine = createTerminalEngine(createFeatureDemoConfig(0));

    await engine.run('mishap');

    expect(engine.getState().transcript.at(-1)).toEqual({
      kind: 'output',
      output: { type: 'error', value: 'Command failed. Please try again.' },
    });
  });
});
