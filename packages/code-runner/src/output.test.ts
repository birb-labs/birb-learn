import { describe, expect, it } from 'vitest';
import { formatResultSets, normalizeOutput, OutputCollector, toCell } from './output';

const byteLength = (text: string) => new TextEncoder().encode(text).length;

describe('normalizeOutput', () => {
  it('converts CRLF, strips trailing whitespace and trailing blank lines', () => {
    expect(normalizeOutput('a  \r\nb\t\n\n\n')).toBe('a\nb');
  });

  it('returns an empty string for empty input', () => {
    expect(normalizeOutput('')).toBe('');
  });

  it('keeps leading whitespace and inner blank lines', () => {
    expect(normalizeOutput('  a\n\nb')).toBe('  a\n\nb');
  });
});

describe('OutputCollector', () => {
  it('accepts output under the limit', () => {
    const collector = new OutputCollector(10);
    expect(collector.push('stdout', 'Olá')).toBe(true);
    expect(collector.stdout).toBe('Olá');
    expect(collector.overflowed).toBe(false);
  });

  it('truncates at the limit and ignores later pushes', () => {
    const collector = new OutputCollector(10);
    expect(collector.push('stdout', 'Olá')).toBe(true);
    expect(collector.push('stderr', '1234567')).toBe(false);
    expect(collector.overflowed).toBe(true);
    expect(byteLength(collector.stdout) + byteLength(collector.stderr)).toBeLessThanOrEqual(10);
    expect(collector.stderr).toBe('123456');
    expect(collector.push('stdout', 'more')).toBe(false);
    expect(collector.stdout).toBe('Olá');
  });

  it('does not split a surrogate pair at the limit', () => {
    const collector = new OutputCollector(5);
    expect(collector.push('stdout', 'ab🙂c')).toBe(false);
    expect(collector.stdout).toBe('ab');
    expect(collector.overflowed).toBe(true);
  });

  it('does not split a multi-byte character at the limit', () => {
    const collector = new OutputCollector(2);
    expect(collector.push('stdout', 'aá')).toBe(false);
    expect(collector.stdout).toBe('a');
  });

  it('accepts exactly the limit without overflowing', () => {
    const collector = new OutputCollector(3);
    expect(collector.push('stdout', 'abc')).toBe(true);
    expect(collector.overflowed).toBe(false);
    expect(collector.push('stdout', 'd')).toBe(false);
    expect(collector.stdout).toBe('abc');
  });

  it('defaults to the 64 KiB output limit', () => {
    const collector = new OutputCollector();
    expect(collector.push('stdout', 'x'.repeat(65536))).toBe(true);
    expect(collector.push('stdout', 'x')).toBe(false);
    expect(byteLength(collector.stdout)).toBe(65536);
  });
});

describe('toCell', () => {
  it('maps null and undefined to null', () => {
    expect(toCell(null)).toBeNull();
    expect(toCell(undefined)).toBeNull();
  });

  it('formats dates as ISO strings', () => {
    expect(toCell(new Date('2020-01-02T03:04:05Z'))).toBe('2020-01-02T03:04:05.000Z');
  });

  it('formats bytes as \\x hex', () => {
    expect(toCell(new Uint8Array([1, 255]))).toBe('\\x01ff');
  });

  it('formats an invalid date instead of throwing', () => {
    expect(toCell(new Date(Number.NaN))).toBe('Invalid Date');
  });

  it('formats plain objects and arrays as JSON', () => {
    expect(toCell({ a: 1, b: ['x', null] })).toBe('{"a":1,"b":["x",null]}');
    expect(toCell([1, 2, 3])).toBe('[1,2,3]');
    expect(toCell([])).toBe('[]');
    expect(toCell({})).toBe('{}');
  });

  it('keeps big integers inside JSON values', () => {
    expect(toCell([1n, 2n ** 70n])).toBe('[1,"1180591620717411303424"]');
  });

  it('stringifies bigint, number, boolean and strings', () => {
    expect(toCell(1n)).toBe('1');
    expect(toCell(1.5)).toBe('1.5');
    expect(toCell(true)).toBe('true');
    expect(toCell('x')).toBe('x');
  });
});

describe('formatResultSets', () => {
  it('formats header and rows with NULL', () => {
    expect(formatResultSets([{ columns: ['a', 'b'], rows: [['1', null]] }])).toBe('a | b\n1 | NULL');
  });

  it('separates sets with a blank line', () => {
    expect(
      formatResultSets([
        { columns: ['a'], rows: [['1']] },
        { columns: ['b'], rows: [['2'], ['3']] },
      ]),
    ).toBe('a\n1\n\nb\n2\n3');
  });

  it('returns an empty string for no sets', () => {
    expect(formatResultSets([])).toBe('');
  });
});
