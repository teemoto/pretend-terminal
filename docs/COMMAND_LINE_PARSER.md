# v2 command-line parser

`parseCommandLine()` provides the small, safe grammar that v2 command schemas build on. It parses visitor text only; it never runs a shell command, reads host state, expands values, or performs I/O.

## Grammar

```text
command-line  = command *( whitespace item )
command       = token
item          = positional / long-flag / short-flag-bundle / "--"
positional    = token / quoted-token
long-flag     = "--" flag-name [ "=" token ]
short-flag-bundle = "-" 1*( ALPHA / DIGIT )
quoted-token  = "'" *( any character except "'" ) "'"
              / '"' *( any character except '"' ) '"'
```

- The first token is the current one-segment `commandPath`; command schemas introduce subcommand resolution later in v2.
- Whitespace separates arguments. Single and double quotes preserve whitespace and may be joined to an adjacent token (`hello" world"` becomes `hello world`). Quotes are delimiters, not escape syntax; close them with the same quote character.
- `--flag` has the value `true`; `--flag=value` has a string value, including an empty string. Long names begin with a letter and use letters, digits, or hyphens.
- `-abc` is equivalent to short boolean flags `a`, `b`, and `c`. Short flags do not take values in this grammar.
- `--` ends flag parsing; later dash-prefixed tokens are positional values. Quote a dash-prefixed value when it appears before `--`.
- Duplicate flags and flags before a command are safe parse errors.

## Deliberate exclusions

Unquoted `|`, `>`, `<`, `;`, `&`, backticks, `$`, and backslashes are rejected with a visitor-safe error. These are not shell operators in Pretend Terminal. Put a literal occurrence in quoted text when needed.

There is no expansion, substitution, redirection, piping, globbing, environment interpolation, filesystem behavior, process behavior, or implicit network access. Characters not given syntax above are ordinary string data.

## Example

```ts
import { parseCommandLine } from '@pretend-terminal/core';

const parsed = parseCommandLine('deploy "web app" --region=us-west -fv');

if (parsed.ok) {
  // parsed.value is:
  // {
  //   rawInput: 'deploy "web app" --region=us-west -fv',
  //   commandPath: ['deploy'],
  //   positionals: ['web app'],
  //   flags: { region: 'us-west', f: true, v: true },
  // }
}
```
