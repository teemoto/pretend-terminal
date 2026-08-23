# Manual test plan

Use the local examples to verify Pretend Terminal as a visitor would. Start from the repository root.

## Setup

1. Run `corepack pnpm build` to rebuild both workspace packages.
2. In one terminal, run `corepack pnpm dev:vanilla`.
3. Open the localhost URL Vite prints, normally `http://localhost:5173`.
4. When finished, stop that server with `Ctrl+C`, then run `corepack pnpm dev:react` and open its printed URL.

## Vanilla example

1. Confirm the terminal has an Amber appearance, a Teemo prompt, and the input is focused.
2. Enter `help`. Confirm built-in and configured commands are listed.
3. Enter `about`, `projects`, `contact`, and `map`. Confirm lines, table, link, and ASCII output each render clearly.
4. Enter `status`. Confirm `Running…` appears briefly, then a green success message replaces it.
5. Enter an unconfigured command such as `dance`. Confirm the unknown-command message and the page event log both update.
6. Enter `about`, type a draft such as `hello`, then press Up and Down. Confirm Up recalls `about` and Down restores `hello`.
7. Type `a` and press Tab. Confirm completion choices appear. Type `ab` and press Tab; confirm it becomes `about`. Type `missing` and press Tab; focus should retain normal browser behavior because there is no match.
8. Press Ctrl+L on Windows/Linux or Cmd+L on macOS while the terminal input is focused. Confirm the transcript clears.
9. Click empty terminal space. Confirm the command input receives focus. Click the contact link and confirm it still behaves like a normal link.
10. Click each theme button. Confirm the theme changes. Refresh the page and confirm the last chosen named theme and command history restore.

## React example

1. Confirm the terminal renders in its custom dark-blue Teemo theme with rounded corners and a larger font.
2. Enter `help`, `about`, and `stack`. Confirm built-ins, line output, and the table render.
3. Enter `status`. Confirm the pending indicator appears, then the success output renders.
4. Enter an unconfigured command such as `dance`. Confirm the page event message reports the unknown command.
5. Repeat the history, Tab-completion, Ctrl/Cmd+L, and click-to-focus checks from vanilla steps 6–9.
6. Resize the browser below roughly 576px. Confirm the prompt/input layout remains readable and usable.
7. Use keyboard-only navigation: Tab to reach the input, type a command, then use Tab completion and Enter. Confirm the visible focus indicator is clear.

## Pass criteria

Both examples should run without browser-console errors. Commands must only produce configured or built-in output; neither example should execute a shell command or interpret text output as HTML.
