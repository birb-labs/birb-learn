'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { elasticPotentialEnergy } from './physics-math';
import { Readout, SliderControl, useFormatNumber } from './physics-controls';
import { asRecord, numberParam } from './params';
import styles from './physics.module.css';

export interface SpringEnergyParams {
  k?: number;
  x?: number;
  maxK?: number;
  maxX?: number;
}

const W = 480;
const SPRING_H = 120;
const GRAPH_H = 220;
const PAD = 40;

function springPath(x0: number, x1: number, y: number, coils: number, amplitude: number): string {
  const lead = 14;
  const span = x1 - x0 - 2 * lead;
  const points = [`${x0},${y}`, `${x0 + lead},${y}`];
  for (let i = 1; i <= coils * 2; i++) {
    points.push(`${x0 + lead + (span * (i - 0.5)) / (coils * 2)},${y + (i % 2 === 0 ? amplitude : -amplitude)}`);
  }
  points.push(`${x1 - lead},${y}`, `${x1},${y}`);
  return `M ${points.join(' L ')}`;
}

export function SpringEnergy({ params }: { params: SpringEnergyParams }) {
  const t = useTranslations('simulators.physics');
  const format = useFormatNumber();
  const raw = asRecord(params);
  const maxK = numberParam(raw.maxK, 1000, 10, 100000);
  const maxX = numberParam(raw.maxX, 0.3, 0.01, 2);
  const [k, setK] = useState(numberParam(raw.k, 200, 1, maxK));
  const [x, setX] = useState(numberParam(raw.x, 0.1, -maxX, maxX));

  const energy = elasticPotentialEnergy(k, x);
  const force = k * Math.abs(x);
  const naturalLength = 220;
  const springEnd = 30 + naturalLength + (x / maxX) * 150;

  const toGx = (value: number) => PAD + (value / maxX) * (W - 2 * PAD);
  const maxForce = maxK * maxX;
  const toGy = (value: number) => GRAPH_H - PAD + 10 - (value / maxForce) * (GRAPH_H - PAD - 20);
  const ax = Math.abs(x);

  return (
    <div className={styles.simulator}>
      <svg viewBox={`0 0 ${W} ${SPRING_H}`} className={styles.svg} role="img" aria-label={t('springLabel')}>
        <rect x={10} y={20} width={20} height={80} className={styles.wall} />
        <line x1={30 + naturalLength + 25} x2={30 + naturalLength + 25} y1={15} y2={105} className={styles.guide} />
        <path d={springPath(30, springEnd, 60, 10, 14)} className={styles.spring} />
        <rect x={springEnd} y={35} width={50} height={50} rx={4} className={styles.block} />
        <text x={30 + naturalLength + 30} y={112} className={styles.svgText}>
          x = 0
        </text>
      </svg>
      <svg viewBox={`0 0 ${W} ${GRAPH_H}`} className={styles.svg} role="img" aria-label={t('springGraphLabel')}>
        <line x1={PAD} x2={W - PAD} y1={toGy(0)} y2={toGy(0)} className={styles.axis} />
        <line x1={PAD} x2={PAD} y1={10} y2={toGy(0)} className={styles.axis} />
        <polygon points={`${toGx(0)},${toGy(0)} ${toGx(ax)},${toGy(0)} ${toGx(ax)},${toGy(force)}`} className={styles.shaded} />
        <line x1={toGx(0)} x2={toGx(maxX)} y1={toGy(0)} y2={toGy(k * maxX)} className={styles.curve} />
        <circle cx={toGx(ax)} cy={toGy(force)} r={6} className={styles.marker} />
        <text x={W - PAD} y={GRAPH_H - 8} textAnchor="end" className={styles.svgText}>
          |x| (m)
        </text>
        <text x={PAD + 6} y={22} className={styles.svgText}>
          F (N)
        </text>
      </svg>
      <div className={styles.controls}>
        <SliderControl label={t('springConstant')} value={k} min={10} max={maxK} step={10} unit="N/m" onChange={setK} />
        <SliderControl label={t('deformation')} value={x} min={-maxX} max={maxX} step={0.01} unit="m" onChange={setX} />
      </div>
      <div className={styles.readouts}>
        <Readout>
          F = k·|x| = <strong>{format(force, 1)} N</strong>
        </Readout>
        <Readout>
          E<sub>pel</sub> = k·x²/2 = <strong>{format(energy, 2)} J</strong>
        </Readout>
        <Readout>
          {t('doubleDeformation')}: <strong>{format(elasticPotentialEnergy(k, 2 * x), 2)} J</strong> (4×)
        </Readout>
      </div>
      <p className={styles.note}>{x < 0 ? t('springCompressed') : x > 0 ? t('springStretched') : t('springRelaxed')}</p>
    </div>
  );
}
