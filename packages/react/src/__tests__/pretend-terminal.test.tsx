// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it } from 'vitest';

import { PretendTerminal } from '../index.js';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

describe('PretendTerminal', () => {
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
      root.render(<PretendTerminal height="28rem" />);
    });

    const terminal = container.querySelector<HTMLElement>('[data-pt-root]');
    expect(terminal?.style.height).toBe('28rem');
    expect(terminal?.hasAttribute('data-pt-fixed-height')).toBe(true);

    await act(async () => root.unmount());
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

    await type(input, 'about');
    await press(input, 'Enter');
    expect(container.textContent).toContain('Captain Teemo.');
    expect(input.value).toBe('');

    await type(input, 'draft');
    await press(input, 'ArrowUp');
    expect(input.value).toBe('about');
    await press(input, 'ArrowDown');
    expect(input.value).toBe('draft');

    await type(input, 'a');
    const ambiguousTab = await press(input, 'Tab');
    expect(ambiguousTab.defaultPrevented).toBe(true);
    expect(container.querySelector('[data-pt-suggestions]')?.textContent).toBe('about  archive');

    await type(input, 'wh');
    await press(input, 'Tab');
    expect(input.value).toBe('about');

    await type(input, 'missing');
    const unmatchedTab = await press(input, 'Tab');
    expect(unmatchedTab.defaultPrevented).toBe(false);

    await press(input, 'l', { ctrlKey: true });
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
