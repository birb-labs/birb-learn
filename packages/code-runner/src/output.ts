import { OUTPUT_LIMIT_BYTES, type SqlResultSet } from './protocol';

/** CRLF to LF, strip trailing whitespace on each line, strip trailing blank lines. */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

// UTF-8 size of one code point. Lone surrogates are encoded as U+FFFD (3 bytes).
function utf8Size(codePoint: number): number {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}

/**
 * Collects stdout and stderr up to a combined UTF-8 byte limit. The chunk that
 * crosses the limit is truncated at a code point boundary, and everything
 * pushed afterwards is ignored.
 */
export class OutputCollector {
  private stdoutText = '';
  private stderrText = '';
  private usedBytes = 0;
  private hasOverflowed = false;

  constructor(private readonly limitBytes: number = OUTPUT_LIMIT_BYTES) {}

  /** Returns false once the limit has been exceeded. */
  push(stream: 'stdout' | 'stderr', chunk: string): boolean {
    if (this.hasOverflowed) return false;

    let kept = '';
    let keptBytes = 0;
    let truncated = false;
    for (const char of chunk) {
      const size = utf8Size(char.codePointAt(0)!);
      if (this.usedBytes + keptBytes + size > this.limitBytes) {
        truncated = true;
        break;
      }
      kept += char;
      keptBytes += size;
    }

    this.usedBytes += keptBytes;
    if (stream === 'stdout') this.stdoutText += kept;
    else this.stderrText += kept;
    if (truncated) this.hasOverflowed = true;
    return !truncated;
  }

  get stdout(): string {
    return this.stdoutText;
  }

  get stderr(): string {
    return this.stderrText;
  }

  get overflowed(): boolean {
    return this.hasOverflowed;
  }
}

/** Normalizes a database value to the string-or-null cell representation. */
export function toCell(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Uint8Array) {
    let hex = '';
    for (const byte of value) hex += byte.toString(16).padStart(2, '0');
    return `\\x${hex}`;
  }
  return String(value);
}

/** Renders result sets as text (used as SQL `stdout`): header, rows, blank line between sets. */
export function formatResultSets(sets: SqlResultSet[]): string {
  return sets
    .map((set) =>
      [set.columns.join(' | '), ...set.rows.map((row) => row.map((cell) => cell ?? 'NULL').join(' | '))].join('\n'),
    )
    .join('\n\n');
}
