# Pretend Terminal — Demo Site Product Requirements Document

**Status:** Approved planning scope  
**Launch target:** GitHub Pages at `https://teemoto.github.io/pretend-terminal/`  
**Future migration:** Dedicated custom domain after the site is polished

## 1. Product summary

The Pretend Terminal demo site is a focused, public single-page product experience. It introduces the library, lets visitors use the component immediately, demonstrates its configuration model and nine built-in themes, and produces copyable integration snippets.

It is not a hosted terminal service or a generic code playground. Every interaction remains a safe, browser-only pseudo-terminal experience.

The site lives in the Pretend Terminal repository, but consumes the released npm packages as an external user would. That constraint makes it both the public showcase and a practical integration/regression environment.

## 2. Goals

- Let a first-time visitor understand Pretend Terminal within one screenful: a safe, configurable terminal UI for websites.
- Let visitors try a polished terminal immediately, with approachable Teemo-led commands.
- Demonstrate the core user-facing features without requiring visitors to read source code first.
- Let visitors explore a safe subset of terminal configuration and copy working Vanilla, React, JSON, and CSS examples.
- Present every bundled theme in an accessible gallery.
- Deploy a fast, static, free site to GitHub Pages first, without blocking a later custom-domain migration.
- Use the published packages rather than workspace source or private implementation APIs.

## 3. Non-goals

- A multi-page documentation portal, blog, or portfolio case study. Those remain in the package README and Tanvir’s portfolio.
- Arbitrary JavaScript execution, remotely fetched configuration, user accounts, saved public sandboxes, analytics, or a backend.
- A full visual builder for every terminal API option.
- A hosted shell, filesystem simulation, or any command execution beyond the package’s author-configured pseudo-terminal behavior.
- A custom domain during the initial launch.

## 4. Audience

### Evaluating developers

They arrive from npm, GitHub, or Tanvir’s portfolio and want to answer: “What is this, how does it feel, and can I use it?”

### Potential adopters

They want a starting configuration, a compatible framework example, and confidence that the library is safe and styled predictably.

### Existing users

They want a quick visual reference for themes, keyboard behavior, output primitives, and configuration patterns.

## 5. Experience and information architecture

The site is a responsive single page with anchored navigation. The intended reading order is:

1. **Hero and live terminal** — concise value proposition, install/source links, and a working terminal with `help`, `about`, `themes`, `install`, and `examples` commands.
2. **Why Pretend Terminal** — safe simulation, configuration-first setup, framework-neutral core, and accessible interaction.
3. **Configuration sandbox** — controls beside a live preview.
4. **Theme gallery** — all nine themes, with an immediately visible preview and a way to select one for the sandbox.
5. **Generated snippets** — Vanilla JavaScript, React, JSON, and CSS-variable tabs that follow the sandbox’s supported settings.
6. **Feature demonstrations** — concise examples of history navigation, Tab completion, async output, error output, and keyboard accessibility.
7. **Footer** — npm, GitHub, README/API documentation, changelog, issue reporting, and contribution links.

Each section must work independently when linked through an anchor and retain understandable context on narrow screens.

## 6. Visual and interaction direction

The site should feel terminal-native but refined: strong typography, calm layout, considered spacing, and restrained motion. It must not make the entire product look like a retro hacker simulation; the terminal components and theme gallery provide that character where appropriate.

### Site appearance switcher

- Provide `System`, `Dark`, and `Light` appearance modes for the site chrome.
- Default to the visitor’s `prefers-color-scheme` setting.
- Persist an explicit visitor choice in browser storage under a site-specific key.
- Apply the saved mode before meaningful content is painted where practical, avoiding a distracting flash.
- The site appearance is independent of the terminal theme selected in the gallery or sandbox.
- The control exposes its state and available choices accessibly and works with keyboard navigation.

### Motion and responsiveness

- Respect `prefers-reduced-motion`.
- Use no autoplaying terminal typing effect.
- Keep terminal previews usable at small widths; controls may stack rather than forcing horizontal page scrolling.

## 7. Functional requirements

### 7.1 Live onboarding terminal

- Mount a React `PretendTerminal` from the published package.
- Use Teemo as the illustrative identity and approachable, explanatory command responses.
- Provide discoverable commands through `help`; no visitor needs prior terminal knowledge.
- Include links to npm and GitHub in both the surrounding UI and terminal output where useful.
- Make the safety boundary clear: the terminal only runs configuration supplied by the site.

### 7.2 Configuration sandbox

The sandbox controls a deliberately small, safe subset of public configuration:

- Prompt text.
- Bundled theme selection.
- Built-in command enablement for `help`, `clear`, and `history`.
- Optional history persistence demonstration with an explanatory label.
- A small set of static command/output examples covering text, lines, status messages, table, link, and ASCII output.
- CSS-token overrides for at least background, text, accent, and border.

The preview updates without page navigation. Invalid user-entered values must fall back safely or show clear local validation; the sandbox never evaluates text as JavaScript or HTML.

### 7.3 Theme gallery

- Show `default`, `dracula`, `matrix`, `amber`, `light`, `nord`, `tokyo-night`, `solarized-light`, and `github-light`.
- Each theme card shows a compact, representative transcript rather than a color swatch alone.
- Selecting a card updates the larger preview and generated snippets.
- Provide visible selected state and readable labels; do not convey selection through color only.
- Keep normal text, muted text, prompt segments, links, success, error, tables, and focus indicators legible.

### 7.4 Generated integration snippets

- Offer four tabs: Vanilla JavaScript, React, JSON configuration, and CSS variables.
- Generate snippets only from sandbox settings that can be represented accurately in each format.
- Clearly explain that dynamic handlers cannot be represented in JSON.
- Keep examples short, syntactically valid, and aligned with the published package API.
- Provide a copy button with an accessible copied/failure message.
- Do not claim a copied snippet is a complete application when it requires a mount element, a framework project, or stylesheet import.

### 7.5 Feature demonstrations

- Explain and demonstrate Arrow Up/Down history, Tab completion, and Ctrl/Cmd + L in a concise keyboard section.
- Include an async command with a visible pending state and successful result.
- Include an error-output example that demonstrates safe, friendly failures.
- Explain focus behavior and the accessible terminal labels/live feedback at a practical level.

## 8. Technical architecture

- Create a static Vite + React + TypeScript app at `apps/demo-site`.
- Add `apps/*` to the pnpm workspace when the app is scaffolded.
- Install versioned published npm dependencies for `@pretend-terminal/core` and `@pretend-terminal/react`; do not use `workspace:` protocol or import package source files.
- Use the React package for interactive terminal experiences. The generated Vanilla snippet remains a documented consumer example rather than a second renderer implementation inside the site.
- Keep site state local to the browser. Site appearance preference may use browser storage; no network service is needed.
- Use semantic HTML, CSS custom properties, and small focused React components. Avoid a heavy UI framework.
- Build as static assets compatible with GitHub Pages under the repository base path.

## 9. Deployment and release strategy

### Initial launch

- Deploy on pushes to `main` through a dedicated GitHub Actions workflow.
- Publish to GitHub Pages at `https://teemoto.github.io/pretend-terminal/`.
- Configure Vite’s base path correctly for the repository deployment path.
- Expose the deployment URL in the repository README and, later, as the primary Live demo destination in Tanvir’s portfolio project card.

### Package prerequisite

The four new themes must be released before demo-site implementation begins. The site must reference the released package version that includes all nine themes, then pass a production build using those installed artifacts.

### Future custom domain

After the design and content are polished, connect a dedicated domain or subdomain. The site must avoid hard-coded absolute GitHub Pages URLs except where they are explicitly presented as the initial launch address.

## 10. Accessibility and quality requirements

- Meet WCAG 2.2 AA intent for text contrast, focus visibility, semantic landmarks, form labels, and keyboard access.
- Verify all interaction without a mouse, including the site appearance switcher, sandbox, terminal input, theme gallery, tabs, and copy controls.
- Respect reduced-motion preferences.
- Test desktop and narrow mobile layouts without horizontal page overflow.
- Verify that generated snippets remain synchronized with the supported configuration controls.
- Confirm production artifacts have no private documentation, workspace source aliases, credentials, or unneeded dependencies.

## 11. Success criteria

- A new visitor can run `help` and understand the product’s safety boundary within one minute.
- A developer can select a theme, alter a prompt, copy a framework-appropriate snippet, and reach the relevant package docs without leaving the page unexpectedly.
- All nine themes are visibly demonstrated and selectable.
- The site works from the GitHub Pages URL and consumes published package artifacts.
- Light, dark, and system site appearance modes work, persist an explicit choice, and remain independent of terminal themes.
- Production build, lint, typecheck, and intent-focused interaction tests pass.

## 12. Follow-up integration with the portfolio

The site remains separate from `tanviraslam.com`. Once deployed, the Pretend Terminal project card should present both a primary Live demo link and a secondary GitHub source link. A deeper portfolio case-study page is intentionally deferred.
