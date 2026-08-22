import { describe, expect, it } from 'vitest';

import { BUILT_IN_THEMES, resolveTheme, ThemeResolutionError } from '../index.js';

describe('resolveTheme', () => {
  it('provides complete tokens for every bundled v1 theme', () => {
    expect(Object.keys(BUILT_IN_THEMES)).toEqual([
      'default',
      'dracula',
      'matrix',
      'amber',
      'light',
    ]);

    for (const theme of Object.values(BUILT_IN_THEMES)) {
      expect(theme.background).toBeTruthy();
      expect(theme.text).toBeTruthy();
      expect(theme.accent).toBeTruthy();
      expect(theme.fontFamily).toBeTruthy();
    }
  });

  it('merges named and inline custom themes with the default token set', () => {
    expect(resolveTheme('teemo', { teemo: { accent: '#9acd32' } })).toMatchObject({
      name: 'teemo',
      tokens: { accent: '#9acd32', background: BUILT_IN_THEMES.default.background },
    });
    expect(resolveTheme({ error: '#ff0000' })).toMatchObject({
      name: 'custom',
      tokens: { error: '#ff0000', text: BUILT_IN_THEMES.default.text },
    });
  });

  it('rejects unknown named themes instead of silently selecting an unexpected palette', () => {
    expect(() => resolveTheme('missing')).toThrow(
      new ThemeResolutionError('Unknown theme: "missing".'),
    );
  });
});
