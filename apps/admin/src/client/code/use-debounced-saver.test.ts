import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { SAVE_DEBOUNCE_MS, useDebouncedSaver } from './use-debounced-saver';

function deferred() {
  let resolve!: (error: string | null) => void;
  const promise = new Promise<string | null>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('useDebouncedSaver', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(send: () => Promise<string | null> | null) {
    const onResult = vi.fn();
    const hook = renderHook(() => useDebouncedSaver({ send, onResult }));
    return { ...hook, onResult };
  }

  it('sends once, after the debounce, however many edits came in', async () => {
    const send = vi.fn(() => Promise.resolve(null));
    const { result } = setup(send);

    act(() => result.current.schedule());
    await act(() => vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS - 100));
    act(() => result.current.schedule());
    await act(() => vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS - 100));
    act(() => result.current.schedule());
    expect(send).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS));

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('reports the result of the request', async () => {
    const { result, onResult } = setup(() => Promise.resolve('Erro do servidor.'));

    act(() => result.current.schedule());
    await act(() => vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS));

    expect(onResult).toHaveBeenCalledExactlyOnceWith('Erro do servidor.');
  });

  it('reports a request that threw as an error message', async () => {
    const { result, onResult } = setup(() => Promise.reject(new Error('rede caiu')));

    act(() => result.current.schedule());
    await act(() => vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS));

    expect(onResult).toHaveBeenCalledExactlyOnceWith('rede caiu');
  });

  it('keeps one request in flight and sends the latest edits when it returns, hiding the stale result', async () => {
    const first = deferred();
    const second = deferred();
    const send = vi.fn<() => Promise<string | null> | null>().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result, onResult } = setup(send);

    act(() => result.current.schedule());
    await act(() => vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS));
    expect(send).toHaveBeenCalledTimes(1);

    // The author keeps typing while the first request is slow.
    act(() => result.current.schedule());
    await act(() => vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS * 3));
    expect(send).toHaveBeenCalledTimes(1);

    // The slow, earlier request fails: that must not show, the newer draft is not saved yet.
    await act(async () => first.resolve('Erro antigo.'));
    expect(onResult).not.toHaveBeenCalled();
    expect(send).toHaveBeenCalledTimes(2);

    await act(async () => second.resolve(null));
    expect(onResult).toHaveBeenCalledExactlyOnceWith(null);
  });

  it('flush sends right away, and only when there is something scheduled', async () => {
    const send = vi.fn(() => Promise.resolve(null));
    const { result } = setup(send);

    act(() => result.current.flush());
    expect(send).not.toHaveBeenCalled();

    act(() => result.current.schedule());
    act(() => result.current.flush());
    expect(send).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS * 2));
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('flushes the pending edits when it unmounts', () => {
    const send = vi.fn(() => Promise.resolve(null));
    const { result, unmount } = setup(send);

    act(() => result.current.schedule());
    unmount();

    expect(send).toHaveBeenCalledTimes(1);
  });

  it('does nothing when there is nothing to send', async () => {
    const { result, onResult } = setup(() => null);

    act(() => result.current.schedule());
    await act(() => vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS));

    expect(onResult).not.toHaveBeenCalled();
  });
});
