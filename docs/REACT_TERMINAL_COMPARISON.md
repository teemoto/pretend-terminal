# Comparison: Pretend Terminal and `react-terminal`

This is a source-level comparison of Pretend Terminal v1 with
[`bony2023/react-terminal`](https://github.com/bony2023/react-terminal). It is
intended to inform product decisions, not to rank either project. Both solve a
similar problem, but their APIs optimize for different kinds of consumers.

## Research snapshot

- **Pretend Terminal baseline:** repository commit `1d7828f` on 2026-08-24.
- **Upstream baseline:** `react-terminal` commit
  [`d92b26a`](https://github.com/bony2023/react-terminal/tree/d92b26a0d83af21ece02d6072576e701046c4229),
  inspected on 2026-08-24. Its manifest declares version `v1.4.5`.
- **Method:** compared the upstream [README](https://github.com/bony2023/react-terminal/blob/d92b26a0d83af21ece02d6072576e701046c4229/README.md),
  [component](https://github.com/bony2023/react-terminal/blob/d92b26a0d83af21ece02d6072576e701046c4229/src/components/Terminal.tsx),
  [input and execution hooks](https://github.com/bony2023/react-terminal/blob/d92b26a0d83af21ece02d6072576e701046c4229/src/hooks/editor.tsx),
  [state context](https://github.com/bony2023/react-terminal/blob/d92b26a0d83af21ece02d6072576e701046c4229/src/contexts/TerminalContext.tsx),
  [themes](https://github.com/bony2023/react-terminal/tree/d92b26a0d83af21ece02d6072576e701046c4229/src/themes),
  and integration tests. This is not a security audit or a claim about later upstream changes.

## Product shape

| Area               | Pretend Terminal v1                                                                       | `react-terminal`                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Packages           | Framework-neutral core/Vanilla API plus React adapter                                     | React component only                                                                           |
| Command model      | Typed command array; static JSON-compatible responses or application-owned handlers       | Object map; values can be strings, React nodes, or functions                                   |
| Output model       | Safe structured text, lines, status, tables, links, and ASCII                             | React content returned or passed directly; richer composition but application code owns safety |
| Command matching   | Case-insensitive, trimmed full-line command keys; aliases and generated `help`            | First token is the command; remaining text is passed as a joined argument string               |
| Styling            | Five presets, semantic tokens, public CSS variables, consumer class/style hooks           | Seven presets, custom theme object, component-specific CSS/Sass styling                        |
| State architecture | Headless engine with Vanilla and React renderers                                          | React contexts and hooks                                                                       |
| Persistence        | Optional, scoped `localStorage` for history and selected theme; SSR-aware React hydration | In-memory context history/transcript; README describes a provider for remount retention        |

## Feature matrix

| Capability                       | Shared                       | Pretend Terminal advantage / difference                                                                                | `react-terminal` advantage / difference                                                                              |
| -------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Configurable prompt and commands | Yes                          | Commands have descriptions, aliases, collision validation, and JSON support.                                           | Concise object-map API for small React apps.                                                                         |
| Sync and async command callbacks | Yes                          | One pending command per terminal is explicit; later submissions are preserved for retry.                               | Functions receive a single joined argument string after the command token.                                           |
| Unknown-command customization    | Yes                          | Static message override with `{command}` interpolation plus an `onUnknownCommand` callback.                            | `errorMessage` may be a value/function and `defaultHandler` can take over unmatched input.                           |
| Built-in `clear`                 | Yes                          | Also supplies configurable `help` and `history`; built-ins can be overridden or disabled.                              | `clear` is the documented built-in.                                                                                  |
| History navigation               | Yes                          | Bounded history, draft restoration, opt-in persistence, and renderer-neutral behavior.                                 | In-memory Arrow Up/Down history through React context.                                                               |
| Tab completion                   | Yes                          | Supports aliases, ambiguous suggestions, and accessible status announcements.                                          | Completes the first matching command; no suggestion list for ambiguity.                                              |
| Auto-scroll and click focus      | Yes                          | Uses a real input and fixed-height internal scrolling option.                                                          | Scrolls its editor and tracks whether clicks are inside the component.                                               |
| Theme presets and custom themes  | Yes                          | Semantic tokens, nine documented contrast-checked presets, and CSS-variable overrides.                                 | Seven presets (`light`, `dark`, Material variants, Matrix, Dracula) and a small custom theme object.                 |
| Mobile and clipboard use         | Broadly                      | Real input provides native browser keyboard/selection/paste behavior without user-agent branching.                     | Explicit mobile detection and direct clipboard read/write handling.                                                  |
| Welcome/initial content          | No                           | Can be modeled today as a command response, but has no first-class initial transcript option.                          | `welcomeMessage` accepts a string or React node before the prompt.                                                   |
| Visual terminal chrome           | No                           | Deliberately keeps v1 presentation lightweight and themeable.                                                          | Optional top control bar, control buttons/labels, caret visibility, and disabled input props.                        |
| Command arguments                | No (intentional v1 boundary) | Full-line keys avoid an underspecified shell parser.                                                                   | Splits on spaces and passes the remainder to handlers.                                                               |
| Remount state sharing            | Different                    | Explicit browser persistence and a headless engine are available.                                                      | Exports context/provider APIs intended for shared in-memory state.                                                   |
| Accessibility and SSR            | Different                    | Real labelled input, region/log/status semantics, live output, completion association, and SSR-safe storage hydration. | Source uses document-level key/mouse listeners and user-agent access; no comparable ARIA/SSR contract is documented. |

## Important implementation observations

### What Pretend Terminal intentionally does better for its stated v1

1. **A safe, portable core.** The headless engine lets Vanilla and React share
   matching, history, themes, persistence, and async behavior. `react-terminal`
   is React-only and puts those concerns in contexts/hooks.
2. **Declarative configuration without executable content.** Static commands
   can live in JSON and output is a discriminated, text-oriented model. This is
   more suitable for portfolios and documentation maintained by non-application
   developers. `react-terminal` accepts React nodes/HTML-shaped content, which
   is flexible but cannot be represented in JSON and moves trust decisions to
   the consumer.
3. **Accessible interaction rather than a visual imitation.** Pretend Terminal
   uses an actual input and named live regions. Upstream renders a custom caret
   and handles desktop keystrokes from a document listener; it uses an off-screen
   input only on detected mobile devices.
4. **Predictable configuration failures.** Pretend Terminal rejects duplicate
   command names/aliases and unknown named themes. Upstream silently falls back
   to its light theme when a selected theme is absent.
5. **Explicit persistence and asynchronous state.** Pretend Terminal scopes
   browser persistence behind an opt-in key and exposes a busy state. Upstream
   keeps session state in React context and awaits handlers, but does not expose
   a documented concurrency or storage contract.

### What `react-terminal` offers that Pretend Terminal does not

1. **An initial welcome message.** This is valuable for onboarding and
   portfolio storytelling before a visitor types anything.
2. **First-token command arguments and a fallback handler.** This makes a
   compact API such as `cd projects` easy. It also allows unmatched input to be
   handed to application code.
3. **Terminal-window presentation controls.** A control bar, decorative
   buttons, caret toggle, and read-only/disabled input are convenient for a
   macOS-terminal visual style or a display-only embed.
4. **More bundled visual presets.** Material and dark variants may help a
   consumer start quickly, though they do not expand the core interaction model.
5. **React-node output.** This supports arbitrary rich UI inline with terminal
   output, at the cost of leaving JSON portability and rendering safety behind.

## Recommendations for Pretend Terminal

| Priority                    | Candidate                                          | Recommendation                                                    | Reasoning                                                                                                                                                                                                                   |
| --------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High, post-v1               | `initialOutput` / welcome transcript               | **Adopt, but as `TerminalOutput`, not React nodes or raw HTML.**  | A first-class greeting improves onboarding, examples, and the future demo without weakening the structured-output or JSON story. It should be recorded as transcript output without command echo/history.                   |
| High, Phase 2               | Deliberate command-argument parser                 | **Adopt as a designed feature, not a quick split-on-space port.** | Upstream demonstrates the value of arguments, but simple splitting cannot represent quoting or escaping. This is already correctly deferred in the PRD; define a parser contract and handler context before implementation. |
| Medium, Phase 2             | Optional fallback handler                          | **Consider with a narrow API and strong docs.**                   | A `fallbackHandler({ rawInput, normalizedInput })` could enable search/navigation flows. It must remain application-owned, opt-in, and documented as potentially making network calls; JSON must stay static-only.          |
| Medium, post-v1             | Read-only/disabled input mode                      | **Adopt if demo or embedding use cases need it.**                 | This is a small, useful presentation state for a prefilled transcript or a completed guided experience. It should preserve transcript accessibility and not turn into a generic shell emulator.                             |
| Low, future renderer option | Decorative control bar                             | **Defer.**                                                        | It is presentation, not terminal behavior. If added, make it an optional renderer/chrome configuration with accessible semantics; do not bake platform-specific decoration into the core engine.                            |
| Low, future theme work      | Additional bundled themes                          | **Defer.**                                                        | Five accessible themes and token customization meet v1’s needs. Add presets only when users show demand, and run the same contrast audit.                                                                                   |
| Reject for the core API     | Raw HTML/React-node output                         | **Do not adopt.**                                                 | It conflicts with the safe structured output and JSON configuration requirements. A future React-only escape hatch would need a separate security and accessibility design, not a relaxed core type.                        |
| Reject as a default         | Global document key handling and UA-specific input | **Do not adopt.**                                                 | The real input approach is more native, scope-safe, and accessible. Native browser clipboard behavior is preferable to a bespoke clipboard requirement.                                                                     |

## One caution when borrowing upstream ideas

The upstream README recommends wrapping the app in `TerminalContextProvider` to
retain state across unmounts. The inspected `ReactTerminal` component also
creates its own context-provider tree internally, so that remount-persistence
claim should be independently verified before treating it as a pattern to copy.
Pretend Terminal should keep its current explicit persistence/engine ownership
model unless a future shared-engine React API has a tested lifecycle contract.

## Suggested next product decision

After the v1 release work is complete, add an issue or Phase 2 tracker item for
**structured initial output**. It is the most directly useful borrowed idea and
can be implemented without expanding Pretend Terminal into a rich-content or
shell-command library.
