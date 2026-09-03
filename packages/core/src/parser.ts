/** A safe parse error that can be shown to a visitor without exposing implementation details. */
export interface CommandLineParseError {
  readonly code:
    | 'empty-input'
    | 'unterminated-quote'
    | 'unsupported-shell-syntax'
    | 'invalid-flag'
    | 'duplicate-flag';
  readonly message: string;
}

/** The supported, framework-neutral representation of a submitted command line. */
export interface ParsedCommandLine {
  /** The exact input supplied by the visitor. */
  readonly rawInput: string;
  /**
   * The parsed command path. The v2.0 parser initially has one command segment;
   * command groups extend this path when schemas are introduced.
   */
  readonly commandPath: readonly [string];
  /** Non-flag tokens after the command path, in input order. */
  readonly positionals: readonly string[];
  /** Long flags and bundled short flags, keyed without their leading dashes. */
  readonly flags: Readonly<Record<string, true | string>>;
}

/** The non-throwing result of parsing one visitor-submitted command line. */
export type CommandLineParseResult = ParseResult<ParsedCommandLine>;

type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: CommandLineParseError };

interface Token {
  readonly value: string;
  readonly quoted: boolean;
}

/**
 * Parses Pretend Terminal's deliberately small command-line grammar.
 *
 * This is not a shell parser: it supports whitespace, single/double quoted
 * strings, long flags, bundled short flags, and `--` to end flag parsing.
 * Shell operators are rejected outside quoted strings rather than interpreted.
 */
export function parseCommandLine(rawInput: string): CommandLineParseResult {
  const tokenResult = tokenize(rawInput);
  if (!tokenResult.ok) {
    return tokenResult;
  }

  const tokens = tokenResult.value;
  const firstToken = tokens[0];

  if (!firstToken) {
    return failure('empty-input', 'Enter a command before its arguments or flags.');
  }

  if (!firstToken.quoted && isFlagToken(firstToken.value)) {
    return failure('invalid-flag', 'Place the command name before its flags.');
  }

  const positionals: string[] = [];
  const flags: Record<string, true | string> = {};
  let flagsEnabled = true;

  for (const token of tokens.slice(1)) {
    if (flagsEnabled && !token.quoted && token.value === '--') {
      flagsEnabled = false;
      continue;
    }

    if (flagsEnabled && !token.quoted && token.value.startsWith('--')) {
      const parsedFlag = parseLongFlag(token.value);
      if (!parsedFlag.ok) {
        return parsedFlag;
      }
      if (flags[parsedFlag.value.name] !== undefined) {
        return failure(
          'duplicate-flag',
          `Flag "--${parsedFlag.value.name}" was provided more than once.`,
        );
      }
      flags[parsedFlag.value.name] = parsedFlag.value.value;
      continue;
    }

    if (flagsEnabled && !token.quoted && token.value.startsWith('-') && token.value !== '-') {
      const parsedFlags = parseShortFlags(token.value);
      if (!parsedFlags.ok) {
        return parsedFlags;
      }
      for (const name of parsedFlags.value) {
        if (flags[name] !== undefined) {
          return failure('duplicate-flag', `Flag "-${name}" was provided more than once.`);
        }
        flags[name] = true;
      }
      continue;
    }

    positionals.push(token.value);
  }

  return {
    ok: true,
    value: {
      rawInput,
      commandPath: [firstToken.value],
      positionals,
      flags,
    },
  };
}

function tokenize(rawInput: string): ParseResult<Token[]> {
  const tokens: Token[] = [];
  let current = '';
  let quoted = false;
  let quote: '"' | "'" | undefined;

  function finishToken(): void {
    if (!current && !quoted) {
      return;
    }
    tokens.push({ value: current, quoted });
    current = '';
    quoted = false;
  }

  for (const character of rawInput) {
    if (quote) {
      if (character === quote) {
        quote = undefined;
      } else {
        current += character;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      quoted = true;
      continue;
    }

    if (/\s/u.test(character)) {
      finishToken();
      continue;
    }

    if (isUnsupportedShellCharacter(character)) {
      return failure(
        'unsupported-shell-syntax',
        `Shell syntax such as "${character}" is not supported. Use quoted text for a literal character.`,
      );
    }

    current += character;
  }

  if (quote) {
    return failure('unterminated-quote', 'Close the quoted argument before running the command.');
  }

  finishToken();
  return { ok: true, value: tokens };
}

function parseLongFlag(
  token: string,
): ParseResult<{ readonly name: string; readonly value: true | string }> {
  const separatorIndex = token.indexOf('=');
  const name = token.slice(2, separatorIndex === -1 ? undefined : separatorIndex);

  if (!isLongFlagName(name)) {
    return failure('invalid-flag', `"${token}" is not a valid long flag.`);
  }

  return {
    ok: true,
    value: { name, value: separatorIndex === -1 ? true : token.slice(separatorIndex + 1) },
  };
}

function parseShortFlags(token: string): ParseResult<readonly string[]> {
  const names = [...token.slice(1)];

  if (names.length === 0 || names.some((name) => !/[A-Za-z0-9]/u.test(name))) {
    return failure('invalid-flag', `"${token}" is not a valid short-flag bundle.`);
  }

  return { ok: true, value: names };
}

function isFlagToken(token: string): boolean {
  return token.startsWith('-') && token !== '-';
}

function isLongFlagName(name: string): boolean {
  return /^[A-Za-z][A-Za-z0-9-]*$/u.test(name);
}

function isUnsupportedShellCharacter(character: string): boolean {
  return (
    character === '|' ||
    character === '>' ||
    character === '<' ||
    character === ';' ||
    character === '&' ||
    character === '`' ||
    character === '$' ||
    character === '\\'
  );
}

function failure(code: CommandLineParseError['code'], message: string): ParseResult<never> {
  return { ok: false, error: { code, message } };
}
