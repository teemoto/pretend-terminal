import { describe, expect, it } from 'vitest';

import type {
  Command,
  CommandHandlerContext,
  MountedTerminal,
  TerminalConfig,
  TerminalEngine,
  TerminalOutputBlock,
} from '../index.js';

describe('the public core type contract', () => {
  it('accepts the v1 structured output variants', () => {
    const output = [
      { type: 'text', value: 'Hello, Teemo.' },
      { type: 'lines', lines: ['One', 'Two'] },
      { type: 'success', value: 'Saved.' },
      { type: 'error', value: 'Try again.' },
      { type: 'muted', value: 'Optional detail.' },
      { type: 'accent', value: 'Featured.' },
      {
        type: 'table',
        headers: ['Label', 'Value'],
        rows: [
          ['Role', 'Scout'],
          ['Region', 'Bandle City'],
        ],
      },
      { type: 'link', label: 'Profile', href: 'https://example.com/teemo', openInNewTab: true },
      { type: 'ascii', value: ' /\\_/\\\n( o.o )' },
    ] satisfies readonly TerminalOutputBlock[];

    expect(output).toHaveLength(9);
  });

  it('accepts static and asynchronous command definitions', async () => {
    const staticCommand = {
      name: 'about',
      aliases: ['whoami'],
      description: 'Learn about Teemo',
      response: { type: 'text', value: 'Captain Teemo on duty.' },
    } satisfies Command;

    const dynamicCommand = {
      name: 'status',
      description: 'Show the current status',
      async handler(context: CommandHandlerContext) {
        return { type: 'success', value: `${context.commandName}: ready` };
      },
    } satisfies Command;

    expect(staticCommand.name).toBe('about');
    await expect(
      dynamicCommand.handler({
        rawInput: 'status',
        normalizedInput: 'status',
        commandName: 'status',
      }),
    ).resolves.toEqual({ type: 'success', value: 'status: ready' });
  });

  it('rejects a command that mixes a response and a handler', () => {
    // @ts-expect-error A command must choose exactly one execution form.
    const invalidCommand: Command = {
      name: 'invalid',
      response: { type: 'text', value: 'Static output' },
      handler: () => ({ type: 'text', value: 'Dynamic output' }),
    };

    expect(invalidCommand.name).toBe('invalid');
  });

  it('accepts persistence only when enabled storage has a key', () => {
    const config = {
      prompt: 'teemo@portfolio:~ $',
      theme: 'matrix',
      themes: { scout: { accent: '#9acd32' } },
      commands: [{ name: 'help', response: { type: 'text', value: 'Try about.' } }],
      storage: {
        enabled: true,
        key: 'teemo-terminal',
        persistHistory: true,
        persistTheme: true,
      },
    } satisfies TerminalConfig;

    expect(config.storage.key).toBe('teemo-terminal');
  });

  it('exposes the headless and mounted imperative control surfaces', () => {
    type HeadlessControls = Pick<
      TerminalEngine,
      | 'getState'
      | 'subscribe'
      | 'setInput'
      | 'navigateHistory'
      | 'complete'
      | 'setTheme'
      | 'run'
      | 'clear'
      | 'destroy'
    >;
    type MountedControls = Pick<
      MountedTerminal,
      'run' | 'clear' | 'focus' | 'setTheme' | 'destroy'
    >;

    const headlessControls = {} as HeadlessControls;
    const mountedControls = {} as MountedControls;

    expect(headlessControls).toBeDefined();
    expect(mountedControls).toBeDefined();
  });
});
