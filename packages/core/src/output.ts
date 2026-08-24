import type { StyledOutput } from './types.js';

const DEFAULT_UNKNOWN_COMMAND_MESSAGE =
  'Command not found: {command}. Type help for available commands.';

/** Creates the generic error response used when an application command fails. */
export function createCommandFailureOutput(): StyledOutput {
  return { type: 'error', value: 'Command failed. Please try again.' };
}

/** Creates the safe response used when a submitted command has no match. */
export function createUnknownCommandOutput(
  command: string,
  messageTemplate?: string,
): StyledOutput {
  return {
    type: 'error',
    value: (messageTemplate ?? DEFAULT_UNKNOWN_COMMAND_MESSAGE).replaceAll('{command}', command),
  };
}
