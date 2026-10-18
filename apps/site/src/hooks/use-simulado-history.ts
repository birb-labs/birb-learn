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

/** The longest expected or actual output kept per test in storage. */
const MAX_STORED_TEST_OUTPUT = 2000;

/**
 * The attempt as it is written to storage: a code question drops its highlighted
 * tokens (the results view falls back to the plain solution) and long test output
 * is cut, so a few attempts cannot fill the browser's storage quota. The payload
 * stays, because a retry grades with its tests.
 */
function compactAttempt(attempt: SimuladoAttempt): SimuladoAttempt {
  return {
    ...attempt,
    result: {
      ...attempt.result,
      perQuestion: attempt.result.perQuestion.map((entry) => {
        if (!entry.question.code && !entry.code) return entry;
        let question = entry.question;
        if (question.code) {
          // The stored shape has no tokens; readers of a reopened attempt must cope (see SimuladoCodeReview).
          const { starterTokens: _starter, solutionTokens: _solution, ...rest } = question.code;
          question = { ...question, code: rest as typeof question.code };
        }
        const code = entry.code && {
          ...entry.code,
          tests: entry.code.tests.map((test) => ({
            ...test,
            expected: test.expected.slice(0, MAX_STORED_TEST_OUTPUT),
            actual: test.actual.slice(0, MAX_STORED_TEST_OUTPUT),
          })),
        };
        return { ...entry, question, code };
      }),
    },
  };
}

/**
 * Writes the history. A full storage must not break the page: the attempts stay in
 * memory, and one retry is made with the older half of the history dropped.
 */
function writeStoredHistory(history: SimuladoAttempt[]): void {
  let toStore = history.map(compactAttempt);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      window.localStorage.setItem(SIMULADO_HISTORY_STORAGE_KEY, JSON.stringify(toStore));
      return;
    } catch {
      if (toStore.length <= 1) return;
      toStore = toStore.slice(Math.ceil(toStore.length / 2));
    }
  }
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
      writeStoredHistory(next);
      return next;
    });
    return completedAt;
  }, []);

  /** Replaces the result of the attempt `completedAt` (e.g. after its not-graded questions are graded again). */
  const updateAttempt = useCallback((completedAt: string, result: GradedResult) => {
    setHistory((prev) => {
      const next = prev.map((attempt) => (attempt.completedAt === completedAt ? { completedAt, result } : attempt));
      writeStoredHistory(next);
      return next;
    });
  }, []);

  return { history, addAttempt, updateAttempt };
}
