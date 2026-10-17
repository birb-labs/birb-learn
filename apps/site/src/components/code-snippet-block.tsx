import { parseLessonCodePayload, parseLineRange, type LessonBlockContent } from '@birb-learn/content-schema';
import { highlightCode } from '@birb-learn/code-ui';
import { compileLessonMdx } from '@/lib/compile-lesson-mdx';
import { CodeSnippetInteractive, type SnippetNote, type SnippetVariant } from './code-snippet-interactive';
import styles from './code-snippet-block.module.css';

async function compileNote(note: { lines: string; mdx: string }): Promise<SnippetNote> {
  const { start, end } = parseLineRange(note.lines);
  return { start, end, content: await compileLessonMdx(note.mdx) };
}

/**
 * Server half of a `code_snippet` block: highlights every variant and compiles
 * the annotation and walkthrough MDX at build time, so the client island receives
 * highlighted tokens and rendered notes and ships neither Shiki nor the MDX compiler.
 * (The notes cross as elements, not HTML strings: a Server Component cannot import
 * `react-dom/server`, and elements need no `dangerouslySetInnerHTML`.)
 *
 * A malformed payload throws (from `parseLessonCodePayload`), failing the build.
 */
export async function CodeSnippetBlock({ block }: { block: LessonBlockContent }) {
  const parsed = parseLessonCodePayload(block);
  if (parsed?.kind !== 'snippet') {
    throw new Error(`Block ${block.id} is not a code snippet`);
  }

  const variants: SnippetVariant[] = await Promise.all(
    parsed.payload.variants.map(async (variant) => ({
      language: variant.language,
      code: variant.code,
      lines: await highlightCode(variant.code, variant.language),
      annotations: await Promise.all(variant.annotations.map(compileNote)),
      walkthrough: await Promise.all(variant.walkthrough.map(compileNote)),
      runnable: variant.runnable,
      stdin: variant.stdin,
      sqlSetup: variant.sqlSetup,
    })),
  );

  return (
    <figure className={styles.figure}>
      <CodeSnippetInteractive variants={variants} />
      {block.caption && <figcaption className={styles.caption}>{block.caption}</figcaption>}
    </figure>
  );
}
