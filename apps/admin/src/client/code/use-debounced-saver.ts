import { useEffect, useMemo, useRef } from 'react';

/** How long the author has to stop editing before the draft is saved. */
export const SAVE_DEBOUNCE_MS = 500;

interface Options {
  /**
   * Starts a save of the latest draft. Resolves to the server's error message, or `null` when it
   * saved. Returns `null` instead of a promise when there is nothing (valid) to send.
   */
  send: () => Promise<string | null> | null;
  /** Called with the outcome of a save, only when no newer edit has made it stale. */
  onResult: (error: string | null) => void;
  delayMs?: number;
}

/**
 * Saves a draft while the author edits it: one request after `delayMs` of quiet, one request in
 * flight at a time, and the latest draft sent when the request in flight returns. The outcome of a
 * request that newer edits have outdated is dropped, so the last request always decides what is shown.
 * Edits still pending are saved when `flush()` is called (on blur) and when the component unmounts.
 */
export function useDebouncedSaver(options: Options): { schedule: () => void; flush: () => void } {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const stateRef = useRef({
    timer: null as ReturnType<typeof setTimeout> | null,
    inFlight: false,
    again: false,
    edited: false,
    mounted: true,
  });

  const api = useMemo(() => {
    const state = stateRef.current;

    function run() {
      state.timer = null;
      if (state.inFlight) {
        state.again = true;
        return;
      }
      const pending = optionsRef.current.send();
      state.edited = false;
      if (!pending) return;
      state.inFlight = true;
      pending.then(
        (error) => finish(error),
        (failure: unknown) => finish(failure instanceof Error ? failure.message : String(failure)),
      );
    }

    function finish(error: string | null) {
      state.inFlight = false;
      if (state.again) {
        state.again = false;
        run();
        return;
      }
      // A newer edit is waiting for its own save; this outcome is about an older draft.
      if (state.edited) return;
      if (state.mounted) optionsRef.current.onResult(error);
    }

    function clearTimer() {
      if (state.timer !== null) clearTimeout(state.timer);
      state.timer = null;
    }

    return {
      schedule() {
        state.edited = true;
        clearTimer();
        state.timer = setTimeout(run, optionsRef.current.delayMs ?? SAVE_DEBOUNCE_MS);
      },
      flush() {
        if (!state.edited) return;
        clearTimer();
        run();
      },
    };
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    state.mounted = true;
    return () => {
      state.mounted = false;
      api.flush();
    };
  }, [api]);

  return api;
}
