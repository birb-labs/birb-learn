'use client';

import { useTranslations } from 'next-intl';
import { isValidSimulatorKey, SIMULATORS } from './registry';
import styles from './simulator-block.module.css';

export function SimulatorBlock({ simulatorKey, params, caption }: { simulatorKey: string; params: string | null; caption: string | null }) {
  const t = useTranslations('simulators');

  if (!isValidSimulatorKey(simulatorKey)) {
    return <p className={styles.error}>{t('unknownSimulator', { key: simulatorKey })}</p>;
  }

  let parsedParams: unknown;
  try {
    parsedParams = params ? JSON.parse(params) : {};
  } catch {
    return <p className={styles.error}>{t('invalidParams', { key: simulatorKey })}</p>;
  }

  const Simulator = SIMULATORS[simulatorKey];
  return (
    <div className={styles.wrapper}>
      {/* Each entry in SIMULATORS expects its own specific params shape;
          this registry-level wrapper can't statically type-check that a
          given block's stored JSON matches its simulatorKey's expected
          shape, so the cast below is the one deliberate escape hatch --
          each simulator component validates what it can of its own params
          up front (e.g. FunctionApproachGrapher checks its `domain` shape
          before sampling) and renders its own inline error for a shape it
          can't handle. `evaluateFunctionAt` returning `null` is a narrower,
          separate case: a per-point evaluation failure (e.g. the expression
          is undefined at that particular x), not a substitute for
          up-front params validation. */}
      <Simulator params={parsedParams as never} />
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
