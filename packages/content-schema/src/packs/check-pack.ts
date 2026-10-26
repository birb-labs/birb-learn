// Whole-bundle checks for content packs. Pure (no file system), so the admin
// Worker can run it on a bundle POSTed to /api/import.
import type { z } from 'zod';
import type { CodeKind, Language } from '../code-languages';
import { CodeSnippetPayload, CodeTaskPayload, formatZodIssues, validateCodeSnippet, validateCodeTask } from '../code-payloads';
import { LOCALES } from '../schema';
import {
  lookupLine,
  type PackBundle,
  type PackLesson,
  type PackProblem,
  type PackQuestion,
  type PackSource,
  type PackTag,
} from './pack-schemas';

/**
 * Checks what needs the whole bundle: unique slugs and question keys, tag
 * references, that every lesson and question sits in a directory declared in
 * `_tree.yaml`, that every item has a pt-BR translation, that translations
 * match their item's structure, and the code payload cross-field rules
 * (`validateCodeSnippet` / `validateCodeTask`). Returns every problem found.
 */
export function checkPack(bundle: PackBundle): PackProblem[] {
  const problems: PackProblem[] = [];
  checkUniqueSlugs(bundle, problems);
  checkTagParents(bundle.tags, problems);
  for (const lesson of bundle.lessons) checkLesson(bundle, lesson, problems);
  for (const question of bundle.questions) checkQuestion(bundle, question, problems);
  return problems;
}

function formatSource(source: PackSource): string {
  return source.line === undefined ? source.file : `${source.file}:${source.line}`;
}

function problemAt(source: PackSource, message: string): PackProblem {
  return source.line === undefined ? { file: source.file, message } : { file: source.file, line: source.line, message };
}

// ---------------------------------------------------------------------------
// Uniqueness
// ---------------------------------------------------------------------------

// Every slug column (and `questions.key`) is unique across its whole table.
function checkUniqueSlugs(bundle: PackBundle, problems: PackProblem[]): void {
  const tables: { label: string; items: { slug: string; source: PackSource }[] }[] = [
    { label: 'discipline slug', items: bundle.disciplines },
    { label: 'subject slug', items: bundle.subjects },
    { label: 'topic slug', items: bundle.topics },
    { label: 'section slug', items: bundle.sections },
    { label: 'tag slug', items: bundle.tags },
    { label: 'lesson slug', items: bundle.lessons.map((lesson) => ({ slug: lesson.slug, source: { file: lessonFile(lesson) } })) },
    {
      label: 'question key',
      items: bundle.questions.map((question) => ({ slug: question.key, source: { file: questionFile(question) } })),
    },
  ];

  for (const { label, items } of tables) {
    const first = new Map<string, PackSource>();
    for (const item of items) {
      const existing = first.get(item.slug);
      if (!existing) {
        first.set(item.slug, item.source);
        continue;
      }
      const where = existing.line === undefined ? `by ${existing.file}` : `at ${formatSource(existing)}`;
      problems.push(problemAt(item.source, `${label} "${item.slug}" is already used ${where}`));
    }
  }
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

function tagsOfSubject(tags: PackTag[], subjectSlug: string): Map<string, PackTag> {
  return new Map(tags.filter((tag) => tag.subjectSlug === subjectSlug).map((tag) => [tag.slug, tag]));
}

function checkTagParents(tags: PackTag[], problems: PackProblem[]): void {
  for (const tag of tags) {
    if (tag.parentSlug === null) continue;
    const subjectTags = tagsOfSubject(tags, tag.subjectSlug);
    if (!subjectTags.has(tag.parentSlug)) {
      problems.push(
        problemAt(tag.source, `tag "${tag.slug}": unknown parent tag "${tag.parentSlug}" in subject "${tag.subjectSlug}"`),
      );
      continue;
    }

    // Walk up the parents; reaching this tag again is a loop.
    const chain = [tag.slug];
    for (let current = subjectTags.get(tag.parentSlug); current; current = current.parentSlug === null ? undefined : subjectTags.get(current.parentSlug)) {
      chain.push(current.slug);
      if (current.slug === tag.slug) {
        problems.push(problemAt(tag.source, `tag "${tag.slug}": its parents loop back to itself (${chain.join(' -> ')})`));
        break;
      }
      if (chain.length > subjectTags.size + 1) break; // a loop that does not include this tag
    }
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** The file to report item-level problems on: the pt-BR one, else the first locale present. */
function firstFile(translations: Partial<Record<string, { file: string }>>, fallback: string): string {
  for (const locale of LOCALES) {
    const translation = translations[locale];
    if (translation) return translation.file;
  }
  return fallback;
}

function lessonFile(lesson: PackLesson): string {
  return firstFile(
    lesson.translations,
    `${lesson.disciplineSlug}/${lesson.subjectSlug}/${lesson.topicSlug}/${lesson.sectionSlug}/`,
  );
}

function questionFile(question: PackQuestion): string {
  return firstFile(question.translations, `${question.disciplineSlug}/${question.subjectSlug}/questions/`);
}

/** "01-my-lesson.en-US.yaml" becomes "01-my-lesson.pt-BR.yaml". */
function ptBrFileName(file: string): string {
  const name = file.slice(file.lastIndexOf('/') + 1);
  return name.replace(/\.[^.]+\.yaml$/, '.pt-BR.yaml');
}

function treeFile(disciplineSlug: string): string {
  return `${disciplineSlug}/_tree.yaml`;
}

/** Checks the subject chain; returns a problem message when a level is missing from the tree. */
function findSubjectProblem(bundle: PackBundle, disciplineSlug: string, subjectSlug: string): string | null {
  if (!bundle.disciplines.some((discipline) => discipline.slug === disciplineSlug)) {
    return `discipline "${disciplineSlug}" is not defined; add ${treeFile(disciplineSlug)}`;
  }
  if (!bundle.subjects.some((subject) => subject.slug === subjectSlug && subject.disciplineSlug === disciplineSlug)) {
    return `subject "${subjectSlug}" is not in ${treeFile(disciplineSlug)}`;
  }
  return null;
}

const PATH_PATTERN = /^[A-Za-z_$][\w$]*(?:\[\d+\]|\.[A-Za-z_$][\w$]*)*$/;

/** Splits "variants[0].runnable: message" into its path and message, when it has one. */
function splitPath(message: string): { path: string; detail: string } {
  const colon = message.indexOf(': ');
  if (colon > 0 && PATH_PATTERN.test(message.slice(0, colon))) {
    return { path: message.slice(0, colon), detail: message.slice(colon + 2) };
  }
  return { path: '', detail: message };
}

function joinPath(prefix: string, path: string): string {
  if (prefix === '') return path;
  if (path === '') return prefix;
  return path.startsWith('[') ? `${prefix}${path}` : `${prefix}.${path}`;
}

/**
 * Turns code-check messages into problems. `prefix` is where the payload sits
 * in the file ("blocks[2]", or "" for a question); `lines` is indexed relative
 * to it, and `fallbackLine` is used when no line is recorded for the path.
 */
function codeProblems(
  messages: string[],
  file: string,
  prefix: string,
  lines: Record<string, number>,
  fallbackLine: number | undefined,
): PackProblem[] {
  return messages.map((message) => {
    const { path, detail } = splitPath(message);
    const line = (path === '' ? undefined : lookupLine(lines, path)) ?? fallbackLine;
    const fullPath = joinPath(prefix, path);
    const text = fullPath === '' ? detail : `${fullPath}: ${detail}`;
    return line === undefined ? { file, message: text } : { file, line, message: text };
  });
}

/** Parses stored payload JSON; returns the data or the reasons it is invalid. */
function parsePayload<S extends z.ZodType>(schema: S, json: string | null): { data: z.output<S> } | { errors: string[] } {
  if (json === null) return { errors: ['the code payload is missing'] };
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return { errors: ['the code payload is not valid JSON'] };
  }
  const result = schema.safeParse(value);
  return result.success ? { data: result.data } : { errors: formatZodIssues(result.error.issues, value) };
}

function codeTaskMessages(kind: CodeKind | null, language: Language | null, json: string | null): string[] {
  if (kind === null) return ['kind: required for a code task'];
  if (language === null) return ['language: required for a code task'];
  const parsed = parsePayload(CodeTaskPayload, json);
  return 'errors' in parsed ? parsed.errors : validateCodeTask(kind, language, parsed.data);
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

function findSectionProblem(bundle: PackBundle, lesson: PackLesson): string | null {
  const subjectProblem = findSubjectProblem(bundle, lesson.disciplineSlug, lesson.subjectSlug);
  if (subjectProblem) return subjectProblem;
  const tree = treeFile(lesson.disciplineSlug);
  if (!bundle.topics.some((topic) => topic.slug === lesson.topicSlug && topic.subjectSlug === lesson.subjectSlug)) {
    return `topic "${lesson.topicSlug}" is not in ${tree} under subject "${lesson.subjectSlug}"`;
  }
  if (!bundle.sections.some((section) => section.slug === lesson.sectionSlug && section.topicSlug === lesson.topicSlug)) {
    return `section "${lesson.sectionSlug}" is not in ${tree} under topic "${lesson.topicSlug}"`;
  }
  return null;
}

function checkLesson(bundle: PackBundle, lesson: PackLesson, problems: PackProblem[]): void {
  const file = lessonFile(lesson);
  const sectionProblem = findSectionProblem(bundle, lesson);
  if (sectionProblem) problems.push({ file, message: sectionProblem });
  if (!lesson.translations['pt-BR']) {
    problems.push({ file, message: `lesson "${lesson.slug}" has no valid pt-BR file (${ptBrFileName(file)})` });
  }

  for (const locale of LOCALES) {
    const translation = lesson.translations[locale];
    if (!translation) continue;
    if (translation.blocks.length !== lesson.blocks.length) {
      problems.push({
        file: translation.file,
        message: `blocks: ${translation.blocks.length} block translations but the lesson has ${lesson.blocks.length} blocks`,
      });
      continue;
    }

    lesson.blocks.forEach((block, index) => {
      const blockTranslation = translation.blocks[index];
      let messages: string[] = [];
      if (block.type === 'code_snippet') {
        const parsed = parsePayload(CodeSnippetPayload, blockTranslation.payloadJson);
        messages = 'errors' in parsed ? parsed.errors : validateCodeSnippet(parsed.data);
      } else if (block.type === 'code_exercise') {
        messages = codeTaskMessages(block.codeKind, block.codeLanguage, blockTranslation.payloadJson);
      }
      problems.push(
        ...codeProblems(messages, translation.file, `blocks[${index}]`, blockTranslation.lines, blockTranslation.line),
      );
    });
  }
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

function checkQuestion(bundle: PackBundle, question: PackQuestion, problems: PackProblem[]): void {
  const file = questionFile(question);
  const authority = LOCALES.map((locale) => question.translations[locale]).find((translation) => translation !== undefined);

  const subjectProblem = findSubjectProblem(bundle, question.disciplineSlug, question.subjectSlug);
  if (subjectProblem) problems.push({ file, message: subjectProblem });
  if (!question.translations['pt-BR']) {
    problems.push({ file, message: `question "${question.key}" has no valid pt-BR file (${ptBrFileName(file)})` });
  }

  if (!subjectProblem) {
    const subjectTags = tagsOfSubject(bundle.tags, question.subjectSlug);
    const known = [...subjectTags.keys()];
    question.tagSlugs.forEach((slug, index) => {
      if (subjectTags.has(slug)) return;
      const path = `tags[${index}]`;
      const defined = known.length === 0 ? 'defines no tags' : `defines: ${known.join(', ')}`;
      const line = authority ? lookupLine(authority.lines, path) : undefined;
      const message = `${path}: unknown tag "${slug}"; subject "${question.subjectSlug}" ${defined}`;
      problems.push(line === undefined ? { file, message } : { file, line, message });
    });
  }

  for (const locale of LOCALES) {
    const translation = question.translations[locale];
    if (!translation) continue;
    if (translation.options.length !== question.options.length) {
      problems.push({
        file: translation.file,
        message: `options: ${translation.options.length} option texts but the question has ${question.options.length} options`,
      });
    }
    if (translation.matchingPairs.length !== question.matchingPairCount) {
      problems.push({
        file: translation.file,
        message: `pairs: ${translation.matchingPairs.length} pair texts but the question has ${question.matchingPairCount} pairs`,
      });
    }
    if (question.type === 'code') {
      const messages = codeTaskMessages(question.codeKind, question.codeLanguage, translation.codeJson);
      problems.push(...codeProblems(messages, translation.file, '', translation.lines, undefined));
    }
  }
}
