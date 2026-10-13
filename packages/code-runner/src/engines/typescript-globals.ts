/**
 * Ambient declarations of the globals the JavaScript runtime provides to the
 * program (`input` and `console`). The type checker runs without the DOM lib,
 * so these are the only globals besides ECMAScript itself.
 */
export const TS_GLOBALS_DTS = `declare function input(): string | null;

declare const console: {
  log(...data: unknown[]): void;
  info(...data: unknown[]): void;
  debug(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
};
`;
