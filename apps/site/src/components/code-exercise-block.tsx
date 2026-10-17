import { parseLessonCodePayload, type LessonBlockContent } from '@birb-learn/content-schema';
import { highlightCode } from '@birb-learn/code-ui';
import { compileLessonMdx } from '@/lib/compile-lesson-mdx';
import { CodeExerciseClient } from './code-exercise-client';

/**
 * Server half of a `code_exercise` block: highlights the starter code and the
 * solution and compiles the prompt, resolution and hints MDX at build time, so
 * the client island ships neither Shiki nor the MDX compiler. (The MDX crosses
 * as elements, not HTML strings: a Server Component cannot import
 * `react-dom/server`, and elements need no `dangerouslySetInnerHTML`.)
 *
 * A malformed payload throws (from `parseLessonCodePayload`), failing the build.
 */
export async function CodeExerciseBlock({ block }: { block: LessonBlockContent }) {
  const parsed = parseLessonCodePayload(block);
  if (parsed?.kind !== 'task') {
    throw new Error(`Block ${block.id} is not a code exercise`);
  }
  const { codeKind, language, payload } = parsed;
  // Grading never reads the solution or the raw hints, and the client gets both rendered (tokens, nodes) anyway.
  const { solution: _solution, hints: _hints, ...clientPayload } = payload;

  const [starterTokens, solutionTokens, prompt, resolution, hints] = await Promise.all([
    highlightCode(payload.starterCode, language),
    payload.solution === undefined ? undefined : highlightCode(payload.solution, language),
    compileLessonMdx(block.promptMdx ?? ''),
    block.resolutionMdx ? compileLessonMdx(block.resolutionMdx) : undefined,
    Promise.all(payload.hints.map((hint) => compileLessonMdx(hint))),
  ]);

  return (
    <CodeExerciseClient
      kind={codeKind}
      language={language}
      starterTokens={starterTokens}
      payload={clientPayload}
      prompt={prompt}
      resolution={resolution}
      hints={hints}
      solutionTokens={solutionTokens}
    />
  );
}
