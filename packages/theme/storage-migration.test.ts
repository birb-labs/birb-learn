import { afterEach, describe, expect, it, vi } from 'vitest';
import { migrateLegacyStorageKey } from './storage-migration';

describe('migrateLegacyStorageKey', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('moves a legacy value onto the current key and drops the legacy key', () => {
    window.localStorage.setItem('birb-math-theme', 'monokai');

    migrateLegacyStorageKey('birb-math-theme', 'birb-learn-theme');

    expect(window.localStorage.getItem('birb-learn-theme')).toBe('monokai');
    expect(window.localStorage.getItem('birb-math-theme')).toBeNull();
  });

  it('leaves an already-migrated value untouched', () => {
    window.localStorage.setItem('birb-math-theme', 'monokai');
    window.localStorage.setItem('birb-learn-theme', 'mocha');

    migrateLegacyStorageKey('birb-math-theme', 'birb-learn-theme');

    expect(window.localStorage.getItem('birb-learn-theme')).toBe('mocha');
  });

  it('does nothing when there is no legacy value', () => {
    migrateLegacyStorageKey('birb-math-theme', 'birb-learn-theme');

    expect(window.localStorage.getItem('birb-learn-theme')).toBeNull();
  });

  it('is idempotent across repeated reads', () => {
    window.localStorage.setItem('birb-math-mode', 'dark');

    migrateLegacyStorageKey('birb-math-mode', 'birb-learn-mode');
    migrateLegacyStorageKey('birb-math-mode', 'birb-learn-mode');

    expect(window.localStorage.getItem('birb-learn-mode')).toBe('dark');
  });

  it('never throws when localStorage is unavailable', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: localStorage is disabled');
    });

    expect(() => migrateLegacyStorageKey('birb-math-theme', 'birb-learn-theme')).not.toThrow();
  });
});
