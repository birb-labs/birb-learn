import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseLessonCodePayload, type LessonBlockContent } from './queries';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function block(overrides: Partial<LessonBlockContent>): LessonBlockContent {
  return {
    id: 123,
    order: 1,
    type: 'text',
    title: null,
    bodyMdx: null,
    promptMdx: null,
    resolutionMdx: null,
    caption: null,
    simulatorKey: null,
    simulatorParams: null,
    codeKind: null,
    codeLanguage: null,
    payloadJson: null,
    ...overrides,
  };
}

describe('migration 0008', () => {
  const drizzleDir = path.resolve(__dirname, '../drizzle');
  const file = readdirSync(drizzleDir).find((name) => name.startsWith('0008_') && name.endsWith('.sql'));

  it('exists', () => {
    expect(file).toBeDefined();
  });

  // Production D1 is migrated incrementally, so the migration must only add columns and indexes.
  it('is additive only: no table rebuild and no drops', () => {
    const sql = readFileSync(path.join(drizzleDir, file!), 'utf8');
    expect(sql).not.toMatch(/__new/);
    expect(sql).not.toMatch(/DROP TABLE/i);
    expect(sql).not.toMatch(/CREATE TABLE/i);
  });
});

describe('parseLessonCodePayload', () => {
  it('returns null for a non-code block', () => {
    expect(parseLessonCodePayload(block({ type: 'text', bodyMdx: 'hi' }))).toBeNull();
  });

  it('parses a valid snippet', () => {
    const parsed = parseLessonCodePayload(
      block({
        type: 'code_snippet',
        payloadJson: JSON.stringify({ variants: [{ language: 'python', code: 'print(1)', runnable: true }] }),
      }),
    );
    expect(parsed?.kind).toBe('snippet');
    if (parsed?.kind !== 'snippet') throw new Error('expected a snippet');
    expect(parsed.payload.variants[0].language).toBe('python');
    expect(parsed.payload.variants[0].annotations).toEqual([]);
  });

  it('parses a valid task and returns its kind and language', () => {
    const parsed = parseLessonCodePayload(
      block({
        type: 'code_exercise',
        codeKind: 'predict_output',
        codeLanguage: 'javascript',
        payloadJson: JSON.stringify({ starterCode: 'console.log(1)', expectedOutput: '1' }),
      }),
    );
    expect(parsed).toMatchObject({ kind: 'task', codeKind: 'predict_output', language: 'javascript' });
  });

  it('throws naming the block for malformed JSON', () => {
    expect(() => parseLessonCodePayload(block({ type: 'code_snippet', payloadJson: '{nope' }))).toThrow(/block 123/);
  });

  it('throws naming the block for a missing payload', () => {
    expect(() => parseLessonCodePayload(block({ type: 'code_snippet', payloadJson: null }))).toThrow(/block 123/);
  });

  it('throws naming the block when zod validation fails', () => {
    expect(() =>
      parseLessonCodePayload(block({ type: 'code_snippet', payloadJson: JSON.stringify({ variants: [] }) })),
    ).toThrow(/block 123/);
  });

  it('throws naming the block when the cross-field validator fails', () => {
    // A write task needs a solution and at least one test.
    expect(() =>
      parseLessonCodePayload(
        block({
          type: 'code_exercise',
          codeKind: 'write',
          codeLanguage: 'python',
          payloadJson: JSON.stringify({ starterCode: '' }),
        }),
      ),
    ).toThrow(/block 123.*solution/);
  });

  it('throws naming the block when a snippet fails the cross-field validator', () => {
    expect(() =>
      parseLessonCodePayload(
        block({
          type: 'code_snippet',
          payloadJson: JSON.stringify({
            variants: [{ language: 'python', code: 'x', annotations: [{ lines: '5', mdx: 'n' }] }],
          }),
        }),
      ),
    ).toThrow(/block 123.*past the end/);
  });

  it('throws when a code_exercise has no kind or language', () => {
    expect(() =>
      parseLessonCodePayload(block({ type: 'code_exercise', payloadJson: JSON.stringify({ starterCode: '' }) })),
    ).toThrow(/block 123/);
  });
});
