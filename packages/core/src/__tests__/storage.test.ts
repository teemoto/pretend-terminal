import { describe, expect, it } from 'vitest';

import {
  createBrowserStorageAdapter,
  createMemoryStorageAdapter,
  createSafeStorageAdapter,
  createTerminalStorageKey,
} from '../index.js';

describe('storage adapters', () => {
  it('keeps fallback values in memory when no browser storage is supplied', () => {
    const storage = createMemoryStorageAdapter();

    storage.set('teemo', 'ready');
    expect(storage.get('teemo')).toBe('ready');
    storage.remove('teemo');
    expect(storage.get('teemo')).toBeNull();
  });

  it('falls back without throwing when a browser storage operation is blocked', () => {
    const blockedStorage = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
      removeItem() {
        throw new Error('blocked');
      },
    };
    const storage = createSafeStorageAdapter(blockedStorage);

    storage.set('teemo', 'ready');
    expect(storage.get('teemo')).toBe('ready');
    expect(() => storage.remove('teemo')).not.toThrow();
  });

  it('creates versioned keys scoped to the consumer storage key', () => {
    expect(createTerminalStorageKey('teemo-portfolio', 'history')).toBe(
      'teemo-portfolio:pretend-terminal:v1:history',
    );
  });

  it('can be created outside a browser without accessing window during import', () => {
    expect(createBrowserStorageAdapter().get('missing')).toBeNull();
  });
});
