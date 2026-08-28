import { PretendTerminal } from '@pretend-terminal/react';
import { createRoot } from 'react-dom/client';

import '@pretend-terminal/react/styles.css';
import { onboardingTerminalConfig } from './onboarding.js';
import './style.css';

function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Pretend Terminal home">
          pretend-terminal
        </a>
        <nav aria-label="Main navigation">
          <a href="#try-it">Try it</a>
          <a href="#learn">How it works</a>
          <a href="https://github.com/teemoto/pretend-terminal" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
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

const rootElement = document.querySelector('#root');

if (!rootElement) {
  throw new Error('The demo site is missing its React root.');
}

createRoot(rootElement).render(<App />);
