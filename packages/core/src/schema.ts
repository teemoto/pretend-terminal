import type { ParsedCommandLine } from './parser.js';
import type { CommandArgumentSchema, CommandFlagSchema, ValidatedCommandValues } from './types.js';

export interface CommandSchema {
  readonly arguments?: readonly CommandArgumentSchema[];
  readonly flags?: readonly CommandFlagSchema[];
}

export interface CommandSchemaValidationError {
  readonly code: 'unknown-flag' | 'missing-value' | 'invalid-value' | 'unexpected-argument';
  readonly message: string;
}

export type CommandSchemaValidationResult =
  | { readonly ok: true; readonly value: ValidatedCommandValues }
  | { readonly ok: false; readonly error: CommandSchemaValidationError };

/** Validates parsed visitor input without running application-owned command code. */
export function validateCommandSchema(
  input: ParsedCommandLine,
  schema: CommandSchema = {},
): CommandSchemaValidationResult {
  const argumentsByName: Record<string, string> = {};
  const flagsByName: Record<string, boolean | string> = {};
  const argumentsSchema = schema.arguments ?? [];
  const flagsSchema = schema.flags ?? [];
  if (input.positionals.length > argumentsSchema.length)
    return failure('unexpected-argument', 'This command does not accept that many arguments.');
  for (const [index, definition] of argumentsSchema.entries()) {
    const value = input.positionals[index] ?? definition.default;
    if (value === undefined) {
      if (definition.required)
        return failure('missing-value', `Argument "${definition.name}" is required.`);
      continue;
    }
    if (definition.values && !definition.values.includes(value))
      return failure(
        'invalid-value',
        `Argument "${definition.name}" must be one of: ${definition.values.join(', ')}.`,
      );
    argumentsByName[definition.name] = value;
  }
  const byName = new Map(flagsSchema.map((definition) => [definition.name, definition]));
  for (const [name, value] of Object.entries(input.flags)) {
    const definition = byName.get(name);
    if (!definition)
      return failure('unknown-flag', `Flag "--${name}" is not supported by this command.`);
    if ((definition.type ?? 'boolean') === 'boolean' && value !== true)
      return failure('invalid-value', `Flag "--${name}" does not accept a value.`);
    if (definition.values && (typeof value !== 'string' || !definition.values.includes(value)))
      return failure(
        'invalid-value',
        `Flag "--${name}" must be one of: ${definition.values.join(', ')}.`,
      );
    flagsByName[name] = value;
  }
  for (const definition of flagsSchema) {
    if (flagsByName[definition.name] !== undefined) continue;
    if (definition.default !== undefined) flagsByName[definition.name] = definition.default;
    else if (definition.required)
      return failure('missing-value', `Flag "--${definition.name}" is required.`);
  }
  return { ok: true, value: { arguments: argumentsByName, flags: flagsByName } };
}

function failure(
  code: CommandSchemaValidationError['code'],
  message: string,
): CommandSchemaValidationResult {
  return { ok: false, error: { code, message } };
}
