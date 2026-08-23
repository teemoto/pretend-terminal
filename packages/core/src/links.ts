/**
 * Returns whether a URL can be rendered as an interactive terminal link.
 *
 * Relative URLs, fragments, and query strings are accepted alongside the
 * explicitly supported browser protocols. Unsafe executable/data protocols
 * are intentionally rejected.
 */
export function isSafeLinkHref(href: string): boolean {
  try {
    const url = new URL(href, 'https://pretend-terminal.invalid');
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol);
  } catch {
    return false;
  }
}
