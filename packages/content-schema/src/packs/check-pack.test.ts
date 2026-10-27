import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { checkPack } from './check-pack';
import { loadPacks } from './load-pack';
import type { PackBundle, PackProblem } from './pack-schemas';

const FIXTURES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../test-fixtures/packs');

const LESSONS = 'demo/basics/intro';
const QUESTIONS = 'demo/basics/questions';

describe('checkPack on the cross-checks fixture', () => {
  let bundle: PackBundle;
  let problems: PackProblem[];

  beforeAll(async () => {
    const loaded = await loadPacks(path.join(FIXTURES, 'invalid/cross-checks'));
    // Every file is valid on its own; only the whole-bundle checks fail.
    expect(loaded.problems).toEqual([]);
    bundle = loaded.bundle;
    problems = checkPack(bundle);
  });

  it('reports a question tag that the subject does not define', () => {
    expect(problems).toContainEqual({
      file: `${QUESTIONS}/unknown-tag.pt-BR.yaml`,
      line: 4,
      message: 'tags[1]: unknown tag "nope"; subject "basics" defines: alpha, orphan',
    });
  });

  it('reports a tag whose parent does not exist', () => {
    expect(problems).toContainEqual({
      file: 'demo/_tree.yaml',
      line: 20,
      message: 'tag "orphan": unknown parent tag "no-such-parent" in subject "basics"',
    });
  });

  it('reports a question key used twice', () => {
    expect(problems).toContainEqual({
      file: 'demo/extras/questions/shared-key.pt-BR.yaml',
      message: `question key "shared-key" is already used by ${QUESTIONS}/shared-key.pt-BR.yaml`,
    });
  });

  it('reports a slug used twice in the same table', () => {
    expect(problems).toContainEqual({
      file: 'demo/_tree.yaml',
      line: 27,
      message: 'topic slug "intro" is already used at demo/_tree.yaml:10',
    });
  });

  it('reports a lesson whose directory is not in _tree.yaml', () => {
    expect(problems).toContainEqual({
      file: `${LESSONS}/missing-section/01-lost.pt-BR.yaml`,
      message: 'section "missing-section" is not in demo/_tree.yaml under topic "intro"',
    });
  });

  it('reports a lesson without a pt-BR file', () => {
    expect(problems).toContainEqual({
      file: `${LESSONS}/start/01-english-only.en-US.yaml`,
      message: 'lesson "english-only" has no valid pt-BR file (01-english-only.pt-BR.yaml)',
    });
  });

  it('reports code snippet checks with the block path and line', () => {
    expect(problems).toContainEqual({
      file: `${LESSONS}/start/02-code-checks.pt-BR.yaml`,
      line: 9,
      message: 'blocks[1].variants[0].runnable: mysql code is read-only',
    });
  });

  it('reports code exercise checks with the block path and line', () => {
    expect(problems).toContainEqual({
      file: `${LESSONS}/start/02-code-checks.pt-BR.yaml`,
      line: 22,
      message: 'blocks[2].blanks[0].id: blank 2 has no ___2___ marker in starterCode',
    });
    expect(problems).toContainEqual({
      file: `${LESSONS}/start/02-code-checks.pt-BR.yaml`,
      line: 21,
      message: 'blocks[2].blanks: marker ___1___ in starterCode has no matching blank 1',
    });
  });

  it('reports code question checks with the field line', () => {
    expect(problems).toContainEqual({
      file: `${QUESTIONS}/find-bug-range.pt-BR.yaml`,
      line: 11,
      message: 'bugLines: range "9" is past the end of the code (1 lines)',
    });
  });

  it('reports nothing else', () => {
    expect(problems).toHaveLength(10);
  });

  it('gives the same problems for a bundle that went through JSON', () => {
    expect(checkPack(JSON.parse(JSON.stringify(bundle)) as PackBundle)).toEqual(problems);
  });
});

describe('checkPack on inconsistent bundles', () => {
  it('reports a translation whose block count differs from the lesson', async () => {
    const { bundle } = await loadPacks(path.join(FIXTURES, 'valid'));
    bundle.lessons[0].translations['en-US']!.blocks.pop();
    expect(checkPack(bundle)).toEqual([
      {
        file: 'computer-science/programming/programming-basics/first-steps/01-counting-in-binary.en-US.yaml',
        message: 'blocks: 6 block translations but the lesson has 7 blocks',
      },
    ]);
  });

  it('reports a question translation whose option count differs from the question', async () => {
    const { bundle } = await loadPacks(path.join(FIXTURES, 'valid'));
    const question = bundle.questions.find((candidate) => candidate.key === 'binary-multiple-choice')!;
    question.translations['pt-BR']!.options.pop();
    expect(checkPack(bundle)).toEqual([
      {
        file: 'computer-science/programming/questions/binary-multiple-choice.pt-BR.yaml',
        message: 'options: 2 option texts but the question has 3 options',
      },
    ]);
  });

  it('reports every tree entry that was left out because of its own problems', async () => {
    const { bundle } = await loadPacks(path.join(FIXTURES, 'valid'));
    bundle.treeProblems.tags.push('broken-tag', 'other-tag');
    bundle.treeProblems.subjects.push('broken-subject');
    expect(checkPack(bundle)).toEqual([
      { file: '_tree.yaml', message: 'subjects "broken-subject" were left out of _tree.yaml because of problems in their entries' },
      { file: '_tree.yaml', message: 'tags "broken-tag", "other-tag" were left out of _tree.yaml because of problems in their entries' },
    ]);
  });

  it('reports nothing for a bundle without tree problems', async () => {
    const { bundle } = await loadPacks(path.join(FIXTURES, 'valid'));
    expect(checkPack(bundle)).toEqual([]);
  });
});
