'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { orbitalPeriodYears, orbitalSpeedKmS, orbitPosition } from './physics-math';
import { Readout, SliderControl, useFormatNumber } from './physics-controls';
import { asRecord, numberParam } from './params';
import styles from './physics.module.css';

export interface KeplerOrbitParams {
  eccentricity?: number;
  semiMajorAxis?: number;
  /** Number of equal-time sectors drawn for the second law (2–24). */
  sectors?: number;
}

const W = 480;
const H = 320;
/** Seconds of animation per orbit, regardless of the real period. */
const SECONDS_PER_ORBIT = 8;

export function KeplerOrbit({ params }: { params: KeplerOrbitParams }) {
  const t = useTranslations('simulators.physics');
  const format = useFormatNumber();
  const raw = asRecord(params);
  const sectors = Math.round(numberParam(raw.sectors, 12, 2, 24));
  const [eccentricity, setEccentricity] = useState(numberParam(raw.eccentricity, 0.5, 0, 0.9));
  const [semiMajorAxis, setSemiMajorAxis] = useState(numberParam(raw.semiMajorAxis, 1, 0.3, 40));
  const [fraction, setFraction] = useState(0);
  const [running, setRunning] = useState(false);
  const [showAreas, setShowAreas] = useState(true);

  useEffect(() => {
    if (!running || typeof requestAnimationFrame !== 'function') return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setFraction((value) => (value + dt / SECONDS_PER_ORBIT) % 1);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  // Drawing scale: the ellipse (in units of a) fits the viewBox.
  const e = eccentricity;
  const b = Math.sqrt(1 - e * e);
  const scale = Math.min((W - 40) / 2, (H - 40) / (2 * b));
  const centerX = W / 2;
  const centerY = H / 2;
  // Focus (star) at the origin of orbitPosition; ellipse centre at x = −a·e.
  const toSvg = (px: number, py: number) => ({ x: centerX + (px + e) * scale, y: centerY - py * scale });
  const star = toSvg(0, 0);
  const planet = orbitPosition(1, e, fraction);
  const planetSvg = toSvg(planet.x, planet.y);

  const sectorPaths = Array.from({ length: sectors }, (_, index) => {
    const points = Array.from({ length: 21 }, (_, step) => {
      const p = orbitPosition(1, e, (index + step / 20) / sectors);
      const s = toSvg(p.x, p.y);
      return `${s.x},${s.y}`;
    });
    return { d: `M ${star.x},${star.y} L ${points.join(' L ')} Z`, even: index % 2 === 0 };
  });

  const r = planet.r * semiMajorAxis;
  const period = orbitalPeriodYears(semiMajorAxis);
  const perihelion = semiMajorAxis * (1 - e);
  const aphelion = semiMajorAxis * (1 + e);

  return (
    <div className={styles.simulator}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={t('orbitLabel')}>
        {showAreas && sectorPaths.map((sector, index) => <path key={index} d={sector.d} className={sector.even ? styles.areaA : styles.areaB} />)}
        <ellipse cx={toSvg(-e, 0).x} cy={centerY} rx={scale} ry={b * scale} className={styles.curve} />
        <line x1={star.x} y1={star.y} x2={planetSvg.x} y2={planetSvg.y} className={styles.guide} />
        <circle cx={star.x} cy={star.y} r={12} className={styles.star} />
        <circle cx={planetSvg.x} cy={planetSvg.y} r={7} className={styles.body} />
        <text x={toSvg(1 - e, 0).x - 4} y={centerY + 18} textAnchor="end" className={styles.svgText}>
          {t('perihelion')}
        </text>
        <text x={toSvg(-1 - e, 0).x + 4} y={centerY + 18} className={styles.svgText}>
          {t('aphelion')}
        </text>
      </svg>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setRunning((value) => !value)}>
          {running ? t('pause') : t('play')}
        </button>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={showAreas} onChange={(event) => setShowAreas(event.target.checked)} />
          {t('showEqualAreas', { count: sectors })}
        </label>
      </div>
      <div className={styles.controls}>
        <SliderControl label={t('eccentricity')} value={eccentricity} min={0} max={0.9} step={0.01} unit="" onChange={setEccentricity} />
        <SliderControl label={t('semiMajorAxis')} value={semiMajorAxis} min={0.3} max={40} step={0.1} unit={t('auUnit')} onChange={setSemiMajorAxis} />
        <SliderControl label={t('orbitTime')} value={fraction} min={0} max={0.99} step={0.01} unit="T" onChange={setFraction} />
      </div>
      <div className={styles.readouts}>
        <Readout>
          T = a<sup>3/2</sup> = <strong>{format(period, 2)} {t('years')}</strong>
        </Readout>
        <Readout>
          T²/a³ = <strong>{format((period * period) / semiMajorAxis ** 3, 2)}</strong>
        </Readout>
        <Readout>
          r = <strong>{format(r, 2)} {t('auUnit')}</strong>
        </Readout>
        <Readout>
          v = <strong>{format(orbitalSpeedKmS(r, semiMajorAxis), 1)} km/s</strong>
        </Readout>
        <Readout>
          {t('perihelion')}: {format(perihelion, 2)} {t('auUnit')} · {t('aphelion')}: {format(aphelion, 2)} {t('auUnit')}
        </Readout>
      </div>
      <p className={styles.note}>{t('orbitNote')}</p>
    </div>
  );
}
