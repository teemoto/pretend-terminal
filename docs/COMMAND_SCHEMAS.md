# v2 command schemas and command trees

This document defines the public model for #3 before it is wired into the terminal engine. The model is JSON-compatible by default and preserves existing v1 command configuration.

## Compatibility rule

Existing command names may contain spaces (for example, `About Teemo`). They remain valid v1 commands and are resolved as their complete configured name. A v2 command tree is an explicit `subcommands` relationship; whitespace alone never silently changes an existing command into a group.

## Declarative metadata

A runnable command may declare positional arguments and flags. A group declares `subcommands` and has no response or handler of its own.

```ts
{
  name: 'project',
  description: 'Work with projects',
  category: 'Workspace',
  subcommands: [
    {
      name: 'create',
      description: 'Create a project',
      arguments: [
        { name: 'name', required: true, description: 'Project name' },
      ],
      flags: [
        { name: 'visibility', values: ['private', 'public'], default: 'private' },
      ],
      response: { type: 'success', value: 'Project created.' },
    },
  ],
}
```

Arguments and string-valued flags support `required`, `default`, and an ordered `values` allowlist. Boolean flags support a boolean `default`. Unknown flags, missing required values, invalid allowlist values, and surplus positionals are visitor-safe validation errors; handlers do not run when validation fails.

## Resolution and visibility

Lookup uses the configured tree, preserving declaration order. At every level, canonical names and aliases are case-insensitive. A group/subcommand path wins only when it is an explicit configured relationship; otherwise remaining words stay positional arguments for a v1-compatible command.

Aliases can be marked `hidden`. Hidden aliases resolve normally but are omitted from generated help and normal completion. Commands can be marked `hidden` to omit them, together with their descendants, from default help.

## Generated help

The built-in `help` command accepts an optional command path. Every runnable command also recognizes `--help` before validation or execution. Help is structured output: a usage line followed by a table of description, positional arguments, flags, and direct subcommands where applicable. It never renders consumer-provided HTML.

## Handler context

Dynamic handlers retain `rawInput`, `normalizedInput`, and `commandName`. v2 adds the resolved command path, parsed command line, and validated named positional/flag values. These values are immutable snapshots and are supplied only after schema validation succeeds.
