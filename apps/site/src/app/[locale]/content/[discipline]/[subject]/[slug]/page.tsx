import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getContentTree, getLessonBySlug, type Locale } from '@birb-learn/content-schema';
import { getDb } from '@birb-learn/content-schema/src/client';
import { LessonBlocks } from '@/components/lesson-blocks';
import { LessonFooter } from '@/components/lesson-footer';
import { LessonHeader } from '@/components/lesson-header';
import { LessonShell } from '@/components/lesson-shell';
import {
  findDiscipline,
  findSubject,
  flattenSubjectLessons,
  lessonHref,
  listLessonPaths,
  subjectHref,
} from '@/lib/content-navigation';
import { buildLessonSteps } from '@/lib/lesson-steps';
import { LESSON_BLOCK_TYPES } from '@birb-learn/content-schema';

// `output: 'export'` requires this to return at least one entry, or the
// build fails outright. In production builds (see
// apps/site/scripts/hydrate-from-admin.ts), the content database is
// hydrated from the admin panel's live D1 data, which must therefore
// always contain at least one lesson -- see apps/admin/README.md's
// "Publishing and the content database" section before ever deleting
// the last remaining lesson via the admin API.
export async function generateStaticParams() {
  return listLessonPaths(await getContentTree(getDb(), 'pt-BR'));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: Locale; discipline: string; subject: string; slug: string }>;
}) {
  const { locale, discipline: disciplineSlug, subject: subjectSlug, slug } = await params;
  setRequestLocale(locale);

  const db = getDb();
  const lesson = await getLessonBySlug(db, slug, locale);
  // The URL carries the whole hierarchy; reject a lesson requested under the wrong parents.
  if (!lesson || lesson.discipline.slug !== disciplineSlug || lesson.subject.slug !== subjectSlug) notFound();

  const t = await getTranslations('content');
  const tree = await getContentTree(db, locale);
  const discipline = findDiscipline(tree, disciplineSlug);
  const subject = discipline && findSubject(discipline, subjectSlug);
  if (!discipline || !subject) notFound();

  const siblings = flattenSubjectLessons(subject);
  const position = siblings.findIndex((entry) => entry.slug === lesson.slug);
  const toLink = (entry: (typeof siblings)[number] | undefined) =>
    entry ? { href: lessonHref(discipline.slug, subject.slug, entry.slug), title: entry.title } : undefined;
  const previousLesson = toLink(siblings[position - 1]);
  const nextLesson = toLink(siblings[position + 1]);

  const blockTypes = Object.fromEntries(LESSON_BLOCK_TYPES.map((type) => [type, t(`blocks.${type}`)])) as Record<
    (typeof LESSON_BLOCK_TYPES)[number],
    string
  >;
  const steps = buildLessonSteps(lesson.blocks, blockTypes);

  let body;
  try {
    body = await LessonBlocks({
      blocks: lesson.blocks,
      labels: {
        blockTypes,
        showResolution: t('showResolution'),
        hideResolution: t('hideResolution'),
        exerciseTry: t('exerciseTry'),
        resolution: t('resolution'),
      },
    });
  } catch (cause) {
    throw new Error(`Failed to compile lesson "${lesson.slug}"`, { cause });
  }

  return (
    <main id="main-content">
      <LessonShell
        steps={steps}
        lessonSlug={lesson.slug}
        lessonNumber={position + 1}
        lessonTotal={siblings.length}
        outline={siblings.map((entry) => ({
          slug: entry.slug,
          title: entry.title,
          href: lessonHref(discipline.slug, subject.slug, entry.slug),
        }))}
        previousLesson={previousLesson}
        nextLesson={nextLesson}
        indexHref={subjectHref(discipline.slug, subject.slug)}
        header={
          <LessonHeader
            title={lesson.title}
            discipline={lesson.discipline}
            subject={lesson.subject}
            topicName={lesson.topic.name}
            sectionName={lesson.section.name}
            lessonNumber={position + 1}
            lessonTotal={siblings.length}
            isFallback={lesson.isFallback}
          />
        }
        footer={<LessonFooter lessonSlug={lesson.slug} previousLesson={previousLesson} nextLesson={nextLesson} />}
      >
        {body}
      </LessonShell>
    </main>
  );
}
