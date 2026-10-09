import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getContentTree, type Locale } from '@birb-learn/content-schema';
import { getDb } from '@birb-learn/content-schema/src/client';
import { Icon } from '@birb-learn/theme';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { CardProgress } from '@/components/card-progress';
import { PageHeader } from '@/components/page-header';
import { Reveal } from '@/components/reveal';
import { SelectionCard } from '@/components/selection-card';
import { SelectionSteps } from '@/components/selection-steps';
import {
  countSubjectLessons,
  countSubjectSections,
  findDiscipline,
  lessonSlugsOfSubject,
  subjectHref,
} from '@/lib/content-navigation';
import { iconForSlug, toneForIndex } from '@/lib/slug-icons';
import styles from '@/styles/page.module.css';

export async function generateStaticParams() {
  const tree = await getContentTree(getDb(), 'pt-BR');
  return tree.map((discipline) => ({ discipline: discipline.slug }));
}

export default async function DisciplinePage({
  params,
}: {
  params: Promise<{ locale: Locale; discipline: string }>;
}) {
  const { locale, discipline: disciplineSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('content');
  const tree = await getContentTree(getDb(), locale);
  const discipline = findDiscipline(tree, disciplineSlug);
  if (!discipline) notFound();

  return (
    <main className={styles.main} id="main-content">
      <PageHeader
        eyebrow={t('subjects.eyebrow')}
        title={discipline.name}
        subtitle={t('subjects.subtitle', { discipline: discipline.name })}
        icon={iconForSlug(discipline.slug)}
        breadcrumbs={
          <>
            <Breadcrumbs
              label={t('breadcrumbLabel')}
              items={[{ label: t('title'), href: '/content' }, { label: discipline.name }]}
            />
            <SelectionSteps current="subject" />
          </>
        }
      />
      <div className={styles.container}>
        {discipline.subjects.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <Icon name="inbox" size={28} aria-hidden />
            </span>
            <p>{t('subjects.empty')}</p>
          </div>
        ) : (
          <ul className={styles.grid}>
            {discipline.subjects.map((subject, index) => (
              <Reveal as="li" key={subject.slug} delay={index * 70}>
                <SelectionCard
                  href={subjectHref(discipline.slug, subject.slug)}
                  icon={iconForSlug(subject.slug)}
                  tone={toneForIndex(index)}
                  title={subject.name}
                  meta={[
                    t('counts.topics', { count: subject.topics.length }),
                    t('counts.sections', { count: countSubjectSections(subject) }),
                    t('counts.lessons', { count: countSubjectLessons(subject) }),
                  ]}
                  footer={<CardProgress slugs={lessonSlugsOfSubject(subject)} />}
                  openLabel={t('open')}
                />
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
