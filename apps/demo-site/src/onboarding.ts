import { BUILT_IN_THEMES, type TerminalConfig } from '@pretend-terminal/core';

const themeNames = Object.keys(BUILT_IN_THEMES).join(', ');

/** Commands that introduce the product without executing anything outside the browser. */
export const onboardingTerminalConfig = {
  prompt: 'teemo@pretend-terminal:~ $',
  height: '27rem',
  theme: 'nord',
  commands: [
    {
      name: 'about',
      description: 'Learn what Pretend Terminal is.',
      response: [
        {
          type: 'text',
          value:
            'Pretend Terminal is a configurable, browser-based terminal interface for websites.',
        },
        {
          type: 'muted',
          value: 'It is a simulation: it never runs a visitor command on your machine or a server.',
        },
      ],
    },
    {
      name: 'themes',
      description: 'See the bundled theme names.',
      response: { type: 'lines', lines: [`Nine bundled themes: ${themeNames}.`] },
    },
    {
      name: 'install',
      description: 'Show the package installation command.',
      response: {
        type: 'ascii',
        value: 'pnpm add @pretend-terminal/react\n# or: pnpm add @pretend-terminal/core',
      },
    },
    {
      name: 'examples',
      description: 'Open the documentation and examples.',
      response: {
        type: 'link',
        label: 'Read the Pretend Terminal README on GitHub',
        href: 'https://github.com/teemoto/pretend-terminal#readme',
        openInNewTab: true,
      },
    },
  ],
} satisfies TerminalConfig;
