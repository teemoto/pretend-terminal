import { BUILT_IN_THEMES, type BuiltInThemeName } from '@pretend-terminal/core';
import type { CSSProperties } from 'react';

export interface ThemeGalleryItem {
  readonly name: BuiltInThemeName;
  readonly label: string;
}

export const themeGalleryItems: readonly ThemeGalleryItem[] = [
  { name: 'default', label: 'Default' },
  { name: 'dracula', label: 'Dracula' },
  { name: 'matrix', label: 'Matrix' },
  { name: 'amber', label: 'Amber' },
  { name: 'light', label: 'Light' },
  { name: 'nord', label: 'Nord' },
  { name: 'tokyo-night', label: 'Tokyo Night' },
  { name: 'solarized-light', label: 'Solarized Light' },
  { name: 'github-light', label: 'GitHub Light' },
];

/** Maps public terminal tokens onto the small, non-interactive transcript in each card. */
export function createThemeCardStyle(theme: BuiltInThemeName): CSSProperties {
  const tokens = BUILT_IN_THEMES[theme];
  return {
    '--theme-card-background': tokens.background,
    '--theme-card-surface': tokens.surface,
    '--theme-card-text': tokens.text,
    '--theme-card-muted': tokens.muted,
    '--theme-card-border': tokens.border,
    '--theme-card-accent': tokens.accent,
    '--theme-card-success': tokens.success,
    '--theme-card-error': tokens.error,
  } as CSSProperties;
}
