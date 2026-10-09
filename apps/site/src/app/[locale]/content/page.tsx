import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getContentTree, type Locale } from '@birb-learn/content-schema';
import { getDb } from '@birb-learn/content-schema/src/client';
import { Icon } from '@birb-learn/theme';
import { CardProgress } from '@/components/card-progress';
import { PageHeader } from '@/components/page-header';
import { Reveal } from '@/components/reveal';
import { SelectionCard } from '@/components/selection-card';
import { SelectionSteps } from '@/components/selection-steps';
import {
  countDisciplineLessons,
  disciplineHref,
  lessonSlugsOfDiscipline,
} from '@/lib/content-navigation';
import { iconForSlug, toneForIndex } from '@/lib/slug-icons';
import styles from '@/styles/page.module.css';

export default async function ContentIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('content');
  const tree = await getContentTree(getDb(), locale);

  return (
    <main className={styles.main} id="main-content">
      <PageHeader
        eyebrow={t('disciplines.eyebrow')}
        title={t('disciplines.title')}
        subtitle={t('disciplines.subtitle')}
        icon="library"
        breadcrumbs={<SelectionSteps current="discipline" />}
      />
      <div className={styles.container}>
        {tree.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <Icon name="inbox" size={28} aria-hidden />
            </span>
            <p>{t('empty')}</p>
          </div>
        ) : (
          <ul className={styles.grid}>
            {tree.map((discipline, index) => (
              <Reveal as="li" key={discipline.slug} delay={index * 70}>
                <SelectionCard
                  href={disciplineHref(discipline.slug)}
                  icon={iconForSlug(discipline.slug)}
                  tone={toneForIndex(index)}
                  title={discipline.name}
                  meta={[
                    t('counts.subjects', { count: discipline.subjects.length }),
                    t('counts.lessons', { count: countDisciplineLessons(discipline) }),
                  ]}
                  footer={<CardProgress slugs={lessonSlugsOfDiscipline(discipline)} />}
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
