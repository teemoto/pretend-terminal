import { describe, expect, it } from 'vitest';

import { normalizeStoredAppearance, resolveAppearance } from './appearance.js';

describe('site appearance preferences', () => {
  it('defaults to the visitor system setting when no explicit preference was saved', () => {
    expect(normalizeStoredAppearance(null)).toBe('system');
    expect(resolveAppearance('system', true)).toBe('dark');
    expect(resolveAppearance('system', false)).toBe('light');
  });

  it('uses only supported saved preferences and honours them over the system setting', () => {
    expect(normalizeStoredAppearance('dark')).toBe('dark');
    expect(normalizeStoredAppearance('light')).toBe('light');
    expect(normalizeStoredAppearance('unexpected')).toBe('system');
    expect(resolveAppearance('light', true)).toBe('light');
    expect(resolveAppearance('dark', false)).toBe('dark');
  });
});
