'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { evaluateFunctionAt } from './evaluate-function';
import styles from './function-approach-grapher.module.css';

export interface FunctionApproachGrapherParams {
  expression: string;
  variable?: string;
  approachPoint: number;
  domain: [number, number];
}

const SVG_WIDTH = 480;
const SVG_HEIGHT = 320;
const SAMPLE_COUNT = 200;

function toSvgX(x: number, domain: [number, number]): number {
  return ((x - domain[0]) / (domain[1] - domain[0])) * SVG_WIDTH;
}

function toSvgY(y: number, range: [number, number]): number {
  return SVG_HEIGHT - ((y - range[0]) / (range[1] - range[0])) * SVG_HEIGHT;
}

// A missing/malformed `domain`, or one where the upper bound doesn't exceed
// the lower bound, makes `toSvgX`'s division degenerate (0/0 or division by
// a non-positive span) -- every sampled point would land at a NaN SVG
// coordinate, producing a silently blank graph instead of the inline error
// the spec requires for a shape this simulator can't handle.
function isValidDomain(domain: unknown): domain is [number, number] {
  return (
    Array.isArray(domain) &&
    domain.length === 2 &&
    typeof domain[0] === 'number' &&
    typeof domain[1] === 'number' &&
    domain[1] > domain[0]
  );
}

export function FunctionApproachGrapher({ params }: { params: FunctionApproachGrapherParams }) {
  const t = useTranslations('simulators');
  const variable = params.variable ?? 'x';
  const domainIsValid = isValidDomain(params.domain);
  const [samples, setSamples] = useState<{ x: number; y: number }[]>([]);
  const [range, setRange] = useState<[number, number]>([-1, 1]);
  const [approachX, setApproachX] = useState(params.approachPoint);
  const [approachY, setApproachY] = useState<number | null>(null);

  useEffect(() => {
    if (!domainIsValid) return;
    let cancelled = false;
    async function computeSamples() {
      const step = (params.domain[1] - params.domain[0]) / SAMPLE_COUNT;
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i <= SAMPLE_COUNT; i++) {
        const x = params.domain[0] + i * step;
        const y = await evaluateFunctionAt(params.expression, variable, x);
        if (y !== null) points.push({ x, y });
      }
      if (cancelled) return;
      setSamples(points);
      if (points.length > 0) {
        const ys = points.map((p) => p.y);
        const min = Math.min(...ys);
        const max = Math.max(...ys);
        // A constant function (e.g. f(x) = 3, a normal early-limits example)
        // samples to a single y value across the whole domain. Leaving the
        // range degenerate (min === max) makes toSvgY's division 0/0 --
        // padding it keeps every coordinate finite.
        setRange(min === max ? [min - 1, max + 1] : [min, max]);
      }
    }
    computeSamples();
    return () => {
      cancelled = true;
    };
  }, [params.expression, params.domain, variable, domainIsValid]);

  useEffect(() => {
    if (!domainIsValid) return;
    let cancelled = false;
    evaluateFunctionAt(params.expression, variable, approachX).then((y) => {
      if (!cancelled) setApproachY(y);
    });
    return () => {
      cancelled = true;
    };
  }, [approachX, params.expression, variable, domainIsValid]);

  if (!domainIsValid) {
    return <p className={styles.error}>{t('invalidDomain')}</p>;
  }

  const pathData = samples.length > 0
    ? `M ${samples.map((p) => `${toSvgX(p.x, params.domain)},${toSvgY(p.y, range)}`).join(' L ')}`
    : '';

  const originX = params.domain[0] <= 0 && params.domain[1] >= 0 ? toSvgX(0, params.domain) : null;
  const originY = range[0] <= 0 && range[1] >= 0 ? toSvgY(0, range) : null;
  const gridXs = Array.from({ length: 7 }, (_, i) => (SVG_WIDTH / 8) * (i + 1));
  const gridYs = Array.from({ length: 5 }, (_, i) => (SVG_HEIGHT / 6) * (i + 1));
  const markerX = toSvgX(approachX, params.domain);
  const markerY = approachY === null ? null : toSvgY(approachY, range);

  return (
    <div className={styles.grapher}>
      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className={styles.svg} role="img" aria-label={t('graphAriaLabel')}>
        {gridXs.map((x) => (
          <line key={`gx-${x}`} x1={x} x2={x} y1={0} y2={SVG_HEIGHT} className={styles.grid} />
        ))}
        {gridYs.map((y) => (
          <line key={`gy-${y}`} x1={0} x2={SVG_WIDTH} y1={y} y2={y} className={styles.grid} />
        ))}
        {originX !== null && <line x1={originX} x2={originX} y1={0} y2={SVG_HEIGHT} className={styles.axis} />}
        {originY !== null && <line x1={0} x2={SVG_WIDTH} y1={originY} y2={originY} className={styles.axis} />}
        {pathData && <path d={pathData} className={styles.curve} fill="none" />}
        {markerY !== null && (
          <>
            <line x1={markerX} x2={markerX} y1={markerY} y2={SVG_HEIGHT} className={styles.guide} />
            <line x1={0} x2={markerX} y1={markerY} y2={markerY} className={styles.guide} />
            <circle cx={markerX} cy={markerY} r={6} className={styles.marker} />
          </>
        )}
      </svg>
      <div className={styles.controls}>
        <label className={styles.controlRow}>
          <span className={styles.variable}>{variable} =</span>
          <input
            type="number"
            step={0.01}
            value={approachX}
            min={params.domain[0]}
            max={params.domain[1]}
            onChange={(event) => setApproachX(Number(event.target.value))}
          />
        </label>
        <input
          type="range"
          className={styles.slider}
          aria-label={variable}
          step={(params.domain[1] - params.domain[0]) / 400}
          min={params.domain[0]}
          max={params.domain[1]}
          value={approachX}
          onChange={(event) => setApproachX(Number(event.target.value))}
        />
        <p className={styles.readout}>
          f({variable}) = <strong>{approachY === null ? t('undefinedValue') : approachY.toFixed(4)}</strong>
        </p>
      </div>
    </div>
  );
}
