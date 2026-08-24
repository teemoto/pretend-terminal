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

  it('keeps every bundled foreground token readable against its background', () => {
    const textTokens = [
      'text',
      'muted',
      'accent',
      'success',
      'error',
      'promptUser',
      'promptHost',
      'promptPath',
      'promptSymbol',
    ] as const;

    for (const [name, theme] of Object.entries(BUILT_IN_THEMES)) {
      for (const token of textTokens) {
        expect(
          contrastRatio(theme.background, theme[token]),
          `${name} ${token}`,
        ).toBeGreaterThanOrEqual(4.5);
      }

      expect(
        contrastRatio(theme.background, theme.accent),
        `${name} focus outline`,
      ).toBeGreaterThanOrEqual(3);
    }
  });
});

function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(color: string): number {
  const [red, green, blue] = color
    .slice(1)
    .match(/.{2}/g)
    ?.map((part) => Number.parseInt(part, 16) / 255) ?? [0, 0, 0];
  const [linearRed, linearGreen, linearBlue] = [red, green, blue].map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return linearRed * 0.2126 + linearGreen * 0.7152 + linearBlue * 0.0722;
}
