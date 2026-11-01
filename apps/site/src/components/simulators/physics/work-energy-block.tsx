'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { workEnergy } from './physics-math';
import { EnergyBars, Readout, SliderControl, useFormatNumber } from './physics-controls';
import { asRecord, numberParam } from './params';
import styles from './physics.module.css';

export interface WorkEnergyBlockParams {
  mass?: number;
  initialSpeed?: number;
  force?: number;
  mu?: number;
  distance?: number;
  g?: number;
}

const W = 480;
const H = 150;

export function WorkEnergyBlock({ params }: { params: WorkEnergyBlockParams }) {
  const t = useTranslations('simulators.physics');
  const format = useFormatNumber();
  const markerId = useId().replace(/:/g, '');
  const raw = asRecord(params);
  const g = numberParam(raw.g, 10, 1, 30);
  const [mass, setMass] = useState(numberParam(raw.mass, 2, 0.5, 20));
  const [initialSpeed, setInitialSpeed] = useState(numberParam(raw.initialSpeed, 0, 0, 20));
  const [force, setForce] = useState(numberParam(raw.force, 20, 0, 100));
  const [mu, setMu] = useState(numberParam(raw.mu, 0.2, 0, 1));
  const [distance, setDistance] = useState(numberParam(raw.distance, 5, 0.5, 20));

  const result = workEnergy({ mass, initialSpeed, force, mu, distance, g });
  const maxBar = Math.max(result.initialKinetic, result.finalKinetic, Math.abs(result.workForce), Math.abs(result.workFriction), 1);
  const blockX = 40 + (result.travelled / 20) * (W - 140);
  const forceLength = Math.min(110, force * 1.1);
  const frictionLength = Math.min(110, result.frictionForce * 1.1);

  return (
    <div className={styles.simulator}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t('workDiagramLabel')}>
        <defs>
          <marker id={`${markerId}-f`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-success)" />
          </marker>
          <marker id={`${markerId}-a`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-danger)" />
          </marker>
        </defs>
        <line x1={10} x2={W - 10} y1={110} y2={110} className={styles.track} />
        <line x1={40} x2={40} y1={100} y2={120} className={styles.axis} />
        <line x1={40 + (distance / 20) * (W - 140)} x2={40 + (distance / 20) * (W - 140)} y1={100} y2={120} className={styles.guide} />
        <rect x={blockX - 25} y={60} width={50} height={50} rx={4} className={styles.block} />
        {forceLength > 0 && (
          <line x1={blockX + 25} x2={blockX + 25 + forceLength} y1={85} y2={85} className={styles.arrowForce} markerEnd={`url(#${markerId}-f)`} />
        )}
        {frictionLength > 0 && (
          <line x1={blockX - 25} x2={blockX - 25 - frictionLength} y1={105} y2={105} className={styles.arrowFriction} markerEnd={`url(#${markerId}-a)`} />
        )}
        <text x={blockX + 30} y={75} className={styles.svgText}>
          F
        </text>
        <text x={Math.max(14, blockX - 25 - frictionLength)} y={135} className={styles.svgText}>
          {t('symbols.friction')}
        </text>
      </svg>
      <div className={styles.controls}>
        <SliderControl label={t('mass')} value={mass} min={0.5} max={20} step={0.5} unit="kg" onChange={setMass} />
        <SliderControl label={t('initialSpeed')} value={initialSpeed} min={0} max={20} step={0.5} unit="m/s" onChange={setInitialSpeed} />
        <SliderControl label={t('appliedForce')} value={force} min={0} max={100} step={1} unit="N" onChange={setForce} />
        <SliderControl label={t('frictionCoefficient')} value={mu} min={0} max={1} step={0.05} unit="" onChange={setMu} />
        <SliderControl label={t('distance')} value={distance} min={0.5} max={20} step={0.5} unit="m" onChange={setDistance} />
      </div>
      <EnergyBars
        ariaLabel={t('energyBarsLabel')}
        unit="J"
        max={maxBar}
        items={[
          { label: t('initialKinetic'), value: result.initialKinetic, tone: 'kinetic' },
          { label: t('workOfForce'), value: result.workForce, tone: 'work' },
          { label: t('workOfFriction'), value: result.workFriction, tone: 'negative' },
          { label: t('finalKinetic'), value: result.finalKinetic, tone: 'kinetic' },
        ]}
      />
      <div className={styles.readouts}>
        <Readout>
          {t('symbols.friction')} = μ·m·g = <strong>{format(result.frictionForce, 1)} N</strong>
        </Readout>
        <Readout>
          W<sub>total</sub> = {format(result.workForce, 1)} + ({format(result.workFriction, 1)}) = <strong>{format(result.workTotal, 1)} J</strong>
        </Readout>
        <Readout>
          v<sub>f</sub> = <strong>{format(result.finalSpeed, 2)} m/s</strong>
        </Readout>
      </div>
      <p className={styles.note}>
        {result.stopsEarly
          ? t('stopsEarly', { distance: format(result.travelled, 2) })
          : t('workTheoremNote', { g: format(g, 2) })}
      </p>
    </div>
  );
}
