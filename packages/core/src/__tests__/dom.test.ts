// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { createTerminal, TerminalMountError } from '../index.js';

describe('createTerminal', () => {
  it('mounts a labelled terminal and renders command output through its imperative API', async () => {
    const mount = document.createElement('div');
    document.body.append(mount);
    const terminal = createTerminal(mount, {
      ariaLabel: 'Teemo terminal',
      prompt: 'teemo@portfolio:~ $',
      commands: [{ name: 'about', response: { type: 'text', value: 'Captain Teemo on duty.' } }],
    });

    await terminal.run('about');

    expect(mount.querySelector('[data-pt-root]')?.getAttribute('aria-label')).toBe(
      'Teemo terminal',
    );
    expect(mount.querySelector('[data-pt-input]')).toBeInstanceOf(HTMLInputElement);
    expect(mount.textContent).toContain('teemo@portfolio:~ $ about');
    expect(mount.textContent).toContain('Captain Teemo on duty.');

    terminal.destroy();
  });

  it('renders configured text as text rather than HTML', async () => {
    const mount = document.createElement('div');
    const terminal = createTerminal(mount, {
      includeBuiltIns: false,
      commands: [
        { name: 'about', response: { type: 'text', value: '<img src=x onerror=alert(1)>' } },
      ],
    });

    await terminal.run('about');

    expect(mount.querySelector('img')).toBeNull();
    expect(mount.textContent).toContain('<img src=x onerror=alert(1)>');

    terminal.destroy();
  });

  it('renders links and tables with safe browser semantics', async () => {
    const mount = document.createElement('div');
    const terminal = createTerminal(mount, {
      includeBuiltIns: false,
      commands: [
        {
          name: 'profile',
          response: [
            {
              type: 'link',
              label: 'Teemo profile',
              href: 'https://example.com/teemo',
              openInNewTab: true,
            },
            { type: 'table', headers: ['Role'], rows: [['Scout']] },
            { type: 'ascii', value: '(^.^)' },
          ],
        },
      ],
    });

    await terminal.run('profile');

    expect(mount.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(mount.querySelector('th')?.textContent).toBe('Role');
    expect(mount.querySelector('pre')?.textContent).toBe('(^.^)');

    terminal.destroy();
  });

  it('removes only its own root and rejects use after destroy', () => {
    const mount = document.createElement('div');
    const sibling = document.createElement('p');
    sibling.textContent = 'Keep me';
    mount.append(sibling);
    const terminal = createTerminal(mount);

    terminal.destroy();

    expect(mount.contains(sibling)).toBe(true);
    expect(mount.querySelector('[data-pt-root]')).toBeNull();
    expect(() => terminal.clear()).toThrow(
      new TerminalMountError('The terminal has been destroyed.'),
    );
  });
});
