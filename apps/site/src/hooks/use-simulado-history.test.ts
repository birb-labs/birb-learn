import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  LEGACY_SIMULADO_HISTORY_STORAGE_KEY,
  SIMULADO_HISTORY_STORAGE_KEY,
  useSimuladoHistory,
} from './use-simulado-history';
import type { GradedResult } from '@/lib/grade-simulado';

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
});
