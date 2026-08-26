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
11. Click each theme button (`default`, `dracula`, `matrix`, `amber`, and `light`) while the showcase output is visible. Confirm normal, muted, accent/link, success, error, and prompt text remain readable in every theme.
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
10. Enter `showcase`, then click each theme button (`default`, `dracula`, `matrix`, `amber`, and `light`). Confirm normal, muted, accent/link, success, error, prompt, table, and ASCII output remain readable in every theme.

## Pass criteria

Both examples should run without browser-console errors. Commands must only produce configured or built-in output; neither example should execute a shell command or interpret text output as HTML.
