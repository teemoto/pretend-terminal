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

    await act(async () => {
      input.value = 'about';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

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
});
