'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '@birb-learn/theme';
import type { SimuladoAttempt } from '@/hooks/use-simulado-history';
import styles from './simulado-history.module.css';

export function SimuladoHistory({
  history,
  onViewAttempt,
}: {
  history: SimuladoAttempt[];
  onViewAttempt: (attempt: SimuladoAttempt) => void;
}) {
  const t = useTranslations('simulado.history');

  if (history.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>
          <Icon name="history" size={20} aria-hidden />
          {t('title')}
        </h2>
        <p className={styles.empty}>{t('empty')}</p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        <Icon name="history" size={20} aria-hidden />
        {t('title')}
      </h2>
      <div className={styles.list}>
        {history.map((attempt) => {
          const percent = attempt.result.total > 0 ? Math.round((attempt.result.correctCount / attempt.result.total) * 100) : 0;
          return (
            <div key={attempt.completedAt} className={styles.entry}>
              <span className={styles.score} data-level={percent >= 70 ? 'high' : percent >= 40 ? 'mid' : 'low'}>
                {attempt.result.correctCount}/{attempt.result.total}
              </span>
              <span className={styles.date}>{new Date(attempt.completedAt).toLocaleString()}</span>
              <button type="button" className={styles.viewButton} onClick={() => onViewAttempt(attempt)}>
                {t('viewAttempt')}
                <Icon name="arrow-right" size={14} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
