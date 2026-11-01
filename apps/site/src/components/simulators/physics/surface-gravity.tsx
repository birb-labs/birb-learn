'use client';

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { gravityAtAltitude } from './physics-math';
import { Readout, SliderControl, useFormatNumber } from './physics-controls';
import { asRecord, numberParam } from './params';
import styles from './physics.module.css';

// Masses and equatorial radii from NASA's planetary fact sheets; GM/R² with
// these values reproduces the fact sheets' surface gravities.
const BODIES = {
  earth: { mass: 5.9722e24, radius: 6.3781e6 },
  moon: { mass: 7.346e22, radius: 1.7381e6 },
  mars: { mass: 6.4169e23, radius: 3.3962e6 },
  venus: { mass: 4.8673e24, radius: 6.0518e6 },
  jupiter: { mass: 1.89813e27, radius: 7.1492e7 },
  saturn: { mass: 5.6832e26, radius: 6.0268e7 },
} as const;

type BodyKey = keyof typeof BODIES;

export interface SurfaceGravityParams {
  body?: BodyKey;
  personMass?: number;
}

const W = 480;
const H = 240;
const PAD = 40;
const ISS_ALTITUDE_KM = 400;

function isBody(value: unknown): value is BodyKey {
  return typeof value === 'string' && value in BODIES;
}

export function SurfaceGravity({ params }: { params: SurfaceGravityParams }) {
  const t = useTranslations('simulators.physics');
  const format = useFormatNumber();
  const selectId = useId();
  const raw = asRecord(params);
  const [body, setBody] = useState<BodyKey>(isBody(raw.body) ? raw.body : 'earth');
  const [altitudeKm, setAltitudeKm] = useState(0);
  const [personMass, setPersonMass] = useState(numberParam(raw.personMass, 60, 1, 200));

  const { mass, radius } = BODIES[body];
  const radiusKm = radius / 1000;
  const maxAltitudeKm = Math.round(radiusKm * 3);
  const g0 = gravityAtAltitude(mass, radius, 0);
  const g = gravityAtAltitude(mass, radius, altitudeKm * 1000);

  const toX = (km: number) => PAD + (km / maxAltitudeKm) * (W - 2 * PAD);
  const toY = (value: number) => H - PAD - (value / g0) * (H - 2 * PAD);
  const points = Array.from({ length: 81 }, (_, i) => {
    const km = (maxAltitudeKm * i) / 80;
    return `${toX(km)},${toY(gravityAtAltitude(mass, radius, km * 1000))}`;
  });

  function chooseBody(value: BodyKey) {
    setBody(value);
    setAltitudeKm(0);
  }

  return (
    <div className={styles.simulator}>
      <label htmlFor={selectId} className={styles.select}>
        {t('celestialBody')}
        <select id={selectId} value={body} onChange={(event) => chooseBody(event.target.value as BodyKey)}>
          {(Object.keys(BODIES) as BodyKey[]).map((key) => (
            <option key={key} value={key}>
              {t(`bodies.${key}`)}
            </option>
          ))}
        </select>
      </label>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t('gravityGraphLabel')}>
        <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} className={styles.axis} />
        <line x1={PAD} x2={PAD} y1={PAD / 2} y2={H - PAD} className={styles.axis} />
        <path d={`M ${points.join(' L ')}`} className={styles.curve} />
        {body === 'earth' && (
          <>
            <line x1={toX(ISS_ALTITUDE_KM)} x2={toX(ISS_ALTITUDE_KM)} y1={PAD / 2} y2={H - PAD} className={styles.guide} />
            <text x={toX(ISS_ALTITUDE_KM) + 4} y={PAD} className={styles.svgText}>
              {t('iss')}
            </text>
          </>
        )}
        <circle cx={toX(altitudeKm)} cy={toY(g)} r={6} className={styles.marker} />
        <text x={W - PAD} y={H - 10} textAnchor="end" className={styles.svgText}>
          h (km)
        </text>
        <text x={PAD + 6} y={PAD / 2 + 10} className={styles.svgText}>
          g (m/s²)
        </text>
      </svg>
      <div className={styles.controls}>
        <SliderControl label={t('altitude')} value={altitudeKm} min={0} max={maxAltitudeKm} step={10} unit="km" onChange={setAltitudeKm} />
        <SliderControl label={t('personMass')} value={personMass} min={1} max={200} step={1} unit="kg" onChange={setPersonMass} />
      </div>
      <div className={styles.readouts}>
        <Readout>
          g₀ = GM/R² = <strong>{format(g0, 2)} m/s²</strong>
        </Readout>
        <Readout>
          g(h) = GM/(R + h)² = <strong>{format(g, 2)} m/s²</strong>
        </Readout>
        <Readout>
          g(h)/g₀ = (R/(R + h))² = <strong>{format(g / g0, 3)}</strong>
        </Readout>
        <Readout>
          P = m·g = <strong>{format(personMass * g, 1)} N</strong>
        </Readout>
      </div>
      <p className={styles.note}>{t('gravityNote', { radius: format(radiusKm, 0) })}</p>
    </div>
  );
}
