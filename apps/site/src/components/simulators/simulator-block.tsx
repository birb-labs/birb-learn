'use client';

import { isValidSimulatorKey, SIMULATORS } from './registry';
import styles from './simulator-block.module.css';

export function SimulatorBlock({ simulatorKey, params, caption }: { simulatorKey: string; params: string | null; caption: string | null }) {
  if (!isValidSimulatorKey(simulatorKey)) {
    return <p className={styles.error}>Simulador desconhecido: &quot;{simulatorKey}&quot;.</p>;
  }

  let parsedParams: unknown;
  try {
    parsedParams = params ? JSON.parse(params) : {};
  } catch {
    return <p className={styles.error}>Parâmetros do simulador &quot;{simulatorKey}&quot; são um JSON inválido.</p>;
  }

  const Simulator = SIMULATORS[simulatorKey];
  return (
    <div className={styles.wrapper}>
      {/* Each entry in SIMULATORS expects its own specific params shape;
          this registry-level wrapper can't statically type-check that a
          given block's stored JSON matches its simulatorKey's expected
          shape, so the cast below is the one deliberate escape hatch --
          each simulator component is responsible for validating its own
          params defensively at runtime and rendering its own error state
          for a malformed shape, exactly like FunctionApproachGrapher does
          implicitly via evaluateFunctionAt returning null. */}
      <Simulator params={parsedParams as never} />
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
