import { describe, expect, it } from 'vitest';

import { defaultSandboxSettings } from './sandbox.js';
import { createSnippet, snippetTabs } from './snippets.js';

describe('generated integration snippets', () => {
  it('offers the four documented integration formats', () => {
    expect(snippetTabs).toEqual(['vanilla', 'react', 'json', 'css']);
  });

  it('keeps the JSON configuration valid and aligned with sandbox settings', () => {
    const parsed = JSON.parse(createSnippet('json', { ...defaultSandboxSettings, theme: 'nord' }));

    expect(parsed).toMatchObject({
      prompt: 'teemo@demo:~ $',
      theme: 'nord',
      includeBuiltIns: true,
      commands: [{ name: 'showcase' }],
    });
  });

  it('uses public package imports and supported CSS variables', () => {
    expect(createSnippet('vanilla', defaultSandboxSettings)).toContain(
      "import { createTerminal } from '@pretend-terminal/core';",
    );
    expect(createSnippet('react', defaultSandboxSettings)).toContain(
      "import { PretendTerminal } from '@pretend-terminal/react';",
    );
    expect(createSnippet('css', defaultSandboxSettings)).toContain('--pt-background: #0c0f0d;');
  });
});
