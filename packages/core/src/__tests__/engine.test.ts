import { describe, expect, it, vi } from 'vitest';

import { createTerminalEngine, TerminalEngineError } from '../index.js';

describe('createTerminalEngine', () => {
  it('executes static commands and records an echo plus structured output', async () => {
    const onCommand = vi.fn();
    const engine = createTerminalEngine({
      includeBuiltIns: false,
      onCommand,
      commands: [
        {
          name: 'about',
          response: { type: 'text', value: 'Captain Teemo on duty.' },
        },
      ],
    });

    await expect(engine.run('  ABOUT  ')).resolves.toMatchObject({ status: 'executed' });
    expect(onCommand).toHaveBeenCalledWith('ABOUT');
    expect(engine.getState()).toEqual({
      history: ['ABOUT'],
      isExecuting: false,
      transcript: [
        { kind: 'command', value: 'ABOUT' },
        { kind: 'output', output: { type: 'text', value: 'Captain Teemo on duty.' } },
      ],
    });
  });

  it('ignores blank input and safely reports unknown commands', async () => {
    const onUnknownCommand = vi.fn();
    const engine = createTerminalEngine({ includeBuiltIns: false, onUnknownCommand });

    await expect(engine.run('   ')).resolves.toEqual({ status: 'ignored' });
    await expect(engine.run('missing')).resolves.toEqual({ status: 'unknown', input: 'missing' });
    expect(onUnknownCommand).toHaveBeenCalledWith('missing');
    expect(engine.getState().transcript.at(-1)).toEqual({
      kind: 'output',
      output: { type: 'error', value: 'Command not found: missing' },
    });
  });

  it('serializes asynchronous commands and exposes execution state', async () => {
    let resolveStatus: ((value: { type: 'success'; value: string }) => void) | undefined;
    const engine = createTerminalEngine({
      includeBuiltIns: false,
      commands: [
        {
          name: 'status',
          handler: () =>
            new Promise((resolve) => {
              resolveStatus = resolve;
            }),
        },
      ],
    });

    const states: boolean[] = [];
    engine.subscribe((state) => states.push(state.isExecuting));
    const running = engine.run('status');

    expect(engine.getState().isExecuting).toBe(true);
    await expect(engine.run('status')).resolves.toEqual({ status: 'busy' });

    resolveStatus?.({ type: 'success', value: 'Ready.' });
    await expect(running).resolves.toMatchObject({ status: 'executed' });

    expect(states).toEqual([false, true, false]);
    expect(engine.getState().transcript.at(-1)).toEqual({
      kind: 'output',
      output: { type: 'success', value: 'Ready.' },
    });
  });

  it('turns handler failures into safe output without exposing the error', async () => {
    const engine = createTerminalEngine({
      includeBuiltIns: false,
      commands: [
        {
          name: 'explode',
          handler: () => {
            throw new Error('secret stack detail');
          },
        },
      ],
    });

    await expect(engine.run('explode')).resolves.toMatchObject({ status: 'executed' });
    expect(engine.getState().transcript.at(-1)).toEqual({
      kind: 'output',
      output: { type: 'error', value: 'Command failed. Please try again.' },
    });
  });

  it('implements generated help, history, and clear without deleting history', async () => {
    const engine = createTerminalEngine({
      commands: [
        {
          name: 'about',
          aliases: ['whoami'],
          description: 'Learn about Teemo.',
          response: { type: 'text', value: 'Captain Teemo on duty.' },
        },
      ],
    });

    await engine.run('help');
    expect(engine.getState().transcript.at(-1)).toEqual({
      kind: 'output',
      output: {
        type: 'table',
        headers: ['Command', 'Description'],
        rows: [
          ['help', 'List available commands.'],
          ['clear', 'Clear visible terminal output.'],
          ['history', 'Show command history.'],
          ['about (whoami)', 'Learn about Teemo.'],
        ],
      },
    });

    await engine.run('history');
    expect(engine.getState().transcript.at(-1)).toEqual({
      kind: 'output',
      output: { type: 'lines', lines: ['1  help', '2  history'] },
    });

    await expect(engine.run('clear')).resolves.toMatchObject({ status: 'cleared' });
    expect(engine.getState().transcript).toEqual([]);
    expect(engine.getState().history).toEqual(['help', 'history', 'clear']);
  });

  it('supports subscription cleanup and protects destroyed engines', () => {
    const engine = createTerminalEngine();
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);

    unsubscribe();
    engine.clear();
    expect(listener).toHaveBeenCalledTimes(1);

    engine.destroy();
    expect(() => engine.getState()).toThrow(
      new TerminalEngineError('The terminal engine has been destroyed.'),
    );
  });
});
