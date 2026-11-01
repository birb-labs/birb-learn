'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { initialTrackState, stepTrack, trackHeight, type TrackConfig, type TrackState } from './physics-math';
import { EnergyBars, Readout, SliderControl, useFormatNumber } from './physics-controls';
import { asRecord, numberParam } from './params';
import styles from './physics.module.css';

export interface EnergyTrackParams {
  mass?: number;
  height?: number;
  g?: number;
  /** Show the friction slider (default true). */
  friction?: boolean;
  frictionForce?: number;
}

const W = 480;
const H = 260;
const PAD_X = 30;
const PAD_TOP = 30;
const PAD_BOTTOM = 30;
const MAX_HEIGHT = 10;
const HALF_WIDTH = 8;

export function EnergyTrack({ params }: { params: EnergyTrackParams }) {
  const t = useTranslations('simulators.physics');
  const format = useFormatNumber();
  const raw = asRecord(params);
  const g = numberParam(raw.g, 10, 1, 30);
  const showFriction = raw.friction !== false;
  const [mass, setMass] = useState(numberParam(raw.mass, 1, 0.5, 10));
  const [height, setHeight] = useState(numberParam(raw.height, 5, 1, MAX_HEIGHT));
  const [friction, setFriction] = useState(showFriction ? numberParam(raw.frictionForce, 0, 0, 20) : 0);
  const [state, setState] = useState<TrackState>(initialTrackState);
  const [running, setRunning] = useState(false);

  const config: TrackConfig = { mass, height, halfWidth: HALF_WIDTH, g, friction };
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!running || typeof requestAnimationFrame !== 'function') return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setState((previous) => {
        const next = stepTrack(configRef.current, previous, dt);
        if (next.stopped) setRunning(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  function reset() {
    setRunning(false);
    setState(initialTrackState());
  }

  function changeAndReset(setter: (value: number) => void) {
    return (value: number) => {
      setter(value);
      setRunning(false);
      setState(initialTrackState());
    };
  }

  const y = trackHeight(config, state.x);
  const potential = mass * g * y;
  const kinetic = Math.max(0, mass * g * height - state.dissipated - potential);
  const mechanical = kinetic + potential;
  const initial = mass * g * height;

  const toSvgX = (x: number) => PAD_X + ((x + 1) / 2) * (W - 2 * PAD_X);
  const toSvgY = (metres: number) => H - PAD_BOTTOM - (metres / MAX_HEIGHT) * (H - PAD_TOP - PAD_BOTTOM);
  const trackPoints = Array.from({ length: 81 }, (_, i) => {
    const x = -1 + (2 * i) / 80;
    return `${toSvgX(x)},${toSvgY(trackHeight(config, x))}`;
  });

  return (
    <div className={styles.simulator}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t('trackLabel')}>
        <line x1={PAD_X} x2={W - PAD_X} y1={toSvgY(0)} y2={toSvgY(0)} className={styles.axis} />
        <line x1={PAD_X} x2={W - PAD_X} y1={toSvgY(height)} y2={toSvgY(height)} className={styles.guide} />
        <path d={`M ${trackPoints.join(' L ')}`} className={styles.track} />
        <circle cx={toSvgX(state.x)} cy={toSvgY(y) - 10} r={10} className={styles.body} />
        <text x={W - PAD_X} y={toSvgY(height) - 6} textAnchor="end" className={styles.svgText}>
          h₀ = {format(height, 1)} m
        </text>
        <text x={PAD_X + 4} y={toSvgY(0) + 18} className={styles.svgText}>
          {t('referenceLevel')}
        </text>
      </svg>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setRunning((value) => !value)} disabled={state.stopped}>
          {running ? t('pause') : t('play')}
        </button>
        <button type="button" className={styles.button} onClick={reset}>
          {t('reset')}
        </button>
      </div>
      <div className={styles.controls}>
        <SliderControl label={t('mass')} value={mass} min={0.5} max={10} step={0.5} unit="kg" onChange={changeAndReset(setMass)} />
        <SliderControl label={t('releaseHeight')} value={height} min={1} max={MAX_HEIGHT} step={0.5} unit="m" onChange={changeAndReset(setHeight)} />
        {showFriction && (
          <SliderControl label={t('frictionForce')} value={friction} min={0} max={20} step={0.5} unit="N" onChange={changeAndReset(setFriction)} />
        )}
      </div>
      <EnergyBars
        ariaLabel={t('energyBarsLabel')}
        unit="J"
        max={initial}
        items={[
          { label: t('kineticEnergy'), value: kinetic, tone: 'kinetic' },
          { label: t('potentialEnergy'), value: potential, tone: 'potential' },
          { label: t('mechanicalEnergy'), value: mechanical, tone: 'mechanical' },
          ...(showFriction ? [{ label: t('dissipatedEnergy'), value: state.dissipated, tone: 'dissipated' as const }] : []),
        ]}
      />
      <div className={styles.readouts}>
        <Readout>
          h = <strong>{format(y, 2)} m</strong>
        </Readout>
        <Readout>
          v = <strong>{format(Math.sqrt((2 * kinetic) / mass), 2)} m/s</strong>
        </Readout>
        <Readout>
          Em + E<sub>{t('dissipatedShort')}</sub> = <strong>{format(mechanical + state.dissipated, 1)} J</strong>
        </Readout>
      </div>
      <p className={styles.note}>{state.stopped && friction > 0 ? t('trackStopped') : t('trackNote', { g: format(g, 2) })}</p>
    </div>
  );
}
