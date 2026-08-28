import type { BuiltInThemeName } from '@pretend-terminal/core';
import { PretendTerminal } from '@pretend-terminal/react';
import { createRoot } from 'react-dom/client';
import { type CSSProperties, useEffect, useState } from 'react';

import '@pretend-terminal/react/styles.css';
import {
  applySiteAppearance,
  readSiteAppearance,
  resolveAppearance,
  type SiteAppearance,
  writeSiteAppearance,
} from './appearance.js';
import { onboardingTerminalConfig } from './onboarding.js';
import {
  applyBuiltInTheme,
  createSandboxTerminalConfig,
  defaultSandboxSettings,
  type SandboxSettings,
} from './sandbox.js';
import { createThemeCardStyle, themeGalleryItems } from './theme-gallery.js';
import { createSnippet, snippetTabLabels, snippetTabs, type SnippetTab } from './snippets.js';
import { createFeatureDemoConfig } from './feature-demo.js';
import './style.css';

const appearanceOptions = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
] as const satisfies readonly { readonly value: SiteAppearance; readonly label: string }[];

function App() {
  const [appearance, setAppearance] = useState<SiteAppearance>(readSiteAppearance);
  const [sandbox, setSandbox] = useState<SandboxSettings>(defaultSandboxSettings);
  const [activeSnippet, setActiveSnippet] = useState<SnippetTab>('react');
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => applySiteAppearance(resolveAppearance(appearance, media.matches));

    apply();
    if (appearance !== 'system') {
      return;
    }

    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [appearance]);

  const chooseAppearance = (nextAppearance: SiteAppearance) => {
    setAppearance(nextAppearance);
    writeSiteAppearance(nextAppearance);
  };

  const sandboxConfig = createSandboxTerminalConfig(sandbox);
  const sandboxStyle = {
    '--pt-background': sandbox.background,
    '--pt-text': sandbox.text,
    '--pt-accent': sandbox.accent,
    '--pt-border': sandbox.border,
  } as CSSProperties;

  const selectGalleryTheme = (theme: BuiltInThemeName) => {
    setSandbox((current) => applyBuiltInTheme(current, theme));
  };

  const moveGalleryFocus = (theme: BuiltInThemeName, direction: -1 | 1) => {
    const currentIndex = themeGalleryItems.findIndex((item) => item.name === theme);
    const nextIndex =
      (currentIndex + direction + themeGalleryItems.length) % themeGalleryItems.length;
    const nextTheme = themeGalleryItems[nextIndex].name;
    selectGalleryTheme(nextTheme);
    document.querySelector<HTMLButtonElement>(`#theme-card-${nextTheme}`)?.focus();
  };

  const activeSnippetValue = createSnippet(activeSnippet, sandbox);
  const featureDemoConfig = createFeatureDemoConfig();

  const copyActiveSnippet = async () => {
    if (!navigator.clipboard) {
      setCopyFeedback('Copy is unavailable in this browser.');
      return;
    }

    try {
      await navigator.clipboard.writeText(activeSnippetValue);
      setCopyFeedback(`${snippetTabLabels[activeSnippet]} snippet copied.`);
    } catch {
      setCopyFeedback('Could not copy the snippet. Select and copy it manually.');
    }
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Pretend Terminal home">
          pretend-terminal
        </a>
        <nav aria-label="Main navigation">
          <a href="#try-it">Try it</a>
          <a href="#learn">How it works</a>
          <a href="#sandbox">Sandbox</a>
          <a href="#agents">For agents</a>
          <a href="https://github.com/teemoto/pretend-terminal" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
        <fieldset className="appearance-switcher">
          <legend className="visually-hidden">Site appearance</legend>
          {appearanceOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={appearance === option.value ? 'is-selected' : undefined}
              aria-label={option.label}
              aria-pressed={appearance === option.value}
              data-tooltip={option.label}
              title={option.label}
              onClick={() => chooseAppearance(option.value)}
            >
              <AppearanceIcon appearance={option.value} />
            </button>
          ))}
        </fieldset>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">Open-source pseudo-terminal for the web</p>
            <h1 id="hero-title">A terminal feel for your site. None of the shell.</h1>
            <p className="hero-intro">
              Pretend Terminal gives React and plain JavaScript sites a configurable, safe terminal
              interface visitors can explore.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#try-it">
                Try the terminal
              </a>
              <a
                className="button button-secondary"
                href="https://www.npmjs.com/package/@pretend-terminal/react"
                target="_blank"
                rel="noreferrer"
              >
                View on npm
              </a>
            </div>
            <ul className="product-facts" aria-label="Product highlights">
              <li>Browser-only simulation</li>
              <li>React and plain JavaScript</li>
              <li>Nine bundled themes</li>
            </ul>
          </div>
        </section>

        <section className="terminal-section" id="try-it" aria-labelledby="try-it-title">
          <div className="section-heading">
            <p className="eyebrow">Live onboarding</p>
            <h2 id="try-it-title">Meet your guide, Teemo.</h2>
            <p>
              Start with <code>help</code>, then ask about the project, themes, installation, or
              examples. Every response comes from a consumer-defined command configuration.
            </p>
          </div>
          <div className="terminal-layout">
            <PretendTerminal
              {...onboardingTerminalConfig}
              ariaLabel="Teemo's Pretend Terminal onboarding demo"
              className="onboarding-terminal"
            />
            <aside className="terminal-guide" aria-label="Terminal demo guidance">
              <p className="guide-label">Try these commands</p>
              <ul>
                <li>
                  <code>help</code>
                </li>
                <li>
                  <code>about</code>
                </li>
                <li>
                  <code>themes</code>
                </li>
                <li>
                  <code>install</code>
                </li>
                <li>
                  <code>agents</code>
                </li>
              </ul>
              <p>
                This is deliberately a pseudo-terminal. It renders only the commands its owner
                configures; it cannot execute shell commands.
              </p>
            </aside>
          </div>
        </section>

        <section className="value-section" id="learn" aria-labelledby="learn-title">
          <div className="section-heading">
            <p className="eyebrow">Built for product teams</p>
            <h2 id="learn-title">An interactive surface you still control.</h2>
          </div>
          <div className="value-grid">
            <article>
              <h3>Configurable</h3>
              <p>Define commands and structured responses in JSON-friendly configuration.</p>
            </article>
            <article>
              <h3>Safe by design</h3>
              <p>
                No shell access, raw HTML, or implicit remote execution is built into the library.
              </p>
            </article>
            <article>
              <h3>Easy to style</h3>
              <p>Start from a bundled theme or override public CSS tokens for your own brand.</p>
            </article>
          </div>
        </section>

        <section className="sandbox-section" id="sandbox" aria-labelledby="sandbox-title">
          <div className="section-heading">
            <p className="eyebrow">Configuration sandbox</p>
            <h2 id="sandbox-title">Tune the terminal without writing code.</h2>
            <p>
              These controls represent a small, safe subset of the public configuration API. Your
              changes stay in this browser tab and never evaluate as JavaScript or HTML.
            </p>
          </div>
          <div className="sandbox-layout">
            <form className="sandbox-controls" onSubmit={(event) => event.preventDefault()}>
              <label>
                Prompt
                <input
                  type="text"
                  value={sandbox.prompt}
                  maxLength={60}
                  onChange={(event) =>
                    setSandbox((current) => ({
                      ...current,
                      prompt: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Theme
                <select
                  value={sandbox.theme}
                  onChange={(event) => {
                    const theme = event.target.value as BuiltInThemeName;
                    setSandbox((current) => applyBuiltInTheme(current, theme));
                  }}
                >
                  <option value="default">Default</option>
                  <option value="dracula">Dracula</option>
                  <option value="matrix">Matrix</option>
                  <option value="amber">Amber</option>
                  <option value="light">Light</option>
                  <option value="nord">Nord</option>
                  <option value="tokyo-night">Tokyo Night</option>
                  <option value="solarized-light">Solarized Light</option>
                  <option value="github-light">GitHub Light</option>
                </select>
              </label>
              <label className="checkbox-control">
                <input
                  type="checkbox"
                  checked={sandbox.includeBuiltIns}
                  onChange={(event) =>
                    setSandbox((current) => ({ ...current, includeBuiltIns: event.target.checked }))
                  }
                />
                <span className="built-in-command-list">
                  Enable <code>help</code>, <code>clear</code>, and <code>history</code>
                </span>
              </label>
              <label className="checkbox-control">
                <input
                  type="checkbox"
                  checked={sandbox.persistHistory}
                  onChange={(event) =>
                    setSandbox((current) => ({ ...current, persistHistory: event.target.checked }))
                  }
                />
                Remember command history on this device
              </label>
              <p className="field-note">
                History uses the demo-only key <code>pretend-terminal-demo:sandbox-v1</code>.
              </p>
              <fieldset className="token-controls">
                <legend>CSS token overrides</legend>
                {(
                  [
                    ['background', 'Background'],
                    ['text', 'Text'],
                    ['accent', 'Accent'],
                    ['border', 'Border'],
                  ] as const
                ).map(([token, label]) => (
                  <label key={token}>
                    {label}
                    <input
                      type="color"
                      value={sandbox[token]}
                      onChange={(event) =>
                        setSandbox((current) => ({ ...current, [token]: event.target.value }))
                      }
                    />
                  </label>
                ))}
              </fieldset>
            </form>
            <div className="sandbox-preview">
              <p className="guide-label">Live preview</p>
              <PretendTerminal
                key={JSON.stringify(sandboxConfig)}
                {...sandboxConfig}
                style={sandboxStyle}
                ariaLabel="Configurable Pretend Terminal sandbox preview"
              />
              <p className="field-note">
                Try <code>showcase</code>. Built-in commands appear only when enabled above.
              </p>
            </div>
          </div>
        </section>

        <section className="theme-gallery-section" id="themes" aria-labelledby="themes-title">
          <div className="section-heading">
            <p className="eyebrow">Bundled themes</p>
            <h2 id="themes-title">Nine palettes. One consistent terminal.</h2>
            <p>
              Select a theme to apply it to the sandbox. Every card uses a representative
              transcript, so you can assess text, muted output, links, and status colors together.
            </p>
          </div>
          <div className="theme-gallery" role="radiogroup" aria-label="Bundled terminal themes">
            {themeGalleryItems.map((item) => {
              const selected = sandbox.theme === item.name;
              return (
                <button
                  id={`theme-card-${item.name}`}
                  key={item.name}
                  type="button"
                  className={selected ? 'theme-card is-selected' : 'theme-card'}
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${item.label} theme${selected ? ', selected' : ''}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectGalleryTheme(item.name)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                      event.preventDefault();
                      moveGalleryFocus(item.name, 1);
                    }
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                      event.preventDefault();
                      moveGalleryFocus(item.name, -1);
                    }
                    if (event.key === 'Home') {
                      event.preventDefault();
                      const firstTheme = themeGalleryItems[0].name;
                      selectGalleryTheme(firstTheme);
                      document.querySelector<HTMLButtonElement>('#theme-card-default')?.focus();
                    }
                    if (event.key === 'End') {
                      event.preventDefault();
                      const lastTheme = themeGalleryItems.at(-1)?.name;
                      if (lastTheme) {
                        selectGalleryTheme(lastTheme);
                        document
                          .querySelector<HTMLButtonElement>(`#theme-card-${lastTheme}`)
                          ?.focus();
                      }
                    }
                  }}
                >
                  <span className="theme-card-name">
                    {item.label}
                    {selected ? <span className="theme-card-selected">Selected</span> : null}
                  </span>
                  <span className="theme-card-terminal" style={createThemeCardStyle(item.name)}>
                    <span>
                      <strong>teemo</strong>@site:~ $ showcase
                    </span>
                    <span className="theme-card-muted">Structured and configurable.</span>
                    <span className="theme-card-success">✓ Safe browser simulation</span>
                    <span className="theme-card-error">Controlled error output</span>
                    <span className="theme-card-link">Read the docs ↗</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="snippets-section" id="snippets" aria-labelledby="snippets-title">
          <div className="section-heading">
            <p className="eyebrow">Integration snippets</p>
            <h2 id="snippets-title">Take your configuration with you.</h2>
            <p>
              These snippets reflect the supported sandbox settings. JSON can express static
              commands and structured output, but not dynamic JavaScript handlers.
            </p>
          </div>
          <div className="snippet-panel">
            <div className="snippet-tabs" role="tablist" aria-label="Integration snippet format">
              {snippetTabs.map((tab) => (
                <button
                  id={`snippet-tab-${tab}`}
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeSnippet === tab}
                  aria-controls={`snippet-panel-${tab}`}
                  className={activeSnippet === tab ? 'is-selected' : undefined}
                  onClick={() => {
                    setActiveSnippet(tab);
                    setCopyFeedback('');
                  }}
                >
                  {snippetTabLabels[tab]}
                </button>
              ))}
            </div>
            <div
              id={`snippet-panel-${activeSnippet}`}
              role="tabpanel"
              aria-labelledby={`snippet-tab-${activeSnippet}`}
              tabIndex={0}
            >
              <pre className="snippet-code">
                <code>{activeSnippetValue}</code>
              </pre>
            </div>
            <div className="snippet-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => void copyActiveSnippet()}
              >
                Copy snippet
              </button>
              <p className="copy-feedback" role="status" aria-live="polite">
                {copyFeedback}
              </p>
            </div>
          </div>
        </section>

        <section className="agent-guidance-section" id="agents" aria-labelledby="agents-title">
          <div className="section-heading">
            <p className="eyebrow">For people and coding agents</p>
            <h2 id="agents-title">Give your implementation a reliable starting point.</h2>
            <p>
              The guide covers the correct renderer, stylesheet, JSON-friendly configuration, and
              browser-only safety boundary. The concise <code>llms.txt</code> file helps an agent
              find that guidance and the full reference quickly.
            </p>
          </div>
          <div className="agent-guidance-links">
            <a
              className="agent-guidance-card"
              href="https://github.com/teemoto/pretend-terminal/blob/main/docs/INTEGRATION_GUIDE.md"
              target="_blank"
              rel="noreferrer"
            >
              <span className="guide-label">Start here</span>
              <strong>Integration guide ↗</strong>
              <span>
                Copy-paste React and vanilla setup, styling, persistence, and safety notes.
              </span>
            </a>
            <a
              className="agent-guidance-card"
              href="https://github.com/teemoto/pretend-terminal/blob/main/llms.txt"
              target="_blank"
              rel="noreferrer"
            >
              <span className="guide-label">Quick map</span>
              <strong>llms.txt ↗</strong>
              <span>
                Compact links to the guide, API reference, examples, npm packages, and demo.
              </span>
            </a>
          </div>
        </section>

        <section className="features-section" id="features" aria-labelledby="features-title">
          <div className="section-heading">
            <p className="eyebrow">Interaction features</p>
            <h2 id="features-title">Familiar terminal controls, clearly explained.</h2>
            <p>
              Pretend Terminal keeps a real text input and predictable keyboard behavior, while the
              commands themselves stay under the site owner's control.
            </p>
          </div>
          <div className="features-layout">
            <div className="keyboard-guide" aria-labelledby="keyboard-guide-title">
              <h3 id="keyboard-guide-title">Keyboard guide</h3>
              <dl>
                <div>
                  <dt>
                    <kbd>↑</kbd> <kbd>↓</kbd>
                  </dt>
                  <dd>Move through submitted command history.</dd>
                </div>
                <div>
                  <dt>
                    <kbd>Tab</kbd>
                  </dt>
                  <dd>Complete a configured command or show matching choices.</dd>
                </div>
                <div>
                  <dt>
                    <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>L</kbd>
                  </dt>
                  <dd>Clear visible output while retaining command history.</dd>
                </div>
              </dl>
              <p className="field-note">
                Click a terminal’s empty space to focus its input. Output is announced politely to
                assistive technology.
              </p>
            </div>
            <div className="feature-terminal-demo">
              <p className="guide-label">Try live behavior</p>
              <PretendTerminal
                {...featureDemoConfig}
                ariaLabel="Pretend Terminal interaction feature demonstration"
              />
              <p className="field-note">
                Run <code>status</code> to see the pending state and a safe async result. Run{' '}
                <code>mishap</code> to see the friendly error output; internal details are not
                shown.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>MIT licensed and free to use.</span>
        <a href="https://github.com/teemoto/pretend-terminal" target="_blank" rel="noreferrer">
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}

function AppearanceIcon({ appearance }: { readonly appearance: SiteAppearance }) {
  if (appearance === 'dark') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M20.4 15.1A8.3 8.3 0 0 1 8.9 3.6 8.3 8.3 0 1 0 20.4 15.1Z" />
      </svg>
    );
  }

  if (appearance === 'light') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="13" rx="1.5" />
      <path d="M8 21h8m-4-4v4" />
    </svg>
  );
}

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('The demo site is missing its React root.');
}

createRoot(rootElement).render(<App />);
