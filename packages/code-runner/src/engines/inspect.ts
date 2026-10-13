// A small, single-line take on Node's `util.inspect` / `util.format`, used by
// the JavaScript runtime's `console`. It follows Node's notation for the values
// students meet (`[ 1, undefined ]`, `{ a: 1 }`, `Map(1) { 1 => 2 }`, `-0`,
// `10n`, `[Circular *1]`, ...) but never breaks a value over several lines.

// Like Node: deeper objects show as `[Object]`, longer arrays are cut.
const MAX_DEPTH = 2;
const MAX_ITEMS = 100;

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

const ESCAPES: Record<string, string> = { '\n': '\\n', '\t': '\\t', '\r': '\\r', '\b': '\\b', '\f': '\\f', '\v': '\\v' };

/** A string as Node shows it inside a value: single quotes unless the text contains them. */
function quote(text: string): string {
  const mark = !text.includes("'") ? "'" : !text.includes('"') ? '"' : !text.includes('`') ? '`' : "'";
  let quoted = '';
  for (const char of text) {
    if (char === mark || char === '\\') quoted += `\\${char}`;
    else if (ESCAPES[char]) quoted += ESCAPES[char];
    else if (char < ' ' || char === '\x7f') quoted += `\\x${char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()}`;
    else quoted += char;
  }
  return `${mark}${quoted}${mark}`;
}

function formatPrimitive(value: unknown): string {
  switch (typeof value) {
    case 'string':
      return quote(value);
    case 'number':
      return Object.is(value, -0) ? '-0' : String(value);
    case 'bigint':
      return `${value}n`;
    case 'symbol':
      return value.toString();
    default:
      return String(value);
  }
}

function formatFunction(fn: (...args: unknown[]) => unknown): string {
  const source = Function.prototype.toString.call(fn);
  if (source.startsWith('class')) return fn.name ? `[class ${fn.name}]` : '[class (anonymous)]';
  return fn.name ? `[Function: ${fn.name}]` : '[Function (anonymous)]';
}

function formatKey(key: string | symbol): string {
  if (typeof key === 'symbol') return key.toString();
  return IDENTIFIER.test(key) ? key : quote(key);
}

/** `{ a: 1 }`-style body, or `{}`. */
function braces(entries: string[]): string {
  return entries.length === 0 ? '{}' : `{ ${entries.join(', ')} }`;
}

function brackets(entries: string[]): string {
  return entries.length === 0 ? '[]' : `[ ${entries.join(', ')} ]`;
}

function constructorName(value: object, fallback: string): string {
  const proto = Object.getPrototypeOf(value) as { constructor?: { name?: unknown } } | null;
  const name = proto?.constructor?.name;
  return typeof name === 'string' && name !== '' ? name : fallback;
}

/** What Node prints before the braces of an object: nothing for a plain one, else its class. */
function prefixOf(value: object, plain: string): string {
  if (Object.getPrototypeOf(value) === null) return '[Object: null prototype] ';
  const name = constructorName(value, plain);
  return name === plain ? '' : `${name} `;
}

class Inspector {
  private readonly refs = new Map<object, number>();
  private readonly ancestors: object[] = [];

  format(value: unknown, depth: number): string {
    if (typeof value === 'function') return formatFunction(value as (...args: unknown[]) => unknown);
    if (typeof value !== 'object' || value === null) return formatPrimitive(value);

    if (this.ancestors.includes(value)) {
      let ref = this.refs.get(value);
      if (ref === undefined) {
        ref = this.refs.size + 1;
        this.refs.set(value, ref);
      }
      return `[Circular *${ref}]`;
    }

    const simple = this.formatSimpleObject(value);
    if (simple !== undefined) return simple;

    if (depth > MAX_DEPTH) return `[${Array.isArray(value) ? 'Array' : constructorName(value, 'Object')}]`;

    this.ancestors.push(value);
    let body: string;
    try {
      body = this.formatContainer(value, depth);
    } finally {
      this.ancestors.pop();
    }
    const ref = this.refs.get(value);
    return ref === undefined ? body : `<ref *${ref}> ${body}`;
  }

  /** Objects that print without their properties. */
  private formatSimpleObject(value: object): string | undefined {
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
    if (value instanceof RegExp) return value.toString();
    if (value instanceof Number) return `[Number: ${formatPrimitive(value.valueOf())}]`;
    if (value instanceof String) return `[String: ${quote(value.valueOf())}]`;
    if (value instanceof Boolean) return `[Boolean: ${value.valueOf()}]`;
    return undefined;
  }

  private formatContainer(value: object, depth: number): string {
    const next = depth + 1;
    if (Array.isArray(value)) return prefixOf(value, 'Array') + brackets(this.arrayItems(value, next));
    if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
      const typed = value as unknown as ArrayLike<unknown>;
      return `${constructorName(value, 'TypedArray')}(${typed.length}) ${brackets(this.arrayItems(Array.from(typed), next))}`;
    }
    if (value instanceof Map) {
      const entries = [...value].map(([key, item]) => `${this.format(key, next)} => ${this.format(item, next)}`);
      return `${constructorName(value, 'Map')}(${value.size}) ${braces(entries)}`;
    }
    if (value instanceof Set) {
      const entries = [...value].map((item) => this.format(item, next));
      return `${constructorName(value, 'Set')}(${value.size}) ${braces(entries)}`;
    }
    return prefixOf(value, 'Object') + braces(this.properties(value, next));
  }

  private arrayItems(items: unknown[], depth: number): string[] {
    const shown: string[] = [];
    let holes = 0;
    const flushHoles = () => {
      if (holes > 0) shown.push(`<${holes} empty item${holes === 1 ? '' : 's'}>`);
      holes = 0;
    };
    const limit = Math.min(items.length, MAX_ITEMS);
    for (let index = 0; index < limit; index += 1) {
      if (!(index in items)) {
        holes += 1;
        continue;
      }
      flushHoles();
      shown.push(this.format(items[index], depth));
    }
    flushHoles();
    const rest = items.length - limit;
    if (rest > 0) shown.push(`... ${rest} more item${rest === 1 ? '' : 's'}`);
    return shown;
  }

  /** Own enumerable properties; accessors are shown, not called. */
  private properties(value: object, depth: number): string[] {
    const keys: (string | symbol)[] = [
      ...Object.keys(value),
      ...Object.getOwnPropertySymbols(value).filter((key) => Object.prototype.propertyIsEnumerable.call(value, key)),
    ];
    return keys.map((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      let shown: string;
      if (descriptor && !('value' in descriptor)) {
        shown = descriptor.get && descriptor.set ? '[Getter/Setter]' : descriptor.get ? '[Getter]' : '[Setter]';
      } else {
        shown = this.format(descriptor?.value, depth);
      }
      return `${formatKey(key)}: ${shown}`;
    });
  }
}

/** A value as Node's `util.inspect` shows it, on one line. */
export function inspect(value: unknown): string {
  return new Inspector().format(value, 0);
}

const SPECIFIER = /%[sdifjoOc%]/g;

/** One `%` substitution of `util.format`. */
function substitute(specifier: string, arg: unknown): string {
  switch (specifier) {
    case '%s':
      if (typeof arg === 'string') return arg;
      return typeof arg === 'object' || typeof arg === 'function' ? inspect(arg) : formatPrimitive(arg);
    case '%d':
      return typeof arg === 'bigint' ? `${arg}n` : typeof arg === 'symbol' ? 'NaN' : formatPrimitive(Number(arg));
    case '%i':
      return typeof arg === 'bigint' ? `${arg}n` : formatPrimitive(Number.parseInt(String(arg), 10));
    case '%f':
      return formatPrimitive(Number.parseFloat(String(arg)));
    case '%j':
      try {
        return JSON.stringify(arg) ?? 'undefined';
      } catch {
        return '[Circular]';
      }
    case '%c':
      return '';
    default:
      return inspect(arg);
  }
}

/**
 * The line `console.log(...args)` prints, like Node: a leading string may hold
 * `%s`/`%d`/`%i`/`%f`/`%j`/`%o`/`%O`/`%c` substitutions; then strings print raw
 * and other values inspected, separated by spaces.
 */
export function formatLogArguments(args: unknown[]): string {
  let rest = args;
  const parts: string[] = [];
  if (typeof args[0] === 'string' && args.length > 1 && args[0].includes('%')) {
    let next = 1;
    parts.push(
      args[0].replace(SPECIFIER, (specifier) => {
        if (specifier === '%%') return '%';
        if (next >= args.length) return specifier;
        return substitute(specifier, args[next++]);
      }),
    );
    rest = args.slice(next);
  } else if (args.length > 0) {
    parts.push(typeof args[0] === 'string' ? args[0] : inspect(args[0]));
    rest = args.slice(1);
  }
  for (const arg of rest) parts.push(typeof arg === 'string' ? arg : inspect(arg));
  return parts.join(' ');
}
