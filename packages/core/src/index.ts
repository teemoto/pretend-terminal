export type {
  AsciiOutput,
  BuiltInThemeName,
  Command,
  CommandHandler,
  CommandHandlerContext,
  LinkOutput,
  StyledOutput,
  TableOutput,
  TerminalConfig,
  TerminalOutput,
  TerminalOutputBlock,
  TerminalStorageConfig,
  TextOutput,
  ThemeName,
  ThemeTokens,
  LinesOutput,
} from './types.js';

export {
  BUILT_IN_COMMANDS,
  CommandRegistryError,
  createCommandRegistry,
  normalizeCommand,
} from './registry.js';

export { createTerminalEngine, TerminalEngineError } from './engine.js';

export type {
  CommandTranscriptEntry,
  OutputTranscriptEntry,
  TerminalEngine,
  TerminalEngineState,
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
