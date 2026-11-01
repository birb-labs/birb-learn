import { describe, expect, it } from 'vitest';
import {
  elasticPotentialEnergy,
  gravitationalForce,
  gravityAtAltitude,
  initialTrackState,
  kineticEnergy,
  orbitalPeriodYears,
  orbitalSpeedKmS,
  orbitPosition,
  solveEccentricAnomaly,
  stepTrack,
  trackHeight,
  workEnergy,
  type TrackConfig,
} from './physics-math';

describe('energy formulas', () => {
  it('computes kinetic and elastic potential energy', () => {
    expect(kineticEnergy(2, 3)).toBe(9);
    expect(elasticPotentialEnergy(200, 0.1)).toBeCloseTo(1, 10);
  });
});

describe('workEnergy', () => {
  it('applies the work–energy theorem on a rough floor', () => {
    const result = workEnergy({ mass: 2, initialSpeed: 0, force: 20, mu: 0.5, distance: 4, g: 10 });
    expect(result.workForce).toBe(80);
    expect(result.workFriction).toBe(-40);
    expect(result.finalKinetic).toBe(40);
    expect(result.finalSpeed).toBeCloseTo(Math.sqrt(40), 10);
    expect(result.stopsEarly).toBe(false);
  });

  it('reports where a decelerating block stops', () => {
    // Ec = 0.5·1·10² = 50 J; net = 0 − 0.5·1·10 = −5 N → stops after 10 m.
    const result = workEnergy({ mass: 1, initialSpeed: 10, force: 0, mu: 0.5, distance: 20, g: 10 });
    expect(result.stopsEarly).toBe(true);
    expect(result.travelled).toBeCloseTo(10, 10);
    expect(result.finalKinetic).toBeCloseTo(0, 10);
  });

  it('does not move a block at rest that the force cannot overcome', () => {
    const result = workEnergy({ mass: 10, initialSpeed: 0, force: 10, mu: 0.5, distance: 5, g: 10 });
    expect(result.travelled).toBe(0);
    expect(result.workTotal).toBe(0);
  });
});

describe('gravitation', () => {
  it('gives a 70 kg person about 687 N at Earth’s surface', () => {
    expect(gravitationalForce(5.9722e24, 70, 6.371e6)).toBeCloseTo(687, 0);
  });

  it('gives Earth’s surface gravity close to 9.82 m/s² and about 8.7 m/s² at 400 km', () => {
    expect(gravityAtAltitude(5.9722e24, 6.371e6, 0)).toBeCloseTo(9.82, 2);
    expect(gravityAtAltitude(5.9722e24, 6.371e6, 400e3)).toBeCloseTo(8.69, 2);
  });
});

describe('Kepler orbit helpers', () => {
  it('solves Kepler’s equation', () => {
    for (const e of [0, 0.3, 0.9]) {
      const M = 1.234;
      const E = solveEccentricAnomaly(M, e);
      expect(E - e * Math.sin(E)).toBeCloseTo(M, 10);
    }
  });

  it('places perihelion and aphelion at a(1−e) and a(1+e)', () => {
    expect(orbitPosition(2, 0.5, 0).r).toBeCloseTo(1, 10);
    expect(orbitPosition(2, 0.5, 0.5).r).toBeCloseTo(3, 10);
  });

  it('follows T² = a³ and gives Earth about 29.8 km/s', () => {
    expect(orbitalPeriodYears(4)).toBeCloseTo(8, 10);
    expect(orbitalSpeedKmS(1, 1)).toBeCloseTo(29.78, 1);
  });

  it('sweeps equal areas in equal times (second law)', () => {
    const area = (from: number, to: number) => {
      let total = 0;
      const steps = 2000;
      for (let i = 0; i < steps; i++) {
        const p = orbitPosition(1, 0.6, from + ((to - from) * i) / steps);
        const q = orbitPosition(1, 0.6, from + ((to - from) * (i + 1)) / steps);
        total += Math.abs(p.x * q.y - q.x * p.y) / 2;
      }
      return total;
    };
    expect(area(0, 0.1)).toBeCloseTo(area(0.45, 0.55), 4);
  });
});

describe('stepTrack', () => {
  const base: TrackConfig = { mass: 1, height: 5, halfWidth: 8, g: 10, friction: 0 };

  function run(config: TrackConfig, seconds: number) {
    let state = initialTrackState();
    let maxX = -1;
    for (let t = 0; t < seconds * 60; t++) {
      state = stepTrack(config, state, 1 / 60);
      maxX = Math.max(maxX, state.x);
    }
    return { state, maxX };
  }

  it('conserves mechanical energy without friction and reaches the same height', () => {
    const { state, maxX } = run(base, 10);
    expect(maxX).toBeGreaterThan(0.99);
    const mechanical = 0.5 * base.mass * state.speed ** 2 + base.mass * base.g * trackHeight(base, state.x);
    expect(mechanical).toBeCloseTo(50, 6);
  });

  it('dissipates energy with friction and eventually stops', () => {
    const config = { ...base, friction: 2 };
    const { state, maxX } = run(config, 60);
    expect(maxX).toBeLessThan(0.99);
    expect(state.stopped).toBe(true);
    const mechanical = 0.5 * config.mass * state.speed ** 2 + config.mass * config.g * trackHeight(config, state.x);
    expect(mechanical + state.dissipated).toBeCloseTo(50, 3);
  });
});
