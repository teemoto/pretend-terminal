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
  output.className = 'pt-output';
  output.dataset.ptOutput = '';
  output.setAttribute('aria-live', 'polite');

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
  root.append(output, inputRow);
  element.append(root);

  const engine = createTerminalEngine(config, {
    storage: config.storage?.enabled ? createBrowserStorageAdapter() : undefined,
  });
  const unsubscribe = engine.subscribe((state) => {
    for (const [token, value] of Object.entries(state.theme.tokens)) {
      root.style.setProperty(`--pt-${toKebabCase(token)}`, value);
    }

    output.replaceChildren(
      ...state.transcript.map((entry) =>
        renderTranscriptEntry(document, entry, prompt.textContent ?? ''),
      ),
    );
    input.value = state.input;
  });
  let destroyed = false;

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
