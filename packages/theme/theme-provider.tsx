'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  LEGACY_MODE_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  MODE_STORAGE_KEY,
  THEME_MODES,
  THEME_NAMES,
  THEME_STORAGE_KEY,
  type ResolvedMode,
  type ThemeMode,
  type ThemeName,
} from './theme-types';
import { resolveMode } from './resolve-mode';
import { migrateLegacyStorageKey } from './storage-migration';

interface ThemeContextValue {
  theme: ThemeName;
  mode: ThemeMode;
  resolvedMode: ResolvedMode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return (THEME_NAMES as string[]).includes(stored ?? '') ? (stored as ThemeName) : DEFAULT_THEME;
}

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
  return (THEME_MODES as string[]).includes(stored ?? '') ? (stored as ThemeMode) : DEFAULT_MODE;
}

function prefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getThemeServerSnapshot(): ThemeName {
  return DEFAULT_THEME;
}

function getModeServerSnapshot(): ThemeMode {
  return DEFAULT_MODE;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Migrating here (render body), rather than inside the `getSnapshot`
  // arguments passed to useSyncExternalStore below, keeps those snapshot
  // readers pure as React requires: getSnapshot may run multiple times per
  // render (and twice under StrictMode) purely to compare against a cached
  // value, so it must never perform writes. Both migrations are idempotent,
  // so re-running them on every render of this component is harmless, and
  // running them here still guarantees they precede the first read below.
  if (typeof window !== 'undefined') {
    migrateLegacyStorageKey(LEGACY_THEME_STORAGE_KEY, THEME_STORAGE_KEY);
    migrateLegacyStorageKey(LEGACY_MODE_STORAGE_KEY, MODE_STORAGE_KEY);
  }

  const theme = useSyncExternalStore(subscribe, readStoredTheme, getThemeServerSnapshot);
  const mode = useSyncExternalStore(subscribe, readStoredMode, getModeServerSnapshot);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    setSystemPrefersDark(prefersDark());

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const resolvedMode = useMemo(() => resolveMode(mode, systemPrefersDark), [mode, systemPrefersDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', resolvedMode);
  }, [theme, resolvedMode]);

  const setTheme = useCallback((next: ThemeName) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    notify();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    window.localStorage.setItem(MODE_STORAGE_KEY, next);
    notify();
  }, []);

  const value = useMemo(
    () => ({ theme, mode, resolvedMode, setTheme, setMode }),
    [theme, mode, resolvedMode, setTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
