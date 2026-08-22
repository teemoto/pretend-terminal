import {
  createCommandRegistry,
  type CommandRegistry,
  type RegisteredBuiltInCommand,
  type RegisteredCommand,
} from './registry.js';
import type {
  CommandHandlerContext,
  TerminalConfig,
  TerminalOutput,
  TerminalOutputBlock,
} from './types.js';

/** A submitted command preserved in the terminal transcript. */
export interface CommandTranscriptEntry {
  readonly kind: 'command';
  readonly value: string;
}

/** A structured output block preserved in the terminal transcript. */
export interface OutputTranscriptEntry {
  readonly kind: 'output';
  readonly output: TerminalOutputBlock;
}

/** A chronologically ordered event displayed by a terminal renderer. */
export type TerminalTranscriptEntry = CommandTranscriptEntry | OutputTranscriptEntry;

/** Immutable state snapshot supplied to renderer subscribers. */
export interface TerminalEngineState {
  readonly transcript: readonly TerminalTranscriptEntry[];
  readonly history: readonly string[];
  readonly isExecuting: boolean;
}

/** Result of attempting to submit terminal input. */
export type TerminalRunResult =
  | { readonly status: 'ignored' | 'busy' }
  | { readonly status: 'unknown'; readonly input: string }
  | { readonly status: 'executed'; readonly command: RegisteredCommand }
  | { readonly status: 'cleared'; readonly command: RegisteredBuiltInCommand };

/** Listener notified whenever the engine state changes. */
export type TerminalStateListener = (state: TerminalEngineState) => void;

/** Headless terminal behavior shared by future DOM and React renderers. */
export interface TerminalEngine {
  readonly registry: CommandRegistry;
  getState(): TerminalEngineState;
  subscribe(listener: TerminalStateListener): () => void;
  run(input: string): Promise<TerminalRunResult>;
  clear(): void;
  destroy(): void;
}

/** Thrown when an operation is attempted after an engine is destroyed. */
export class TerminalEngineError extends Error {
  override readonly name = 'TerminalEngineError';
}

/** Creates a browser-independent terminal engine from consumer configuration. */
export function createTerminalEngine(config: TerminalConfig = {}): TerminalEngine {
  const registry = createCommandRegistry(config);
  const transcript: TerminalTranscriptEntry[] = [];
  const history: string[] = [];
  const listeners = new Set<TerminalStateListener>();
  let isExecuting = false;
  let destroyed = false;

  function assertActive(): void {
    if (destroyed) {
      throw new TerminalEngineError('The terminal engine has been destroyed.');
    }
  }

  function getState(): TerminalEngineState {
    assertActive();

    return {
      transcript: [...transcript],
      history: [...history],
      isExecuting,
    };
  }

  function emit(): void {
    const state = getState();

    for (const listener of listeners) {
      listener(state);
    }
  }

  function appendOutput(output: TerminalOutput): void {
    const outputBlocks = Array.isArray(output) ? output : [output];

    for (const block of outputBlocks) {
      transcript.push({ kind: 'output', output: block });
    }
  }

  function clear(): void {
    assertActive();
    transcript.length = 0;
    emit();
  }

  async function run(input: string): Promise<TerminalRunResult> {
    assertActive();

    const normalizedInput = input.trim().toLowerCase();
    if (!normalizedInput) {
      return { status: 'ignored' };
    }

    if (isExecuting) {
      return { status: 'busy' };
    }

    const submittedInput = input.trim();
    const command = registry.get(input);
    history.push(submittedInput);
    transcript.push({ kind: 'command', value: submittedInput });
    config.onCommand?.(submittedInput);

    if (!command) {
      appendOutput({
        type: 'error',
        value: `Command not found: ${submittedInput}`,
      });
      config.onUnknownCommand?.(submittedInput);
      emit();
      return { status: 'unknown', input: submittedInput };
    }

    if (command.source === 'built-in') {
      const result = runBuiltIn(command);

      if (result === 'cleared') {
        return { status: 'cleared', command };
      }

      appendOutput(result);
      emit();
      return { status: 'executed', command };
    }

    if (command.command.response !== undefined) {
      appendOutput(command.command.response);
      emit();
      return { status: 'executed', command };
    }

    isExecuting = true;
    emit();

    try {
      const context: CommandHandlerContext = {
        rawInput: input,
        normalizedInput,
        commandName: command.normalizedName,
      };
      appendOutput(await command.command.handler(context));
    } catch {
      appendOutput({
        type: 'error',
        value: 'Command failed. Please try again.',
      });
    } finally {
      isExecuting = false;
    }

    emit();
    return { status: 'executed', command };
  }

  function runBuiltIn(command: RegisteredBuiltInCommand): TerminalOutput | 'cleared' {
    switch (command.builtIn) {
      case 'help':
        return {
          type: 'table',
          headers: ['Command', 'Description'],
          rows: registry.commands.map((registered) => [
            formatCommandLabel(registered),
            registered.description ?? '',
          ]),
        };
      case 'clear':
        clear();
        return 'cleared';
      case 'history':
        return {
          type: 'lines',
          lines: history.map((entry, index) => `${index + 1}  ${entry}`),
        };
      default:
        throw new TerminalEngineError(`Unsupported built-in command: ${command.builtIn}`);
    }
  }

  function subscribe(listener: TerminalStateListener): () => void {
    assertActive();
    listeners.add(listener);
    listener(getState());

    return () => listeners.delete(listener);
  }

  function destroy(): void {
    if (destroyed) {
      return;
    }

    listeners.clear();
    destroyed = true;
  }

  return { registry, getState, subscribe, run, clear, destroy };
}

function formatCommandLabel(command: RegisteredCommand): string {
  if (command.aliases.length === 0) {
    return command.name;
  }

  return `${command.name} (${command.aliases.join(', ')})`;
}
