/** Output rendered as a single plain-text line. */
export interface TextOutput {
  readonly type: 'text';
  readonly value: string;
}

/** Output rendered as several plain-text lines. */
export interface LinesOutput {
  readonly type: 'lines';
  readonly lines: readonly string[];
}

/** Output with a semantic visual treatment. */
export interface StyledOutput {
  readonly type: 'success' | 'error' | 'muted' | 'accent';
  readonly value: string;
}

/** Output rendered as a small, text-only table. */
export interface TableOutput {
  readonly type: 'table';
  readonly headers?: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

/** Output rendered as a labelled link. */
export interface LinkOutput {
  readonly type: 'link';
  readonly label: string;
  readonly href: string;
  readonly openInNewTab?: boolean;
}

/** Output rendered in a preformatted block, such as ASCII art. */
export interface AsciiOutput {
  readonly type: 'ascii';
  readonly value: string;
}

/** A single safely renderable terminal output block. */
export type TerminalOutputBlock =
  TextOutput | LinesOutput | StyledOutput | TableOutput | LinkOutput | AsciiOutput;

/** One output block or an ordered sequence of blocks. */
export type TerminalOutput = TerminalOutputBlock | readonly TerminalOutputBlock[];

/** The only theme names bundled with Pretend Terminal v1. */
export type BuiltInThemeName = 'default' | 'dracula' | 'matrix' | 'amber' | 'light';

/** A built-in theme name or a consumer-defined theme name. */
export type ThemeName = BuiltInThemeName | (string & {});

/**
 * Semantic visual tokens. A custom theme may override only the tokens it needs;
 * the renderer supplies the remaining values from its active base theme.
 */
export interface ThemeTokens {
  readonly background?: string;
  readonly surface?: string;
  readonly text?: string;
  readonly muted?: string;
  readonly border?: string;
  readonly promptUser?: string;
  readonly promptHost?: string;
  readonly promptPath?: string;
  readonly promptSymbol?: string;
  readonly accent?: string;
  readonly success?: string;
  readonly error?: string;
  readonly fontFamily?: string;
  readonly fontSize?: string;
  readonly lineHeight?: string;
  readonly radius?: string;
  readonly spacing?: string;
}

/** Browser persistence explicitly disabled for a terminal instance. */
export interface DisabledTerminalStorageConfig {
  readonly enabled: false;
}

/** Browser persistence enabled with a consumer-owned storage key. */
export interface EnabledTerminalStorageConfig {
  readonly enabled: true;
  readonly key: string;
  readonly persistHistory?: boolean;
  readonly persistTheme?: boolean;
}

/** Opt-in configuration for browser history and theme persistence. */
export type TerminalStorageConfig = DisabledTerminalStorageConfig | EnabledTerminalStorageConfig;

/** Context supplied to a dynamic command handler. */
export interface CommandHandlerContext {
  /** The exact non-empty input submitted by the visitor. */
  readonly rawInput: string;
  /** The case- and whitespace-normalized input used for command matching. */
  readonly normalizedInput: string;
  /** The canonical name of the command being executed. */
  readonly commandName: string;
}

/** A function that produces terminal output synchronously or asynchronously. */
export type CommandHandler = (
  context: CommandHandlerContext,
) => TerminalOutput | Promise<TerminalOutput>;

/** Shared command metadata. */
interface CommandBase {
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly description?: string;
}

/** A command whose output is entirely declarative and JSON-compatible. */
export interface StaticCommand extends CommandBase {
  readonly response: TerminalOutput;
  readonly handler?: never;
}

/** A command whose output is computed by application-owned code. */
export interface DynamicCommand extends CommandBase {
  readonly handler: CommandHandler;
  readonly response?: never;
}

/** A configured terminal command. Commands use either a response or a handler. */
export type Command = StaticCommand | DynamicCommand;

/** Configuration shared by the future vanilla-JS and React renderers. */
export interface TerminalConfig {
  readonly prompt?: string;
  readonly commands?: readonly Command[];
  readonly includeBuiltIns?: boolean;
  readonly theme?: ThemeName | ThemeTokens;
  readonly themes?: Readonly<Record<string, ThemeTokens>>;
  readonly className?: string;
  /** Maximum session-history entries to retain. Defaults to 100; zero disables retention. */
  readonly historyLimit?: number;
  readonly storage?: TerminalStorageConfig;
  /** Invoked after non-empty input is recorded, before the command resolves. */
  readonly onCommand?: (command: string) => void;
  /** Invoked only when non-empty input does not match an active command. */
  readonly onUnknownCommand?: (command: string) => void;
}
