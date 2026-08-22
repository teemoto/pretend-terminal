import { describe, expect, it } from 'vitest';

import { CommandRegistryError, createCommandRegistry, normalizeCommand } from '../index.js';

describe('normalizeCommand', () => {
  it('trims outer whitespace and matches case-insensitively', () => {
    expect(normalizeCommand('  HeLp  ')).toBe('help');
  });

  it('preserves internal whitespace for exact v1 matching', () => {
    expect(normalizeCommand('kubectl  get pods')).toBe('kubectl  get pods');
  });
});

describe('createCommandRegistry', () => {
  it('registers built-ins in stable default order', () => {
    const registry = createCommandRegistry();

    expect(registry.commands.map((command) => command.name)).toEqual(['help', 'clear', 'history']);
    expect(registry.get('help')).toMatchObject({ source: 'built-in', builtIn: 'help' });
  });

  it('can omit all built-ins', () => {
    const registry = createCommandRegistry({ includeBuiltIns: false });

    expect(registry.commands).toEqual([]);
    expect(registry.get('help')).toBeUndefined();
  });

  it('lets a consumer command replace a built-in with the same canonical name', () => {
    const registry = createCommandRegistry({
      commands: [
        {
          name: 'help',
          description: 'Show a custom guide.',
          response: { type: 'text', value: 'Custom help.' },
        },
      ],
    });

    expect(registry.get(' HELP ')).toMatchObject({
      source: 'consumer',
      name: 'help',
      description: 'Show a custom guide.',
    });
    expect(registry.commands.filter((command) => command.name === 'help')).toHaveLength(1);
  });

  it('resolves configured aliases without losing display metadata', () => {
    const registry = createCommandRegistry({
      includeBuiltIns: false,
      commands: [
        {
          name: 'About Teemo',
          aliases: ['whoami', 'about'],
          response: { type: 'text', value: 'Captain Teemo on duty.' },
        },
      ],
    });

    expect(registry.get(' WHOAMI ')).toMatchObject({
      name: 'About Teemo',
      normalizedName: 'about teemo',
      aliases: ['whoami', 'about'],
    });
  });

  it('rejects blank keys and collisions across names and aliases', () => {
    expect(() =>
      createCommandRegistry({
        includeBuiltIns: false,
        commands: [{ name: '   ', response: { type: 'text', value: 'Nope.' } }],
      }),
    ).toThrow(new CommandRegistryError('Command name must not be empty.'));

    expect(() =>
      createCommandRegistry({
        commands: [
          { name: 'about', aliases: ['info'], response: { type: 'text', value: 'About.' } },
          { name: 'contact', aliases: ['INFO'], response: { type: 'text', value: 'Contact.' } },
        ],
      }),
    ).toThrow(new CommandRegistryError('Command key "info" for "contact" conflicts with "about".'));
  });

  it('rejects aliases that collide with an active built-in', () => {
    expect(() =>
      createCommandRegistry({
        commands: [
          { name: 'about', aliases: ['clear'], response: { type: 'text', value: 'About.' } },
        ],
      }),
    ).toThrow(new CommandRegistryError('Command key "clear" for "about" conflicts with "clear".'));
  });
});
