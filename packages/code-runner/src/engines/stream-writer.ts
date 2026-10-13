import type { Emit } from './types';

/**
 * A stdout/stderr writer that decodes bytes as they arrive. The decoder is
 * streaming, so a character split across two writes is not corrupted; `finish`
 * flushes whatever it still holds.
 */
export function streamWriter(emit: Emit, stream: 'stdout' | 'stderr') {
  const decoder = new TextDecoder();
  return {
    write(bytes: Uint8Array): number {
      const text = decoder.decode(bytes, { stream: true });
      if (text) emit(stream, text);
      return bytes.length;
    },
    finish(): void {
      const text = decoder.decode();
      if (text) emit(stream, text);
    },
  };
}
