import type { BuiltInThemeName, ThemeName, ThemeTokens } from './types.js';

/** A complete set of semantic tokens ready for a renderer to apply. */
export type ResolvedThemeTokens = Required<ThemeTokens>;

/** A named theme with fully resolved semantic tokens. */
export interface ResolvedTerminalTheme {
  readonly name: ThemeName;
  readonly tokens: ResolvedThemeTokens;
}

/** A preset name or partial semantic-token override accepted by the resolver. */
export type TerminalThemeInput = ThemeName | ThemeTokens;

/** Thrown when a named theme has no bundled or consumer-supplied definition. */
export class ThemeResolutionError extends Error {
  override readonly name = 'ThemeResolutionError';
}

/** The default bundled theme used as the base for all custom token overrides. */
export const DEFAULT_THEME_NAME: BuiltInThemeName = 'default';

const MONOSPACE_FONT_STACK =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

/** Fully resolved token sets for the v1 bundled themes. */
export const BUILT_IN_THEMES: Readonly<Record<BuiltInThemeName, ResolvedThemeTokens>> = {
  default: {
    background: '#0c0f0d',
    surface: '#151a17',
    text: '#d7e1d8',
    muted: '#91a090',
    border: '#314438',
    promptUser: '#88c0d0',
    promptHost: '#a3be8c',
    promptPath: '#ebcb8b',
    promptSymbol: '#81a1c1',
    accent: '#88c0d0',
    success: '#a3be8c',
    error: '#bf616a',
    fontFamily: MONOSPACE_FONT_STACK,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    radius: '0.5rem',
    spacing: '1rem',
  },
  dracula: {
    background: '#282a36',
    surface: '#343746',
    text: '#f8f8f2',
    muted: '#b9b9c5',
    border: '#6272a4',
    promptUser: '#8be9fd',
    promptHost: '#50fa7b',
    promptPath: '#f1fa8c',
    promptSymbol: '#ff79c6',
    accent: '#bd93f9',
    success: '#50fa7b',
    error: '#ff5555',
    fontFamily: MONOSPACE_FONT_STACK,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    radius: '0.5rem',
    spacing: '1rem',
  },
  matrix: {
    background: '#020a02',
    surface: '#061406',
    text: '#c8ffc8',
    muted: '#74a874',
    border: '#247a36',
    promptUser: '#7dff7d',
    promptHost: '#4dff88',
    promptPath: '#b5ff65',
    promptSymbol: '#53ff53',
    accent: '#57ff57',
    success: '#84ff84',
    error: '#ff7171',
    fontFamily: MONOSPACE_FONT_STACK,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    radius: '0.25rem',
    spacing: '1rem',
  },
  amber: {
    background: '#1a1104',
    surface: '#251905',
    text: '#ffe7a1',
    muted: '#c6a85d',
    border: '#8f6519',
    promptUser: '#ffd46b',
    promptHost: '#ffbc3f',
    promptPath: '#ffdf7a',
    promptSymbol: '#ffae26',
    accent: '#ffbc3f',
    success: '#e7f48b',
    error: '#ff8f70',
    fontFamily: MONOSPACE_FONT_STACK,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    radius: '0.25rem',
    spacing: '1rem',
  },
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#172033',
    muted: '#5d6b82',
    border: '#cbd5e1',
    promptUser: '#0369a1',
    promptHost: '#15803d',
    promptPath: '#a16207',
    promptSymbol: '#4338ca',
    accent: '#2563eb',
    success: '#15803d',
    error: '#b91c1c',
    fontFamily: MONOSPACE_FONT_STACK,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    radius: '0.5rem',
    spacing: '1rem',
  },
  nord: {
    background: '#2e3440',
    surface: '#3b4252',
    text: '#eceff4',
    muted: '#d8dee9',
    border: '#4c566a',
    promptUser: '#88c0d0',
    promptHost: '#a3be8c',
    promptPath: '#ebcb8b',
    promptSymbol: '#81a1c1',
    accent: '#88c0d0',
    success: '#a3be8c',
    error: '#ff8a8a',
    fontFamily: MONOSPACE_FONT_STACK,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    radius: '0.5rem',
    spacing: '1rem',
  },
  'tokyo-night': {
    background: '#1a1b26',
    surface: '#24283b',
    text: '#c0caf5',
    muted: '#a9b1d6',
    border: '#414868',
    promptUser: '#7dcfff',
    promptHost: '#9ece6a',
    promptPath: '#e0af68',
    promptSymbol: '#bb9af7',
    accent: '#7aa2f7',
    success: '#9ece6a',
    error: '#f7768e',
    fontFamily: MONOSPACE_FONT_STACK,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    radius: '0.5rem',
    spacing: '1rem',
  },
  'solarized-light': {
    background: '#fdf6e3',
    surface: '#eee8d5',
    text: '#073642',
    muted: '#586e75',
    border: '#93a1a1',
    promptUser: '#005f87',
    promptHost: '#2f6f3e',
    promptPath: '#8a5a00',
    promptSymbol: '#6c3ea5',
    accent: '#005f87',
    success: '#2f6f3e',
    error: '#b42318',
    fontFamily: MONOSPACE_FONT_STACK,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    radius: '0.375rem',
    spacing: '1rem',
  },
  'github-light': {
    background: '#ffffff',
    surface: '#f6f8fa',
    text: '#1f2328',
    muted: '#57606a',
    border: '#d0d7de',
    promptUser: '#0969da',
    promptHost: '#1a7f37',
    promptPath: '#8250df',
    promptSymbol: '#cf222e',
    accent: '#0969da',
    success: '#1a7f37',
    error: '#cf222e',
    fontFamily: MONOSPACE_FONT_STACK,
    fontSize: '0.9375rem',
    lineHeight: '1.5',
    radius: '0.375rem',
    spacing: '1rem',
  },
};

/** Resolves a configured theme into the complete semantic token set a renderer needs. */
export function resolveTheme(
  theme: TerminalThemeInput | undefined = DEFAULT_THEME_NAME,
  themes: Readonly<Record<string, ThemeTokens>> = {},
): ResolvedTerminalTheme {
  if (typeof theme !== 'string') {
    return { name: 'custom', tokens: { ...BUILT_IN_THEMES[DEFAULT_THEME_NAME], ...theme } };
  }

  const builtInTheme = BUILT_IN_THEMES[theme as BuiltInThemeName];
  if (builtInTheme) {
    return { name: theme, tokens: { ...builtInTheme } };
  }

  const customTheme = themes[theme];
  if (!customTheme) {
    throw new ThemeResolutionError(`Unknown theme: "${theme}".`);
  }

  return { name: theme, tokens: { ...BUILT_IN_THEMES[DEFAULT_THEME_NAME], ...customTheme } };
}
