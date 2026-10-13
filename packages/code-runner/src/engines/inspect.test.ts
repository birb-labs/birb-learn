import { describe, expect, it } from 'vitest';
import { formatLogArguments, inspect } from './inspect';

describe('inspect', () => {
  it.each<[string, unknown, string]>([
    ['undefined', undefined, 'undefined'],
    ['null', null, 'null'],
    ['NaN', NaN, 'NaN'],
    ['Infinity', -Infinity, '-Infinity'],
    ['negative zero', -0, '-0'],
    ['a bigint', 10n, '10n'],
    ['a boolean', true, 'true'],
    ['a symbol', Symbol('s'), 'Symbol(s)'],
    ['a nested-free string', 'x', "'x'"],
  ])('formats %s', (_name, value, expected) => {
    expect(inspect(value)).toBe(expected);
  });

  it('formats arrays like Node', () => {
    expect(inspect([1, undefined, NaN])).toBe('[ 1, undefined, NaN ]');
    expect(inspect([])).toBe('[]');
    expect(inspect(['a', [2, -0]])).toBe("[ 'a', [ 2, -0 ] ]");
    // eslint-disable-next-line no-sparse-arrays
    expect(inspect([1, , , 4])).toBe('[ 1, <2 empty items>, 4 ]');
    expect(inspect(Array.from({ length: 102 }, (_, i) => i))).toMatch(/, 99, \.\.\. 2 more items \]$/);
  });

  it('formats plain objects like Node', () => {
    expect(inspect({ a: undefined })).toBe('{ a: undefined }');
    expect(inspect({})).toBe('{}');
    expect(inspect({ a: 1, 'b-c': 'x', [Symbol('k')]: 2 })).toBe("{ a: 1, 'b-c': 'x', Symbol(k): 2 }");
    expect(inspect(Object.assign(Object.create(null), { a: 1 }))).toBe('[Object: null prototype] { a: 1 }');
    expect(inspect({ get g() { return 1; } })).toBe('{ g: [Getter] }');
  });

  it('formats maps and sets', () => {
    expect(inspect(new Map([[1, 2]]))).toBe('Map(1) { 1 => 2 }');
    expect(inspect(new Map([['k', { v: 1 }]]))).toBe("Map(1) { 'k' => { v: 1 } }");
    expect(inspect(new Set([1]))).toBe('Set(1) { 1 }');
    expect(inspect(new Set())).toBe('Set(0) {}');
  });

  it('formats class instances, functions and classes', () => {
    class Foo {
      x = 1;
    }
    class Empty {}
    function named() {}
    expect(inspect(new Foo())).toBe('Foo { x: 1 }');
    expect(inspect(new Empty())).toBe('Empty {}');
    expect(inspect(named)).toBe('[Function: named]');
    expect(inspect(() => {})).toBe('[Function (anonymous)]');
    expect(inspect(Foo)).toBe('[class Foo]');
  });

  it('marks circular references', () => {
    const a: Record<string, unknown> = { name: 'a' };
    a.self = a;
    expect(inspect(a)).toBe("<ref *1> { name: 'a', self: [Circular *1] }");
    const list: unknown[] = [1];
    list.push({ back: list });
    expect(inspect(list)).toBe('<ref *1> [ 1, { back: [Circular *1] } ]');
  });

  it('formats errors as name and message', () => {
    expect(inspect(new TypeError('bad'))).toBe('TypeError: bad');
    expect(inspect({ e: new RangeError('r') })).toBe('{ e: RangeError: r }');
  });

  it('formats dates, regular expressions, boxed primitives and typed arrays', () => {
    expect(inspect(new Date(0))).toBe('1970-01-01T00:00:00.000Z');
    expect(inspect(new Date(Number.NaN))).toBe('Invalid Date');
    expect(inspect(/a+/g)).toBe('/a+/g');
    expect(inspect(Object(3))).toBe('[Number: 3]');
    expect(inspect(Object('s'))).toBe("[String: 's']");
    expect(inspect(new Uint8Array([1, 2]))).toBe('Uint8Array(2) [ 1, 2 ]');
  });

  it('quotes nested strings and escapes them', () => {
    expect(inspect(["it's", 'say "hi"', 'a\nb'])).toBe(`[ "it's", 'say "hi"', 'a\\nb' ]`);
  });

  it('stops at depth 2 like Node', () => {
    expect(inspect({ a: { b: { c: { d: 1 } } } })).toBe('{ a: { b: { c: [Object] } } }');
    expect(inspect([[[[1]]]])).toBe('[ [ [ [Array] ] ] ]');
  });
});

describe('formatLogArguments', () => {
  it('prints top-level strings raw and everything else inspected', () => {
    expect(
      formatLogArguments([[1, undefined, NaN], new Map([[1, 2]]), new Set([1]), { a: undefined }, -0, 10n]),
    ).toBe('[ 1, undefined, NaN ] Map(1) { 1 => 2 } Set(1) { 1 } { a: undefined } -0 10n');
    expect(formatLogArguments(['Olá', 1, { a: 1 }])).toBe('Olá 1 { a: 1 }');
  });

  it('applies printf-style substitutions of a leading string', () => {
    expect(formatLogArguments(['%s has %d items (%i%%)', 'cart', 3.5, 42.9])).toBe('cart has 3.5 items (42%)');
    expect(formatLogArguments(['%o and %f', { a: 1 }, '2.5', 'extra'])).toBe('{ a: 1 } and 2.5 extra');
    expect(formatLogArguments(['%c styled', 'color: red'])).toBe(' styled');
    expect(formatLogArguments(['100%', 1])).toBe('100% 1');
  });
});
