'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { kineticEnergy } from './physics-math';
import { Readout, SliderControl, useFormatNumber } from './physics-controls';
import { asRecord, numberParam } from './params';
import styles from './physics.module.css';

export interface KineticEnergyExplorerParams {
  mass?: number;
  speed?: number;
  maxMass?: number;
  maxSpeed?: number;
}

const W = 480;
const H = 260;
const PAD = 36;

export function KineticEnergyExplorer({ params }: { params: KineticEnergyExplorerParams }) {
  const t = useTranslations('simulators.physics');
  const format = useFormatNumber();
  const raw = asRecord(params);
  const maxMass = numberParam(raw.maxMass, 10, 1, 1000);
  const maxSpeed = numberParam(raw.maxSpeed, 30, 1, 300);
  const [mass, setMass] = useState(numberParam(raw.mass, 2, 0.1, maxMass));
  const [speed, setSpeed] = useState(numberParam(raw.speed, 10, 0, maxSpeed));

  const energy = kineticEnergy(mass, speed);
  const maxEnergy = kineticEnergy(mass, maxSpeed);
  const toX = (v: number) => PAD + (v / maxSpeed) * (W - 2 * PAD);
  const toY = (e: number) => H - PAD - (e / maxEnergy) * (H - 2 * PAD);
  const points = Array.from({ length: 61 }, (_, i) => {
    const v = (maxSpeed * i) / 60;
    return `${toX(v)},${toY(kineticEnergy(mass, v))}`;
  });

  return (
    <div className={styles.simulator}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t('kineticGraphLabel')}>
        <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} className={styles.axis} />
        <line x1={PAD} x2={PAD} y1={PAD / 2} y2={H - PAD} className={styles.axis} />
        <path d={`M ${points.join(' L ')}`} className={styles.curve} />
        <line x1={toX(speed)} x2={toX(speed)} y1={toY(energy)} y2={H - PAD} className={styles.guide} />
        <line x1={PAD} x2={toX(speed)} y1={toY(energy)} y2={toY(energy)} className={styles.guide} />
        <circle cx={toX(speed)} cy={toY(energy)} r={6} className={styles.marker} />
        <text x={W - PAD} y={H - 10} textAnchor="end" className={styles.svgText}>
          v (m/s)
        </text>
        <text x={PAD + 6} y={PAD / 2 + 10} className={styles.svgText}>
          Ec (J)
        </text>
      </svg>
      <div className={styles.controls}>
        <SliderControl label={t('mass')} value={mass} min={0.1} max={maxMass} step={0.1} unit="kg" onChange={setMass} />
        <SliderControl label={t('speed')} value={speed} min={0} max={maxSpeed} step={0.5} unit="m/s" onChange={setSpeed} />
      </div>
      <div className={styles.readouts}>
        <Readout>
          Ec = ½ · {format(mass, 1)} · {format(speed, 1)}² = <strong>{format(energy, 1)} J</strong>
        </Readout>
        <Readout>
          {t('doubleSpeed')}: <strong>{format(kineticEnergy(mass, 2 * speed), 1)} J</strong> (4×)
        </Readout>
        <Readout>
          {t('doubleMass')}: <strong>{format(kineticEnergy(2 * mass, speed), 1)} J</strong> (2×)
        </Readout>
      </div>
    </div>
  );
}
