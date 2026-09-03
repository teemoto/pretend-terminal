import { describe, expect, it } from 'vitest';

import { parseCommandLine } from '../index.js';

describe('parseCommandLine', () => {
  it('preserves raw input while parsing whitespace, quotes, positional values, and flags', () => {
    const rawInput = 'deploy "web app"\tproduction --region=us-west -fv';

    expect(parseCommandLine(rawInput)).toEqual({
      ok: true,
      value: {
        rawInput,
        commandPath: ['deploy'],
        positionals: ['web app', 'production'],
        flags: { region: 'us-west', f: true, v: true },
      },
    });
  });

  it('treats quoted dash-prefixed values and tokens after -- as positional arguments', () => {
    expect(parseCommandLine('find "--literal" -- -not-a-flag')).toEqual({
      ok: true,
      value: {
        rawInput: 'find "--literal" -- -not-a-flag',
        commandPath: ['find'],
        positionals: ['--literal', '-not-a-flag'],
        flags: {},
      },
    });
  });

  it('accepts boolean and empty-valued long flags', () => {
    expect(parseCommandLine('publish --dry-run --tag=')).toEqual({
      ok: true,
      value: {
        rawInput: 'publish --dry-run --tag=',
        commandPath: ['publish'],
        positionals: [],
        flags: { 'dry-run': true, tag: '' },
      },
    });
  });

  it.each([
    ['unterminated quotes', 'say "hello', 'unterminated-quote'],
    ['flags before the command', '--verbose help', 'invalid-flag'],
    ['invalid long flags', 'help --=value', 'invalid-flag'],
    ['invalid short flags', 'help -a=value', 'invalid-flag'],
    ['duplicate flags', 'help --verbose --verbose', 'duplicate-flag'],
    ['an empty input', '  \t ', 'empty-input'],
  ])('reports safe errors for %s', (_label, input, code) => {
    expect(parseCommandLine(input)).toMatchObject({
      ok: false,
      error: { code, message: expect.any(String) },
    });
  });

  it.each([
    'help | status',
    'help > output',
    'help;status',
    'help && status',
    'help `status`',
    'help $HOME',
    'help one\\ two',
  ])('rejects shell-like syntax rather than interpreting it: %s', (input) => {
    expect(parseCommandLine(input)).toMatchObject({
      ok: false,
      error: { code: 'unsupported-shell-syntax', message: expect.any(String) },
    });
  });

  it('allows excluded characters as literal quoted argument content', () => {
    expect(parseCommandLine('say "a | b; $HOME"')).toEqual({
      ok: true,
      value: {
        rawInput: 'say "a | b; $HOME"',
        commandPath: ['say'],
        positionals: ['a | b; $HOME'],
        flags: {},
      },
    });
  });
});
