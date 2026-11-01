'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { gravitationalForce } from './physics-math';
import { Readout, SliderControl, useFormatNumber } from './physics-controls';
import { asRecord } from './params';
import styles from './physics.module.css';

// Masses and mean distances from NASA's planetary fact sheets.
const PRESETS = {
  people: { m1: 70, m2: 60, d: 1 },
  earthPerson: { m1: 5.9722e24, m2: 70, d: 6.371e6 },
  earthMoon: { m1: 5.9722e24, m2: 7.346e22, d: 3.844e8 },
  earthSun: { m1: 1.9885e30, m2: 5.9722e24, d: 1.496e11 },
} as const;

type PresetKey = keyof typeof PRESETS;

export interface UniversalGravitationParams {
  preset?: PresetKey;
}

const W = 480;
const H = 160;

function isPreset(value: unknown): value is PresetKey {
  return typeof value === 'string' && value in PRESETS;
}

export function UniversalGravitation({ params }: { params: UniversalGravitationParams }) {
  const t = useTranslations('simulators.physics');
  const format = useFormatNumber();
  const selectId = useId();
  const markerId = useId().replace(/:/g, '');
  const raw = asRecord(params);
  const [preset, setPreset] = useState<PresetKey>(isPreset(raw.preset) ? raw.preset : 'people');
  const [m1Factor, setM1Factor] = useState(1);
  const [m2Factor, setM2Factor] = useState(1);
  const [dFactor, setDFactor] = useState(1);

  const base = PRESETS[preset];
  const m1 = base.m1 * m1Factor;
  const m2 = base.m2 * m2Factor;
  const d = base.d * dFactor;
  const force = gravitationalForce(m1, m2, d);
  const ratio = force / gravitationalForce(base.m1, base.m2, base.d);

  const left = W / 2 - 40 - dFactor * 40;
  const right = W / 2 + 40 + dFactor * 40;
  const arrow = Math.max(12, Math.min(70, 35 + 15 * Math.log2(ratio)));

  function choosePreset(value: PresetKey) {
    setPreset(value);
    setM1Factor(1);
    setM2Factor(1);
    setDFactor(1);
  }

  return (
    <div className={styles.simulator}>
      <label htmlFor={selectId} className={styles.select}>
        {t('scenario')}
        <select id={selectId} value={preset} onChange={(event) => choosePreset(event.target.value as PresetKey)}>
          {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
            <option key={key} value={key}>
              {t(`presets.${key}`)}
            </option>
          ))}
        </select>
      </label>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t('gravitationLabel')}>
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-success)" />
          </marker>
        </defs>
        <line x1={left} x2={right} y1={120} y2={120} className={styles.guide} />
        <text x={W / 2} y={145} textAnchor="middle" className={styles.svgText}>
          d = {format(d, 2)} m
        </text>
        <circle cx={left} cy={70} r={14 + 6 * Math.log2(m1Factor + 1)} className={styles.body} />
        <circle cx={right} cy={70} r={10 + 6 * Math.log2(m2Factor + 1)} className={styles.star} />
        <line x1={left + 22} x2={left + 22 + arrow} y1={70} y2={70} className={styles.arrowForce} markerEnd={`url(#${markerId})`} />
        <line x1={right - 22} x2={right - 22 - arrow} y1={70} y2={70} className={styles.arrowForce} markerEnd={`url(#${markerId})`} />
        <text x={left} y={30} textAnchor="middle" className={styles.svgText}>
          m₁
        </text>
        <text x={right} y={30} textAnchor="middle" className={styles.svgText}>
          m₂
        </text>
      </svg>
      <div className={styles.controls}>
        <SliderControl label={t('m1Factor')} value={m1Factor} min={0.25} max={4} step={0.25} unit="×" onChange={setM1Factor} />
        <SliderControl label={t('m2Factor')} value={m2Factor} min={0.25} max={4} step={0.25} unit="×" onChange={setM2Factor} />
        <SliderControl label={t('distanceFactor')} value={dFactor} min={0.25} max={4} step={0.25} unit="×" onChange={setDFactor} />
      </div>
      <div className={styles.readouts}>
        <Readout>
          m₁ = {format(m1, 2)} kg · m₂ = {format(m2, 2)} kg
        </Readout>
        <Readout>
          F = G·m₁·m₂/d² = <strong>{format(force, 3)} N</strong>
        </Readout>
        <Readout>
          {t('forceRatio')}: <strong>{format(ratio, 4)}×</strong>
        </Readout>
      </div>
      <p className={styles.note}>{t('gravitationNote')}</p>
    </div>
  );
}
