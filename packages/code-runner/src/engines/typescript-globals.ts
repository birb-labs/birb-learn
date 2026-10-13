/**
 * Ambient declarations of the globals the JavaScript runtime provides to the
 * program (`input`, `console` and the timer functions). The type checker runs
 * without the DOM lib, so these are the only globals besides ECMAScript itself.
 * Timer ids are numbers, as in browsers.
 */
export const TS_GLOBALS_DTS = `declare function input(): string | null;

declare const console: {
  log(...data: unknown[]): void;
  info(...data: unknown[]): void;
  debug(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
};

declare function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): number;
declare function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): number;
declare function clearTimeout(id: number | undefined): void;
declare function clearInterval(id: number | undefined): void;
declare function queueMicrotask(callback: () => void): void;
`;
