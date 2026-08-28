import { createTerminalEngine } from '@pretend-terminal/core';
import { describe, expect, it } from 'vitest';

import {
  applyBuiltInTheme,
  createSandboxTerminalConfig,
  defaultSandboxSettings,
  normalizePrompt,
} from './sandbox.js';

describe('configuration sandbox', () => {
  it('uses a safe default prompt when a visitor clears the prompt field', () => {
    expect(normalizePrompt('   ')).toBe(defaultSandboxSettings.prompt);
    expect(normalizePrompt('teemo\n$ ')).toBe('teemo $');
  });

  it('starts each newly selected preset with matching editable token values', () => {
    expect(applyBuiltInTheme(defaultSandboxSettings, 'github-light')).toMatchObject({
      theme: 'github-light',
      background: '#ffffff',
      text: '#1f2328',
      accent: '#0969da',
      border: '#d0d7de',
    });
  });

  it('renders configured structured output without treating it as executable code', async () => {
    const engine = createTerminalEngine(createSandboxTerminalConfig(defaultSandboxSettings));

    await engine.run('showcase');

    expect(
      engine
        .getState()
        .transcript.filter((entry) => entry.kind === 'output')
        .map((entry) => entry.output.type),
    ).toEqual(['text', 'lines', 'success', 'error', 'table', 'link', 'ascii']);
  });

  it('lets a site author disable the built-in command set while retaining their showcase command', async () => {
    const config = createSandboxTerminalConfig({
      ...defaultSandboxSettings,
      includeBuiltIns: false,
    });
    const engine = createTerminalEngine(config);

    await expect(engine.run('help')).resolves.toMatchObject({ status: 'unknown' });
    await expect(engine.run('showcase')).resolves.toMatchObject({ status: 'executed' });
  });
});
