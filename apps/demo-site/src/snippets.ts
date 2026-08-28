import { createPortableSandboxConfig, type SandboxSettings } from './sandbox.js';

export const snippetTabs = ['vanilla', 'react', 'json', 'css'] as const;
export type SnippetTab = (typeof snippetTabs)[number];

export const snippetTabLabels: Readonly<Record<SnippetTab, string>> = {
  vanilla: 'Vanilla JS',
  react: 'React',
  json: 'JSON config',
  css: 'CSS tokens',
};

function stringifyConfig(settings: SandboxSettings): string {
  return JSON.stringify(createPortableSandboxConfig(settings), null, 2);
}

/** Generates only examples that accurately represent the sandbox's declarative settings. */
export function createSnippet(tab: SnippetTab, settings: SandboxSettings): string {
  const config = stringifyConfig(settings);

  switch (tab) {
    case 'vanilla':
      return `import { createTerminal } from '@pretend-terminal/core';
import '@pretend-terminal/core/styles.css';

const mount = document.querySelector('#terminal');
if (!mount) throw new Error('Missing #terminal mount element.');

createTerminal(mount, ${config});`;
    case 'react':
      return `import { PretendTerminal } from '@pretend-terminal/react';
import '@pretend-terminal/react/styles.css';

const config = ${config};

export function DemoTerminal() {
  return <PretendTerminal {...config} ariaLabel="Demo terminal" />;
}`;
    case 'json':
      return config;
    case 'css':
      return `.pt-terminal {
  --pt-background: ${settings.background};
  --pt-text: ${settings.text};
  --pt-accent: ${settings.accent};
  --pt-border: ${settings.border};
}`;
  }
}
