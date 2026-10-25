import { createStore } from 'jotai';
import { atomWithStorage, RESET } from 'jotai/utils';
import { afterEach, expect, test, vi } from 'vitest';

import {
  localStorage,
  sessionStorage,
} from '../src/features/state/syncStorage';

afterEach(() => vi.unstubAllGlobals());

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}

test('stored atom values and writes remain synchronous for both browser storage types', () => {
  const local = memoryStorage();
  const session = memoryStorage();
  vi.stubGlobal('window', { localStorage: local, sessionStorage: session });
  for (const [createStorage, backing] of [
    [localStorage<string[]>, local],
    [sessionStorage<string[]>, session],
  ] as const) {
    backing.setItem('items', '["saved"]');
    const atom = atomWithStorage<string[]>('items', [], createStorage(), {
      getOnInit: true,
    });
    const store = createStore();
    expect(store.get(atom)).toEqual(['saved']);
    expect(store.get(atom)).not.toBeInstanceOf(Promise);
    expect(store.set(atom, (previous) => [...previous, 'new'])).toBeUndefined();
    expect(backing.getItem('items')).toBe('["saved","new"]');
    store.set(atom, RESET);
    expect(store.get(atom)).toEqual([]);
    expect(backing.getItem('items')).toBeNull();
  }
});

test('storage helpers return undefined when there is no browser window', () => {
  vi.stubGlobal('window', undefined);
  expect(localStorage()).toBeUndefined();
  expect(sessionStorage()).toBeUndefined();
});
