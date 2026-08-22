/** Minimal storage contract shared by browser and test adapters. */
export interface TerminalStorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** Browser Storage-shaped object accepted by the safe adapter. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Version for the persisted Pretend Terminal record format. */
export const TERMINAL_STORAGE_VERSION = 1;

/** Persisted record names supported by v1. */
export type TerminalStorageRecordName = 'history' | 'theme';

/** Creates a versioned storage key scoped to one consumer-owned terminal key. */
export function createTerminalStorageKey(
  storageKey: string,
  record: TerminalStorageRecordName,
): string {
  return `${storageKey}:pretend-terminal:v${TERMINAL_STORAGE_VERSION}:${record}`;
}

/** Creates an ephemeral adapter used when browser storage is unavailable. */
export function createMemoryStorageAdapter(): TerminalStorageAdapter {
  const values = new Map<string, string>();

  return {
    get(key) {
      return values.get(key) ?? null;
    },
    set(key, value) {
      values.set(key, value);
    },
    remove(key) {
      values.delete(key);
    },
  };
}

/**
 * Wraps a browser-like storage object so privacy, quota, and security errors
 * fall back to an in-memory store instead of interrupting terminal behavior.
 */
export function createSafeStorageAdapter(storage?: StorageLike): TerminalStorageAdapter {
  const fallback = createMemoryStorageAdapter();

  if (!storage) {
    return fallback;
  }

  return {
    get(key) {
      try {
        return storage.getItem(key);
      } catch {
        return fallback.get(key);
      }
    },
    set(key, value) {
      try {
        storage.setItem(key, value);
      } catch {
        fallback.set(key, value);
      }
    },
    remove(key) {
      try {
        storage.removeItem(key);
      } catch {
        fallback.remove(key);
      }
    },
  };
}

/**
 * Creates a localStorage-backed adapter only when called in a browser.
 * Renderers should call this after mount, never during module initialization.
 */
export function createBrowserStorageAdapter(): TerminalStorageAdapter {
  if (typeof window === 'undefined') {
    return createMemoryStorageAdapter();
  }

  try {
    return createSafeStorageAdapter(window.localStorage);
  } catch {
    return createMemoryStorageAdapter();
  }
}
