// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { createTerminal, createTerminalStorageKey, TerminalMountError } from '../index.js';

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

    const root = mount.querySelector('[data-pt-root]');
    const output = mount.querySelector('[data-pt-output]');
    const input = mount.querySelector('[data-pt-input]');
    expect(root?.getAttribute('role')).toBe('region');
    expect(root?.getAttribute('aria-label')).toBe('Teemo terminal');
    expect(output?.getAttribute('role')).toBe('log');
    expect(output?.getAttribute('aria-label')).toBe('Terminal output');
    expect(output?.getAttribute('aria-live')).toBe('polite');
    expect(output?.getAttribute('aria-relevant')).toBe('additions text');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input?.getAttribute('aria-label')).toBe('Terminal command');
    expect(mount.textContent).toContain('teemo@portfolio:~ $ about');
    expect(mount.textContent).toContain('Captain Teemo on duty.');

    terminal.destroy();
  });

  it('appends new transcript entries without replacing earlier log content', async () => {
    const mount = document.createElement('div');
    const terminal = createTerminal(mount, {
      includeBuiltIns: false,
      commands: [
        { name: 'about', response: { type: 'text', value: 'Captain Teemo on duty.' } },
        { name: 'status', response: { type: 'success', value: 'Scout status: ready.' } },
      ],
    });

    await terminal.run('about');
    const firstCommand = mount.querySelector('.pt-command');
    await terminal.run('status');

    expect(mount.querySelector('.pt-command')).toBe(firstCommand);
    expect(mount.textContent).toContain('Captain Teemo on duty.');
    expect(mount.textContent).toContain('Scout status: ready.');

    terminal.destroy();
  });

  it('places command echoes and safe errors in the accessible output log', async () => {
    const mount = document.createElement('div');
    const terminal = createTerminal(mount, {
      includeBuiltIns: false,
      prompt: 'teemo@portfolio:~ $',
    });

    await terminal.run('dance');

    const output = mount.querySelector('[data-pt-output]');
    expect(output?.textContent).toContain('teemo@portfolio:~ $ dance');
    expect(output?.textContent).toContain(
      'Command not found: dance. Type help for available commands.',
    );

    terminal.destroy();
  });

  it('keeps the command input focused after rendering a response', async () => {
    const mount = document.createElement('div');
    document.body.append(mount);
    const terminal = createTerminal(mount, {
      includeBuiltIns: false,
      commands: [{ name: 'about', response: { type: 'text', value: 'Captain Teemo on duty.' } }],
    });
    const input = mount.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!input) {
      throw new Error('Expected a terminal input.');
    }

    input.focus();
    input.value = 'about';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );

    expect(document.activeElement).toBe(input);
    expect(mount.textContent).toContain('Captain Teemo on duty.');

    terminal.destroy();
    mount.remove();
  });

  it('uses the terminal as the scrolling container when a fixed height is configured', async () => {
    const mount = document.createElement('div');
    const terminal = createTerminal(mount, { height: '28rem' });
    const root = mount.querySelector<HTMLElement>('[data-pt-root]');
    if (!root) {
      throw new Error('Expected a terminal root.');
    }

    expect(root.style.height).toBe('28rem');
    expect(root.hasAttribute('data-pt-fixed-height')).toBe(true);
    Object.defineProperty(root, 'scrollHeight', { configurable: true, value: 400 });

    await terminal.run('help');
    expect(root.scrollTop).toBe(400);

    terminal.destroy();
  });

  it('switches the mounted theme without replacing the terminal or clearing its transcript', async () => {
    const mount = document.createElement('div');
    const terminal = createTerminal(mount, {
      includeBuiltIns: false,
      commands: [{ name: 'about', response: { type: 'text', value: 'Captain Teemo on duty.' } }],
    });
    const root = mount.querySelector<HTMLElement>('[data-pt-root]');
    if (!root) {
      throw new Error('Expected a terminal root.');
    }

    await terminal.run('about');
    terminal.setTheme('matrix');

    expect(mount.querySelector('[data-pt-root]')).toBe(root);
    expect(mount.querySelectorAll('[data-pt-root]')).toHaveLength(1);
    expect(root.style.getPropertyValue('--pt-theme-background')).toBe('#020a02');
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

  it('renders hostile command and output text without creating markup', async () => {
    const payload = '<img src=x onerror=alert(1)>';
    const mount = document.createElement('div');
    const terminal = createTerminal(mount, {
      includeBuiltIns: false,
      commands: [
        {
          name: 'showcase',
          response: [
            { type: 'text', value: payload },
            { type: 'lines', lines: [payload] },
            { type: 'success', value: payload },
            { type: 'error', value: payload },
            { type: 'muted', value: payload },
            { type: 'accent', value: payload },
            { type: 'table', headers: [payload], rows: [[payload]] },
            { type: 'link', label: payload, href: 'https://example.com/teemo' },
            { type: 'ascii', value: payload },
          ],
        },
      ],
    });

    await terminal.run('showcase');
    await terminal.run(payload);

    expect(mount.querySelector('img, script')).toBeNull();
    expect(mount.textContent).toContain(payload);

    terminal.destroy();
  });

  it('renders allowed links with safe browser semantics and leaves unsafe URLs non-interactive', async () => {
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
            { type: 'link', label: 'Teemo home', href: '/teemo' },
            { type: 'link', label: 'Unsafe profile', href: 'javascript:alert(1)' },
            { type: 'table', headers: ['Role'], rows: [['Scout']] },
            { type: 'ascii', value: '(^.^)' },
          ],
        },
      ],
    });

    await terminal.run('profile');

    const links = mount.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0]?.getAttribute('target')).toBe('_blank');
    expect(links[0]?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(links[1]?.getAttribute('target')).toBeNull();
    expect(links[1]?.getAttribute('rel')).toBeNull();
    expect(mount.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(mount.textContent).toContain('Unsafe profile');
    expect(mount.querySelector('th')?.textContent).toBe('Role');
    expect(mount.querySelector('pre')?.textContent).toBe('(^.^)');

    terminal.destroy();
  });

  it('replaces pending async work with a safe error when a handler rejects', async () => {
    let rejectStatus: ((reason?: unknown) => void) | undefined;
    const mount = document.createElement('div');
    const terminal = createTerminal(mount, {
      includeBuiltIns: false,
      commands: [
        {
          name: 'status',
          handler: () =>
            new Promise<never>((_resolve, reject) => {
              rejectStatus = reject;
            }),
        },
      ],
    });

    const running = terminal.run('status');
    expect(mount.querySelector('[data-pt-pending]')?.textContent).toBe('Running…');

    rejectStatus?.(new Error('secret implementation detail'));
    await expect(running).resolves.toMatchObject({ status: 'executed' });

    expect(mount.querySelector('[data-pt-pending]')?.textContent).toBe('');
    expect(mount.textContent).toContain('Command failed. Please try again.');
    expect(mount.textContent).not.toContain('secret implementation detail');

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

  it('can be repeatedly destroyed and recreated without retaining a prior transcript', async () => {
    const mount = document.createElement('div');
    const sibling = document.createElement('p');
    sibling.textContent = 'Keep me';
    mount.append(sibling);

    for (const response of ['First scout report.', 'Second scout report.', 'Final scout report.']) {
      const terminal = createTerminal(mount, {
        includeBuiltIns: false,
        commands: [{ name: 'status', response: { type: 'text', value: response } }],
      });

      expect(mount.querySelectorAll('[data-pt-root]')).toHaveLength(1);
      await terminal.run('status');
      expect(mount.textContent).toContain(response);

      terminal.destroy();
      expect(mount.querySelector('[data-pt-root]')).toBeNull();
      expect(mount.contains(sibling)).toBe(true);
      expect(mount.textContent).not.toContain(response);
    }
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
    const suggestions = mount.querySelector<HTMLElement>('[data-pt-suggestions]');
    expect(suggestions?.textContent).toBe('about  archive');
    expect(suggestions?.getAttribute('role')).toBe('status');
    expect(suggestions?.getAttribute('aria-live')).toBe('polite');
    expect(input.getAttribute('aria-describedby')).toBe(suggestions?.id);

    input.value = 'wh';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(input.value).toBe('about');
    expect(input.hasAttribute('aria-describedby')).toBe(false);

    const controlClear = new KeyboardEvent('keydown', {
      key: 'l',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(controlClear);
    expect(controlClear.defaultPrevented).toBe(true);
    expect(mount.querySelector('[data-pt-output]')?.textContent).toBe('');

    input.value = 'about';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    const commandClear = new KeyboardEvent('keydown', {
      key: 'l',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(commandClear);
    expect(commandClear.defaultPrevented).toBe(true);
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

  it('keeps concurrent terminals and their persisted histories independent', async () => {
    const teemoStorageKey = 'teemo-dom-instance';
    const scoutStorageKey = 'scout-dom-instance';
    const teemoHistoryKey = createTerminalStorageKey(teemoStorageKey, 'history');
    const scoutHistoryKey = createTerminalStorageKey(scoutStorageKey, 'history');
    window.localStorage.removeItem(teemoHistoryKey);
    window.localStorage.removeItem(scoutHistoryKey);

    const teemoMount = document.createElement('div');
    const scoutMount = document.createElement('div');
    document.body.append(teemoMount, scoutMount);
    const teemoTerminal = createTerminal(teemoMount, {
      includeBuiltIns: false,
      storage: { enabled: true, key: teemoStorageKey, persistHistory: true },
      commands: [{ name: 'about', response: { type: 'text', value: 'Captain Teemo on duty.' } }],
    });
    const scoutTerminal = createTerminal(scoutMount, {
      includeBuiltIns: false,
      storage: { enabled: true, key: scoutStorageKey, persistHistory: true },
      commands: [{ name: 'status', response: { type: 'text', value: 'Scout status: ready.' } }],
    });

    await teemoTerminal.run('about');
    await scoutTerminal.run('status');

    expect(teemoMount.textContent).toContain('Captain Teemo on duty.');
    expect(teemoMount.textContent).not.toContain('Scout status: ready.');
    expect(scoutMount.textContent).toContain('Scout status: ready.');
    expect(scoutMount.textContent).not.toContain('Captain Teemo on duty.');
    expect(window.localStorage.getItem(teemoHistoryKey)).toBe(JSON.stringify(['about']));
    expect(window.localStorage.getItem(scoutHistoryKey)).toBe(JSON.stringify(['status']));

    teemoTerminal.destroy();
    scoutTerminal.destroy();
    teemoMount.remove();
    scoutMount.remove();
    window.localStorage.removeItem(teemoHistoryKey);
    window.localStorage.removeItem(scoutHistoryKey);
  });
});
