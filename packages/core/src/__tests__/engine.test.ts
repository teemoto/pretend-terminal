import { describe, expect, it, vi } from 'vitest';

import {
  createMemoryStorageAdapter,
  createTerminalEngine,
  createTerminalStorageKey,
  TerminalEngineError,
  type TerminalOutputBlock,
} from '../index.js';

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
      input: '',
      completionSuggestions: [],
      history: ['ABOUT'],
      isExecuting: false,
      transcript: [
        { kind: 'command', value: 'ABOUT' },
        { kind: 'output', output: { type: 'text', value: 'Captain Teemo on duty.' } },
      ],
    });
  });

  it('preserves every structured output type and ordered multi-block responses', async () => {
    const response = [
      { type: 'text', value: 'Hello, Teemo.' },
      { type: 'lines', lines: ['One', 'Two'] },
      { type: 'success', value: 'Saved.' },
      { type: 'error', value: 'Try again.' },
      { type: 'muted', value: 'Optional detail.' },
      { type: 'accent', value: 'Featured.' },
      { type: 'table', headers: ['Role', 'Region'], rows: [['Scout', 'Bandle City']] },
      { type: 'link', label: 'Profile', href: 'https://example.com/teemo', openInNewTab: true },
      { type: 'ascii', value: ' /\\_/\\\n( o.o )' },
    ] satisfies readonly TerminalOutputBlock[];
    const engine = createTerminalEngine({
      includeBuiltIns: false,
      commands: [{ name: 'showcase', response }],
    });

    await engine.run('showcase');

    expect(engine.getState().transcript).toEqual([
      { kind: 'command', value: 'showcase' },
      ...response.map((output) => ({ kind: 'output' as const, output })),
    ]);
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

  it('records output returned by a synchronous dynamic handler', async () => {
    const engine = createTerminalEngine({
      includeBuiltIns: false,
      commands: [
        {
          name: 'motto',
          handler: () => ({ type: 'accent', value: 'Never underestimate the power of the Scout.' }),
        },
      ],
    });

    await engine.run('motto');

    expect(engine.getState().transcript.at(-1)).toEqual({
      kind: 'output',
      output: { type: 'accent', value: 'Never underestimate the power of the Scout.' },
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

  it('navigates retained session history and restores a draft after the newest entry', async () => {
    const engine = createTerminalEngine({
      includeBuiltIns: false,
      historyLimit: 2,
      commands: [
        { name: 'first', response: { type: 'text', value: 'First.' } },
        { name: 'second', response: { type: 'text', value: 'Second.' } },
      ],
    });

    await engine.run('first');
    await engine.run('second');
    engine.setInput('draft command');

    expect(engine.navigateHistory('previous')).toBe('second');
    expect(engine.navigateHistory('previous')).toBe('first');
    expect(engine.navigateHistory('previous')).toBe('first');
    expect(engine.navigateHistory('next')).toBe('second');
    expect(engine.navigateHistory('next')).toBe('draft command');
    expect(engine.getState().input).toBe('draft command');
  });

  it('retains duplicate entries, enforces the history limit, and resets browsing after input changes', async () => {
    const engine = createTerminalEngine({
      includeBuiltIns: false,
      historyLimit: 2,
      commands: [{ name: 'echo', response: { type: 'text', value: 'Teemo.' } }],
    });

    await engine.run('echo');
    await engine.run('echo');
    await engine.run('echo');
    expect(engine.getState().history).toEqual(['echo', 'echo']);

    engine.navigateHistory('previous');
    engine.setInput('fresh input');
    expect(engine.navigateHistory('next')).toBe('fresh input');
    await engine.run('echo');
    expect(engine.getState().input).toBe('');
  });

  it('rejects an invalid history limit at initialization', () => {
    expect(() => createTerminalEngine({ historyLimit: -1 })).toThrow(
      new TerminalEngineError('historyLimit must be a non-negative safe integer.'),
    );
  });

  it('restores validated persisted history and writes only retained history after submission', async () => {
    const storage = createMemoryStorageAdapter();
    const historyKey = createTerminalStorageKey('teemo-terminal', 'history');
    storage.set(historyKey, JSON.stringify(['scout', 'map', 'mushroom']));
    const engine = createTerminalEngine(
      {
        includeBuiltIns: false,
        historyLimit: 2,
        storage: { enabled: true, key: 'teemo-terminal', persistHistory: true },
        commands: [{ name: 'about', response: { type: 'text', value: 'Captain Teemo on duty.' } }],
      },
      { storage },
    );

    expect(engine.getState().history).toEqual(['map', 'mushroom']);
    await engine.run('about');

    expect(storage.get(historyKey)).toBe(JSON.stringify(['mushroom', 'about']));
    expect(engine.getState().transcript).toHaveLength(2);
    engine.clear();
    expect(storage.get(historyKey)).toBe(JSON.stringify(['mushroom', 'about']));
  });

  it('does not touch storage when history persistence is disabled or invalid', async () => {
    const storage = { get: vi.fn(), set: vi.fn(), remove: vi.fn() };
    const engine = createTerminalEngine(
      {
        includeBuiltIns: false,
        storage: { enabled: false },
        commands: [{ name: 'about', response: { type: 'text', value: 'Captain Teemo on duty.' } }],
      },
      { storage },
    );

    await engine.run('about');

    expect(storage.get).not.toHaveBeenCalled();
    expect(storage.set).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('ignores malformed persisted history without interrupting the terminal', async () => {
    const storage = createMemoryStorageAdapter();
    storage.set(createTerminalStorageKey('teemo-terminal', 'history'), '{not-json');
    const engine = createTerminalEngine(
      {
        includeBuiltIns: false,
        storage: { enabled: true, key: 'teemo-terminal', persistHistory: true },
        commands: [{ name: 'about', response: { type: 'text', value: 'Captain Teemo on duty.' } }],
      },
      { storage },
    );

    expect(engine.getState().history).toEqual([]);
    await expect(engine.run('about')).resolves.toMatchObject({ status: 'executed' });
  });

  it('completes a unique canonical-name or alias prefix to the command name', () => {
    const engine = createTerminalEngine({
      includeBuiltIns: false,
      commands: [
        {
          name: 'about',
          aliases: ['whoami'],
          description: 'Learn about Teemo.',
          response: { type: 'text', value: 'Captain Teemo on duty.' },
        },
      ],
    });

    engine.setInput('WH');
    expect(engine.complete()).toEqual({
      status: 'completed',
      input: 'about',
      command: { name: 'about', aliases: ['whoami'], description: 'Learn about Teemo.' },
    });
    expect(engine.getState().completionSuggestions).toEqual([]);
  });

  it('exposes ordered active suggestions for ambiguous prefixes and leaves zero matches unchanged', () => {
    const engine = createTerminalEngine({
      commands: [
        { name: 'about', response: { type: 'text', value: 'Captain Teemo on duty.' } },
        { name: 'archive', response: { type: 'text', value: 'Archive.' } },
      ],
    });

    engine.setInput('a');
    expect(engine.complete()).toEqual({
      status: 'suggestions',
      input: 'a',
      suggestions: [
        { name: 'about', aliases: [], description: undefined },
        { name: 'archive', aliases: [], description: undefined },
      ],
    });
    expect(engine.getState().input).toBe('a');

    engine.setInput('missing');
    expect(engine.complete()).toEqual({ status: 'none', input: 'missing' });
    expect(engine.getState().completionSuggestions).toEqual([]);
  });

  it('uses only active commands for completion', () => {
    const engine = createTerminalEngine({
      commands: [
        { name: 'help', response: { type: 'text', value: 'Teemo help.' } },
        { name: 'hello', response: { type: 'text', value: 'Hello.' } },
      ],
    });

    engine.setInput('he');
    expect(engine.complete()).toMatchObject({
      status: 'suggestions',
      suggestions: [{ name: 'help' }, { name: 'hello' }],
    });
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
