import { Fragment } from 'react';
import { getTranslations } from 'next-intl/server';
import { Icon } from '@birb-learn/theme';
import styles from './selection-steps.module.css';

type Step = 'discipline' | 'subject' | 'lessons';
const STEPS: Step[] = ['discipline', 'subject', 'lessons'];

/** Three-step trail (matéria → assunto → lições) shown on the content selection screens. */
export async function SelectionSteps({ current }: { current: Step }) {
  const t = await getTranslations('content.steps');
  const currentIndex = STEPS.indexOf(current);

  return (
    <ol className={styles.steps} aria-label={t('label')}>
      {STEPS.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo';
        return (
          <Fragment key={step}>
            <li className={styles.step} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
              <span className={styles.marker}>
                {state === 'done' ? <Icon name="check" size={12} aria-hidden /> : index + 1}
              </span>
              <span className={styles.label}>{t(step)}</span>
            </li>
            {index < STEPS.length - 1 && <li className={styles.connector} data-state={state} aria-hidden />}
          </Fragment>
        );
      })}
    </ol>
  );
}
