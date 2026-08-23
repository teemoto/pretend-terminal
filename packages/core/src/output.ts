import type { StyledOutput } from './types.js';

/** Creates the generic error response used when an application command fails. */
export function createCommandFailureOutput(): StyledOutput {
  return { type: 'error', value: 'Command failed. Please try again.' };
}
