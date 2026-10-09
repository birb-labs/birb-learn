import type {
  ContentSection,
  ContentSubject,
  ContentTopic,
  ContentTree,
} from '@birb-learn/content-schema';

/** A lesson together with where it sits inside its subject, in reading order. */
export interface FlatLesson {
  slug: string;
  title: string;
  topic: { slug: string; name: string };
  section: { slug: string; name: string };
}

export function lessonHref(disciplineSlug: string, subjectSlug: string, lessonSlug: string): string {
  return `/content/${disciplineSlug}/${subjectSlug}/${lessonSlug}`;
}

export function subjectHref(disciplineSlug: string, subjectSlug: string): string {
  return `/content/${disciplineSlug}/${subjectSlug}`;
}

export function disciplineHref(disciplineSlug: string): string {
  return `/content/${disciplineSlug}`;
}

/** Every lesson of a subject, flattened in the order a student reads them. */
export function flattenSubjectLessons(subject: ContentSubject): FlatLesson[] {
  return subject.topics.flatMap((topic) =>
    topic.sections.flatMap((section) =>
      section.lessons.map((lesson) => ({
        slug: lesson.slug,
        title: lesson.title,
        topic: { slug: topic.slug, name: topic.name },
        section: { slug: section.slug, name: section.name },
      })),
    ),
  );
}

export function countSectionLessons(section: ContentSection): number {
  return section.lessons.length;
}

export function countTopicLessons(topic: ContentTopic): number {
  return topic.sections.reduce((sum, section) => sum + countSectionLessons(section), 0);
}

export function countSubjectLessons(subject: ContentSubject): number {
  return subject.topics.reduce((sum, topic) => sum + countTopicLessons(topic), 0);
}

export function countDisciplineLessons(discipline: ContentTree): number {
  return discipline.subjects.reduce((sum, subject) => sum + countSubjectLessons(subject), 0);
}

export function countTopicSections(topic: ContentTopic): number {
  return topic.sections.length;
}

export function countSubjectSections(subject: ContentSubject): number {
  return subject.topics.reduce((sum, topic) => sum + countTopicSections(topic), 0);
}

export function lessonSlugsOfSection(section: ContentSection): string[] {
  return section.lessons.map((lesson) => lesson.slug);
}

export function lessonSlugsOfTopic(topic: ContentTopic): string[] {
  return topic.sections.flatMap(lessonSlugsOfSection);
}

export function lessonSlugsOfSubject(subject: ContentSubject): string[] {
  return subject.topics.flatMap(lessonSlugsOfTopic);
}

export function lessonSlugsOfDiscipline(discipline: ContentTree): string[] {
  return discipline.subjects.flatMap(lessonSlugsOfSubject);
}

export function countCompleted(slugs: string[], isComplete: (slug: string) => boolean): number {
  return slugs.filter(isComplete).length;
}

/** Whole-number percentage, 0 when there is nothing to complete. */
export function percentOf(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

export function findDiscipline(tree: ContentTree[], slug: string): ContentTree | undefined {
  return tree.find((discipline) => discipline.slug === slug);
}

export function findSubject(discipline: ContentTree, slug: string): ContentSubject | undefined {
  return discipline.subjects.find((subject) => subject.slug === slug);
}

/** The first lesson not yet completed, falling back to the first lesson. */
export function pickResumeLesson(lessons: FlatLesson[], isComplete: (slug: string) => boolean): FlatLesson | undefined {
  return lessons.find((lesson) => !isComplete(lesson.slug)) ?? lessons[0];
}

/** Static-export params for every `[discipline]/[subject]/[slug]` lesson page. */
export function listLessonPaths(tree: ContentTree[]): { discipline: string; subject: string; slug: string }[] {
  return tree.flatMap((discipline) =>
    discipline.subjects.flatMap((subject) =>
      lessonSlugsOfSubject(subject).map((slug) => ({ discipline: discipline.slug, subject: subject.slug, slug })),
    ),
  );
}
