import { describe, expect, it } from 'vitest';

import { parseCommandLine, validateCommandSchema } from '../index.js';

function parsed(input: string) {
  const result = parseCommandLine(input);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.value;
}

describe('validateCommandSchema', () => {
  const schema = {
    arguments: [
      { name: 'name', required: true },
      { name: 'region', default: 'us-west', values: ['us-west', 'eu-west'] },
    ],
    flags: [
      { name: 'dry-run' },
      {
        name: 'visibility',
        type: 'string' as const,
        default: 'private',
        values: ['private', 'public'],
      },
    ],
  };

  it('returns named validated values and defaults', () => {
    expect(validateCommandSchema(parsed('deploy teemo --dry-run'), schema)).toEqual({
      ok: true,
      value: {
        arguments: { name: 'teemo', region: 'us-west' },
        flags: { 'dry-run': true, visibility: 'private' },
      },
    });
  });

  it.each([
    ['deploy', 'missing-value'],
    ['deploy teemo --other', 'unknown-flag'],
    ['deploy teemo extra extra', 'unexpected-argument'],
    ['deploy teemo --visibility=team', 'invalid-value'],
  ])('returns a safe error for %s', (input, code) => {
    expect(validateCommandSchema(parsed(input), schema)).toMatchObject({
      ok: false,
      error: { code, message: expect.any(String) },
    });
  });
});
