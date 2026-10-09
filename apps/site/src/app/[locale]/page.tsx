import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getContentTree, type Locale } from '@birb-learn/content-schema';
import { getDb } from '@birb-learn/content-schema/src/client';
import { BirbLogo, Icon, type IconName } from '@birb-learn/theme';
import { CardProgress } from '@/components/card-progress';
import { HeroVisual } from '@/components/hero-visual';
import { Reveal } from '@/components/reveal';
import { SelectionCard } from '@/components/selection-card';
import { Link } from '@/i18n/navigation';
import { countDisciplineLessons, disciplineHref, lessonSlugsOfDiscipline } from '@/lib/content-navigation';
import { iconForSlug, toneForIndex } from '@/lib/slug-icons';
import styles from '@/styles/home.module.css';

const FEATURES: { key: 'lessons' | 'simulators' | 'solved' | 'simulado' | 'themes' | 'openSource'; icon: IconName; tone: string }[] = [
  { key: 'lessons', icon: 'book-open', tone: 'accent' },
  { key: 'simulators', icon: 'sliders', tone: 'info' },
  { key: 'solved', icon: 'pen-line', tone: 'success' },
  { key: 'simulado', icon: 'clipboard-list', tone: 'warning' },
  { key: 'themes', icon: 'palette', tone: 'accent' },
  { key: 'openSource', icon: 'code', tone: 'info' },
];

const STEPS: { key: 'choose' | 'learn' | 'practice'; icon: IconName }[] = [
  { key: 'choose', icon: 'compass' },
  { key: 'learn', icon: 'graduation-cap' },
  { key: 'practice', icon: 'target' },
];

/** Splits `title` around `highlight` so the highlighted phrase can be styled; falls back to plain text. */
function splitHighlight(title: string, highlight: string): [string, string, string] {
  const index = title.indexOf(highlight);
  if (!highlight || index === -1) return [title, '', ''];
  return [title.slice(0, index), highlight, title.slice(index + highlight.length)];
}

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tContent = await getTranslations('content');
  const tree = await getContentTree(getDb(), locale);

  const lessonCount = tree.reduce((sum, discipline) => sum + countDisciplineLessons(discipline), 0);
  const subjectCount = tree.reduce((sum, discipline) => sum + discipline.subjects.length, 0);
  const [titleStart, titleHighlight, titleEnd] = splitHighlight(t('heroTitle'), t('heroHighlight'));

  const stats: { icon: IconName; label: string }[] = [
    { icon: 'book-open', label: t('stats.lessons', { count: lessonCount }) },
    { icon: 'layers', label: t('stats.subjects', { count: subjectCount }) },
    { icon: 'languages', label: t('stats.languages') },
    { icon: 'heart', label: t('stats.free') },
  ];

  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBackdrop} aria-hidden />
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>
              <Icon name="sparkles" size={14} aria-hidden />
              {t('eyebrow')}
            </p>
            <h1 className={styles.heroTitle}>
              {titleStart}
              {titleHighlight && <span className={styles.highlight}>{titleHighlight}</span>}
              {titleEnd}
            </h1>
            <p className={styles.heroSubtitle}>{t('heroSubtitle')}</p>
            <div className={styles.actions}>
              <Link href="/content" className={styles.primaryAction}>
                <Icon name="rocket" size={18} aria-hidden />
                {t('ctaContent')}
              </Link>
              <Link href="/simulado" className={styles.secondaryAction}>
                <Icon name="clipboard-list" size={18} aria-hidden />
                {t('ctaSimulado')}
              </Link>
            </div>
            <ul className={styles.stats}>
              {stats.map((stat) => (
                <li key={stat.label} className={styles.stat}>
                  <Icon name={stat.icon} size={16} aria-hidden />
                  {stat.label}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      {tree.length > 0 && (
        <section className={styles.section} aria-labelledby="home-disciplines">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHead}>
              <div>
                <h2 id="home-disciplines" className={styles.sectionTitle}>
                  {t('disciplines.title')}
                </h2>
                <p className={styles.sectionSubtitle}>{t('disciplines.subtitle')}</p>
              </div>
              <Link href="/content" className={styles.textLink}>
                {t('disciplines.viewAll')}
                <Icon name="arrow-right" size={16} aria-hidden />
              </Link>
            </div>
            <ul className={styles.cardGrid}>
              {tree.slice(0, 3).map((discipline, index) => (
                <Reveal as="li" key={discipline.slug} delay={index * 80}>
                  <SelectionCard
                    href={disciplineHref(discipline.slug)}
                    icon={iconForSlug(discipline.slug)}
                    tone={toneForIndex(index)}
                    title={discipline.name}
                    meta={[
                      tContent('counts.subjects', { count: discipline.subjects.length }),
                      tContent('counts.lessons', { count: countDisciplineLessons(discipline) }),
                    ]}
                    footer={<CardProgress slugs={lessonSlugsOfDiscipline(discipline)} />}
                    openLabel={tContent('open')}
                  />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className={styles.section} aria-labelledby="home-features">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeadCentered}>
            <h2 id="home-features" className={styles.sectionTitle}>
              {t('features.title')}
            </h2>
            <p className={styles.sectionSubtitle}>{t('features.subtitle')}</p>
          </div>
          <ul className={styles.featureGrid}>
            {FEATURES.map((feature, index) => (
              <Reveal as="li" key={feature.key} delay={(index % 3) * 80}>
                <article className={styles.feature} data-tone={feature.tone}>
                  <span className={styles.featureIcon} aria-hidden>
                    <Icon name={feature.icon} size={22} />
                  </span>
                  <h3 className={styles.featureTitle}>{t(`features.${feature.key}.title`)}</h3>
                  <p className={styles.featureText}>{t(`features.${feature.key}.text`)}</p>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionTinted}`} aria-labelledby="home-steps">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeadCentered}>
            <h2 id="home-steps" className={styles.sectionTitle}>
              {t('steps.title')}
            </h2>
          </div>
          <ol className={styles.steps}>
            {STEPS.map((step, index) => (
              <Reveal as="li" key={step.key} delay={index * 100} className={styles.stepItem}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <span className={styles.stepIcon} aria-hidden>
                  <Icon name={step.icon} size={24} />
                </span>
                <h3 className={styles.featureTitle}>{t(`steps.${step.key}.title`)}</h3>
                <p className={styles.featureText}>{t(`steps.${step.key}.text`)}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <Reveal className={styles.cta}>
          <BirbLogo variant="mark" size={72} className={styles.ctaLogo} />
          <h2 className={styles.ctaTitle}>{t('cta.title')}</h2>
          <p className={styles.ctaText}>{t('cta.text')}</p>
          <Link href="/content" className={styles.ctaButton}>
            {t('cta.button')}
            <Icon name="arrow-right" size={18} aria-hidden />
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
