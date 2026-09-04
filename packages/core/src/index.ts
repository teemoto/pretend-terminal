export type {
  AsciiOutput,
  BuiltInThemeName,
  Command,
  CommandArgumentSchema,
  CommandFlagSchema,
  CommandHandler,
  CommandHandlerContext,
  LinkOutput,
  StyledOutput,
  TableOutput,
  TerminalConfig,
  TerminalMessages,
  TerminalOutput,
  TerminalOutputBlock,
  TerminalStorageConfig,
  TextOutput,
  ValidatedCommandValues,
  ThemeName,
  ThemeTokens,
  LinesOutput,
} from './types.js';

export { validateCommandSchema } from './schema.js';
export type {
  CommandSchema,
  CommandSchemaValidationError,
  CommandSchemaValidationResult,
} from './schema.js';

export {
  BUILT_IN_COMMANDS,
  CommandRegistryError,
  createCommandRegistry,
  normalizeCommand,
} from './registry.js';

export { createTerminalEngine, TerminalEngineError } from './engine.js';

export { parseCommandLine } from './parser.js';

export type { CommandLineParseError, CommandLineParseResult, ParsedCommandLine } from './parser.js';

export { isSafeLinkHref } from './links.js';

export { createTerminal, TerminalMountError } from './dom.js';

export type { MountedTerminal, TerminalDomConfig } from './dom.js';

export {
  BUILT_IN_THEMES,
  DEFAULT_THEME_NAME,
  resolveTheme,
  ThemeResolutionError,
} from './themes.js';

export type { ResolvedTerminalTheme, ResolvedThemeTokens, TerminalThemeInput } from './themes.js';

export {
  createBrowserStorageAdapter,
  createMemoryStorageAdapter,
  createSafeStorageAdapter,
  createTerminalStorageKey,
  TERMINAL_STORAGE_VERSION,
} from './storage.js';

export type { StorageLike, TerminalStorageAdapter, TerminalStorageRecordName } from './storage.js';

export type {
  CommandTranscriptEntry,
  OutputTranscriptEntry,
  TerminalCompletionResult,
  TerminalCompletionSuggestion,
  TerminalEngine,
  TerminalEngineOptions,
  TerminalEngineState,
  TerminalHistoryDirection,
  TerminalRunResult,
  TerminalStateListener,
  TerminalTranscriptEntry,
} from './engine.js';

export type {
  BuiltInCommandDefinition,
  BuiltInCommandName,
  CommandRegistry,
  RegisteredBuiltInCommand,
  RegisteredCommand,
  RegisteredCommandBase,
  RegisteredConsumerCommand,
} from './registry.js';

/** The currently installed core package version. */
export const PRETEND_TERMINAL_CORE_VERSION = '0.0.0';
