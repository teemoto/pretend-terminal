import { expect, test, type Locator } from '@playwright/test';

type Example = {
  readonly name: string;
  readonly url: string;
  readonly aboutOutput: string;
  readonly statusOutput: string;
  readonly linkCommand: string;
  readonly linkHref: RegExp;
  readonly themeButton?: string;
};

const examples: readonly Example[] = [
  {
    name: 'Vanilla example',
    url: 'http://127.0.0.1:4173',
    aboutOutput: 'Teemo is a curious front-end developer.',
    statusOutput: 'All systems are ready.',
    linkCommand: 'contact',
    linkHref: /^mailto:teemo@example\.com$/,
    themeButton: 'Matrix',
  },
  {
    name: 'React example',
    url: 'http://127.0.0.1:4174',
    aboutOutput: 'Teemo is building a friendly portfolio experience.',
    statusOutput: 'React example is ready.',
    linkCommand: 'showcase',
    linkHref: /^https:\/\/example\.com\/teemo$/,
  },
];

for (const example of examples) {
  test(`${example.name} supports the v1 visitor command journey`, async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        browserErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => browserErrors.push(error.message));

    await page.goto(example.url);
    const root = page.locator('[data-pt-root]');
    const input = page.locator('[data-pt-input]');
    const output = page.locator('[data-pt-output]');

    await expect(root).toHaveAttribute('role', 'region');
    await expect(output).toHaveAttribute('role', 'log');
    await input.focus();
    await expect(input).toBeFocused();

    await runCommand(input, 'about');
    await expect(output).toContainText(example.aboutOutput);

    await input.fill('draft command');
    await input.press('ArrowUp');
    await expect(input).toHaveValue('about');
    await input.press('ArrowDown');
    await expect(input).toHaveValue('draft command');

    await input.fill('s');
    await input.press('Tab');
    await expect(page.locator('[data-pt-suggestions]')).toContainText('status');
    await expect(page.locator('[data-pt-suggestions]')).toContainText('showcase');

    await input.fill('abo');
    await input.press('Tab');
    await expect(input).toHaveValue('about');

    await input.fill('missing');
    await input.press('Tab');
    await expect(input).toHaveValue('missing');

    await input.press('Control+l');
    await expect(output).toBeEmpty();

    await runCommand(input, 'status');
    await expect(page.locator('[data-pt-pending]')).toContainText('Running…');
    await expect(output).toContainText(example.statusOutput);
    await expect
      .poll(async () => (await page.locator('[data-pt-pending]').allTextContents()).join(''))
      .toBe('');

    await runCommand(input, 'dance');
    await expect(output).toContainText(
      'Command not found: dance. Type help for available commands.',
    );

    await runCommand(input, example.linkCommand);
    await expect(output.locator('a').last()).toHaveAttribute('href', example.linkHref);

    if (example.themeButton) {
      await page.getByRole('button', { name: example.themeButton, exact: true }).click();
      await expect
        .poll(() =>
          root.evaluate((element) => element.style.getPropertyValue('--pt-theme-background')),
        )
        .toBe('#020a02');
    }

    await page.reload();
    const reloadedInput = page.locator('[data-pt-input]');
    await reloadedInput.press('ArrowUp');
    await expect(reloadedInput).toHaveValue(example.linkCommand);

    await page.setViewportSize({ width: 320, height: 720 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);

    expect(browserErrors).toEqual([]);
  });
}

async function runCommand(input: Locator, command: string): Promise<void> {
  await input.fill(command);
  await input.press('Enter');
}
