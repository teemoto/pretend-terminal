import { describe, expect, it } from 'vitest';

import { createThemeCardStyle, themeGalleryItems } from './theme-gallery.js';

describe('theme gallery', () => {
  it('gives every bundled theme a labelled gallery card', () => {
    expect(themeGalleryItems.map((item) => item.name)).toEqual([
      'default',
      'dracula',
      'matrix',
      'amber',
      'light',
      'nord',
      'tokyo-night',
      'solarized-light',
      'github-light',
    ]);
    expect(themeGalleryItems.every((item) => item.label.length > 0)).toBe(true);
  });

  it('renders each compact transcript from its public theme tokens', () => {
    expect(createThemeCardStyle('github-light')).toMatchObject({
      '--theme-card-background': '#ffffff',
      '--theme-card-text': '#1f2328',
      '--theme-card-accent': '#0969da',
    });
  });
});
