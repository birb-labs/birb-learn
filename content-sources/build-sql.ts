/**
 * Turns the Markdown sources under `content-sources/<discipline>/` into SQL
 * that inserts them into the content database (local SQLite or the admin's
 * D1), plus a rollback script that removes exactly what was inserted.
 *
 * Usage: tsx content-sources/build-sql.ts <discipline-dir> <out-dir> [--lessons] [--questions]
 *
 * Every foreign key is resolved with a sub-select on a unique slug, so the
 * script needs no knowledge of the target's current ids.
 *
 * Source format:
 * - `structure.json`: sections (with their lesson slugs, in order), section
 *   reorders and question tags.
 * - `lessons/<slug>/<locale>.md`: `---\ntitle: …\n---` front matter, then
 *   blocks fenced as `:::<type> [args]` … `:::`. Types: `text`,
 *   `curiosity <title>`, `real_world_application <title>`,
 *   `solved_exercise [title]` (prompt, then `---resolution---`, then the
 *   resolution) and `simulator <key> [json params]` (first body line is the
 *   title, the rest the plain-text caption). Translations must repeat the
 *   pt-BR block sequence; structural fields come from pt-BR.
 * - `questions/<group>.<locale>.md`: `:::question <id> <type> <difficulty>
 *   <tag,tag> [answer=…] [format=math]`, with the prompt, then `---options---`
 *   (`- [x] correct` / `- [ ] wrong`; ordering items in the correct order),
 *   `---pairs---` (`- left ||| right`), `---answers---` and `---resolution---`.
 *   Translations only need `:::question <id>`.
 */
import fs from 'node:fs';
import path from 'node:path';

const LOCALES = ['pt-BR', 'en-US', 'es'] as const;
type Locale = (typeof LOCALES)[number];
// `--only-pt-BR` builds pt-BR translations only; the site falls back to pt-BR.
let activeLocales: readonly Locale[] = LOCALES;
const BLOCK_TYPES = ['text', 'curiosity', 'real_world_application', 'solved_exercise', 'simulator'] as const;
type BlockType = (typeof BLOCK_TYPES)[number];
const QUESTION_TYPES = ['multiple_choice', 'multiple_response', 'numeric', 'true_false', 'short_text', 'ordering', 'matching'] as const;
type QuestionType = (typeof QUESTION_TYPES)[number];

interface Named {
  slug: string;
  names: Record<Locale, string>;
}

interface Structure {
  topic: string;
  subject: string;
  sections: (Named & { order: number; lessons: string[] })[];
  reorder: { table: 'sections'; slug: string; order: number; previousOrder: number }[];
  tags: (Named & { parent?: string })[];
}

interface Block {
  type: BlockType;
  title: string | null;
  bodyMdx: string | null;
  promptMdx: string | null;
  resolutionMdx: string | null;
  caption: string | null;
  simulatorKey: string | null;
  simulatorParams: string | null;
}

interface Lesson {
  title: string;
  blocks: Block[];
}

interface QuestionText {
  prompt: string;
  resolution: string;
  options: string[];
  pairs: [string, string][];
  answers: string[];
}

interface Question {
  id: string;
  type: QuestionType;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  correctAnswer: string | null;
  answerFormat: 'text' | 'math';
  correctOptions: boolean[];
  text: Partial<Record<Locale, QuestionText>>;
}

class SourceError extends Error {}

function fail(file: string, message: string): never {
  throw new SourceError(`${file}: ${message}`);
}

function q(value: string | number | null): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

function trimBlock(lines: string[]): string {
  return lines.join('\n').replace(/^\s*\n/, '').replace(/\s+$/, '');
}

/** Splits `:::type args … :::` fences. Returns header args and body lines. */
function splitFences(file: string, source: string): { header: string; body: string[]; line: number }[] {
  const fences: { header: string; body: string[]; line: number }[] = [];
  let current: { header: string; body: string[]; line: number } | null = null;
  source.split('\n').forEach((line, index) => {
    if (current === null) {
      if (line.startsWith(':::') && line.trim() !== ':::') {
        current = { header: line.slice(3).trim(), body: [], line: index + 1 };
      } else if (line.trim() !== '' && !line.startsWith('<!--')) {
        fail(file, `line ${index + 1}: text outside a ::: block`);
      }
      return;
    }
    if (line.trim() === ':::') {
      fences.push(current);
      current = null;
      return;
    }
    if (line.startsWith(':::')) fail(file, `line ${index + 1}: nested ::: block (missing a closing :::?)`);
    current.body.push(line);
  });
  if (current !== null) fail(file, `block opened at line ${(current as { line: number }).line} is never closed`);
  return fences;
}

function splitSections(file: string, body: string[], markers: string[]): Record<string, string[]> {
  const parts: Record<string, string[]> = { '': [] };
  let key = '';
  for (const line of body) {
    const match = /^---([a-z]+)---$/.exec(line.trim());
    if (match) {
      if (!markers.includes(match[1])) fail(file, `unknown section marker ${line.trim()}`);
      key = match[1];
      parts[key] = [];
      continue;
    }
    parts[key].push(line);
  }
  return parts;
}

function parseLesson(file: string): Lesson {
  const source = fs.readFileSync(file, 'utf8');
  const frontMatter = /^---\ntitle: (.+)\n---\n/.exec(source);
  if (!frontMatter) fail(file, 'missing "---\\ntitle: …\\n---" front matter');
  const blocks = splitFences(file, source.slice(frontMatter[0].length)).map(({ header, body, line }): Block => {
    const [type, ...rest] = header.split(' ');
    if (!(BLOCK_TYPES as readonly string[]).includes(type)) fail(file, `line ${line}: unknown block type "${type}"`);
    const args = rest.join(' ').trim();
    const block: Block = {
      type: type as BlockType,
      title: null,
      bodyMdx: null,
      promptMdx: null,
      resolutionMdx: null,
      caption: null,
      simulatorKey: null,
      simulatorParams: null,
    };
    if (type === 'text') {
      block.bodyMdx = trimBlock(body);
    } else if (type === 'curiosity' || type === 'real_world_application') {
      if (!args) fail(file, `line ${line}: ${type} needs a title after the type`);
      block.title = args;
      block.bodyMdx = trimBlock(body);
    } else if (type === 'solved_exercise') {
      block.title = args || null;
      const parts = splitSections(file, body, ['resolution']);
      if (!parts.resolution) fail(file, `line ${line}: solved_exercise needs a ---resolution--- marker`);
      block.promptMdx = trimBlock(parts['']);
      block.resolutionMdx = trimBlock(parts.resolution);
    } else {
      const match = /^(\S+)(?:\s+(\{.*\}))?$/.exec(args);
      if (args && !match) fail(file, `line ${line}: simulator header must be ":::simulator <key> [json]"`);
      if (match) {
        block.simulatorKey = match[1];
        block.simulatorParams = match[2] ?? '{}';
        JSON.parse(block.simulatorParams);
      }
      const text = trimBlock(body).split('\n');
      block.title = text[0]?.trim() || null;
      block.caption = trimBlock(text.slice(1)) || null;
    }
    for (const field of ['bodyMdx', 'promptMdx', 'resolutionMdx'] as const) {
      if (block[field] !== null && block[field]!.trim() === '') fail(file, `line ${line}: empty ${field}`);
    }
    return block;
  });
  if (blocks.length === 0) fail(file, 'lesson has no blocks');
  return { title: frontMatter[1].trim(), blocks };
}

function loadLesson(dir: string, slug: string): Record<Locale, Lesson> {
  const lessons = {} as Record<Locale, Lesson>;
  for (const locale of activeLocales) {
    const file = path.join(dir, 'lessons', slug, `${locale}.md`);
    if (!fs.existsSync(file)) fail(file, 'missing translation');
    lessons[locale] = parseLesson(file);
  }
  const base = lessons['pt-BR'];
  for (const locale of activeLocales) {
    const lesson = lessons[locale];
    const file = path.join(dir, 'lessons', slug, `${locale}.md`);
    if (lesson.blocks.length !== base.blocks.length) {
      fail(file, `has ${lesson.blocks.length} blocks, pt-BR has ${base.blocks.length}`);
    }
    lesson.blocks.forEach((block, index) => {
      const reference = base.blocks[index];
      if (block.type !== reference.type) fail(file, `block ${index + 1} is ${block.type}, pt-BR has ${reference.type}`);
      if (block.type === 'simulator') {
        if (reference.simulatorKey === null) fail(file, `pt-BR simulator block ${index + 1} has no key`);
        if (block.simulatorKey !== null && block.simulatorKey !== reference.simulatorKey) {
          fail(file, `simulator block ${index + 1} key differs from pt-BR`);
        }
      }
    });
  }
  return lessons;
}

function parseQuestions(file: string): Map<string, { header: string[]; text: QuestionText; line: number }> {
  const source = fs.readFileSync(file, 'utf8');
  const result = new Map<string, { header: string[]; text: QuestionText; line: number }>();
  for (const { header, body, line } of splitFences(file, source)) {
    const tokens = header.split(/\s+/);
    if (tokens[0] !== 'question' || !tokens[1]) fail(file, `line ${line}: expected ":::question <id> …"`);
    const id = tokens[1];
    if (result.has(id)) fail(file, `line ${line}: duplicate question id ${id}`);
    const parts = splitSections(file, body, ['options', 'pairs', 'answers', 'resolution']);
    if (!parts.resolution) fail(file, `line ${line}: question ${id} needs ---resolution---`);
    const listItems = (lines: string[] | undefined) =>
      (lines ?? [])
        .join('\n')
        .split(/\n(?=- )/)
        .map((item) => item.trim())
        .filter((item) => item !== '');
    const options = listItems(parts.options).map((item) => {
      const match = /^- (\[[x ]\] )?([\s\S]+)$/.exec(item);
      if (!match) fail(file, `line ${line}: bad option "${item}"`);
      return (match[1] ?? '') + match[2].trim();
    });
    const pairs = listItems(parts.pairs).map((item): [string, string] => {
      const [left, right] = item.slice(2).split('|||').map((side) => side.trim());
      if (!left || !right) fail(file, `line ${line}: pair needs "left ||| right"`);
      return [left, right];
    });
    const answers = listItems(parts.answers).map((item) => item.slice(2).trim());
    result.set(id, {
      header: tokens.slice(2),
      line,
      text: { prompt: trimBlock(parts['']), resolution: trimBlock(parts.resolution), options, pairs, answers },
    });
    if (!result.get(id)!.text.prompt) fail(file, `line ${line}: question ${id} has an empty prompt`);
  }
  return result;
}

function loadQuestions(dir: string, knownTags: Set<string>): Question[] {
  const questionDir = path.join(dir, 'questions');
  if (!fs.existsSync(questionDir)) return [];
  const groups = [...new Set(fs.readdirSync(questionDir).map((name) => name.replace(/\.(pt-BR|en-US|es)\.md$/, '')))].sort();
  const questions: Question[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    const byLocale = {} as Record<Locale, ReturnType<typeof parseQuestions>>;
    for (const locale of activeLocales) {
      const file = path.join(questionDir, `${group}.${locale}.md`);
      if (!fs.existsSync(file)) fail(file, 'missing translation');
      byLocale[locale] = parseQuestions(file);
    }
    const baseFile = path.join(questionDir, `${group}.pt-BR.md`);
    for (const [id, entry] of byLocale['pt-BR']) {
      if (seen.has(id)) fail(baseFile, `question id ${id} used twice`);
      seen.add(id);
      const [type, difficulty, tagList, ...extras] = entry.header;
      if (!(QUESTION_TYPES as readonly string[]).includes(type)) fail(baseFile, `line ${entry.line}: unknown type "${type}"`);
      if (!['easy', 'medium', 'hard'].includes(difficulty)) fail(baseFile, `line ${entry.line}: bad difficulty "${difficulty}"`);
      const tags = (tagList ?? '').split(',').filter(Boolean);
      if (tags.length === 0) fail(baseFile, `line ${entry.line}: question ${id} needs tags`);
      for (const tag of tags) if (!knownTags.has(tag)) fail(baseFile, `line ${entry.line}: unknown tag "${tag}"`);
      let correctAnswer: string | null = null;
      let answerFormat: 'text' | 'math' = 'text';
      for (const extra of extras) {
        if (extra.startsWith('answer=')) correctAnswer = extra.slice('answer='.length);
        else if (extra === 'format=math') answerFormat = 'math';
        else fail(baseFile, `line ${entry.line}: unknown header token "${extra}"`);
      }
      const correctOptions = entry.text.options.map((option) => option.startsWith('[x] '));
      const question: Question = {
        id,
        type: type as QuestionType,
        difficulty: difficulty as Question['difficulty'],
        tags,
        correctAnswer,
        answerFormat,
        correctOptions,
        text: {},
      };
      validateQuestionShape(baseFile, entry.line, question, entry.text);
      for (const locale of activeLocales) {
        const localized = byLocale[locale].get(id);
        const file = path.join(questionDir, `${group}.${locale}.md`);
        if (!localized) fail(file, `missing question ${id}`);
        const text = localized.text;
        if (text.options.length !== entry.text.options.length) fail(file, `question ${id}: option count differs from pt-BR`);
        if (text.pairs.length !== entry.text.pairs.length) fail(file, `question ${id}: pair count differs from pt-BR`);
        question.text[locale] = {
          ...text,
          options: text.options.map((option) => option.replace(/^\[[x ]\] /, '')),
        };
      }
      for (const locale of activeLocales) {
        if (locale !== 'pt-BR' && byLocale[locale].size !== byLocale['pt-BR'].size) {
          fail(path.join(questionDir, `${group}.${locale}.md`), 'question count differs from pt-BR');
        }
      }
      questions.push(question);
    }
  }
  return questions;
}

function validateQuestionShape(file: string, line: number, question: Question, text: QuestionText) {
  const where = `line ${line} (${question.id})`;
  const correct = question.correctOptions.filter(Boolean).length;
  switch (question.type) {
    case 'multiple_choice':
      if (text.options.length < 2 || correct !== 1) fail(file, `${where}: multiple_choice needs ≥2 options and exactly one [x]`);
      break;
    case 'multiple_response':
      if (text.options.length < 2 || correct < 1) fail(file, `${where}: multiple_response needs ≥2 options and at least one [x]`);
      break;
    case 'ordering':
      if (text.options.length < 2) fail(file, `${where}: ordering needs ≥2 items (listed in the correct order)`);
      break;
    case 'matching':
      if (text.pairs.length < 2) fail(file, `${where}: matching needs ≥2 pairs`);
      break;
    case 'true_false':
      if (question.correctAnswer !== 'true' && question.correctAnswer !== 'false') fail(file, `${where}: true_false needs answer=true|false`);
      break;
    case 'numeric':
      if (question.correctAnswer === null || !/^[+-]?\d+(\.\d+)?$/.test(question.correctAnswer)) {
        fail(file, `${where}: numeric needs a canonical answer=<number>`);
      }
      break;
    case 'short_text':
      if (text.answers.length === 0) fail(file, `${where}: short_text needs ---answers---`);
      break;
  }
}

const sel = (table: string, slug: string) => `(SELECT id FROM ${table} WHERE slug = ${q(slug)})`;

function buildLessonSql(dir: string, structure: Structure, out: string[], rollback: string[]) {
  for (const section of structure.sections) {
    out.push(
      `INSERT INTO sections (topic_id, slug, "order") VALUES (${sel('topics', structure.topic)}, ${q(section.slug)}, ${section.order});`,
    );
    for (const locale of LOCALES) {
      out.push(
        `INSERT INTO section_translations (section_id, locale, name) VALUES (${sel('sections', section.slug)}, ${q(locale)}, ${q(section.names[locale])});`,
      );
    }
    section.lessons.forEach((slug, index) => {
      const lessons = loadLesson(dir, slug);
      out.push(`INSERT INTO lessons (section_id, slug, "order") VALUES (${sel('sections', section.slug)}, ${q(slug)}, ${index + 1});`);
      for (const locale of activeLocales) {
        out.push(
          `INSERT INTO lesson_translations (lesson_id, locale, title) VALUES (${sel('lessons', slug)}, ${q(locale)}, ${q(lessons[locale].title)});`,
        );
      }
      lessons['pt-BR'].blocks.forEach((block, blockIndex) => {
        const order = blockIndex + 1;
        out.push(
          `INSERT INTO lesson_blocks (lesson_id, "order", type, simulator_key, simulator_params) VALUES (${sel('lessons', slug)}, ${order}, ${q(block.type)}, ${q(block.simulatorKey)}, ${q(block.simulatorParams)});`,
        );
        const blockId = `(SELECT id FROM lesson_blocks WHERE lesson_id = ${sel('lessons', slug)} AND "order" = ${order})`;
        for (const locale of activeLocales) {
          const localized = lessons[locale].blocks[blockIndex];
          out.push(
            `INSERT INTO lesson_block_translations (block_id, locale, title, body_mdx, prompt_mdx, resolution_mdx, caption) VALUES (${blockId}, ${q(locale)}, ${q(localized.title)}, ${q(localized.bodyMdx)}, ${q(localized.promptMdx)}, ${q(localized.resolutionMdx)}, ${q(localized.caption)});`,
          );
        }
      });
      const lessonId = sel('lessons', slug);
      rollback.unshift(
        `DELETE FROM lesson_block_translations WHERE block_id IN (SELECT id FROM lesson_blocks WHERE lesson_id = ${lessonId});`,
        `DELETE FROM lesson_blocks WHERE lesson_id = ${lessonId};`,
        `DELETE FROM lesson_translations WHERE lesson_id = ${lessonId};`,
        `DELETE FROM lessons WHERE slug = ${q(slug)};`,
      );
    });
    rollback.push(
      `DELETE FROM section_translations WHERE section_id = ${sel('sections', section.slug)};`,
      `DELETE FROM sections WHERE slug = ${q(section.slug)};`,
    );
  }
  for (const change of structure.reorder) {
    out.push(`UPDATE ${change.table} SET "order" = ${change.order} WHERE slug = ${q(change.slug)};`);
    rollback.push(`UPDATE ${change.table} SET "order" = ${change.previousOrder} WHERE slug = ${q(change.slug)};`);
  }
}

function buildQuestionSql(structure: Structure, questions: Question[], out: string[], rollback: string[]) {
  for (const tag of structure.tags) {
    out.push(
      `INSERT INTO tags (slug, parent_tag_id, subject_id) VALUES (${q(tag.slug)}, ${tag.parent ? sel('tags', tag.parent) : 'NULL'}, ${sel('subjects', structure.subject)});`,
    );
    for (const locale of LOCALES) {
      out.push(`INSERT INTO tag_translations (tag_id, locale, name) VALUES (${sel('tags', tag.slug)}, ${q(locale)}, ${q(tag.names[locale])});`);
    }
  }
  const lastQuestion = '(SELECT max(id) FROM questions)';
  for (const question of questions) {
    out.push(`-- ${question.id}`);
    out.push(
      `INSERT INTO questions (type, difficulty, correct_answer, answer_format) VALUES (${q(question.type)}, ${q(question.difficulty)}, ${q(question.correctAnswer)}, ${q(question.answerFormat)});`,
    );
    for (const locale of activeLocales) {
      const text = question.text[locale]!;
      out.push(
        `INSERT INTO question_translations (question_id, locale, prompt_mdx, resolution_mdx) VALUES (${lastQuestion}, ${q(locale)}, ${q(text.prompt)}, ${q(text.resolution)});`,
      );
    }
    const optionCount = question.text['pt-BR']!.options.length;
    for (let index = 0; index < optionCount; index++) {
      const isCorrect = question.type === 'ordering' ? 1 : question.correctOptions[index] ? 1 : 0;
      out.push(`INSERT INTO question_options (question_id, is_correct, "order") VALUES (${lastQuestion}, ${isCorrect}, ${index + 1});`);
      for (const locale of activeLocales) {
        out.push(
          `INSERT INTO question_option_translations (option_id, locale, text_mdx) VALUES ((SELECT max(id) FROM question_options), ${q(locale)}, ${q(question.text[locale]!.options[index])});`,
        );
      }
    }
    const pairCount = question.text['pt-BR']!.pairs.length;
    for (let index = 0; index < pairCount; index++) {
      out.push(`INSERT INTO question_matching_pairs (question_id, "order") VALUES (${lastQuestion}, ${index + 1});`);
      for (const locale of activeLocales) {
        const [left, right] = question.text[locale]!.pairs[index];
        out.push(
          `INSERT INTO question_matching_pair_translations (pair_id, locale, left_mdx, right_mdx) VALUES ((SELECT max(id) FROM question_matching_pairs), ${q(locale)}, ${q(left)}, ${q(right)});`,
        );
      }
    }
    for (const locale of activeLocales) {
      for (const answer of question.text[locale]!.answers) {
        out.push(`INSERT INTO question_accepted_answers (question_id, text, locale) VALUES (${lastQuestion}, ${q(answer)}, ${q(locale)});`);
      }
    }
    for (const tag of question.tags) {
      out.push(`INSERT INTO question_tags (question_id, tag_id) VALUES (${lastQuestion}, ${sel('tags', tag)});`);
    }
  }
  const ourTags = `(SELECT id FROM tags WHERE slug IN (${structure.tags.map((tag) => q(tag.slug)).join(', ')}))`;
  rollback.push(
    `CREATE TEMP TABLE physics_rollback_questions AS SELECT DISTINCT question_id AS id FROM question_tags WHERE tag_id IN ${ourTags};`,
    `DELETE FROM question_option_translations WHERE option_id IN (SELECT id FROM question_options WHERE question_id IN (SELECT id FROM physics_rollback_questions));`,
    `DELETE FROM question_options WHERE question_id IN (SELECT id FROM physics_rollback_questions);`,
    `DELETE FROM question_matching_pair_translations WHERE pair_id IN (SELECT id FROM question_matching_pairs WHERE question_id IN (SELECT id FROM physics_rollback_questions));`,
    `DELETE FROM question_matching_pairs WHERE question_id IN (SELECT id FROM physics_rollback_questions);`,
    `DELETE FROM question_accepted_answers WHERE question_id IN (SELECT id FROM physics_rollback_questions);`,
    `DELETE FROM question_translations WHERE question_id IN (SELECT id FROM physics_rollback_questions);`,
    `DELETE FROM question_tags WHERE question_id IN (SELECT id FROM physics_rollback_questions);`,
    `DELETE FROM questions WHERE id IN (SELECT id FROM physics_rollback_questions);`,
    `DROP TABLE physics_rollback_questions;`,
    `DELETE FROM tag_translations WHERE tag_id IN ${ourTags};`,
    ...structure.tags
      .filter((tag) => tag.parent)
      .map((tag) => `DELETE FROM tags WHERE slug = ${q(tag.slug)};`),
    ...structure.tags.filter((tag) => !tag.parent).map((tag) => `DELETE FROM tags WHERE slug = ${q(tag.slug)};`),
  );
}

function main() {
  const [dirArg, outArg, ...flags] = process.argv.slice(2);
  if (!dirArg || !outArg) {
    console.error('Usage: tsx content-sources/build-sql.ts <discipline-dir> <out-dir> [--lessons] [--questions]');
    process.exit(2);
  }
  const base = process.env.INIT_CWD ?? process.cwd();
  const dir = path.resolve(base, dirArg);
  const outDir = path.resolve(base, outArg);
  if (flags.includes('--only-pt-BR')) activeLocales = ['pt-BR'];
  const contentFlags = flags.filter((flag) => flag !== '--only-pt-BR');
  const wantLessons = contentFlags.length === 0 || contentFlags.includes('--lessons');
  const wantQuestions = contentFlags.length === 0 || contentFlags.includes('--questions');
  const structure = JSON.parse(fs.readFileSync(path.join(dir, 'structure.json'), 'utf8')) as Structure;
  const out: string[] = [];
  const rollback: string[] = [];
  try {
    if (wantLessons) buildLessonSql(dir, structure, out, rollback);
    if (wantQuestions) {
      const questions = loadQuestions(dir, new Set(structure.tags.map((tag) => tag.slug)));
      buildQuestionSql(structure, questions, out, rollback);
      console.log(`questions: ${questions.length}`);
    }
  } catch (error) {
    if (error instanceof SourceError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
  fs.mkdirSync(outDir, { recursive: true });
  const suffix = wantLessons && wantQuestions ? 'all' : wantLessons ? 'lessons' : 'questions';
  fs.writeFileSync(path.join(outDir, `apply-${suffix}.sql`), out.join('\n') + '\n');
  fs.writeFileSync(path.join(outDir, `rollback-${suffix}.sql`), rollback.join('\n') + '\n');
  console.log(`wrote ${out.length} statements to ${path.join(outDir, `apply-${suffix}.sql`)}`);
}

main();
