import {
  BUILT_IN_THEMES,
  type BuiltInThemeName,
  type TerminalConfig,
} from '@pretend-terminal/core';

export const SANDBOX_STORAGE_KEY = 'pretend-terminal-demo:sandbox-v1';
const DEFAULT_PROMPT = 'teemo@demo:~ $';

export interface SandboxSettings {
  readonly prompt: string;
  readonly theme: BuiltInThemeName;
  readonly includeBuiltIns: boolean;
  readonly persistHistory: boolean;
  readonly background: string;
  readonly text: string;
  readonly accent: string;
  readonly border: string;
}

export const defaultSandboxSettings: SandboxSettings = {
  prompt: DEFAULT_PROMPT,
  theme: 'default',
  includeBuiltIns: true,
  persistHistory: false,
  background: '#0c0f0d',
  text: '#d7e1d8',
  accent: '#88c0d0',
  border: '#314438',
};

export function normalizePrompt(value: string): string {
  const normalized = value
    .replaceAll(/[\r\n]/g, ' ')
    .trim()
    .slice(0, 60);
  return normalized || DEFAULT_PROMPT;
}

/** Selects a bundled theme and resets the editable token overrides to that preset's values. */
export function applyBuiltInTheme(
  settings: SandboxSettings,
  theme: BuiltInThemeName,
): SandboxSettings {
  const tokens = BUILT_IN_THEMES[theme];
  return {
    ...settings,
    theme,
    background: tokens.background,
    text: tokens.text,
    accent: tokens.accent,
    border: tokens.border,
  };
}

/** Creates the JSON-compatible configuration shared by the preview and generated snippets. */
export function createPortableSandboxConfig(settings: SandboxSettings): TerminalConfig {
  return {
    prompt: normalizePrompt(settings.prompt),
    theme: settings.theme,
    includeBuiltIns: settings.includeBuiltIns,
    storage: settings.persistHistory
      ? {
          enabled: true,
          key: SANDBOX_STORAGE_KEY,
          persistHistory: true,
          persistTheme: true,
        }
      : { enabled: false },
    commands: [
      {
        name: 'showcase',
        description: 'Show every safe output primitive.',
        response: [
          { type: 'text', value: 'Text output is simple and safe.' },
          { type: 'lines', lines: ['Lines stay in order.', 'They are configured, not executed.'] },
          { type: 'success', value: 'Success output is available.' },
          { type: 'error', value: 'Errors can remain friendly and controlled.' },
          { type: 'table', headers: ['Feature', 'Status'], rows: [['Configuration', 'Ready']] },
          {
            type: 'link',
            label: 'Read the API guide',
            href: 'https://github.com/teemoto/pretend-terminal#readme',
            openInNewTab: true,
          },
          { type: 'ascii', value: '  /\\_/\\\n ( o.o )\n  > ^ <' },
        ],
      },
    ],
  };
}

/** Creates the sandbox preview configuration with its demo-specific fixed height. */
export function createSandboxTerminalConfig(settings: SandboxSettings): TerminalConfig {
  return { ...createPortableSandboxConfig(settings), height: '25rem' };
}
