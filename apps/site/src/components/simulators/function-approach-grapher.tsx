'use client';

import { useEffect, useState } from 'react';
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

export function FunctionApproachGrapher({ params }: { params: FunctionApproachGrapherParams }) {
  const variable = params.variable ?? 'x';
  const [samples, setSamples] = useState<{ x: number; y: number }[]>([]);
  const [range, setRange] = useState<[number, number]>([-1, 1]);
  const [approachX, setApproachX] = useState(params.approachPoint);
  const [approachY, setApproachY] = useState<number | null>(null);

  useEffect(() => {
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
        setRange([Math.min(...ys), Math.max(...ys)]);
      }
    }
    computeSamples();
    return () => {
      cancelled = true;
    };
  }, [params.expression, params.domain, variable]);

  useEffect(() => {
    let cancelled = false;
    evaluateFunctionAt(params.expression, variable, approachX).then((y) => {
      if (!cancelled) setApproachY(y);
    });
    return () => {
      cancelled = true;
    };
  }, [approachX, params.expression, variable]);

  const pathData = samples.length > 0
    ? `M ${samples.map((p) => `${toSvgX(p.x, params.domain)},${toSvgY(p.y, range)}`).join(' L ')}`
    : '';

  return (
    <div className={styles.grapher}>
      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className={styles.svg} role="img" aria-label="Gráfico de função interativo">
        {pathData && <path d={pathData} className={styles.curve} fill="none" />}
        {approachY !== null && (
          <circle cx={toSvgX(approachX, params.domain)} cy={toSvgY(approachY, range)} r={5} className={styles.marker} />
        )}
      </svg>
      <label className={styles.controlRow}>
        {variable} ={' '}
        <input
          type="number"
          step={0.01}
          value={approachX}
          min={params.domain[0]}
          max={params.domain[1]}
          onChange={(event) => setApproachX(Number(event.target.value))}
        />
      </label>
      <p className={styles.readout}>
        f({variable}) = {approachY === null ? 'indefinido' : approachY.toFixed(4)}
      </p>
    </div>
  );
}
