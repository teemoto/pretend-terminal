import {
  createCommandRegistry,
  normalizeCommand,
  type CommandRegistry,
  type RegisteredBuiltInCommand,
  type RegisteredCommand,
} from './registry.js';
import { createCommandFailureOutput, createUnknownCommandOutput } from './output.js';
import { parseCommandLine, type ParsedCommandLine } from './parser.js';
import { validateCommandSchema } from './schema.js';
import { createTerminalStorageKey, type TerminalStorageAdapter } from './storage.js';
import { resolveTheme, type ResolvedTerminalTheme, type TerminalThemeInput } from './themes.js';
import type {
  CommandHandlerContext,
  TerminalConfig,
  TerminalOutput,
  TerminalOutputBlock,
  ValidatedCommandValues,
  ThemeName,
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
  /** The current renderer-controlled input value. */
  readonly input: string;
  /** Ordered matches made available after a non-unique completion attempt. */
  readonly completionSuggestions: readonly TerminalCompletionSuggestion[];
  /** The current fully resolved theme for a renderer to apply. */
  readonly theme: ResolvedTerminalTheme;
  readonly transcript: readonly TerminalTranscriptEntry[];
  readonly history: readonly string[];
  readonly isExecuting: boolean;
}

/** Result of attempting to submit terminal input. */
export type TerminalRunResult =
  | { readonly status: 'ignored' | 'busy' }
  | { readonly status: 'invalid'; readonly input: string; readonly message: string }
  | { readonly status: 'unknown'; readonly input: string }
  | { readonly status: 'executed'; readonly command: RegisteredCommand }
  | { readonly status: 'cleared'; readonly command: RegisteredBuiltInCommand };

/** Direction used to navigate a terminal's session history. */
export type TerminalHistoryDirection = 'previous' | 'next';

/** Renderer-neutral metadata for a command offered by Tab completion. */
export interface TerminalCompletionSuggestion {
  readonly name: string;
  readonly aliases: readonly string[];
  readonly description?: string;
}

/** Result of attempting to complete the engine's current input. */
export type TerminalCompletionResult =
  | { readonly status: 'none'; readonly input: string }
  | {
      readonly status: 'completed';
      readonly input: string;
      readonly command: TerminalCompletionSuggestion;
    }
  | {
      readonly status: 'suggestions';
      readonly input: string;
      readonly suggestions: readonly TerminalCompletionSuggestion[];
    };

/** Listener notified whenever the engine state changes. */
export type TerminalStateListener = (state: TerminalEngineState) => void;

/** Headless terminal behavior shared by future DOM and React renderers. */
export interface TerminalEngine {
  /** Active normalized command registry, shared by execution and completion. */
  readonly registry: CommandRegistry;
  /** Returns the current immutable renderer state snapshot. */
  getState(): TerminalEngineState;
  /** Subscribes to state updates and returns an unsubscribe function. */
  subscribe(listener: TerminalStateListener): () => void;
  /** Replaces the draft command text. */
  setInput(input: string): void;
  /** Moves through retained command history. */
  navigateHistory(direction: TerminalHistoryDirection): string;
  /** Completes the current input or returns matching command suggestions. */
  complete(): TerminalCompletionResult;
  /** Changes the active theme without clearing terminal state. */
  setTheme(theme: TerminalThemeInput): void;
  /** Submits an input line for command execution. */
  run(input: string): Promise<TerminalRunResult>;
  /** Clears visible transcript entries without deleting history. */
  clear(): void;
  /** Releases subscriptions and prevents further interaction. */
  destroy(): void;
}

/** Environment-provided dependencies for a headless terminal engine. */
export interface TerminalEngineOptions {
  /** An adapter created by a renderer after browser mount, when persistence is desired. */
  readonly storage?: TerminalStorageAdapter;
}

/** Thrown when an operation is attempted after an engine is destroyed. */
export class TerminalEngineError extends Error {
  override readonly name = 'TerminalEngineError';
}

/** Creates a browser-independent terminal engine from consumer configuration. */
export function createTerminalEngine(
  config: TerminalConfig = {},
  options: TerminalEngineOptions = {},
): TerminalEngine {
  const registry = createCommandRegistry(config);
  const historyLimit = resolveHistoryLimit(config.historyLimit);
  const persistedHistory = resolvePersistedHistory(config, options.storage, historyLimit);
  const persistedTheme = resolvePersistedTheme(config, options.storage);
  const transcript: TerminalTranscriptEntry[] = [];
  const history: string[] = [...persistedHistory.history];
  const listeners = new Set<TerminalStateListener>();
  let inputValue = '';
  let completionSuggestions: TerminalCompletionSuggestion[] = [];
  let activeTheme = resolveTheme(persistedTheme.theme ?? config.theme, config.themes);
  let historyCursor: number | undefined;
  let historyDraft = '';
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
      input: inputValue,
      completionSuggestions: [...completionSuggestions],
      theme: { name: activeTheme.name, tokens: { ...activeTheme.tokens } },
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
    clearCompletionSuggestions();
    emit();
  }

  function setInput(input: string): void {
    assertActive();
    inputValue = input;
    resetHistoryNavigation();
    clearCompletionSuggestions();
    emit();
  }

  function navigateHistory(direction: TerminalHistoryDirection): string {
    assertActive();

    if (history.length === 0) {
      return inputValue;
    }

    if (direction === 'previous') {
      if (historyCursor === undefined) {
        historyDraft = inputValue;
        historyCursor = history.length - 1;
      } else {
        historyCursor = Math.max(0, historyCursor - 1);
      }

      inputValue = history[historyCursor];
      emit();
      return inputValue;
    }

    if (historyCursor === undefined) {
      return inputValue;
    }

    if (historyCursor === history.length - 1) {
      inputValue = historyDraft;
      resetHistoryNavigation();
    } else {
      historyCursor += 1;
      inputValue = history[historyCursor];
    }

    emit();
    return inputValue;
  }

  function complete(): TerminalCompletionResult {
    assertActive();

    const normalizedInput = normalizeCommand(inputValue);
    const matches = registry.commands.filter(
      (command) =>
        command.normalizedName.startsWith(normalizedInput) ||
        command.normalizedAliases.some((alias) => alias.startsWith(normalizedInput)),
    );
    const suggestions = matches.map(toCompletionSuggestion);

    if (suggestions.length === 0) {
      clearCompletionSuggestions();
      emit();
      return { status: 'none', input: inputValue };
    }

    if (suggestions.length === 1) {
      inputValue = suggestions[0].name;
      clearCompletionSuggestions();
      emit();
      return { status: 'completed', input: inputValue, command: suggestions[0] };
    }

    completionSuggestions = suggestions;
    emit();
    return { status: 'suggestions', input: inputValue, suggestions: [...suggestions] };
  }

  function setTheme(theme: TerminalThemeInput): void {
    assertActive();
    activeTheme = resolveTheme(theme, config.themes);
    persistTheme(theme);
    emit();
  }

  async function run(input: string): Promise<TerminalRunResult> {
    assertActive();

    const normalizedInput = normalizeCommand(input);
    if (!normalizedInput) {
      return { status: 'ignored' };
    }

    if (isExecuting) {
      return { status: 'busy' };
    }

    const submittedInput = input.trim();
    const exactCommand = registry.get(input);
    const parsedResult = exactCommand ? undefined : parseCommandLine(input);
    const parsedCommand = parsedResult?.ok
      ? registry.get(parsedResult.value.commandPath[0])
      : undefined;
    let command =
      exactCommand ?? (canResolveFromParsedInput(parsedCommand) ? parsedCommand : undefined);
    let parsedForCommand = parsedResult?.ok ? parsedResult.value : undefined;
    if (isGroup(command) && parsedForCommand) {
      const childName = parsedForCommand.positionals[0];
      const child = childName ? registry.getSubcommand(command, childName) : undefined;
      if (child) {
        command = child;
        parsedForCommand = {
          ...parsedForCommand,
          positionals: parsedForCommand.positionals.slice(1),
        };
      }
    }
    inputValue = '';
    resetHistoryNavigation();
    clearCompletionSuggestions();
    recordHistory(submittedInput);
    transcript.push({ kind: 'command', value: submittedInput });
    config.onCommand?.(submittedInput);

    if (!command) {
      if (parsedResult && !parsedResult.ok) {
        appendOutput({ type: 'error', value: parsedResult.error.message });
        emit();
        return { status: 'invalid', input: submittedInput, message: parsedResult.error.message };
      }
      appendOutput(createUnknownCommandOutput(submittedInput, config.messages?.unknownCommand));
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

    if ('subcommands' in command.command) {
      const message = `Specify a subcommand for ${command.name}.`;
      appendOutput({ type: 'error', value: message });
      emit();
      return { status: 'invalid', input: submittedInput, message };
    }

    let parsedInput: ParsedCommandLine | undefined;
    let values: ValidatedCommandValues | undefined;
    if (hasSchema(command)) {
      const parsed = parsedForCommand
        ? { ok: true as const, value: parsedForCommand }
        : parseCommandLine(input);
      if (!parsed.ok) {
        appendOutput({ type: 'error', value: parsed.error.message });
        emit();
        return { status: 'invalid', input: submittedInput, message: parsed.error.message };
      }
      parsedInput = parsed.value;
      const validation = validateCommandSchema(parsed.value, command.command);
      if (!validation.ok) {
        appendOutput({ type: 'error', value: validation.error.message });
        emit();
        return { status: 'invalid', input: submittedInput, message: validation.error.message };
      }
      values = validation.value;
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
        ...(parsedInput && values ? { parsedInput, values } : {}),
      };
      const output = await command.command.handler(context);
      if (destroyed) {
        return { status: 'executed', command };
      }
      appendOutput(output);
    } catch {
      if (destroyed) {
        return { status: 'executed', command };
      }
      appendOutput(createCommandFailureOutput());
    } finally {
      isExecuting = false;
    }

    if (destroyed) {
      return { status: 'executed', command };
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

  function recordHistory(entry: string): void {
    history.push(entry);
    history.splice(0, Math.max(0, history.length - historyLimit));
    persistHistory();
  }

  function persistHistory(): void {
    if (!persistedHistory.storageKey || !options.storage) {
      return;
    }

    try {
      options.storage.set(persistedHistory.storageKey, JSON.stringify(history));
    } catch {
      // Persistence is an optional enhancement; command execution must continue.
    }
  }

  function persistTheme(theme: TerminalThemeInput): void {
    if (!persistedTheme.storageKey || !options.storage) {
      return;
    }

    try {
      if (typeof theme === 'string') {
        options.storage.set(persistedTheme.storageKey, JSON.stringify(theme));
      } else {
        options.storage.remove(persistedTheme.storageKey);
      }
    } catch {
      // Persistence is an optional enhancement; theme updates must continue.
    }
  }

  function resetHistoryNavigation(): void {
    historyCursor = undefined;
    historyDraft = '';
  }

  function clearCompletionSuggestions(): void {
    completionSuggestions = [];
  }

  function destroy(): void {
    if (destroyed) {
      return;
    }

    listeners.clear();
    destroyed = true;
  }

  return {
    registry,
    getState,
    subscribe,
    setInput,
    navigateHistory,
    complete,
    setTheme,
    run,
    clear,
    destroy,
  };
}

function hasSchema(
  command: RegisteredCommand | undefined,
): command is RegisteredCommand & { readonly source: 'consumer' } {
  return (
    command?.source === 'consumer' &&
    (command.command.arguments !== undefined || command.command.flags !== undefined)
  );
}

function isGroup(
  command: RegisteredCommand | undefined,
): command is RegisteredCommand & { readonly source: 'consumer' } {
  return command?.source === 'consumer' && 'subcommands' in command.command;
}

function canResolveFromParsedInput(command: RegisteredCommand | undefined): boolean {
  return hasSchema(command) || isGroup(command);
}

function toCompletionSuggestion(command: RegisteredCommand): TerminalCompletionSuggestion {
  return {
    name: command.name,
    aliases: command.aliases,
    description: command.description,
  };
}

function resolveHistoryLimit(historyLimit: number | undefined): number {
  if (historyLimit === undefined) {
    return 100;
  }

  if (!Number.isSafeInteger(historyLimit) || historyLimit < 0) {
    throw new TerminalEngineError('historyLimit must be a non-negative safe integer.');
  }

  return historyLimit;
}

function resolvePersistedHistory(
  config: TerminalConfig,
  storage: TerminalStorageAdapter | undefined,
  historyLimit: number,
): { history: string[]; storageKey?: string } {
  if (config.storage?.enabled !== true || config.storage.persistHistory !== true || !storage) {
    return { history: [] };
  }

  const consumerStorageKey = config.storage.key.trim();
  if (!consumerStorageKey) {
    return { history: [] };
  }

  const storageKey = createTerminalStorageKey(consumerStorageKey, 'history');

  try {
    const serialized = storage.get(storageKey);
    if (!serialized) {
      return { history: [], storageKey };
    }

    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === 'string')) {
      return { history: [], storageKey };
    }

    return { history: parsed.slice(-historyLimit), storageKey };
  } catch {
    return { history: [], storageKey };
  }
}

function resolvePersistedTheme(
  config: TerminalConfig,
  storage: TerminalStorageAdapter | undefined,
): { theme?: ThemeName; storageKey?: string } {
  if (config.storage?.enabled !== true || config.storage.persistTheme !== true || !storage) {
    return {};
  }

  const consumerStorageKey = config.storage.key.trim();
  if (!consumerStorageKey) {
    return {};
  }

  const storageKey = createTerminalStorageKey(consumerStorageKey, 'theme');

  try {
    const serialized = storage.get(storageKey);
    if (!serialized) {
      return { storageKey };
    }

    const parsed: unknown = JSON.parse(serialized);
    if (typeof parsed !== 'string') {
      return { storageKey };
    }

    resolveTheme(parsed, config.themes);
    return { theme: parsed, storageKey };
  } catch {
    return { storageKey };
  }
}

function formatCommandLabel(command: RegisteredCommand): string {
  if (command.aliases.length === 0) {
    return command.name;
  }

  return `${command.name} (${command.aliases.join(', ')})`;
}
