import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getContentTree, type Locale } from '@birb-learn/content-schema';
import { getDb } from '@birb-learn/content-schema/src/client';
import { Icon } from '@birb-learn/theme';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ContentTree, SubjectProgressSummary } from '@/components/content-tree';
import { PageHeader } from '@/components/page-header';
import { SelectionSteps } from '@/components/selection-steps';
import { countSubjectLessons, findDiscipline, findSubject } from '@/lib/content-navigation';
import { iconForSlug } from '@/lib/slug-icons';
import styles from '@/styles/page.module.css';

// Static export: every (discipline, subject) pair must be known at build time.
// Next calls this once per parent `[discipline]` param when the parent defines
// its own `generateStaticParams`, so narrow to that discipline when it is given.
export async function generateStaticParams({
  params,
}: {
  params?: { discipline?: string } | Promise<{ discipline?: string }>;
}) {
  const parent = params ? await params : undefined;
  const tree = await getContentTree(getDb(), 'pt-BR');
  return tree
    .filter((discipline) => !parent?.discipline || discipline.slug === parent.discipline)
    .flatMap((discipline) =>
      discipline.subjects.map((subject) => ({ discipline: discipline.slug, subject: subject.slug })),
    );
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ locale: Locale; discipline: string; subject: string }>;
}) {
  const { locale, discipline: disciplineSlug, subject: subjectSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('content');
  const tree = await getContentTree(getDb(), locale);
  const discipline = findDiscipline(tree, disciplineSlug);
  const subject = discipline && findSubject(discipline, subjectSlug);
  if (!discipline || !subject) notFound();

  const lessonCount = countSubjectLessons(subject);

  return (
    <main className={styles.main} id="main-content">
      <PageHeader
        eyebrow={t('tree.eyebrow')}
        title={subject.name}
        subtitle={t('tree.subtitle')}
        icon={iconForSlug(subject.slug)}
        breadcrumbs={
          <>
            <Breadcrumbs
              label={t('breadcrumbLabel')}
              items={[
                { label: t('title'), href: '/content' },
                { label: discipline.name, href: `/content/${discipline.slug}` },
                { label: subject.name },
              ]}
            />
            <SelectionSteps current="lessons" />
          </>
        }
      />
      <div className={`${styles.container} ${styles.narrow}`}>
        {lessonCount === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <Icon name="inbox" size={28} aria-hidden />
            </span>
            <p>{t('tree.empty')}</p>
          </div>
        ) : (
          <>
            <SubjectProgressSummary disciplineSlug={discipline.slug} subject={subject} />
            <ContentTree disciplineSlug={discipline.slug} subject={subject} />
          </>
        )}
      </div>
    </main>
  );
}
