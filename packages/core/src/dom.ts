import { createTerminalEngine, type TerminalEngine, type TerminalRunResult } from './engine.js';
import { createBrowserStorageAdapter } from './storage.js';
import type { TerminalConfig } from './types.js';
import type { TerminalThemeInput } from './themes.js';

/** Vanilla-JS configuration for an accessible mounted terminal. */
export interface TerminalDomConfig extends TerminalConfig {
  /** Accessible name for the terminal region. */
  readonly ariaLabel?: string;
}

/** Imperative API returned from `createTerminal`. */
export interface MountedTerminal {
  run(input: string): Promise<TerminalRunResult>;
  clear(): void;
  focus(): void;
  setTheme(theme: TerminalThemeInput): void;
  destroy(): void;
}

/** Thrown when a vanilla terminal cannot be mounted into the supplied target. */
export class TerminalMountError extends Error {
  override readonly name = 'TerminalMountError';
}

/** Mounts a safely rendered Pretend Terminal into an existing element. */
export function createTerminal(element: Element, config: TerminalDomConfig = {}): MountedTerminal {
  if (!element || element.nodeType !== 1 || !element.ownerDocument) {
    throw new TerminalMountError('createTerminal requires an element mount target.');
  }

  const document = element.ownerDocument;
  const root = document.createElement('section');
  root.className = ['pt-terminal', config.className].filter(Boolean).join(' ');
  root.dataset.ptRoot = '';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', config.ariaLabel ?? 'Pretend terminal');

  const output = document.createElement('div');
  output.className = 'pt-output pt-output-log';
  output.dataset.ptOutput = '';
  output.setAttribute('aria-live', 'polite');

  const suggestions = document.createElement('div');
  suggestions.className = 'pt-completion-suggestions';
  suggestions.dataset.ptSuggestions = '';
  suggestions.setAttribute('aria-live', 'polite');

  const pending = document.createElement('div');
  pending.className = 'pt-pending';
  pending.dataset.ptPending = '';
  pending.setAttribute('role', 'status');

  const inputRow = document.createElement('label');
  inputRow.className = 'pt-input-row';
  const prompt = document.createElement('span');
  prompt.className = 'pt-prompt';
  prompt.textContent = config.prompt ?? 'visitor@pretend-terminal:~ $';
  const input = document.createElement('input');
  input.className = 'pt-input';
  input.dataset.ptInput = '';
  input.type = 'text';
  input.autocomplete = 'off';
  input.autocapitalize = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Terminal command');
  inputRow.append(prompt, input);
  root.append(output, suggestions, pending, inputRow);
  element.append(root);

  const engine = createTerminalEngine(config, {
    storage: config.storage?.enabled ? createBrowserStorageAdapter() : undefined,
  });
  let renderedTranscriptLength = -1;
  const unsubscribe = engine.subscribe((state) => {
    for (const [token, value] of Object.entries(state.theme.tokens)) {
      root.style.setProperty(`--pt-theme-${toKebabCase(token)}`, value);
    }

    output.replaceChildren(
      ...state.transcript.map((entry) =>
        renderTranscriptEntry(document, entry, prompt.textContent ?? ''),
      ),
    );
    input.value = state.input;
    if (document.activeElement === input) {
      input.setSelectionRange(input.value.length, input.value.length);
    }
    suggestions.textContent = state.completionSuggestions
      .map((suggestion) => suggestion.name)
      .join('  ');
    pending.textContent = state.isExecuting ? 'Running…' : '';
    root.toggleAttribute('data-pt-executing', state.isExecuting);

    if (renderedTranscriptLength !== state.transcript.length) {
      renderedTranscriptLength = state.transcript.length;
      output.scrollTop = output.scrollHeight;
    }
  });
  let destroyed = false;

  function onInput(): void {
    engine.setInput(input.value);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      void engine.run(input.value);
      return;
    }

    if (event.key === 'ArrowUp' && engine.getState().history.length > 0) {
      event.preventDefault();
      engine.navigateHistory('previous');
      return;
    }

    if (event.key === 'ArrowDown' && engine.getState().history.length > 0) {
      event.preventDefault();
      engine.navigateHistory('next');
      return;
    }

    if (event.key === 'Tab') {
      const completion = engine.complete();
      if (completion.status !== 'none') {
        event.preventDefault();
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
      event.preventDefault();
      engine.clear();
    }
  }

  function onRootClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('a, button, input, select, textarea')) {
      return;
    }

    input.focus();
  }

  input.addEventListener('input', onInput);
  input.addEventListener('keydown', onKeyDown);
  root.addEventListener('click', onRootClick);

  function assertActive(): void {
    if (destroyed) {
      throw new TerminalMountError('The terminal has been destroyed.');
    }
  }

  return {
    run(inputValue) {
      assertActive();
      return engine.run(inputValue);
    },
    clear() {
      assertActive();
      engine.clear();
    },
    focus() {
      assertActive();
      input.focus();
    },
    setTheme(theme) {
      assertActive();
      engine.setTheme(theme);
    },
    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      input.removeEventListener('input', onInput);
      input.removeEventListener('keydown', onKeyDown);
      root.removeEventListener('click', onRootClick);
      unsubscribe();
      engine.destroy();
      root.remove();
    },
  };
}

function renderTranscriptEntry(
  document: Document,
  entry: ReturnType<TerminalEngine['getState']>['transcript'][number],
  prompt: string,
): HTMLElement {
  if (entry.kind === 'command') {
    const echo = document.createElement('div');
    echo.className = 'pt-command';
    echo.textContent = `${prompt} ${entry.value}`;
    return echo;
  }

  const { output } = entry;
  switch (output.type) {
    case 'text':
    case 'success':
    case 'error':
    case 'muted':
    case 'accent': {
      const text = document.createElement('div');
      text.className = `pt-output pt-output-${output.type}`;
      text.textContent = output.value;
      return text;
    }
    case 'lines': {
      const lines = document.createElement('div');
      lines.className = 'pt-output pt-output-lines';
      for (const line of output.lines) {
        const item = document.createElement('div');
        item.textContent = line;
        lines.append(item);
      }
      return lines;
    }
    case 'table': {
      const table = document.createElement('table');
      table.className = 'pt-output pt-output-table';
      if (output.headers) {
        const head = document.createElement('thead');
        const row = document.createElement('tr');
        for (const header of output.headers) {
          const cell = document.createElement('th');
          cell.scope = 'col';
          cell.textContent = header;
          row.append(cell);
        }
        head.append(row);
        table.append(head);
      }
      const body = document.createElement('tbody');
      for (const values of output.rows) {
        const row = document.createElement('tr');
        for (const value of values) {
          const cell = document.createElement('td');
          cell.textContent = value;
          row.append(cell);
        }
        body.append(row);
      }
      table.append(body);
      return table;
    }
    case 'link': {
      const link = document.createElement('a');
      link.className = 'pt-output pt-output-link';
      link.href = output.href;
      link.textContent = output.label;
      if (output.openInNewTab) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      return link;
    }
    case 'ascii': {
      const ascii = document.createElement('pre');
      ascii.className = 'pt-output pt-output-ascii';
      ascii.textContent = output.value;
      return ascii;
    }
  }
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
