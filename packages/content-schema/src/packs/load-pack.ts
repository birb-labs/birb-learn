// Node-only: reads a content root from disk. Import it by deep path
// (`@birb-learn/content-schema/src/packs/load-pack`); it is deliberately not in
// the package barrel, which the admin Worker bundles. See spec §11.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { isMap, isScalar, isSeq, LineCounter, parseDocument, type Document } from 'yaml';
import type { z } from 'zod';
import { formatZodIssues } from '../code-payloads';
import { LESSON_BLOCK_TYPES, LOCALES, type LessonBlockType, type Locale } from '../schema';
import {
  emptyBundle,
  LESSON_BLOCK_SCHEMAS,
  LessonFileSchema,
  lookupLine,
  packIssueMessage,
  QUESTION_SCHEMAS,
  QUESTION_TYPES,
  SLUG_PATTERN,
  TreeDisciplineSchema,
  TreeFileSchema,
  TreeSubjectSchema,
  type LessonBlockData,
  type PackBundle,
  type PackLesson,
  type PackLessonBlock,
  type PackLessonBlockTranslation,
  type PackProblem,
  type PackQuestion,
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
 * Every problem is collected; a file with problems is left out of the bundle
 * and the rest still loads. Bad content never throws, only I/O failures do. A
 * missing `rootDir` is an empty bundle with no problems. Run `checkPack` on the
 * bundle for the checks that need all of it.
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

  const files = await listFiles(rootDir);
  const lessonGroups = new Map<string, LessonFile[]>();
  const questionGroups = new Map<string, QuestionFile[]>();
  const disciplineDirs = new Set<string>();
  const treeDirs = new Set<string>();

  for (const file of files) {
    const parts = file.split('/');
    if (parts.length > 1) disciplineDirs.add(parts[0]);
    const kind = classify(parts);
    if (kind === 'ignored') continue;
    if (kind === 'unexpected') {
      problems.push({ file, message: UNEXPECTED_FILE_MESSAGE });
      continue;
    }

    const yaml = parseYamlFile(file, await readFile(path.join(rootDir, file), 'utf8'), problems);
    if (kind === 'tree') {
      treeDirs.add(parts[0]);
      if (yaml) loadTree(yaml, parts[0], bundle, problems);
    } else if (kind === 'lesson') {
      const lesson = yaml && loadLessonFile(yaml, parts, problems);
      if (lesson) pushToGroup(lessonGroups, `${parts.slice(0, 4).join('/')}/${lesson.slug}`, lesson);
    } else {
      const question = yaml && loadQuestionFile(yaml, parts, problems);
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

const UNEXPECTED_FILE_MESSAGE =
  'unexpected file: packs only hold <discipline>/_tree.yaml, ' +
  '<discipline>/<subject>/<topic>/<section>/<order>-<lesson-slug>.<locale>.yaml and ' +
  '<discipline>/<subject>/questions/<question-key>.<locale>.yaml';

async function statOrNull(target: string) {
  try {
    return await stat(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

/** Every file under `rootDir`, relative with `/` separators, sorted. Dotfiles are skipped. */
async function listFiles(rootDir: string, relative = ''): Promise<string[]> {
  const entries = await readdir(path.join(rootDir, relative), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const child = relative === '' ? entry.name : `${relative}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await listFiles(rootDir, child)));
    else files.push(child);
  }
  return files.sort();
}

function classify(parts: string[]): 'tree' | 'lesson' | 'question' | 'ignored' | 'unexpected' {
  const name = parts[parts.length - 1];
  if (name.endsWith('.md')) return 'ignored'; // notes and READMEs may sit next to the packs
  if (parts.length === 2 && name === TREE_FILE) return 'tree';
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

function loadTree(yaml: YamlFile, dirName: string, bundle: PackBundle, problems: PackProblem[]): void {
  const top = validate(yaml, TreeFileSchema, yaml.value, [], problems);
  if (!top) return;
  const discipline = validate(yaml, TreeDisciplineSchema, top.discipline, ['discipline'], problems);
  if (!discipline) return;

  if (discipline.slug !== dirName) {
    problems.push(
      problemAt(
        yaml,
        ['discipline', 'slug'],
        `discipline.slug: "${discipline.slug}" must match the directory name "${dirName}"`,
      ),
    );
  }
  const source = (segments: readonly PathSegment[]) => ({ file: yaml.file, line: lineAt(yaml, segments) });
  bundle.disciplines.push({ ...discipline, source: source(['discipline']) });

  // Subjects are checked one by one, so one bad subject does not drop the rest.
  top.subjects.forEach((raw, subjectIndex) => {
    const subjectPath = ['subjects', subjectIndex];
    const subject = validate(yaml, TreeSubjectSchema, raw, subjectPath, problems);
    if (!subject) return;

    bundle.subjects.push({
      slug: subject.slug,
      disciplineSlug: discipline.slug,
      order: subject.order,
      names: subject.names,
      source: source(subjectPath),
    });
    subject.topics.forEach((topic, topicIndex) => {
      const topicPath = [...subjectPath, 'topics', topicIndex];
      bundle.topics.push({
        slug: topic.slug,
        subjectSlug: subject.slug,
        order: topic.order,
        names: topic.names,
        source: source(topicPath),
      });
      topic.sections.forEach((section, sectionIndex) => {
        bundle.sections.push({
          slug: section.slug,
          topicSlug: topic.slug,
          order: section.order,
          names: section.names,
          source: source([...topicPath, 'sections', sectionIndex]),
        });
      });
    });
    subject.tags.forEach((tag, tagIndex) => {
      bundle.tags.push({
        slug: tag.slug,
        subjectSlug: subject.slug,
        parentSlug: tag.parent ?? null,
        names: tag.names,
        source: source([...subjectPath, 'tags', tagIndex]),
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Lesson files
// ---------------------------------------------------------------------------

interface LessonFileBlock {
  structural: PackLessonBlock;
  translation: PackLessonBlockTranslation;
  data: LessonBlockData;
}

interface LessonFile {
  file: string;
  locale: Locale;
  order: number;
  slug: string;
  dirParts: string[];
  title: string;
  blocksLine: number | undefined;
  blocks: LessonFileBlock[];
}

/** Locale from a file name, or a problem when it is not one of ours. */
function parseLocale(yaml: YamlFile, locale: string, problems: PackProblem[]): Locale | null {
  if ((LOCALES as readonly string[]).includes(locale)) return locale as Locale;
  problems.push({
    file: yaml.file,
    message: `unknown locale "${locale}" in the file name; expected one of ${LOCALE_LIST}`,
  });
  return null;
}

function loadLessonFile(yaml: YamlFile, parts: string[], problems: PackProblem[]): LessonFile | null {
  const name = parts[4];
  const match = LESSON_FILE_PATTERN.exec(name);
  if (!match || !SLUG_PATTERN.test(match[2])) {
    problems.push({
      file: yaml.file,
      message: 'lesson file names look like <order>-<lesson-slug>.<locale>.yaml, for example 01-what-is-a-bit.pt-BR.yaml',
    });
    return null;
  }
  const [, orderText, fileSlug, localeText] = match;
  const locale = parseLocale(yaml, localeText, problems);
  const order = Number(orderText);
  let ok = locale !== null;
  if (order < 1) {
    problems.push({ file: yaml.file, message: 'the order prefix of the file name must be 1 or more' });
    ok = false;
  }

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

type QuestionStructure = Omit<PackQuestion, 'key' | 'disciplineSlug' | 'subjectSlug' | 'translations'>;

interface QuestionFile {
  file: string;
  locale: Locale;
  key: string;
  dirParts: string[];
  data: QuestionData;
  structure: QuestionStructure;
  translation: PackQuestionTranslation;
}

function loadQuestionFile(yaml: YamlFile, parts: string[], problems: PackProblem[]): QuestionFile | null {
  const match = QUESTION_FILE_PATTERN.exec(parts[3]);
  if (!match || !SLUG_PATTERN.test(match[1])) {
    problems.push({
      file: yaml.file,
      message: 'question file names look like <question-key>.<locale>.yaml, for example binary-to-decimal.pt-BR.yaml',
    });
    return null;
  }
  const [, fileKey, localeText] = match;
  const locale = parseLocale(yaml, localeText, problems);

  if (!isRecord(yaml.value)) {
    problems.push(problemAt(yaml, [], 'expected a mapping with key, type, difficulty, prompt and resolution'));
    return null;
  }
  const type = checkType<QuestionType>(yaml, yaml.value, [], QUESTION_TYPES, 'question', problems);
  if (!type) return null;
  const data = validate(yaml, QUESTION_SCHEMAS[type], yaml.value, [], problems) as QuestionData | null;
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

// ---------------------------------------------------------------------------
// Merging locale files (spec §11.3: structure must match across locales)
// ---------------------------------------------------------------------------

function showValue(value: unknown): string {
  if (value === null || value === undefined) return 'nothing';
  if (Array.isArray(value)) return `[${value.map((item) => String(item)).join(', ')}]`;
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

/** Collects structural mismatches of one locale file against the authority file. */
class MismatchCollector {
  readonly problems: PackProblem[] = [];

  constructor(
    private readonly file: string,
    private readonly authorityFile: string,
    private readonly lineOf: (fieldPath: string) => number | undefined,
  ) {}

  value(fieldPath: string, here: unknown, there: unknown): boolean {
    if (JSON.stringify(here) === JSON.stringify(there)) return true;
    this.add(fieldPath, `${showValue(here)} here but ${showValue(there)} in ${this.authorityFile}`);
    return false;
  }

  count(fieldPath: string, here: number, there: number, noun: string): boolean {
    if (here === there) return true;
    this.add(fieldPath, `${plural(here, noun)} here but ${there} in ${this.authorityFile}`);
    return false;
  }

  add(fieldPath: string, detail: string): void {
    this.problems.push({ file: this.file, line: this.lineOf(fieldPath), message: `${fieldPath}: ${detail}` });
  }
}

/** pt-BR is the structural authority; without it, the first locale present. */
function byLocale<T extends { locale: Locale; file: string }>(
  files: T[],
  noun: string,
  problems: PackProblem[],
): { files: Map<Locale, T>; authority: T } {
  const map = new Map<Locale, T>();
  for (const file of files) {
    const existing = map.get(file.locale);
    if (existing) {
      problems.push({ file: file.file, message: `a second ${file.locale} file for this ${noun}; ${existing.file} is the first` });
    } else {
      map.set(file.locale, file);
    }
  }
  const authority = LOCALES.map((locale) => map.get(locale)).find((file) => file !== undefined)!;
  return { files: map, authority };
}

function mergeLesson(group: LessonFile[], problems: PackProblem[]): PackLesson {
  const { files, authority } = byLocale(group, 'lesson', problems);
  const [disciplineSlug, subjectSlug, topicSlug, sectionSlug] = authority.dirParts;
  const lesson: PackLesson = {
    slug: authority.slug,
    order: authority.order,
    disciplineSlug,
    subjectSlug,
    topicSlug,
    sectionSlug,
    blocks: authority.blocks.map((block) => block.structural),
    translations: {},
  };

  for (const locale of LOCALES) {
    const file = files.get(locale);
    if (!file) continue;
    if (file !== authority) {
      const mismatches = compareLessons(file, authority);
      if (mismatches.length > 0) {
        // Left out, so the bundle never pairs translations with the wrong blocks.
        problems.push(...mismatches);
        continue;
      }
    }
    lesson.translations[locale] = {
      file: file.file,
      title: file.title,
      blocks: file.blocks.map((block) => block.translation),
    };
  }
  return lesson;
}

function compareLessons(file: LessonFile, authority: LessonFile): PackProblem[] {
  const blockLine = (fieldPath: string): number | undefined => {
    const match = /^blocks\[(\d+)\]\.?(.*)$/.exec(fieldPath);
    if (!match) return fieldPath === 'blocks' ? file.blocksLine : undefined;
    const translation = file.blocks[Number(match[1])].translation;
    return lookupLine(translation.lines, match[2]) ?? translation.line;
  };
  const check = new MismatchCollector(file.file, authority.file, blockLine);

  if (file.order !== authority.order) {
    check.problems.push({
      file: file.file,
      message: `the file name gives order ${file.order} but ${authority.file} gives ${authority.order}`,
    });
  }
  if (!check.count('blocks', file.blocks.length, authority.blocks.length, 'block')) {
    check.problems[check.problems.length - 1].message += '; every locale file needs the same blocks in the same order';
    return check.problems;
  }

  file.blocks.forEach((block, index) => {
    const here = block.data;
    const there = authority.blocks[index].data;
    const at = `blocks[${index}]`;
    if (!check.value(`${at}.type`, here.type, there.type)) return;

    if (here.type === 'simulator' && there.type === 'simulator') {
      check.value(`${at}.simulatorKey`, here.simulatorKey, there.simulatorKey);
      check.value(`${at}.simulatorParams`, block.structural.simulatorParams, authority.blocks[index].structural.simulatorParams);
    } else if (here.type === 'code_exercise' && there.type === 'code_exercise') {
      check.value(`${at}.kind`, here.kind, there.kind);
      check.value(`${at}.language`, here.language, there.language);
      check.count(`${at}.tests`, here.tests.length, there.tests.length, 'test');
    } else if (here.type === 'code_snippet' && there.type === 'code_snippet') {
      if (check.count(`${at}.variants`, here.variants.length, there.variants.length, 'variant')) {
        here.variants.forEach((variant, variantIndex) => {
          check.value(`${at}.variants[${variantIndex}].language`, variant.language, there.variants[variantIndex].language);
        });
      }
    }
  });
  return check.problems;
}

function mergeQuestion(group: QuestionFile[], problems: PackProblem[]): PackQuestion {
  const { files, authority } = byLocale(group, 'question', problems);
  const [disciplineSlug, subjectSlug] = authority.dirParts;
  const question: PackQuestion = {
    key: authority.key,
    disciplineSlug,
    subjectSlug,
    ...authority.structure,
    translations: {},
  };

  for (const locale of LOCALES) {
    const file = files.get(locale);
    if (!file) continue;
    if (file !== authority) {
      const mismatches = compareQuestions(file, authority);
      if (mismatches.length > 0) {
        problems.push(...mismatches);
        continue;
      }
    }
    question.translations[locale] = file.translation;
  }
  return question;
}

function compareQuestions(file: QuestionFile, authority: QuestionFile): PackProblem[] {
  const check = new MismatchCollector(file.file, authority.file, (fieldPath) => lookupLine(file.translation.lines, fieldPath));
  const here = file.data;
  const there = authority.data;

  if (!check.value('type', here.type, there.type)) return check.problems;
  check.value('difficulty', here.difficulty, there.difficulty);
  check.value('tags', [...here.tags].sort(), [...there.tags].sort());

  if ((here.type === 'numeric' || here.type === 'true_false') && (there.type === 'numeric' || there.type === 'true_false')) {
    check.value('correctAnswer', file.structure.correctAnswer, authority.structure.correctAnswer);
  } else if (here.type === 'short_text' && there.type === 'short_text') {
    if (check.value('answerFormat', here.answerFormat, there.answerFormat) && here.answerFormat === 'math') {
      check.value('acceptedAnswers', here.acceptedAnswers, there.acceptedAnswers);
    }
  } else if (
    (here.type === 'multiple_choice' || here.type === 'multiple_response') &&
    (there.type === 'multiple_choice' || there.type === 'multiple_response')
  ) {
    if (check.count('options', here.options.length, there.options.length, 'option')) {
      here.options.forEach((option, index) => {
        check.value(`options[${index}].correct`, option.correct, there.options[index].correct);
      });
    }
  } else if (here.type === 'ordering' && there.type === 'ordering') {
    check.count('items', here.items.length, there.items.length, 'item');
  } else if (here.type === 'matching' && there.type === 'matching') {
    check.count('pairs', here.pairs.length, there.pairs.length, 'pair');
  } else if (here.type === 'code' && there.type === 'code') {
    check.value('kind', here.kind, there.kind);
    check.value('language', here.language, there.language);
    check.count('tests', here.tests.length, there.tests.length, 'test');
  }
  return check.problems;
}
