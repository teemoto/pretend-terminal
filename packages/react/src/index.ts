import type { ReactElement } from 'react';

/** Props for the future Pretend Terminal React component. */
export type PretendTerminalProps = Record<string, never>;

/**
 * React entry point for Pretend Terminal.
 *
 * It is intentionally a placeholder until the shared core state model exists.
 */
export function PretendTerminal(props: PretendTerminalProps): ReactElement | null {
  void props;
  return null;
}
