import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkPack } from './check-pack';
import { loadPacks } from './load-pack';
import type { PackBundle, PackProblem } from './pack-schemas';

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../test-fixtures/packs');
const fixture = (name: string) => path.join(FIXTURES, name);

const LESSON_DIR = 'computer-science/programming/programming-basics/first-steps';
const LINE_ERRORS_DIR = 'demo/basics/intro/start';

function problemsFor(problems: PackProblem[], file: string): PackProblem[] {
  return problems.filter((problem) => problem.file === file);
}

describe('loadPacks on the valid fixture', () => {
  it('loads with no problems, and checkPack finds none either', async () => {
    const { bundle, problems } = await loadPacks(fixture('valid'));
    expect(problems).toEqual([]);
    expect(checkPack(bundle)).toEqual([]);
  });

  it('holds the whole tree with names in every locale', async () => {
    const { bundle } = await loadPacks(fixture('valid'));
    expect(bundle.disciplines).toHaveLength(1);
    expect(bundle.disciplines[0]).toMatchObject({
      slug: 'computer-science',
      order: 1,
      names: { 'pt-BR': 'Ciência da Computação', 'en-US': 'Computer Science', es: 'Ciencias de la Computación' },
      source: { file: 'computer-science/_tree.yaml', line: 1 },
    });
    expect(bundle.subjects).toEqual([
      expect.objectContaining({ slug: 'programming', disciplineSlug: 'computer-science', order: 1 }),
    ]);
    expect(bundle.topics).toEqual([
      expect.objectContaining({ slug: 'programming-basics', subjectSlug: 'programming', order: 1 }),
    ]);
    expect(bundle.sections).toEqual([
      expect.objectContaining({ slug: 'first-steps', topicSlug: 'programming-basics', order: 1 }),
    ]);
    expect(bundle.tags).toEqual([
      expect.objectContaining({ slug: 'binary', subjectSlug: 'programming', parentSlug: null }),
      expect.objectContaining({ slug: 'binary-conversion', subjectSlug: 'programming', parentSlug: 'binary' }),
    ]);
  });

  it('holds one lesson with every block type and a translation per locale file', async () => {
    const { bundle } = await loadPacks(fixture('valid'));
    expect(bundle.lessons).toHaveLength(1);
    const [lesson] = bundle.lessons;
    expect(lesson).toMatchObject({
      slug: 'counting-in-binary',
      order: 1,
      disciplineSlug: 'computer-science',
      subjectSlug: 'programming',
      topicSlug: 'programming-basics',
      sectionSlug: 'first-steps',
    });
    expect(lesson.blocks.map((block) => block.type)).toEqual([
      'text',
      'curiosity',
      'real_world_application',
      'solved_exercise',
      'simulator',
      'code_snippet',
      'code_exercise',
    ]);
    expect(Object.keys(lesson.translations).sort()).toEqual(['en-US', 'pt-BR']);

    const ptBr = lesson.translations['pt-BR']!;
    expect(ptBr.file).toBe(`${LESSON_DIR}/01-counting-in-binary.pt-BR.yaml`);
    expect(ptBr.title).toBe('Contando em binário');
    expect(ptBr.blocks).toHaveLength(7);
    expect(ptBr.blocks[0]).toMatchObject({ line: 4, bodyMdx: 'Um **bit** é a menor unidade de informação: vale 0 ou 1.\n' });
    expect(ptBr.blocks[1]).toMatchObject({ title: 'De onde vem a palavra bit?', bodyMdx: expect.stringContaining('binary digit') });
    expect(ptBr.blocks[3]).toMatchObject({
      title: 'Quanto vale 101?',
      promptMdx: expect.stringContaining('101'),
      resolutionMdx: expect.stringContaining('4 + 0 + 1'),
      payloadJson: null,
    });
    expect(lesson.translations['en-US']!.blocks[0].bodyMdx).toContain('smallest unit');
  });

  it('stores simulator params as a JSON string on the shared block', async () => {
    const { bundle } = await loadPacks(fixture('valid'));
    const simulator = bundle.lessons[0].blocks[4];
    expect(simulator.simulatorKey).toBe('function-approach-grapher');
    expect(typeof simulator.simulatorParams).toBe('string');
    expect(JSON.parse(simulator.simulatorParams!)).toEqual({ expression: 'x^2', approachPoint: 1, domain: [-2, 2] });
    expect(bundle.lessons[0].translations['pt-BR']!.blocks[4].caption).toBe('Veja a curva se aproximar do ponto.');
  });

  it('stores code payloads as JSON per locale and the code kind and language once', async () => {
    const { bundle } = await loadPacks(fixture('valid'));
    const [lesson] = bundle.lessons;

    const snippet = JSON.parse(lesson.translations['pt-BR']!.blocks[5].payloadJson!);
    expect(snippet.variants.map((variant: { language: string }) => variant.language)).toEqual(['python', 'javascript']);
    expect(snippet.variants[0]).toMatchObject({ runnable: true, expectedOutput: '0\n1\n10\n' });
    expect(snippet.variants[1]).toMatchObject({ runnable: false, annotations: [], walkthrough: [] });

    expect(lesson.blocks[6]).toMatchObject({ type: 'code_exercise', codeKind: 'write', codeLanguage: 'python' });
    const exercise = lesson.translations['en-US']!.blocks[6];
    expect(exercise.promptMdx).toContain('Read an integer');
    const task = JSON.parse(exercise.payloadJson!);
    expect(task).toMatchObject({ starterCode: 'n = int(input())\n', tests: [{ stdin: '5', expectedStdout: '101' }, { stdin: '0', expectedStdout: '0' }] });
    expect(task).not.toHaveProperty('prompt');
    expect(task).not.toHaveProperty('kind');
  });

  it('holds one question per type with their per-type fields', async () => {
    const { bundle } = await loadPacks(fixture('valid'));
    const byKey = new Map(bundle.questions.map((question) => [question.key, question]));
    expect([...byKey.values()].map((question) => question.type).sort()).toEqual([
      'code',
      'matching',
      'multiple_choice',
      'multiple_response',
      'numeric',
      'ordering',
      'short_text',
      'short_text',
      'true_false',
    ]);
    for (const question of bundle.questions) {
      expect(question).toMatchObject({ disciplineSlug: 'computer-science', subjectSlug: 'programming' });
    }

    const multipleChoice = byKey.get('binary-multiple-choice')!;
    expect(multipleChoice.options).toEqual([{ isCorrect: false }, { isCorrect: true }, { isCorrect: false }]);
    expect(multipleChoice.translations['pt-BR']!.options).toEqual([{ textMdx: '1' }, { textMdx: '2' }, { textMdx: '10' }]);
    expect(multipleChoice.tagSlugs).toEqual(['binary']);

    expect(byKey.get('binary-multiple-response')!.options.map((option) => option.isCorrect)).toEqual([true, false, true]);
    expect(byKey.get('binary-numeric')).toMatchObject({ correctAnswer: '10', tagSlugs: ['binary-conversion'] });
    expect(byKey.get('binary-true-false')).toMatchObject({ correctAnswer: 'false', tagSlugs: [] });

    const ordering = byKey.get('binary-ordering')!;
    expect(ordering.translations['pt-BR']!.options.map((option) => option.textMdx)).toEqual(['1', '10', '11', '100']);
    expect(ordering.options).toHaveLength(4);

    const matching = byKey.get('binary-matching')!;
    expect(matching.matchingPairCount).toBe(2);
    expect(matching.translations['pt-BR']!.matchingPairs).toEqual([
      { leftMdx: '11', rightMdx: '3' },
      { leftMdx: '101', rightMdx: '5' },
    ]);

    const code = byKey.get('binary-code')!;
    expect(code).toMatchObject({ codeKind: 'write', codeLanguage: 'javascript', difficulty: 'medium' });
    expect(JSON.parse(code.translations['pt-BR']!.codeJson!).tests).toHaveLength(2);
  });

  it('keeps text accepted answers per locale and math accepted answers shared', async () => {
    const { bundle } = await loadPacks(fixture('valid'));
    const byKey = new Map(bundle.questions.map((question) => [question.key, question]));

    const text = byKey.get('binary-short-text')!;
    expect(text.answerFormat).toBe('text');
    expect(text.acceptedAnswersShared).toEqual([]);
    expect(text.translations['pt-BR']!.acceptedAnswers).toEqual(['bit', 'o bit']);
    expect(text.translations['en-US']!.acceptedAnswers).toEqual(['bit', 'a bit']);

    const math = byKey.get('binary-short-math')!;
    expect(math.answerFormat).toBe('math');
    expect(math.acceptedAnswersShared).toEqual(['2^3']);
    expect(math.translations['pt-BR']!.acceptedAnswers).toEqual([]);
  });

  it('is plain serializable data', async () => {
    const { bundle } = await loadPacks(fixture('valid'));
    expect(JSON.parse(JSON.stringify(bundle))).toEqual(bundle);
  });
});

describe('loadPacks line-numbered errors', () => {
  it('reports a YAML syntax error with its file and line', async () => {
    const { problems } = await loadPacks(fixture('invalid/line-errors'));
    const found = problemsFor(problems, `${LINE_ERRORS_DIR}/01-syntax-error.pt-BR.yaml`);
    expect(found).toEqual([
      {
        file: `${LINE_ERRORS_DIR}/01-syntax-error.pt-BR.yaml`,
        line: 5,
        message: expect.stringMatching(/^YAML syntax error: .*column 11/),
      },
    ]);
  });

  it('reports tab indentation with a line', async () => {
    const { problems } = await loadPacks(fixture('invalid/line-errors'));
    const found = problemsFor(problems, `${LINE_ERRORS_DIR}/02-tab-indent.pt-BR.yaml`);
    expect(found.length).toBeGreaterThan(0);
    expect(found[0]).toMatchObject({ line: 4, message: expect.stringContaining('Tabs are not allowed') });
  });

  it('reports a missing prompt with its path and the line of its block', async () => {
    const { problems } = await loadPacks(fixture('invalid/line-errors'));
    expect(problemsFor(problems, `${LINE_ERRORS_DIR}/03-missing-prompt.pt-BR.yaml`)).toEqual([
      {
        file: `${LINE_ERRORS_DIR}/03-missing-prompt.pt-BR.yaml`,
        line: 6,
        message: 'blocks[1].prompt: required (expected text)',
      },
    ]);
  });

  it('reports an unknown block type and lists the known ones', async () => {
    const { problems } = await loadPacks(fixture('invalid/line-errors'));
    const [problem] = problemsFor(problems, `${LINE_ERRORS_DIR}/04-unknown-block-type.pt-BR.yaml`);
    expect(problem).toMatchObject({ line: 6 });
    expect(problem.message).toMatch(/^blocks\[1\]\.type: unknown block type "video"/);
    expect(problem.message).toContain('code_exercise');
  });

  it('keeps invalid files out of the bundle', async () => {
    const { bundle } = await loadPacks(fixture('invalid/line-errors'));
    expect(bundle.lessons).toEqual([]);
  });
});

describe('loadPacks collects every problem', () => {
  it('returns all 4 independent mistakes in one call', async () => {
    const { bundle, problems } = await loadPacks(fixture('invalid/collect'));
    expect(problems).toHaveLength(4);
    expect(problems).toEqual(
      expect.arrayContaining([
        { file: 'demo/_tree.yaml', line: 19, message: expect.stringContaining('subjects[1].order:') },
        { file: 'demo/basics/intro/start/01-broken-yaml.pt-BR.yaml', line: 6, message: expect.stringContaining('YAML syntax error') },
        { file: 'demo/basics/questions/missing-resolution.pt-BR.yaml', line: 1, message: 'resolution: required (expected text)' },
        {
          file: 'demo/basics/questions/two-correct-options.pt-BR.yaml',
          line: 6,
          message: expect.stringContaining('exactly 1 correct option'),
        },
      ]),
    );
    // The valid parts still load, and the cross-checks add nothing.
    expect(bundle.lessons.map((lesson) => lesson.slug)).toEqual(['good-lesson']);
    expect(bundle.subjects.map((subject) => subject.slug)).toEqual(['basics']);
    expect(checkPack(bundle)).toEqual([]);
  });
});

describe('loadPacks locale consistency', () => {
  it('reports an en-US lesson with one block fewer than pt-BR', async () => {
    const { bundle, problems } = await loadPacks(fixture('invalid/locale-mismatch'));
    expect(problemsFor(problems, 'demo/basics/intro/start/01-two-blocks.en-US.yaml')).toEqual([
      {
        file: 'demo/basics/intro/start/01-two-blocks.en-US.yaml',
        line: 3,
        message: expect.stringMatching(/^blocks: 1 block here but 2 in .*01-two-blocks\.pt-BR\.yaml/),
      },
    ]);
    // The mismatching translation is left out; pt-BR stays.
    expect(Object.keys(bundle.lessons[0].translations)).toEqual(['pt-BR']);
  });

  it('reports a question whose correct option differs between locales', async () => {
    const { problems } = await loadPacks(fixture('invalid/locale-mismatch'));
    const found = problemsFor(problems, 'demo/basics/questions/moved-answer.en-US.yaml');
    expect(found).toContainEqual({
      file: 'demo/basics/questions/moved-answer.en-US.yaml',
      line: 7,
      message: expect.stringMatching(/^options\[0\]\.correct: true here but false in .*moved-answer\.pt-BR\.yaml/),
    });
  });
});

describe('loadPacks messages', () => {
  const TREE = [
    'discipline:',
    '  slug: demo',
    '  order: 1',
    '  names: { pt-BR: Demo, en-US: Demo, es: Demo }',
    'subjects:',
    '  - slug: basics',
    '    order: 1',
    '    names: { pt-BR: Básico, en-US: Basics, es: Básico }',
    '    topics:',
    '      - slug: intro',
    '        order: 1',
    '        names: { pt-BR: Intro, en-US: Intro, es: Intro }',
    '        sections:',
    '          - slug: start',
    '            order: 1',
    '            names: { pt-BR: Início, en-US: Start, es: Inicio }',
    '',
  ].join('\n');

  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'birb-packs-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  async function load(files: Record<string, string>): Promise<PackProblem[]> {
    for (const [file, text] of Object.entries({ 'demo/_tree.yaml': TREE, ...files })) {
      await mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await writeFile(path.join(root, file), text);
    }
    return (await loadPacks(root)).problems;
  }

  const lesson = (blocks: string) => `slug: one\ntitle: Um\nblocks:\n${blocks}`;
  const LESSON = 'demo/basics/intro/start/01-one.pt-BR.yaml';

  it('asks to quote text that YAML read as a number', async () => {
    const problems = await load({
      'demo/basics/questions/q.pt-BR.yaml':
        'key: q\ntype: multiple_choice\ndifficulty: easy\nprompt: P\nresolution: R\noptions:\n  - text: 2\n    correct: true\n  - text: "3"\n',
    });
    expect(problems).toEqual([
      {
        file: 'demo/basics/questions/q.pt-BR.yaml',
        line: 7,
        message: 'options[0].text: expected text, but YAML read 2 as a number; wrap it in quotes',
      },
    ]);
  });

  it('names an unknown field at its own line', async () => {
    const problems = await load({ [LESSON]: lesson('  - type: text\n    bodyy: Texto.\n') });
    expect(problems).toEqual([
      { file: LESSON, line: 4, message: 'blocks[0].body: required (expected text)' },
      { file: LESSON, line: 5, message: 'blocks[0]: unknown field "bodyy"' },
    ]);
  });

  it('points into a code test that misses its expected output', async () => {
    const problems = await load({
      [LESSON]: lesson(
        '  - type: code_exercise\n    kind: write\n    language: python\n    prompt: P\n    resolution: R\n' +
          '    starterCode: ""\n    solution: print(1)\n    tests:\n      - stdin: "1"\n',
      ),
    });
    expect(problems).toEqual([{ file: LESSON, line: 12, message: 'blocks[0].tests[0].expectedStdout: required (expected text)' }]);
  });

  it('reports an empty file, a bad locale and a bad file name', async () => {
    const problems = await load({
      [LESSON]: '',
      'demo/basics/intro/start/02-two.en.yaml': lesson('  - type: text\n    body: B\n').replace('one', 'two'),
      'demo/basics/intro/start/intro.pt-BR.yaml': lesson('  - type: text\n    body: B\n'),
    });
    expect(problems).toEqual([
      { file: LESSON, line: 1, message: 'the file is empty' },
      {
        file: 'demo/basics/intro/start/02-two.en.yaml',
        message: 'unknown locale "en" in the file name; expected one of pt-BR, en-US, es',
      },
      {
        file: 'demo/basics/intro/start/intro.pt-BR.yaml',
        message: expect.stringContaining('lesson file names look like <order>-<lesson-slug>.<locale>.yaml'),
      },
    ]);
  });

  it('reports a slug or key that does not match the file name', async () => {
    const problems = await load({
      [LESSON]: lesson('  - type: text\n    body: B\n').replace('slug: one', 'slug: uno'),
      'demo/basics/questions/q.pt-BR.yaml': 'key: other\ntype: true_false\ndifficulty: easy\nprompt: P\nresolution: R\ncorrectAnswer: true\n',
    });
    expect(problems).toEqual([
      { file: 'demo/basics/intro/start/01-one.pt-BR.yaml', line: 1, message: 'slug: "uno" must match the file name, which says "one"' },
      { file: 'demo/basics/questions/q.pt-BR.yaml', line: 1, message: 'key: "other" must match the file name, which says "q"' },
    ]);
  });

  it('rejects a locale-formatted numeric answer and an unknown question type', async () => {
    const problems = await load({
      'demo/basics/questions/a.pt-BR.yaml': 'key: a\ntype: numeric\ndifficulty: easy\nprompt: P\nresolution: R\ncorrectAnswer: "1,5"\n',
      'demo/basics/questions/b.pt-BR.yaml': 'key: b\ntype: essay\ndifficulty: easy\nprompt: P\nresolution: R\n',
    });
    expect(problems).toEqual([
      { file: 'demo/basics/questions/a.pt-BR.yaml', line: 6, message: expect.stringMatching(/^correctAnswer: expected a number written with a dot/) },
      { file: 'demo/basics/questions/b.pt-BR.yaml', line: 2, message: expect.stringMatching(/^type: unknown question type "essay"; expected one of multiple_choice/) },
    ]);
  });

  it('reports a missing _tree.yaml, a discipline slug that differs from its directory and unexpected files', async () => {
    const problems = await load({
      'other/basics/questions/q.pt-BR.yaml': 'key: q\ntype: true_false\ndifficulty: easy\nprompt: P\nresolution: R\ncorrectAnswer: true\n',
      'demo/notes.txt': 'notes',
      'demo/README.md': 'Markdown notes are ignored.',
      'third/_tree.yaml': TREE,
    });
    expect(problems).toEqual([
      { file: 'demo/notes.txt', message: expect.stringContaining('unexpected file') },
      { file: 'third/_tree.yaml', line: 2, message: 'discipline.slug: "demo" must match the directory name "third"' },
      { file: 'other/_tree.yaml', message: expect.stringContaining('needs a _tree.yaml') },
    ]);
  });
});

describe('loadPacks on edited copies of the valid fixture', () => {
  const TREE_FILE = 'computer-science/_tree.yaml';
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'birb-packs-'));
    await cp(fixture('valid'), root, { recursive: true });
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  async function editFile(file: string, edit: (text: string) => string): Promise<void> {
    const target = path.join(root, file);
    await writeFile(target, edit(await readFile(target, 'utf8')));
  }

  async function loadAll(): Promise<{ bundle: PackBundle; problems: PackProblem[] }> {
    const { bundle, problems } = await loadPacks(root);
    return { bundle, problems: [...problems, ...checkPack(bundle)] };
  }

  it('reports a bad tag once, without cascading into its child tag or the questions using it', async () => {
    await editFile(TREE_FILE, (text) => text.replace('          es: Binario\n', ''));
    const { bundle, problems } = await loadAll();
    expect(problems).toEqual([
      { file: TREE_FILE, line: 31, message: 'subjects[0].tags[0].names.es: required (expected text)' },
    ]);
    // Only the bad tag is left out; its subject, topics and sibling tags remain.
    expect(bundle.subjects.map((subject) => subject.slug)).toEqual(['programming']);
    expect(bundle.sections.map((section) => section.slug)).toEqual(['first-steps']);
    expect(bundle.tags.map((tag) => tag.slug)).toEqual(['binary-conversion']);
  });

  it('says a lesson or question sits under a subject whose tree entry has problems, not that it is missing', async () => {
    await editFile(TREE_FILE, (text) => text.replace('  - slug: programming\n    order: 1', '  - slug: programming\n    order: first'));
    const { bundle, problems } = await loadAll();
    expect(problems[0]).toEqual({ file: TREE_FILE, line: 10, message: 'subjects[0].order: expected a number, got the text "first"' });
    // The subject's topics, sections and tags still load.
    expect(bundle.topics).toHaveLength(1);
    expect(bundle.tags).toHaveLength(2);
    const rest = problems.slice(1);
    expect(rest.length).toBe(bundle.lessons.length + bundle.questions.length);
    for (const problem of rest) {
      expect(problem.message).toBe(
        'subject "programming": its entry in computer-science/_tree.yaml has problems (reported above)',
      );
    }
  });

  it('keeps loading subjects when the discipline block has problems', async () => {
    await editFile(TREE_FILE, (text) => text.replace('  order: 1\n  names:', '  order: 0\n  names:'));
    const { bundle, problems } = await loadAll();
    expect(problems[0]).toMatchObject({ file: TREE_FILE, line: 3, message: expect.stringContaining('discipline.order:') });
    expect(bundle.subjects).toHaveLength(1);
    for (const problem of problems.slice(1)) {
      expect(problem.message).toBe(
        'discipline "computer-science": its entry in computer-science/_tree.yaml has problems (reported above)',
      );
    }
  });

  it('keeps the source text of a numeric answer and rejects .inf', async () => {
    const file = 'computer-science/programming/questions/binary-numeric.pt-BR.yaml';
    await editFile(file, (text) => text.replace('correctAnswer: 10', 'correctAnswer: 0.0000001'));
    const loaded = await loadAll();
    expect(loaded.problems).toEqual([]);
    expect(loaded.bundle.questions.find((question) => question.key === 'binary-numeric')!.correctAnswer).toBe('0.0000001');

    await editFile(file, (text) => text.replace('correctAnswer: 0.0000001', 'correctAnswer: .inf'));
    expect((await loadAll()).problems).toEqual([
      { file, line: 7, message: expect.stringMatching(/^correctAnswer: YAML read .inf or .nan as a non-finite number; wrap it in quotes/) },
    ]);
  });

  it('reports two lessons with the same order prefix in one section', async () => {
    const dir = path.join(root, LESSON_DIR);
    await writeFile(
      path.join(dir, '01-another-lesson.pt-BR.yaml'),
      'slug: another-lesson\ntitle: Outra\nblocks:\n  - type: text\n    body: Texto.\n',
    );
    expect((await loadAll()).problems).toEqual([
      {
        file: `${LESSON_DIR}/01-counting-in-binary.pt-BR.yaml`,
        message: `lesson order 1 in section "first-steps" is already used by ${LESSON_DIR}/01-another-lesson.pt-BR.yaml`,
      },
    ]);
  });

  it('reports symbolic links and non-YAML files as unexpected, without reading them', async () => {
    const dir = path.join(root, LESSON_DIR);
    await symlink(path.join(root, 'computer-science'), path.join(dir, 'linked-dir'));
    await symlink(path.join(root, 'nowhere.yaml'), path.join(dir, '02-dangling.pt-BR.yaml'));
    await writeFile(path.join(dir, 'diagram.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0x3a, 0x09]));
    await writeFile(path.join(root, 'computer-science/programming/questions/extra.pt-BR.yml'), 'key: extra\n');

    const { problems } = await loadAll();
    expect(problems).toEqual([
      { file: `${LESSON_DIR}/02-dangling.pt-BR.yaml`, message: expect.stringContaining('symbolic links') },
      { file: `${LESSON_DIR}/diagram.png`, message: expect.stringContaining('unexpected file') },
      { file: `${LESSON_DIR}/linked-dir`, message: expect.stringContaining('symbolic links') },
      {
        file: 'computer-science/programming/questions/extra.pt-BR.yml',
        message: expect.stringContaining('rename it to extra.pt-BR.yaml'),
      },
    ]);
  });
});

describe('loadPacks on a missing directory', () => {
  it('returns an empty bundle and no problems', async () => {
    const { bundle, problems } = await loadPacks(fixture('does-not-exist/content'));
    expect(problems).toEqual([]);
    expect(bundle).toEqual({
      disciplines: [],
      subjects: [],
      topics: [],
      sections: [],
      tags: [],
      lessons: [],
      questions: [],
      treeProblems: { disciplines: [], subjects: [], topics: [], sections: [], tags: [] },
    });
  });
});
