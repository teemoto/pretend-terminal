# Manual test plan

Use the local examples to verify Pretend Terminal as a visitor would. Start from the repository root.

## Setup

1. Run `corepack pnpm build` to rebuild both workspace packages.
2. In one terminal, run `corepack pnpm dev:vanilla`.
3. Open the localhost URL Vite prints, normally `http://localhost:5173`.
4. When finished, stop that server with `Ctrl+C`, then run `corepack pnpm dev:react` and open its printed URL.

## Vanilla example

1. Confirm the terminal has an Amber appearance, a long Teemo prompt, no input outline after clicking it, and a fixed height.
2. Open `examples/vanilla/src/terminal.config.json` and confirm its static commands match the JSON-configured commands shown by `help`; the separately added `status` command is the JavaScript async example. Then enter `help`. Confirm built-in and configured commands are listed.
3. Enter `about`, `projects`, `contact`, and `map`. Confirm lines, table, link, and ASCII output each render clearly.
4. Enter `status`. Confirm `Running…` appears briefly, then a green success message replaces it.
5. Enter an unconfigured command such as `dance`. Confirm the unknown-command message and the page event log both update.
6. Enter `about`, type a draft such as `hello`, then press Up and Down. Confirm Up recalls `about` and Down restores `hello`.
7. Type `a` and press Tab. Confirm completion choices appear. Type `ab` and press Tab; confirm it becomes `about`. Type `missing` and press Tab; focus should retain normal browser behavior because there is no match.
8. Press Ctrl+L on Windows/Linux or Cmd+L on macOS while the terminal input is focused. Confirm the transcript clears.
9. Click empty terminal space. Confirm the command input receives focus. Click the contact link and confirm it still behaves like a normal link.
10. Enter `showcase`. Confirm long text wraps, muted/accent/success/error text remains readable, the table and link are usable, and ASCII art preserves its shape.
11. Click each theme button (`default`, `dracula`, `matrix`, `amber`, `light`, `nord`, `tokyo-night`, `solarized-light`, and `github-light`) while the showcase output is visible. Confirm normal, muted, accent/link, success, error, and prompt text remain readable in every theme.
12. Paste a deliberately long unknown command. Confirm its echoed command wraps cleanly without horizontal page overflow.
13. Resize the browser below roughly 576px. Confirm the long prompt, input, table, link, and ASCII output remain readable and usable.
14. Run enough commands to exceed the visible transcript area. Confirm the terminal height stays fixed and its output area scrolls to the latest entry.
15. Click a theme button after running commands. Confirm the terminal theme changes without clearing the transcript, then refresh the page and confirm the last chosen named theme and command history restore.

## React example

1. Confirm the terminal renders in the Default theme. Its Teemo class should also scope the larger font, rounded corners, and border override; it should have no input outline after clicking and a fixed height.
2. Enter `help`, `about`, and `stack`. Confirm built-ins, line output, and the table render.
3. Enter `status`. Confirm the pending indicator appears, then the success output renders.
4. Enter an unconfigured command such as `dance`. Confirm the page event message reports the unknown command.
5. Repeat the history, Tab-completion, Ctrl/Cmd+L, and click-to-focus checks from vanilla steps 6–9.
6. Resize the browser below roughly 576px. Confirm the prompt/input layout remains readable and usable.
7. Run enough commands to exceed the visible transcript area. Confirm the terminal height stays fixed and its output area scrolls to the latest entry.
8. Use keyboard-only navigation: Tab to reach the input, type a command, then use Tab completion and Enter. Confirm the input caret clearly shows where typing will occur.
9. Enter `about`, refresh the page, then press Up. Confirm the command history restores.
10. Enter `showcase`, then click each theme button (`default`, `dracula`, `matrix`, `amber`, `light`, `nord`, `tokyo-night`, `solarized-light`, and `github-light`). Confirm normal, muted, accent/link, success, error, prompt, table, and ASCII output remain readable in every theme.

## Pass criteria

Both examples should run without browser-console errors. Commands must only produce configured or built-in output; neither example should execute a shell command or interpret text output as HTML.

## Public demo site

1. From the repository root, run `corepack pnpm dev:demo` and open `http://localhost:5173/pretend-terminal/`.
2. Use only the keyboard to Tab through the header links and appearance icon buttons. Confirm each icon exposes a tooltip and clear accessible name on focus.
3. Choose Dark and Light, refresh after each, and confirm the selected site appearance persists. Choose System and confirm the site follows the operating-system preference instead. Confirm the terminal theme itself does not change with the site appearance.
4. In the Teemo onboarding terminal, run `help`, `about`, `themes`, `install`, `examples`, and `agents`. Confirm the safety boundary appears in both visible page copy and the `about` response, and that `agents` opens the integration guide in a new tab.
5. In the sandbox, change the prompt, choose several presets, change each color input, and toggle built-ins. Confirm the preview updates without a page reload and the `showcase` command still renders text, lines, statuses, a table, a link, and ASCII output.
6. Enable history persistence, enter `showcase`, refresh, and press Arrow Up in the preview. Confirm history restores. Disable it and confirm it no longer reads or writes the demo history key.
7. Select every theme card. Confirm each selected card shows text in addition to its visual selected state and updates the sandbox preset and editable colors. Use Arrow keys, Home, and End in the gallery to repeat the check without a mouse.
8. Inspect all nine cards for readable prompt, normal text, muted text, link, success, and error treatments. Repeat in both site appearance modes; the component palette should remain legible independently of surrounding chrome.
9. Change sandbox values and check Vanilla JS, React, JSON config, and CSS token snippets. Confirm the snippets change with the supported configuration, package names and stylesheet imports are correct, and JSON describes static configuration only.
10. Use the Copy snippet button. Confirm the status message announces success; if browser clipboard permission is unavailable, confirm it explains the manual-copy fallback.
11. In the For people and coding agents section, open both cards. Confirm the integration guide and `llms.txt` open on GitHub in a new tab and the card copy makes their distinct purposes clear.
12. In the Interaction features terminal, run `status` and observe `Running…` before its success output. Run `mishap` and confirm the generic friendly error does not include the demo’s internal failure detail.
13. Verify Arrow Up/Down, Tab completion, Ctrl/Cmd + L, click-to-focus, and the keyboard-guide descriptions in the Interaction features section.
14. Test at a narrow width of approximately 320px and a normal desktop width. Confirm no horizontal page scrolling, controls remain reachable, and terminals remain usable.
15. Enable `prefers-reduced-motion` in browser development tools or the operating system. Confirm the page does not rely on animation and transitions are effectively suppressed.
16. Confirm browser developer tools show no console errors or unsafe inline evaluation warnings during the preceding checks.
17. Run `corepack pnpm build`. Check `apps/demo-site/dist` contains static assets only and that its JavaScript contains no `workspace:` dependency references.

**Demo pass criteria:** The page is usable by keyboard at desktop and narrow widths, all visible commands are configured or built in, appearance and terminal themes remain independent, copied examples remain accurate, and production assets resolve under `/pretend-terminal/`.
