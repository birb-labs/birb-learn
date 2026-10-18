import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  LEGACY_SIMULADO_HISTORY_STORAGE_KEY,
  SIMULADO_HISTORY_STORAGE_KEY,
  useSimuladoHistory,
} from './use-simulado-history';
import type { GradedResult } from '@/lib/grade-simulado';
import type { ExportedQuestion } from '@/lib/simulado-selection';

const fixtureResult: GradedResult = { correctCount: 1, total: 2, perQuestion: [] };

describe('useSimuladoHistory', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts with an empty history', () => {
    const { result } = renderHook(() => useSimuladoHistory());
    expect(result.current.history).toEqual([]);
  });

  it('adds a completed attempt to history and persists it', () => {
    const { result } = renderHook(() => useSimuladoHistory());

    act(() => {
      result.current.addAttempt(fixtureResult);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].result).toEqual(fixtureResult);
    expect(result.current.history[0].completedAt).toEqual(expect.any(String));

    const stored = JSON.parse(window.localStorage.getItem(SIMULADO_HISTORY_STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
  });

  it('reads previously stored history on mount', () => {
    window.localStorage.setItem(
      SIMULADO_HISTORY_STORAGE_KEY,
      JSON.stringify([{ completedAt: '2026-01-01T00:00:00.000Z', result: fixtureResult }]),
    );

    const { result } = renderHook(() => useSimuladoHistory());

    expect(result.current.history).toHaveLength(1);
  });

  it('adopts history saved under the pre-rebrand key', () => {
    window.localStorage.setItem(
      LEGACY_SIMULADO_HISTORY_STORAGE_KEY,
      JSON.stringify([{ completedAt: '2026-09-01T12:00:00.000Z', result: fixtureResult }]),
    );

    const { result } = renderHook(() => useSimuladoHistory());

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].completedAt).toBe('2026-09-01T12:00:00.000Z');
    expect(window.localStorage.getItem(LEGACY_SIMULADO_HISTORY_STORAGE_KEY)).toBeNull();
  });

  it('keeps already-migrated history when both keys exist', () => {
    window.localStorage.setItem(
      LEGACY_SIMULADO_HISTORY_STORAGE_KEY,
      JSON.stringify([{ completedAt: '2026-01-01T00:00:00.000Z', result: fixtureResult }]),
    );
    window.localStorage.setItem(
      SIMULADO_HISTORY_STORAGE_KEY,
      JSON.stringify([{ completedAt: '2026-09-01T12:00:00.000Z', result: fixtureResult }]),
    );

    const { result } = renderHook(() => useSimuladoHistory());

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].completedAt).toBe('2026-09-01T12:00:00.000Z');
  });

  it('returns the new attempt id and replaces that attempt in place when it is updated', () => {
    const { result } = renderHook(() => useSimuladoHistory());

    let firstId = '';
    act(() => {
      firstId = result.current.addAttempt(fixtureResult);
    });
    act(() => {
      result.current.addAttempt({ correctCount: 0, total: 1, perQuestion: [] });
    });
    expect(firstId).toBe(result.current.history[0].completedAt);

    const updated: GradedResult = { correctCount: 2, total: 2, perQuestion: [] };
    act(() => {
      result.current.updateAttempt(firstId, updated);
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0]).toEqual({ completedAt: firstId, result: updated });
    expect(result.current.history[1].result.correctCount).toBe(0);
    const stored = JSON.parse(window.localStorage.getItem(SIMULADO_HISTORY_STORAGE_KEY) ?? '[]');
    expect(stored[0].result.correctCount).toBe(2);
  });

  it('gives each attempt a distinct id even when two are added in the same millisecond', () => {
    const { result } = renderHook(() => useSimuladoHistory());
    const ids: string[] = [];

    act(() => {
      ids.push(result.current.addAttempt(fixtureResult));
      ids.push(result.current.addAttempt(fixtureResult));
    });

    expect(new Set(ids).size).toBe(2);
    expect(result.current.history.map((attempt) => attempt.completedAt)).toEqual(ids);
  });

  describe('code questions and storage limits', () => {
    const codeQuestion: ExportedQuestion = {
      id: 30,
      type: 'code',
      difficulty: 'easy',
      promptHtml: '<p>Q30</p>',
      options: [],
      acceptedAnswers: [],
      matchingPairs: [],
      correctAnswer: null,
      resolutionHtml: '<p>R</p>',
      answerFormat: 'text',
      isFallback: false,
      tagIds: [],
      code: {
        kind: 'write',
        language: 'python',
        payload: { starterCode: 'a\n', solution: 'b\n', tests: [{ stdin: '', expectedStdout: 'x' }], blanks: [], hints: [] },
        starterTokens: [[{ text: 'a' }]],
        solutionTokens: [[{ text: 'b' }]],
      },
    };
    const longText = 'x'.repeat(5000);
    const codeResult: GradedResult = {
      correctCount: 0,
      total: 1,
      perQuestion: [
        {
          question: codeQuestion,
          userAnswer: 'a',
          isCorrect: false,
          verdict: 'incorrect',
          code: { verdict: 'incorrect', tests: [{ passed: false, status: 'ok', expected: longText, actual: longText }] },
        },
      ],
    };

    it('stores a code question without its highlighted tokens and with trimmed test output', () => {
      const { result } = renderHook(() => useSimuladoHistory());
      act(() => {
        result.current.addAttempt(codeResult);
      });

      const raw = window.localStorage.getItem(SIMULADO_HISTORY_STORAGE_KEY) ?? '';
      expect(raw).not.toContain('starterTokens');
      expect(raw).not.toContain('solutionTokens');
      const stored = JSON.parse(raw);
      const test = stored[0].result.perQuestion[0].code.tests[0];
      expect(test.expected).toHaveLength(2000);
      expect(test.actual).toHaveLength(2000);
      // The payload, which a retry grades with, is kept.
      expect(stored[0].result.perQuestion[0].question.code.payload.tests).toHaveLength(1);
      // The attempt in memory is untouched.
      expect(result.current.history[0].result.perQuestion[0].code?.tests[0].expected).toHaveLength(5000);
    });

    it('does not throw when the storage is full, keeps the attempt in memory and drops the oldest stored ones', () => {
      const { result } = renderHook(() => useSimuladoHistory());
      for (let i = 0; i < 4; i += 1) {
        act(() => {
          result.current.addAttempt(fixtureResult);
        });
      }
      const setItem = vi.spyOn(Storage.prototype, 'setItem');
      // The first write fails (quota); the retry with fewer attempts succeeds.
      setItem.mockImplementationOnce(() => {
        throw new DOMException('full', 'QuotaExceededError');
      });

      expect(() =>
        act(() => {
          result.current.addAttempt(fixtureResult);
        }),
      ).not.toThrow();

      expect(result.current.history).toHaveLength(5);
      const stored = JSON.parse(window.localStorage.getItem(SIMULADO_HISTORY_STORAGE_KEY) ?? '[]');
      expect(stored.length).toBeGreaterThan(0);
      expect(stored.length).toBeLessThan(5);
      // The newest attempt is the one that stays.
      expect(stored[stored.length - 1].completedAt).toBe(result.current.history[4].completedAt);
      setItem.mockRestore();
    });

    it('does not throw when the storage keeps failing', () => {
      const { result } = renderHook(() => useSimuladoHistory());
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('full', 'QuotaExceededError');
      });
      expect(() =>
        act(() => {
          result.current.addAttempt(fixtureResult);
        }),
      ).not.toThrow();
      expect(result.current.history).toHaveLength(1);
      vi.restoreAllMocks();
    });
  });
});
