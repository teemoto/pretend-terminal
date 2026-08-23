import {
  createBrowserStorageAdapter,
  createTerminalEngine,
  isSafeLinkHref,
  type TerminalConfig,
  type TerminalEngine,
  type TerminalEngineState,
  type TerminalOutputBlock,
  type TerminalTranscriptEntry,
} from '@pretend-terminal/core';
import { type CSSProperties, type ReactElement, useEffect, useRef, useState } from 'react';

/** Props for the React Pretend Terminal component. */
export interface PretendTerminalProps extends TerminalConfig {
  /** Additional class names applied to the terminal root. */
  readonly className?: string;
  /** Inline styles, including public `--pt-*` token overrides. */
  readonly style?: CSSProperties;
  /** Accessible name for the terminal region. */
  readonly ariaLabel?: string;
}

/** Renders a safe, configurable pseudo-terminal backed by the shared core engine. */
export function PretendTerminal({
  ariaLabel = 'Pretend terminal',
  className,
  style,
  ...config
}: PretendTerminalProps): ReactElement {
  const initialConfigRef = useRef<TerminalConfig | null>(null);
  if (!initialConfigRef.current) {
    initialConfigRef.current = config;
  }
  const initialConfig = initialConfigRef.current;
  const [engine, setEngine] = useState<TerminalEngine>(() => createTerminalEngine(initialConfig));
  const state = useTerminalState(engine);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const destroyTokenRef = useRef<{
    readonly engine: TerminalEngine;
    readonly token: object;
  } | null>(null);
  const hasHydratedStorageRef = useRef(false);

  useEffect(() => {
    const token = {};
    destroyTokenRef.current = { engine, token };

    return () => {
      void Promise.resolve().then(() => {
        const current = destroyTokenRef.current;
        if (current?.engine !== engine || current.token === token) {
          engine.destroy();
        }
      });
    };
  }, [engine]);

  useEffect(() => {
    if (hasHydratedStorageRef.current || initialConfig.storage?.enabled !== true) {
      return;
    }

    hasHydratedStorageRef.current = true;
    setEngine(createTerminalEngine(initialConfig, { storage: createBrowserStorageAdapter() }));
  }, [initialConfig]);

  useEffect(() => {
    if (initialConfig.height) {
      const root = rootRef.current;
      if (root) {
        root.scrollTop = root.scrollHeight;
      }
    } else {
      const output = outputRef.current;
      if (!output) {
        return;
      }
      output.scrollTop = output.scrollHeight;
    }
  }, [initialConfig.height, state.transcript.length]);

  useEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) {
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, [state.input]);

  return (
    <section
      ref={rootRef}
      className={['pt-terminal', className].filter(Boolean).join(' ')}
      data-pt-root=""
      data-pt-fixed-height={initialConfig.height ? '' : undefined}
      role="region"
      aria-label={ariaLabel}
      style={{ ...toThemeStyle(state), height: initialConfig.height, ...style }}
      onClick={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest('a, button, input, select, textarea')
        ) {
          return;
        }
        inputRef.current?.focus();
      }}
    >
      <div ref={outputRef} className="pt-output pt-output-log" data-pt-output="" aria-live="polite">
        {state.transcript.map((entry, index) => (
          <TranscriptEntry
            key={index}
            entry={entry}
            prompt={initialConfig.prompt ?? 'visitor@pretend-terminal:~ $'}
          />
        ))}
      </div>
      {state.completionSuggestions.length > 0 ? (
        <div className="pt-completion-suggestions" data-pt-suggestions="" aria-live="polite">
          {state.completionSuggestions.map((suggestion) => suggestion.name).join('  ')}
        </div>
      ) : null}
      {state.isExecuting ? (
        <div className="pt-pending" data-pt-pending="" role="status">
          Running…
        </div>
      ) : null}
      <label className="pt-input-row">
        <span className="pt-prompt">{initialConfig.prompt ?? 'visitor@pretend-terminal:~ $'}</span>
        <input
          ref={inputRef}
          className="pt-input"
          data-pt-input=""
          type="text"
          value={state.input}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Terminal command"
          onChange={(event) => engine.setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void engine.run(state.input);
              return;
            }
            if (event.key === 'ArrowUp' && state.history.length > 0) {
              event.preventDefault();
              engine.navigateHistory('previous');
              return;
            }
            if (event.key === 'ArrowDown' && state.history.length > 0) {
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
          }}
        />
      </label>
    </section>
  );
}

function useTerminalState(engine: TerminalEngine): TerminalEngineState {
  const [state, setState] = useState<TerminalEngineState>(() => engine.getState());

  useEffect(() => engine.subscribe(setState), [engine]);

  return state;
}

function TranscriptEntry({
  entry,
  prompt,
}: {
  readonly entry: TerminalTranscriptEntry;
  readonly prompt: string;
}): ReactElement {
  if (entry.kind === 'command') {
    return <div className="pt-command">{`${prompt} ${entry.value}`}</div>;
  }

  return <OutputBlock output={entry.output} />;
}

function OutputBlock({ output }: { readonly output: TerminalOutputBlock }): ReactElement {
  switch (output.type) {
    case 'text':
    case 'success':
    case 'error':
    case 'muted':
    case 'accent':
      return <div className={`pt-output pt-output-${output.type}`}>{output.value}</div>;
    case 'lines':
      return (
        <div className="pt-output pt-output-lines">
          {output.lines.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      );
    case 'table':
      return (
        <table className="pt-output pt-output-table">
          {output.headers ? (
            <thead>
              <tr>
                {output.headers.map((header) => (
                  <th key={header} scope="col">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {output.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, cellIndex) => (
                  <td key={cellIndex}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'link':
      if (!isSafeLinkHref(output.href)) {
        return <span className="pt-output pt-output-link">{output.label}</span>;
      }
      return (
        <a
          className="pt-output pt-output-link"
          href={output.href}
          target={output.openInNewTab ? '_blank' : undefined}
          rel={output.openInNewTab ? 'noopener noreferrer' : undefined}
        >
          {output.label}
        </a>
      );
    case 'ascii':
      return <pre className="pt-output pt-output-ascii">{output.value}</pre>;
  }
}

function toThemeStyle(state: TerminalEngineState): CSSProperties {
  return Object.fromEntries(
    Object.entries(state.theme.tokens).map(([token, value]) => [
      `--pt-theme-${toKebabCase(token)}`,
      value,
    ]),
  ) as CSSProperties;
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
