// @vitest-environment jsdom

import { act, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { createTerminalStorageKey } from '@pretend-terminal/core';

import { PretendTerminal, type PretendTerminalProps } from '../index.js';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

describe('PretendTerminal', () => {
  it('type-checks the README React usage snippet', () => {
    const props = {
      prompt: 'visitor@site:~ $',
      theme: 'matrix',
      commands: [
        {
          name: 'contact',
          description: 'Show contact details',
          response: { type: 'text', value: 'hello@example.com' },
        },
      ],
    } satisfies PretendTerminalProps;
    const snippet = <PretendTerminal {...props} />;

    expect(snippet.type).toBe(PretendTerminal);
  });

  it('renders a labelled real input and retains typed input through the shared engine', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<PretendTerminal ariaLabel="Teemo terminal" prompt="teemo@portfolio:~ $" />);
    });

    const terminal = container.querySelector('[data-pt-root]');
    const input = container.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!input) {
      throw new Error('Expected a terminal input.');
    }
    expect(terminal?.getAttribute('aria-label')).toBe('Teemo terminal');
    expect(terminal?.getAttribute('role')).toBe('region');
    expect(container.querySelector('[data-pt-output]')?.getAttribute('role')).toBe('log');
    expect(container.querySelector('[data-pt-output]')?.getAttribute('aria-label')).toBe(
      'Terminal output',
    );
    expect(container.querySelector('[data-pt-output]')?.getAttribute('aria-live')).toBe('polite');
    expect(container.querySelector('[data-pt-output]')?.getAttribute('aria-relevant')).toBe(
      'additions text',
    );
    expect(input.getAttribute('aria-label')).toBe('Terminal command');
    expect(input.value).toBe('');

    await type(input, 'about');

    expect(input.value).toBe('about');

    await act(async () => root.unmount());
  });

  it('applies resolved theme values without overwriting consumer public token overrides', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<PretendTerminal theme="matrix" style={{ '--pt-accent': '#9acd32' } as never} />);
    });

    const terminal = container.querySelector<HTMLElement>('[data-pt-root]');
    expect(terminal?.style.getPropertyValue('--pt-theme-background')).toBe('#020a02');
    expect(terminal?.style.getPropertyValue('--pt-accent')).toBe('#9acd32');

    await act(async () => root.unmount());
  });

  it('applies a configured fixed height to contain a scrolling transcript', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PretendTerminal
          height="28rem"
          includeBuiltIns={false}
          commands={[{ name: 'about', response: { type: 'text', value: 'Captain Teemo.' } }]}
        />,
      );
    });

    const terminal = container.querySelector<HTMLElement>('[data-pt-root]');
    const input = container.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!terminal || !input) {
      throw new Error('Expected a terminal root and input.');
    }
    expect(terminal.style.height).toBe('28rem');
    expect(terminal.hasAttribute('data-pt-fixed-height')).toBe(true);
    Object.defineProperty(terminal, 'scrollHeight', { configurable: true, value: 400 });

    await type(input, 'about');
    await press(input, 'Enter');
    expect(terminal.scrollTop).toBe(400);

    await act(async () => root.unmount());
  });

  it('renders hostile command and output text without creating markup', async () => {
    const payload = '<img src=x onerror=alert(1)>';
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PretendTerminal
          includeBuiltIns={false}
          commands={[
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
          ]}
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!input) {
      throw new Error('Expected a terminal input.');
    }
    await type(input, 'showcase');
    await press(input, 'Enter');
    await type(input, payload);
    await press(input, 'Enter');

    expect(container.querySelector('img, script')).toBeNull();
    expect(container.textContent).toContain(payload);

    await act(async () => root.unmount());
  });

  it('renders safe links as anchors and leaves unsafe URLs non-interactive', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PretendTerminal
          includeBuiltIns={false}
          commands={[
            {
              name: 'links',
              response: [
                {
                  type: 'link',
                  label: 'Teemo profile',
                  href: 'https://example.com/teemo',
                  openInNewTab: true,
                },
                { type: 'link', label: 'Teemo home', href: '/teemo' },
                { type: 'link', label: 'Unsafe profile', href: 'javascript:alert(1)' },
              ],
            },
          ]}
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!input) {
      throw new Error('Expected a terminal input.');
    }
    await type(input, 'links');
    await press(input, 'Enter');

    const links = container.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0]?.getAttribute('target')).toBe('_blank');
    expect(links[0]?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(links[1]?.getAttribute('target')).toBeNull();
    expect(links[1]?.getAttribute('rel')).toBeNull();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(container.textContent).toContain('Unsafe profile');

    await act(async () => root.unmount());
  });

  it('hydrates opt-in history and theme persistence only after client mount', async () => {
    const storageKey = 'teemo-react-hydration';
    window.localStorage.setItem(
      createTerminalStorageKey(storageKey, 'history'),
      JSON.stringify(['about']),
    );
    window.localStorage.setItem(
      createTerminalStorageKey(storageKey, 'theme'),
      JSON.stringify('matrix'),
    );
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PretendTerminal
          includeBuiltIns={false}
          theme="dracula"
          storage={{ enabled: true, key: storageKey, persistHistory: true, persistTheme: true }}
          commands={[{ name: 'about', response: { type: 'text', value: 'Captain Teemo.' } }]}
        />,
      );
    });

    const terminal = container.querySelector<HTMLElement>('[data-pt-root]');
    const input = container.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!terminal || !input) {
      throw new Error('Expected a terminal root and input.');
    }
    expect(terminal.style.getPropertyValue('--pt-theme-background')).toBe('#020a02');

    await press(input, 'ArrowUp');
    expect(input.value).toBe('about');

    await act(async () => root.unmount());
    window.localStorage.removeItem(createTerminalStorageKey(storageKey, 'history'));
    window.localStorage.removeItem(createTerminalStorageKey(storageKey, 'theme'));
  });

  it('does not read persisted storage while server rendering', () => {
    const storageKey = 'teemo-react-server';
    window.localStorage.setItem(
      createTerminalStorageKey(storageKey, 'theme'),
      JSON.stringify('matrix'),
    );

    const markup = renderToString(
      <PretendTerminal
        theme="dracula"
        storage={{ enabled: true, key: storageKey, persistTheme: true }}
      />,
    );

    expect(markup).toContain('--pt-theme-background:#282a36');
    expect(markup).not.toContain('--pt-theme-background:#020a02');
    window.localStorage.removeItem(createTerminalStorageKey(storageKey, 'theme'));
  });

  it('submits, browses history, completes, and clears through familiar keyboard controls', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PretendTerminal
          includeBuiltIns={false}
          commands={[
            {
              name: 'about',
              aliases: ['whoami'],
              response: { type: 'text', value: 'Captain Teemo.' },
            },
            { name: 'archive', response: { type: 'text', value: 'Archive.' } },
          ]}
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!input) {
      throw new Error('Expected a terminal input.');
    }

    input.focus();
    await type(input, 'about');
    await press(input, 'Enter');
    expect(container.textContent).toContain('Captain Teemo.');
    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);

    await type(input, 'draft');
    await press(input, 'ArrowUp');
    expect(input.value).toBe('about');
    await press(input, 'ArrowDown');
    expect(input.value).toBe('draft');

    await type(input, 'a');
    const ambiguousTab = await press(input, 'Tab');
    expect(ambiguousTab.defaultPrevented).toBe(true);
    const suggestions = container.querySelector<HTMLElement>('[data-pt-suggestions]');
    expect(suggestions?.textContent).toBe('about  archive');
    expect(suggestions?.getAttribute('role')).toBe('status');
    expect(suggestions?.getAttribute('aria-live')).toBe('polite');
    expect(input.getAttribute('aria-describedby')).toBe(suggestions?.id);

    await type(input, 'wh');
    await press(input, 'Tab');
    expect(input.value).toBe('about');
    expect(input.hasAttribute('aria-describedby')).toBe(false);

    await type(input, 'missing');
    const unmatchedTab = await press(input, 'Tab');
    expect(unmatchedTab.defaultPrevented).toBe(false);

    const controlClear = await press(input, 'l', { ctrlKey: true });
    expect(controlClear.defaultPrevented).toBe(true);
    expect(container.querySelector('[data-pt-output]')?.textContent).toBe('');

    await type(input, 'about');
    await press(input, 'Enter');
    const commandClear = await press(input, 'l', { metaKey: true });
    expect(commandClear.defaultPrevented).toBe(true);
    expect(container.querySelector('[data-pt-output]')?.textContent).toBe('');

    input.blur();
    const terminal = container.querySelector<HTMLElement>('[data-pt-root]');
    await act(async () => terminal?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(document.activeElement).toBe(input);

    await act(async () => root.unmount());
  });

  it('shows pending work for an async handler and safely renders its output', async () => {
    let resolveStatus: ((value: { type: 'success'; value: string }) => void) | undefined;
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PretendTerminal
          includeBuiltIns={false}
          commands={[
            {
              name: 'status',
              handler: () =>
                new Promise((resolve) => {
                  resolveStatus = resolve;
                }),
            },
          ]}
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!input) {
      throw new Error('Expected a terminal input.');
    }
    await type(input, 'status');
    await press(input, 'Enter');
    expect(container.querySelector('[data-pt-pending]')?.textContent).toBe('Running…');

    await act(async () => resolveStatus?.({ type: 'success', value: 'Ready.' }));
    expect(container.textContent).toContain('Ready.');
    expect(container.querySelector('[data-pt-pending]')).toBeNull();

    await act(async () => root.unmount());
  });

  it('replaces rejected async work with a safe error', async () => {
    let rejectStatus: ((reason?: unknown) => void) | undefined;
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PretendTerminal
          includeBuiltIns={false}
          commands={[
            {
              name: 'status',
              handler: () =>
                new Promise<never>((_resolve, reject) => {
                  rejectStatus = reject;
                }),
            },
          ]}
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!input) {
      throw new Error('Expected a terminal input.');
    }
    await type(input, 'status');
    await press(input, 'Enter');
    expect(container.querySelector('[data-pt-pending]')?.textContent).toBe('Running…');

    await act(async () => {
      rejectStatus?.(new Error('secret implementation detail'));
      await Promise.resolve();
    });
    expect(container.querySelector('[data-pt-pending]')).toBeNull();
    expect(container.textContent).toContain('Command failed. Please try again.');
    expect(container.textContent).not.toContain('secret implementation detail');

    await act(async () => root.unmount());
  });

  it('continues to run exactly once under React Strict Mode and cleans up after unmount', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <StrictMode>
          <PretendTerminal
            includeBuiltIns={false}
            commands={[{ name: 'about', response: { type: 'text', value: 'Captain Teemo.' } }]}
          />
        </StrictMode>,
      );
    });

    const input = container.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!input) {
      throw new Error('Expected a terminal input.');
    }
    await type(input, 'about');
    await press(input, 'Enter');
    expect(container.textContent?.match(/Captain Teemo\./g)).toHaveLength(1);

    await act(async () => root.unmount());
  });

  it('can be removed and recreated without retaining a prior transcript', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PretendTerminal
          includeBuiltIns={false}
          commands={[{ name: 'about', response: { type: 'text', value: 'First scout report.' } }]}
        />,
      );
    });
    const firstInput = container.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!firstInput) {
      throw new Error('Expected a terminal input.');
    }
    await type(firstInput, 'about');
    await press(firstInput, 'Enter');
    expect(container.textContent).toContain('First scout report.');

    await act(async () => root.render(null));
    expect(container.querySelector('[data-pt-root]')).toBeNull();

    await act(async () => {
      root.render(
        <PretendTerminal
          includeBuiltIns={false}
          commands={[{ name: 'status', response: { type: 'text', value: 'Fresh scout report.' } }]}
        />,
      );
    });
    const secondInput = container.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!secondInput) {
      throw new Error('Expected a terminal input.');
    }
    expect(container.textContent).not.toContain('First scout report.');
    await type(secondInput, 'status');
    await press(secondInput, 'Enter');
    expect(container.textContent).toContain('Fresh scout report.');

    await act(async () => root.unmount());
  });

  it('invokes command callbacks once with the submitted input', async () => {
    const onCommand = vi.fn();
    const onUnknownCommand = vi.fn();
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <PretendTerminal
          includeBuiltIns={false}
          commands={[{ name: 'about', response: { type: 'text', value: 'Captain Teemo.' } }]}
          onCommand={onCommand}
          onUnknownCommand={onUnknownCommand}
        />,
      );
    });

    const input = container.querySelector<HTMLInputElement>('[data-pt-input]');
    if (!input) {
      throw new Error('Expected a terminal input.');
    }
    await type(input, 'about');
    await press(input, 'Enter');
    await type(input, 'dance');
    await press(input, 'Enter');

    expect(onCommand).toHaveBeenCalledTimes(2);
    expect(onCommand).toHaveBeenNthCalledWith(1, 'about');
    expect(onCommand).toHaveBeenNthCalledWith(2, 'dance');
    expect(onUnknownCommand).toHaveBeenCalledTimes(1);
    expect(onUnknownCommand).toHaveBeenCalledWith('dance');
    expect(container.querySelector('[data-pt-output]')?.textContent).toContain(
      'visitor@pretend-terminal:~ $ dance',
    );
    expect(container.querySelector('[data-pt-output]')?.textContent).toContain(
      'Command not found: dance. Type help for available commands.',
    );

    await act(async () => root.unmount());
  });
});

async function type(input: HTMLInputElement, value: string): Promise<void> {
  await act(async () => {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!setValue) {
      throw new Error('Expected the native input value setter.');
    }
    setValue.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function press(
  input: HTMLInputElement,
  key: string,
  options: KeyboardEventInit = {},
): Promise<KeyboardEvent> {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
  await act(async () => input.dispatchEvent(event));
  return event;
}
