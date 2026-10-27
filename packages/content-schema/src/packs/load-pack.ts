// Node-only: reads a content root from disk. Import it by deep path
// (`@birb-learn/content-schema/src/packs/load-pack`); it is deliberately not in
// the package barrel, which the admin Worker bundles. See spec §11.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { isMap, isScalar, isSeq, LineCounter, parseDocument, type Document } from 'yaml';
import type { z } from 'zod';
import { formatZodIssues } from '../code-payloads';
import { LESSON_BLOCK_TYPES, LOCALES, type LessonBlockType, type Locale } from '../schema';
import { mergeLesson, mergeQuestion, type LessonFile, type LessonFileBlock, type QuestionFile, type QuestionStructure } from './merge-locales';
import {
  emptyBundle,
  LESSON_BLOCK_SCHEMAS,
  LessonFileSchema,
  packIssueMessage,
  QUESTION_SCHEMAS,
  QUESTION_TYPES,
  SLUG_PATTERN,
  TreeDisciplineSchema,
  TreeFileSchema,
  TreeSectionSchema,
  TreeSubjectSchema,
  TreeTagSchema,
  TreeTopicSchema,
  type LessonBlockData,
  type PackBundle,
  type PackLessonBlock,
  type PackLessonBlockTranslation,
  type PackProblem,
  type PackQuestionTranslation,
  type QuestionData,
  type QuestionType,
} from './pack-schemas';

const TREE_FILE = '_tree.yaml';
const QUESTIONS_DIR = 'questions';
const LESSON_FILE_PATTERN = /^(\d+)-(.+)\.([^.]+)\.yaml$/;
const QUESTION_FILE_PATTERN = /^(.+)\.([^.]+)\.yaml$/;
const LOCALE_LIST = LOCALES.join(', ');

type PathSegment = string | number;

/**
 * Reads every pack under `rootDir` (the `content/` directory): one
 * `<discipline>/_tree.yaml` per discipline, lesson files at
 * `<discipline>/<subject>/<topic>/<section>/<order>-<slug>.<locale>.yaml` and
 * question files at `<discipline>/<subject>/questions/<key>.<locale>.yaml`.
 *
 * Every problem is collected; a file or tree entry with problems is left out of
 * the bundle and the rest still loads. Bad content never throws, only I/O
 * failures do. A missing `rootDir` is an empty bundle with no problems. Run
 * `checkPack` on the bundle for the checks that need all of it.
 */
export async function loadPacks(rootDir: string): Promise<{ bundle: PackBundle; problems: PackProblem[] }> {
  const bundle = emptyBundle();
  const problems: PackProblem[] = [];

  const rootStat = await statOrNull(rootDir);
  if (rootStat === null) return { bundle, problems };
  if (!rootStat.isDirectory()) {
    problems.push({ file: rootDir, message: 'expected the content directory, but this is a file' });
    return { bundle, problems };
  }

  const entries = await listEntries(rootDir);
  const lessonGroups = new Map<string, LessonFile[]>();
  const questionGroups = new Map<string, QuestionFile[]>();
  const disciplineDirs = new Set<string>();
  const treeDirs = new Set<string>();

  for (const entry of entries) {
    const file = entry.path;
    const parts = file.split('/');
    if (parts.length > 1) disciplineDirs.add(parts[0]);
    if (!entry.regularFile) {
      problems.push({ file, message: SPECIAL_ENTRY_MESSAGE });
      continue;
    }

    // Classify by name before reading, so a stray binary is never parsed.
    const kind = classify(parts);
    if (kind === 'ignored') continue;
    if (kind === 'unexpected') {
      problems.push({ file, message: unexpectedFileMessage(parts[parts.length - 1]) });
      continue;
    }

    if (kind === 'tree') {
      treeDirs.add(parts[0]);
      const yaml = parseYamlFile(file, await readFile(path.join(rootDir, file), 'utf8'), problems);
      if (yaml) loadTree(yaml, parts[0], bundle, problems);
    } else if (kind === 'lesson') {
      const name = parseLessonName(file, parts[4], problems);
      const yaml = name && parseYamlFile(file, await readFile(path.join(rootDir, file), 'utf8'), problems);
      const lesson = yaml && name && loadLessonFile(yaml, parts, name, problems);
      if (lesson) pushToGroup(lessonGroups, `${parts.slice(0, 4).join('/')}/${lesson.slug}`, lesson);
    } else {
      const name = parseQuestionName(file, parts[3], problems);
      const yaml = name && parseYamlFile(file, await readFile(path.join(rootDir, file), 'utf8'), problems);
      const question = yaml && name && loadQuestionFile(yaml, parts, name, problems);
      if (question) pushToGroup(questionGroups, `${parts.slice(0, 2).join('/')}/${question.key}`, question);
    }
  }

  for (const dir of disciplineDirs) {
    if (!treeDirs.has(dir)) {
      problems.push({
        file: `${dir}/${TREE_FILE}`,
        message: `missing: the discipline directory "${dir}" needs a ${TREE_FILE} with its subjects, topics and sections`,
      });
    }
  }

  for (const group of lessonGroups.values()) bundle.lessons.push(mergeLesson(group, problems));
  for (const group of questionGroups.values()) bundle.questions.push(mergeQuestion(group, problems));

  return { bundle, problems };
}

// ---------------------------------------------------------------------------
// Files and YAML
// ---------------------------------------------------------------------------

const EXPECTED_FILES =
  'packs only hold <discipline>/_tree.yaml, ' +
  '<discipline>/<subject>/<topic>/<section>/<order>-<lesson-slug>.<locale>.yaml and ' +
  '<discipline>/<subject>/questions/<question-key>.<locale>.yaml';

const SPECIAL_ENTRY_MESSAGE =
  'unexpected entry: symbolic links and special files are not read; copy the real file or directory into the pack';

function unexpectedFileMessage(name: string): string {
  if (name.endsWith('.yml')) return `unexpected file: pack files end in .yaml; rename it to ${name.slice(0, -'.yml'.length)}.yaml`;
  return `unexpected file: ${EXPECTED_FILES}`;
}

async function statOrNull(target: string) {
  try {
    return await stat(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

interface Entry {
  /** Relative to the root, with `/` separators. */
  path: string;
  /** False for symbolic links, sockets and other special files, which are never read. */
  regularFile: boolean;
}

/** Every entry under `rootDir` except directories, sorted by path. Dotfiles are skipped. */
async function listEntries(rootDir: string, relative = ''): Promise<Entry[]> {
  const dirents = await readdir(path.join(rootDir, relative), { withFileTypes: true });
  const entries: Entry[] = [];
  for (const dirent of dirents) {
    if (dirent.name.startsWith('.')) continue;
    const child = relative === '' ? dirent.name : `${relative}/${dirent.name}`;
    // `Dirent` describes the link itself, so a symbolic link is never followed here.
    if (dirent.isDirectory()) entries.push(...(await listEntries(rootDir, child)));
    else entries.push({ path: child, regularFile: dirent.isFile() });
  }
  return entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

function classify(parts: string[]): 'tree' | 'lesson' | 'question' | 'ignored' | 'unexpected' {
  const name = parts[parts.length - 1];
  if (name.endsWith('.md')) return 'ignored'; // notes and READMEs may sit next to the packs
  if (parts.length === 2 && name === TREE_FILE) return 'tree';
  if (!name.endsWith('.yaml')) return 'unexpected';
  if (parts.length === 4 && parts[2] === QUESTIONS_DIR) return 'question';
  if (parts.length === 5) return 'lesson';
  return 'unexpected';
}

function pushToGroup<T>(groups: Map<string, T[]>, key: string, item: T): void {
  const group = groups.get(key);
  if (group) group.push(item);
  else groups.set(key, [item]);
}

// Likely fixes for the YAML mistakes authors make most.
const YAML_ERROR_HINTS: Partial<Record<string, string>> = {
  TAB_AS_INDENT: 'indent with spaces',
  BLOCK_AS_IMPLICIT_KEY: 'quote a value that contains ": ", or write it as a block with |',
  MULTILINE_IMPLICIT_KEY: 'quote a value that contains ": ", or write it as a block with |',
  DUPLICATE_KEY: 'each field may appear only once per mapping',
};

interface YamlFile {
  file: string;
  doc: Document;
  value: unknown;
  lineCounter: LineCounter;
}

/** Parses one file, reporting syntax errors (one problem per line); null when unusable. */
function parseYamlFile(file: string, text: string, problems: PackProblem[]): YamlFile | null {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { lineCounter, prettyErrors: false });

  if (doc.errors.length > 0) {
    // One mistake often yields several errors on the same line; report each line once.
    const errorsByLine = new Map<number, Map<string, string>>();
    for (const error of doc.errors) {
      const { line, col } = lineCounter.linePos(error.pos[0]);
      const errors = errorsByLine.get(line) ?? new Map<string, string>();
      if (!errors.has(error.message)) {
        const hint = YAML_ERROR_HINTS[error.code];
        errors.set(error.message, `${error.message} (column ${col})${hint ? `; ${hint}` : ''}`);
      }
      errorsByLine.set(line, errors);
    }
    for (const [line, errors] of errorsByLine) {
      problems.push({ file, line, message: `YAML syntax error: ${[...errors.values()].join('; ')}` });
    }
    return null;
  }
  for (const warning of doc.warnings) {
    problems.push({ file, line: lineCounter.linePos(warning.pos[0]).line, message: `YAML warning: ${warning.message}` });
  }
  if (doc.contents === null) {
    problems.push({ file, line: 1, message: 'the file is empty' });
    return null;
  }

  try {
    return { file, doc, value: doc.toJS(), lineCounter };
  } catch (error) {
    // For example an alias expanding into too many nodes.
    problems.push({ file, message: `YAML error: ${error instanceof Error ? error.message : String(error)}` });
    return null;
  }
}

function lineOfNode(yaml: YamlFile, node: unknown): number | undefined {
  const range = (node as { range?: [number, number, number] } | null)?.range;
  return range ? yaml.lineCounter.linePos(range[0]).line : undefined;
}

/**
 * The line of `path` in the file: the key's own line for a mapping entry, the
 * item's line for a list entry. A path that does not exist (a missing field)
 * resolves to its deepest existing ancestor.
 */
function lineAt(yaml: YamlFile, segments: readonly PropertyKey[]): number | undefined {
  let node: unknown = yaml.doc.contents;
  let line = lineOfNode(yaml, node);
  for (const segment of segments) {
    if (isMap(node)) {
      const pair = node.items.find((item) => isScalar(item.key) && String(item.key.value) === String(segment));
      if (!pair) break;
      line = lineOfNode(yaml, pair.key) ?? line;
      node = pair.value;
    } else if (isSeq(node) && typeof segment === 'number' && segment < node.items.length) {
      node = node.items[segment];
      line = lineOfNode(yaml, node) ?? line;
    } else {
      break;
    }
  }
  return line;
}

/** Line of every field under the node at `segments`, keyed by path relative to it ("tests[0].stdin"). */
function indexLines(yaml: YamlFile, segments: readonly PathSegment[]): Record<string, number> {
  const lines: Record<string, number> = {};
  const visit = (node: unknown, prefix: string) => {
    if (isMap(node)) {
      for (const pair of node.items) {
        if (!isScalar(pair.key)) continue;
        const key = String(pair.key.value);
        const childPath = prefix === '' ? key : `${prefix}.${key}`;
        const line = lineOfNode(yaml, pair.key);
        if (line !== undefined) lines[childPath] = line;
        visit(pair.value, childPath);
      }
    } else if (isSeq(node)) {
      node.items.forEach((item, index) => {
        const childPath = `${prefix}[${index}]`;
        const line = lineOfNode(yaml, item);
        if (line !== undefined) lines[childPath] = line;
        visit(item, childPath);
      });
    }
  };
  visit(segments.length === 0 ? yaml.doc.contents : yaml.doc.getIn(segments, true), '');
  return lines;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parses `value` (found at `base` in the file) with `schema`. On failure every
 * issue becomes a problem with its full path and line, and null is returned.
 */
function validate<S extends z.ZodType>(
  yaml: YamlFile,
  schema: S,
  value: unknown,
  base: readonly PathSegment[],
  problems: PackProblem[],
): z.output<S> | null {
  const result = schema.safeParse(value, { error: packIssueMessage });
  if (result.success) return result.data;

  for (const issue of result.error.issues) {
    const fullPath = [...base, ...issue.path];
    // For an unknown field, point at the field rather than at its parent.
    const linePath = issue.code === 'unrecognized_keys' ? [...fullPath, issue.keys[0]] : fullPath;
    const line = lineAt(yaml, linePath);
    for (const message of formatZodIssues([{ ...issue, path: fullPath }], yaml.value)) {
      problems.push({ file: yaml.file, line, message });
    }
  }
  return null;
}

function problemAt(yaml: YamlFile, segments: readonly PathSegment[], message: string): PackProblem {
  return { file: yaml.file, line: lineAt(yaml, segments), message };
}

// "blocks", 1, "type" becomes "blocks[1].type".
function pathText(segments: readonly PathSegment[]): string {
  return segments.reduce<string>(
    (text, segment) => (typeof segment === 'number' ? `${text}[${segment}]` : text === '' ? segment : `${text}.${segment}`),
    '',
  );
}

/** Checks the `type` field against the known types; reports and returns null when it is not one. */
function checkType<T extends string>(
  yaml: YamlFile,
  raw: Record<string, unknown>,
  base: readonly PathSegment[],
  known: readonly T[],
  noun: string,
  problems: PackProblem[],
): T | null {
  const typePath = [...base, 'type'];
  const type = raw.type;
  if (type === undefined) {
    problems.push(problemAt(yaml, typePath, `${pathText(typePath)}: required (one of ${known.join(', ')})`));
    return null;
  }
  if (typeof type !== 'string' || !(known as readonly string[]).includes(type)) {
    problems.push(
      problemAt(yaml, typePath, `${pathText(typePath)}: unknown ${noun} type ${JSON.stringify(type)}; expected one of ${known.join(', ')}`),
    );
    return null;
  }
  return type as T;
}

// ---------------------------------------------------------------------------
// _tree.yaml
// ---------------------------------------------------------------------------

/** The `slug` written in a raw entry, when it is text; used to name an entry that failed validation. */
function rawSlug(raw: unknown): string | null {
  return isRecord(raw) && typeof raw.slug === 'string' && raw.slug !== '' ? raw.slug : null;
}

/** A raw child list (`topics`, `sections`, `tags`); anything else is reported by the parent's schema. */
function rawList(raw: unknown, key: string): unknown[] {
  return isRecord(raw) && Array.isArray(raw[key]) ? raw[key] : [];
}

/**
 * Loads one `_tree.yaml`. Every entry (discipline, subject, topic, section,
 * tag) is validated on its own, so a bad entry leaves out only itself; its slug
 * goes to `bundle.treeProblems` so `checkPack` does not call the items under it
 * missing. Children of a bad entry still load when its slug is readable.
 */
function loadTree(yaml: YamlFile, dirName: string, bundle: PackBundle, problems: PackProblem[]): void {
  const broken = bundle.treeProblems;
  const source = (segments: readonly PathSegment[]) => ({ file: yaml.file, line: lineAt(yaml, segments) });

  // Reports unknown top-level fields; the known ones are read below either way.
  validate(yaml, TreeFileSchema, yaml.value, [], problems);
  const rawDiscipline = isRecord(yaml.value) ? yaml.value.discipline : undefined;

  // Lessons and questions name their discipline by directory, so the tree's
  // entries hang under the directory name even when the discipline block is bad.
  const discipline = validate(yaml, TreeDisciplineSchema, rawDiscipline, ['discipline'], problems);
  if (discipline && discipline.slug !== dirName) {
    problems.push(
      problemAt(yaml, ['discipline', 'slug'], `discipline.slug: "${discipline.slug}" must match the directory name "${dirName}"`),
    );
  }
  if (discipline && discipline.slug === dirName) {
    bundle.disciplines.push({ ...discipline, source: source(['discipline']) });
  } else {
    broken.disciplines.push(dirName);
  }

  rawList(yaml.value, 'subjects').forEach((rawSubject, subjectIndex) => {
    const subjectPath = ['subjects', subjectIndex];
    const subject = validate(yaml, TreeSubjectSchema, rawSubject, subjectPath, problems);
    const subjectSlug = subject?.slug ?? rawSlug(rawSubject);
    if (subject) {
      bundle.subjects.push({
        slug: subject.slug,
        disciplineSlug: dirName,
        order: subject.order,
        names: subject.names,
        source: source(subjectPath),
      });
    } else if (subjectSlug) {
      broken.subjects.push(subjectSlug);
    }
    if (!subjectSlug) return;

    rawList(rawSubject, 'topics').forEach((rawTopic, topicIndex) => {
      const topicPath = [...subjectPath, 'topics', topicIndex];
      const topic = validate(yaml, TreeTopicSchema, rawTopic, topicPath, problems);
      const topicSlug = topic?.slug ?? rawSlug(rawTopic);
      if (topic) {
        bundle.topics.push({ slug: topic.slug, subjectSlug, order: topic.order, names: topic.names, source: source(topicPath) });
      } else if (topicSlug) {
        broken.topics.push(topicSlug);
      }
      if (!topicSlug) return;

      rawList(rawTopic, 'sections').forEach((rawSection, sectionIndex) => {
        const sectionPath = [...topicPath, 'sections', sectionIndex];
        const section = validate(yaml, TreeSectionSchema, rawSection, sectionPath, problems);
        if (section) {
          bundle.sections.push({
            slug: section.slug,
            topicSlug,
            order: section.order,
            names: section.names,
            source: source(sectionPath),
          });
        } else {
          const sectionSlug = rawSlug(rawSection);
          if (sectionSlug) broken.sections.push(sectionSlug);
        }
      });
    });

    rawList(rawSubject, 'tags').forEach((rawTag, tagIndex) => {
      const tagPath = [...subjectPath, 'tags', tagIndex];
      const tag = validate(yaml, TreeTagSchema, rawTag, tagPath, problems);
      if (tag) {
        bundle.tags.push({
          slug: tag.slug,
          subjectSlug,
          parentSlug: tag.parent ?? null,
          names: tag.names,
          source: source(tagPath),
        });
      } else {
        const tagSlug = rawSlug(rawTag);
        if (tagSlug) broken.tags.push(tagSlug);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Lesson files
// ---------------------------------------------------------------------------

/** Locale from a file name, or a problem when it is not one of ours. */
function parseLocale(file: string, locale: string, problems: PackProblem[]): Locale | null {
  if ((LOCALES as readonly string[]).includes(locale)) return locale as Locale;
  problems.push({ file, message: `unknown locale "${locale}" in the file name; expected one of ${LOCALE_LIST}` });
  return null;
}

/** What a lesson file name says. `locale` is null when it is not one of ours (already reported). */
interface LessonName {
  order: number;
  slug: string;
  locale: Locale | null;
}

/** Reads `<order>-<slug>.<locale>.yaml`; null (reported) when the file cannot be a lesson. */
function parseLessonName(file: string, name: string, problems: PackProblem[]): LessonName | null {
  const match = LESSON_FILE_PATTERN.exec(name);
  if (!match || !SLUG_PATTERN.test(match[2])) {
    problems.push({
      file,
      message: 'lesson file names look like <order>-<lesson-slug>.<locale>.yaml, for example 01-what-is-a-bit.pt-BR.yaml',
    });
    return null;
  }
  const order = Number(match[1]);
  if (order < 1) {
    problems.push({ file, message: 'the order prefix of the file name must be 1 or more' });
    return null;
  }
  // A bad locale is reported, and the content is still checked.
  return { order, slug: match[2], locale: parseLocale(file, match[3], problems) };
}

function loadLessonFile(yaml: YamlFile, parts: string[], name: LessonName, problems: PackProblem[]): LessonFile | null {
  const { order, slug: fileSlug, locale } = name;
  let ok = locale !== null;
  const top = validate(yaml, LessonFileSchema, yaml.value, [], problems);
  if (top && top.slug !== fileSlug) {
    problems.push(problemAt(yaml, ['slug'], `slug: "${top.slug}" must match the file name, which says "${fileSlug}"`));
    ok = false;
  }

  // Blocks are checked even when the top level has problems, to report everything at once.
  const rawBlocks = isRecord(yaml.value) && Array.isArray(yaml.value.blocks) ? yaml.value.blocks : [];
  const blocks = rawBlocks.map((raw, index) => loadBlock(yaml, raw, index, problems));

  if (!ok || !top || blocks.some((block) => block === null)) return null;
  return {
    file: yaml.file,
    locale: locale!,
    order,
    slug: fileSlug,
    dirParts: parts.slice(0, 4),
    title: top.title,
    blocksLine: lineAt(yaml, ['blocks']),
    blocks: blocks as LessonFileBlock[],
  };
}

function loadBlock(yaml: YamlFile, raw: unknown, index: number, problems: PackProblem[]): LessonFileBlock | null {
  const base = ['blocks', index];
  if (!isRecord(raw)) {
    problems.push(problemAt(yaml, base, `${pathText(base)}: expected a mapping with a type, got ${raw === null ? 'nothing' : typeof raw}`));
    return null;
  }
  const type = checkType<LessonBlockType>(yaml, raw, base, LESSON_BLOCK_TYPES, 'block', problems);
  if (!type) return null;
  const data = validate(yaml, LESSON_BLOCK_SCHEMAS[type], raw, base, problems) as LessonBlockData | null;
  if (!data) return null;

  const structural: PackLessonBlock = {
    type,
    simulatorKey: null,
    simulatorParams: null,
    codeKind: null,
    codeLanguage: null,
  };
  const translation: PackLessonBlockTranslation = {
    line: lineAt(yaml, base),
    lines: indexLines(yaml, base),
    title: null,
    bodyMdx: null,
    promptMdx: null,
    resolutionMdx: null,
    caption: null,
    payloadJson: null,
  };

  switch (data.type) {
    case 'text':
    case 'curiosity':
    case 'real_world_application':
      translation.title = data.title ?? null;
      translation.bodyMdx = data.body;
      break;
    case 'solved_exercise':
      translation.title = data.title ?? null;
      translation.promptMdx = data.prompt;
      translation.resolutionMdx = data.resolution;
      break;
    case 'simulator':
      structural.simulatorKey = data.simulatorKey;
      structural.simulatorParams = data.simulatorParams === undefined ? null : JSON.stringify(data.simulatorParams);
      translation.caption = data.caption ?? null;
      break;
    case 'code_snippet':
      translation.title = data.title ?? null;
      translation.caption = data.caption ?? null;
      translation.payloadJson = JSON.stringify({ variants: data.variants });
      break;
    case 'code_exercise': {
      const { type: _type, kind, language, title, prompt, resolution, ...payload } = data;
      structural.codeKind = kind;
      structural.codeLanguage = language;
      translation.title = title ?? null;
      translation.promptMdx = prompt;
      translation.resolutionMdx = resolution;
      translation.payloadJson = JSON.stringify(payload);
      break;
    }
  }
  return { structural, translation, data };
}

// ---------------------------------------------------------------------------
// Question files
// ---------------------------------------------------------------------------

/** What a question file name says. `locale` is null when it is not one of ours (already reported). */
interface QuestionName {
  key: string;
  locale: Locale | null;
}

/** Reads `<key>.<locale>.yaml`; null (reported) when the file cannot be a question. */
function parseQuestionName(file: string, name: string, problems: PackProblem[]): QuestionName | null {
  const match = QUESTION_FILE_PATTERN.exec(name);
  if (!match || !SLUG_PATTERN.test(match[1])) {
    problems.push({
      file,
      message: 'question file names look like <question-key>.<locale>.yaml, for example binary-to-decimal.pt-BR.yaml',
    });
    return null;
  }
  return { key: match[1], locale: parseLocale(file, match[2], problems) };
}

/**
 * A plain YAML number as written ("0.0000001" rather than JS's "1e-7"), so a
 * numeric answer keeps the author's form. Anything else is returned as is.
 */
function numberAsWritten(yaml: YamlFile, segments: readonly PathSegment[], value: unknown): unknown {
  const node = yaml.doc.getIn(segments, true);
  if (isScalar(node) && typeof node.value === 'number' && Number.isFinite(node.value) && node.source) {
    return node.source;
  }
  return value;
}

function loadQuestionFile(yaml: YamlFile, parts: string[], name: QuestionName, problems: PackProblem[]): QuestionFile | null {
  const { key: fileKey, locale } = name;

  if (!isRecord(yaml.value)) {
    problems.push(problemAt(yaml, [], 'expected a mapping with key, type, difficulty, prompt and resolution'));
    return null;
  }
  const type = checkType<QuestionType>(yaml, yaml.value, [], QUESTION_TYPES, 'question', problems);
  if (!type) return null;
  const value =
    type === 'numeric'
      ? { ...yaml.value, correctAnswer: numberAsWritten(yaml, ['correctAnswer'], yaml.value.correctAnswer) }
      : yaml.value;
  const data = validate(yaml, QUESTION_SCHEMAS[type], value, [], problems) as QuestionData | null;
  if (!data) return null;
  if (data.key !== fileKey) {
    problems.push(problemAt(yaml, ['key'], `key: "${data.key}" must match the file name, which says "${fileKey}"`));
    return null;
  }
  if (!locale) return null;

  const structure: QuestionStructure = {
    type,
    difficulty: data.difficulty,
    correctAnswer: null,
    answerFormat: 'text',
    codeKind: null,
    codeLanguage: null,
    tagSlugs: data.tags,
    options: [],
    matchingPairCount: 0,
    acceptedAnswersShared: [],
  };
  const translation: PackQuestionTranslation = {
    file: yaml.file,
    lines: indexLines(yaml, []),
    promptMdx: data.prompt,
    resolutionMdx: data.resolution,
    codeJson: null,
    options: [],
    matchingPairs: [],
    acceptedAnswers: [],
  };

  switch (data.type) {
    case 'multiple_choice':
    case 'multiple_response':
      structure.options = data.options.map((option) => ({ isCorrect: option.correct }));
      translation.options = data.options.map((option) => ({ textMdx: option.text }));
      break;
    case 'numeric':
      structure.correctAnswer = data.correctAnswer;
      break;
    case 'true_false':
      structure.correctAnswer = String(data.correctAnswer);
      break;
    case 'short_text':
      structure.answerFormat = data.answerFormat;
      // Math answers are compared symbolically, so every locale shares them.
      if (data.answerFormat === 'math') structure.acceptedAnswersShared = data.acceptedAnswers;
      else translation.acceptedAnswers = data.acceptedAnswers;
      break;
    case 'ordering':
      // Stored as options in the correct order, like the admin does.
      structure.options = data.items.map(() => ({ isCorrect: false }));
      translation.options = data.items.map((text) => ({ textMdx: text }));
      break;
    case 'matching':
      structure.matchingPairCount = data.pairs.length;
      translation.matchingPairs = data.pairs.map((pair) => ({ leftMdx: pair.left, rightMdx: pair.right }));
      break;
    case 'code': {
      const { key: _key, type: _type, difficulty: _difficulty, tags: _tags, prompt: _prompt, resolution: _resolution, kind, language, ...payload } =
        data;
      structure.codeKind = kind;
      structure.codeLanguage = language;
      translation.codeJson = JSON.stringify(payload);
      break;
    }
  }

  return { file: yaml.file, locale, key: fileKey, dirParts: parts.slice(0, 2), data, structure, translation };
}
