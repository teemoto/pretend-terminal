import { describe, expect, it } from 'vitest';

import {
  createBrowserStorageAdapter,
  createSafeStorageAdapter,
  createTerminalStorageKey,
} from '../index.js';

describe('storage adapters', () => {
  it('keeps persistence in memory when browser storage is unavailable', () => {
    const storage = createSafeStorageAdapter();

    storage.set('teemo', 'ready');
    expect(storage.get('teemo')).toBe('ready');
    storage.remove('teemo');
    expect(storage.get('teemo')).toBeNull();
  });

  it('keeps persistence available when privacy settings block every storage operation', () => {
    const privacyRestrictedStorage = {
      getItem() {
        throw new Error('storage access denied');
      },
      setItem() {
        throw new Error('storage access denied');
      },
      removeItem() {
        throw new Error('storage access denied');
      },
    };
    const storage = createSafeStorageAdapter(privacyRestrictedStorage);

    storage.set('teemo', 'ready');
    expect(storage.get('teemo')).toBe('ready');
    expect(() => storage.remove('teemo')).not.toThrow();
  });

  it('keeps persistence available when browser storage rejects quota-limited writes', () => {
    const quotaLimitedStorage = {
      getItem() {
        return null;
      },
      setItem() {
        throw new Error('quota exceeded');
      },
      removeItem() {
        throw new Error('quota exceeded');
      },
    };
    const storage = createSafeStorageAdapter(quotaLimitedStorage);

    storage.set('teemo', 'ready');
    expect(storage.get('teemo')).toBe('ready');
    expect(() => storage.remove('teemo')).not.toThrow();
    expect(storage.get('teemo')).toBeNull();
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
