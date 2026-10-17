'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { migrateLegacyStorageKey } from '@birb-learn/theme';
import type { GradedResult } from '@/lib/grade-simulado';

export const SIMULADO_HISTORY_STORAGE_KEY = 'birb-learn-simulado-history';
/** Pre-rebrand key, read once by `migrateLegacyStorageKey`. */
export const LEGACY_SIMULADO_HISTORY_STORAGE_KEY = 'birb-math-simulado-history';

export interface SimuladoAttempt {
  /** When the attempt was finished; also its id (unique within the history). */
  completedAt: string;
  result: GradedResult;
}

function readStoredHistory(): SimuladoAttempt[] {
  if (typeof window === 'undefined') return [];
  migrateLegacyStorageKey(LEGACY_SIMULADO_HISTORY_STORAGE_KEY, SIMULADO_HISTORY_STORAGE_KEY);
  try {
    const raw = window.localStorage.getItem(SIMULADO_HISTORY_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SimuladoAttempt[]) : [];
  } catch {
    return [];
  }
}

export function useSimuladoHistory() {
  const [history, setHistory] = useState<SimuladoAttempt[]>(() => []);

  useEffect(() => {
    setHistory(readStoredHistory());
  }, []);

  // The last timestamp handed out, so two attempts added in the same millisecond still get distinct ids.
  const lastIssuedRef = useRef(0);

  /** Records a finished attempt and returns its id, for `updateAttempt`. */
  const addAttempt = useCallback((result: GradedResult): string => {
    const time = Math.max(Date.now(), lastIssuedRef.current + 1);
    lastIssuedRef.current = time;
    const completedAt = new Date(time).toISOString();
    setHistory((prev) => {
      const next = [...prev, { completedAt, result }];
      window.localStorage.setItem(SIMULADO_HISTORY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    return completedAt;
  }, []);

  /** Replaces the result of the attempt `completedAt` (e.g. after its not-graded questions are graded again). */
  const updateAttempt = useCallback((completedAt: string, result: GradedResult) => {
    setHistory((prev) => {
      const next = prev.map((attempt) => (attempt.completedAt === completedAt ? { completedAt, result } : attempt));
      window.localStorage.setItem(SIMULADO_HISTORY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { history, addAttempt, updateAttempt };
}
