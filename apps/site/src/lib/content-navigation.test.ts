import { describe, expect, it } from 'vitest';
import type { ContentTree } from '@birb-learn/content-schema';
import {
  countCompleted,
  countDisciplineLessons,
  countSubjectLessons,
  findDiscipline,
  findSubject,
  flattenSubjectLessons,
  lessonHref,
  lessonSlugsOfSubject,
  listLessonPaths,
  percentOf,
  pickResumeLesson,
} from './content-navigation';

const tree: ContentTree[] = [
  {
    id: 1,
    slug: 'matematica',
    name: 'Matemática',
    subjects: [
      {
        id: 1,
        slug: 'calculo',
        name: 'Cálculo',
        topics: [
          {
            id: 1,
            slug: 'limites',
            name: 'Limites',
            sections: [
              {
                id: 1,
                slug: 'intuicao',
                name: 'Ideia intuitiva',
                lessons: [
                  { slug: 'o-que-e-limite', title: 'O que é um limite?' },
                  { slug: 'limites-graficos', title: 'Limites no gráfico' },
                ],
              },
              { id: 2, slug: 'formal', name: 'Definição formal', lessons: [{ slug: 'epsilon-delta', title: 'Épsilon-delta' }] },
            ],
          },
        ],
      },
      { id: 2, slug: 'algebra', name: 'Álgebra', topics: [] },
    ],
  },
  { id: 2, slug: 'fisica', name: 'Física', subjects: [] },
];

describe('content navigation helpers', () => {
  it('builds hierarchical hrefs', () => {
    expect(lessonHref('matematica', 'calculo', 'o-que-e-limite')).toBe('/content/matematica/calculo/o-que-e-limite');
  });

  it('flattens a subject into reading order with its ancestors', () => {
    const flat = flattenSubjectLessons(tree[0].subjects[0]);
    expect(flat.map((lesson) => lesson.slug)).toEqual(['o-que-e-limite', 'limites-graficos', 'epsilon-delta']);
    expect(flat[2].section).toEqual({ slug: 'formal', name: 'Definição formal' });
    expect(flat[0].topic).toEqual({ slug: 'limites', name: 'Limites' });
  });

  it('counts lessons per subject and discipline', () => {
    expect(countSubjectLessons(tree[0].subjects[0])).toBe(3);
    expect(countSubjectLessons(tree[0].subjects[1])).toBe(0);
    expect(countDisciplineLessons(tree[0])).toBe(3);
  });

  it('counts completed lessons and computes a rounded percentage', () => {
    const slugs = lessonSlugsOfSubject(tree[0].subjects[0]);
    expect(countCompleted(slugs, (slug) => slug === 'epsilon-delta')).toBe(1);
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(0, 0)).toBe(0);
  });

  it('finds disciplines and subjects by slug', () => {
    expect(findDiscipline(tree, 'fisica')?.name).toBe('Física');
    expect(findDiscipline(tree, 'nope')).toBeUndefined();
    expect(findSubject(tree[0], 'algebra')?.name).toBe('Álgebra');
  });

  it('resumes at the first incomplete lesson, or the first lesson when all are done', () => {
    const flat = flattenSubjectLessons(tree[0].subjects[0]);
    expect(pickResumeLesson(flat, (slug) => slug === 'o-que-e-limite')?.slug).toBe('limites-graficos');
    expect(pickResumeLesson(flat, () => true)?.slug).toBe('o-que-e-limite');
    expect(pickResumeLesson([], () => false)).toBeUndefined();
  });

  it('lists every lesson path for static export', () => {
    expect(listLessonPaths(tree)).toEqual([
      { discipline: 'matematica', subject: 'calculo', slug: 'o-que-e-limite' },
      { discipline: 'matematica', subject: 'calculo', slug: 'limites-graficos' },
      { discipline: 'matematica', subject: 'calculo', slug: 'epsilon-delta' },
    ]);
  });
});
