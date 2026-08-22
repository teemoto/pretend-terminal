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

  it('submits input, browses history, completes commands, and clears from the keyboard', async () => {
    const mount = document.createElement('div');
    const terminal = createTerminal(mount, {
      includeBuiltIns: false,
      commands: [
        { name: 'about', aliases: ['whoami'], response: { type: 'text', value: 'Captain Teemo.' } },
        { name: 'archive', response: { type: 'text', value: 'Archive.' } },
      ],
    });
    const input = mount.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!input) {
      throw new Error('Expected a terminal input.');
    }

    input.value = 'about';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
    expect(mount.textContent).toContain('Captain Teemo.');
    expect(input.value).toBe('');

    input.value = 'draft';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const up = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true });
    input.dispatchEvent(up);
    expect(up.defaultPrevented).toBe(true);
    expect(input.value).toBe('about');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(input.value).toBe('draft');

    input.value = 'a';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const ambiguousTab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(ambiguousTab);
    expect(ambiguousTab.defaultPrevented).toBe(true);
    expect(mount.querySelector('[data-pt-suggestions]')?.textContent).toBe('about  archive');

    input.value = 'wh';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(input.value).toBe('about');

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'l', ctrlKey: true, bubbles: true, cancelable: true }),
    );
    expect(mount.querySelector('[data-pt-output]')?.textContent).toBe('');

    terminal.destroy();
  });

  it('keeps native Tab behavior when the terminal has no completion match and focuses from the body', () => {
    const mount = document.createElement('div');
    document.body.append(mount);
    const terminal = createTerminal(mount, { includeBuiltIns: false });
    const root = mount.querySelector<HTMLElement>('[data-pt-root]');
    const input = mount.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!root || !input) {
      throw new Error('Expected a terminal root and input.');
    }

    root.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.activeElement).toBe(input);

    input.value = 'missing';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    input.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);

    terminal.destroy();
  });
});
