import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { noFlashScript } from './no-flash-script';
import {
  LEGACY_MODE_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  MODE_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from './theme-types';

function runScript() {
  // eslint-disable-next-line no-new-func
  new Function(noFlashScript)();
}

describe('noFlashScript', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-mode');
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('applies a theme saved under the current keys', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'mocha');
    window.localStorage.setItem(MODE_STORAGE_KEY, 'dark');

    runScript();

    expect(document.documentElement.getAttribute('data-theme')).toBe('mocha');
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
  });

  it('migrates and applies a theme saved under the pre-rebrand keys', () => {
    window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, 'monokai');
    window.localStorage.setItem(LEGACY_MODE_STORAGE_KEY, 'dark');

    runScript();

    expect(document.documentElement.getAttribute('data-theme')).toBe('monokai');
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('monokai');
    expect(window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY)).toBeNull();
  });

  it('falls back to the defaults when nothing is stored', () => {
    runScript();

    expect(document.documentElement.getAttribute('data-theme')).toBe('default');
    expect(['light', 'dark']).toContain(document.documentElement.getAttribute('data-mode'));
  });
});
