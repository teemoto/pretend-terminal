import type { Command, TerminalConfig } from './types.js';

/** The built-in command names available in Pretend Terminal v1. */
export type BuiltInCommandName = 'help' | 'clear' | 'history';

/** Metadata for a built-in command whose behavior is implemented by the engine. */
export interface BuiltInCommandDefinition {
  readonly name: BuiltInCommandName;
  readonly description: string;
}

/** Metadata retained for every active command after registration. */
export interface RegisteredCommandBase {
  /** The author-provided display name. */
  readonly name: string;
  /** The lookup key derived from the display name. */
  readonly normalizedName: string;
  /** The author-provided aliases. */
  readonly aliases: readonly string[];
  /** Lookup keys derived from aliases. */
  readonly normalizedAliases: readonly string[];
  readonly description?: string;
  readonly category?: string;
  readonly examples: readonly string[];
  readonly hidden: boolean;
}

/** A built-in command registered by the core package. */
export interface RegisteredBuiltInCommand extends RegisteredCommandBase {
  readonly source: 'built-in';
  readonly builtIn: BuiltInCommandName;
  readonly command?: never;
}

/** A command registered from consumer configuration. */
export interface RegisteredConsumerCommand extends RegisteredCommandBase {
  readonly source: 'consumer';
  readonly command: Command;
  /** Explicit child commands, in consumer declaration order. */
  readonly subcommands: readonly RegisteredConsumerCommand[];
  readonly builtIn?: never;
}

/** An active command available to the engine, help renderer, or completion logic. */
export type RegisteredCommand = RegisteredBuiltInCommand | RegisteredConsumerCommand;

/** Read-only lookup access to all active terminal commands. */
export interface CommandRegistry {
  /** Commands in stable display order: remaining built-ins, then consumer commands. */
  readonly commands: readonly RegisteredCommand[];
  /** Finds a command by its canonical name or alias. */
  get(input: string): RegisteredCommand | undefined;
  /** Finds an explicitly declared child command by canonical name or alias. */
  getSubcommand(
    parent: RegisteredConsumerCommand,
    input: string,
  ): RegisteredConsumerCommand | undefined;
}

/** Thrown when configured names or aliases cannot be resolved unambiguously. */
export class CommandRegistryError extends Error {
  override readonly name = 'CommandRegistryError';
}

/** Built-in command metadata in its default display order. */
export const BUILT_IN_COMMANDS: readonly BuiltInCommandDefinition[] = [
  { name: 'help', description: 'List available commands.' },
  { name: 'clear', description: 'Clear visible terminal output.' },
  { name: 'history', description: 'Show command history.' },
];

/** Normalizes terminal input for exact command matching. */
export function normalizeCommand(input: string): string {
  return input.trim().toLowerCase();
}

/** Builds a collision-free registry from configured commands and optional built-ins. */
export function createCommandRegistry(
  config: Pick<TerminalConfig, 'commands' | 'includeBuiltIns'> = {},
): CommandRegistry {
  const consumerCommands = config.commands ?? [];
  const normalizedConsumerNames = new Set<string>();

  for (const command of consumerCommands) {
    const normalizedName = requireCommandKey(command.name, 'name');

    if (normalizedConsumerNames.has(normalizedName)) {
      throw new CommandRegistryError(`Duplicate command name: "${command.name}".`);
    }

    normalizedConsumerNames.add(normalizedName);
  }

  const commands: RegisteredCommand[] = [];

  if (config.includeBuiltIns !== false) {
    for (const builtIn of BUILT_IN_COMMANDS) {
      if (!normalizedConsumerNames.has(builtIn.name)) {
        commands.push(createBuiltInCommand(builtIn));
      }
    }
  }

  for (const command of consumerCommands) {
    commands.push(createConsumerCommand(command));
  }

  const commandsByKey = new Map<string, RegisteredCommand>();

  for (const command of commands) {
    registerKey(commandsByKey, command.normalizedName, command);

    for (const alias of command.normalizedAliases) {
      registerKey(commandsByKey, alias, command);
    }
  }

  return {
    commands,
    get(input) {
      return commandsByKey.get(normalizeCommand(input));
    },
    getSubcommand(parent, input) {
      return createLookup(parent.subcommands).get(normalizeCommand(input));
    },
  };
}

function createBuiltInCommand(definition: BuiltInCommandDefinition): RegisteredBuiltInCommand {
  return {
    source: 'built-in',
    builtIn: definition.name,
    name: definition.name,
    normalizedName: definition.name,
    aliases: [],
    normalizedAliases: [],
    description: definition.description,
    examples: [],
    hidden: false,
  };
}

function createConsumerCommand(command: Command): RegisteredConsumerCommand {
  const aliases = command.aliases ?? [];
  const subcommands =
    'subcommands' in command ? command.subcommands.map(createConsumerCommand) : [];
  createLookup(subcommands);

  return {
    source: 'consumer',
    command,
    name: command.name,
    normalizedName: requireCommandKey(command.name, 'name'),
    aliases,
    normalizedAliases: aliases.map((alias) => requireCommandKey(alias, 'alias')),
    description: command.description,
    category: command.category,
    examples: command.examples ?? [],
    hidden: command.hidden === true,
    subcommands,
  };
}

function createLookup(
  commands: readonly RegisteredConsumerCommand[],
): ReadonlyMap<string, RegisteredConsumerCommand> {
  const commandsByKey = new Map<string, RegisteredConsumerCommand>();
  for (const command of commands) {
    registerKey(commandsByKey, command.normalizedName, command);
    for (const alias of command.normalizedAliases) registerKey(commandsByKey, alias, command);
  }
  return commandsByKey;
}

function requireCommandKey(value: string, field: 'name' | 'alias'): string {
  const normalized = normalizeCommand(value);

  if (!normalized) {
    throw new CommandRegistryError(`Command ${field} must not be empty.`);
  }

  return normalized;
}

function registerKey(
  commandsByKey: Map<string, RegisteredCommand>,
  key: string,
  command: RegisteredCommand,
): void {
  const existing = commandsByKey.get(key);

  if (existing) {
    throw new CommandRegistryError(
      `Command key "${key}" for "${command.name}" conflicts with "${existing.name}".`,
    );
  }

  commandsByKey.set(key, command);
}
