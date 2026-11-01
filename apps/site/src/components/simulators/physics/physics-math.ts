// Pure physics helpers shared by the physics simulators. Kept free of React
// so they can be unit-tested directly.

/** Newtonian constant of gravitation (CODATA 2018/2022), N·m²/kg². */
export const G = 6.6743e-11;

/** Sun's GM in AU³/yr², which makes Kepler's third law read T² = a³. */
export const SUN_GM_AU_YR = 4 * Math.PI * Math.PI;

/** 1 AU/yr expressed in km/s (149 597 870.7 km / 31 557 600 s). */
export const AU_PER_YEAR_IN_KM_S = 149_597_870.7 / 31_557_600;

export function kineticEnergy(mass: number, speed: number): number {
  return 0.5 * mass * speed * speed;
}

export function elasticPotentialEnergy(k: number, x: number): number {
  return 0.5 * k * x * x;
}

export function gravitationalForce(m1: number, m2: number, distance: number): number {
  return (G * m1 * m2) / (distance * distance);
}

export function gravityAtAltitude(mass: number, radius: number, altitude: number): number {
  const r = radius + altitude;
  return (G * mass) / (r * r);
}

export interface WorkEnergyInput {
  mass: number;
  initialSpeed: number;
  force: number;
  mu: number;
  distance: number;
  g: number;
}

export interface WorkEnergyResult {
  workForce: number;
  workFriction: number;
  workTotal: number;
  initialKinetic: number;
  finalKinetic: number;
  finalSpeed: number;
  frictionForce: number;
  /** Distance travelled; shorter than `distance` when the block stops first. */
  travelled: number;
  stopsEarly: boolean;
}

/**
 * Block on a horizontal floor, pushed by a horizontal force `force` against
 * kinetic friction `mu·m·g`, over `distance`. When the net force decelerates
 * the block to rest before `distance`, it reports where it stops.
 */
export function workEnergy({ mass, initialSpeed, force, mu, distance, g }: WorkEnergyInput): WorkEnergyResult {
  const frictionForce = mu * mass * g;
  const initialKinetic = kineticEnergy(mass, initialSpeed);
  const net = force - frictionForce;
  let travelled = distance;
  let stopsEarly = false;
  if (net < 0 && initialKinetic + net * distance < 0) {
    travelled = initialKinetic / -net;
    stopsEarly = true;
  }
  // A block at rest that the force cannot overcome never moves.
  if (initialKinetic === 0 && net <= 0) {
    travelled = 0;
    stopsEarly = distance > 0;
  }
  const workForce = force * travelled;
  const workFriction = -frictionForce * travelled;
  const workTotal = workForce + workFriction;
  const finalKinetic = Math.max(0, initialKinetic + workTotal);
  return {
    workForce,
    workFriction,
    workTotal,
    initialKinetic,
    finalKinetic,
    finalSpeed: Math.sqrt((2 * finalKinetic) / mass),
    frictionForce,
    travelled,
    stopsEarly,
  };
}

/** Solves Kepler's equation M = E − e·sin E for the eccentric anomaly E. */
export function solveEccentricAnomaly(meanAnomaly: number, eccentricity: number): number {
  let E = eccentricity < 0.8 ? meanAnomaly : Math.PI;
  for (let i = 0; i < 50; i++) {
    const delta = (E - eccentricity * Math.sin(E) - meanAnomaly) / (1 - eccentricity * Math.cos(E));
    E -= delta;
    if (Math.abs(delta) < 1e-12) break;
  }
  return E;
}

/**
 * Position of a body on an ellipse with the attracting body at the origin
 * (a focus), perihelion on the +x axis, after `fraction` of one period.
 */
export function orbitPosition(semiMajorAxis: number, eccentricity: number, fraction: number): { x: number; y: number; r: number } {
  const meanAnomaly = 2 * Math.PI * (fraction - Math.floor(fraction));
  const E = solveEccentricAnomaly(meanAnomaly, eccentricity);
  const b = semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
  const x = semiMajorAxis * (Math.cos(E) - eccentricity);
  const y = b * Math.sin(E);
  return { x, y, r: Math.hypot(x, y) };
}

/** Kepler's third law around the Sun: T (years) for a (AU). */
export function orbitalPeriodYears(semiMajorAxisAu: number): number {
  return Math.pow(semiMajorAxisAu, 1.5);
}

/** Vis-viva speed (km/s) around the Sun at distance r (AU) on an orbit of semi-major axis a (AU). */
export function orbitalSpeedKmS(r: number, semiMajorAxis: number): number {
  return Math.sqrt(SUN_GM_AU_YR * (2 / r - 1 / semiMajorAxis)) * AU_PER_YEAR_IN_KM_S;
}

export interface TrackState {
  /** Horizontal position, in units of the track half-width (−1 … 1). */
  x: number;
  /** +1 moving right, −1 moving left. */
  direction: 1 | -1;
  /** Energy dissipated by friction so far (J). */
  dissipated: number;
  speed: number;
  stopped: boolean;
}

export interface TrackConfig {
  mass: number;
  /** Release height (m) — the track is y = H·x², x ∈ [−1, 1] in half-widths. */
  height: number;
  /** Track half-width (m). */
  halfWidth: number;
  g: number;
  /** Constant-magnitude dissipative force opposing motion (N). */
  friction: number;
}

export function trackHeight(config: TrackConfig, x: number): number {
  return config.height * x * x;
}

function slope(config: TrackConfig, x: number): number {
  // dy/dX in metres per metre, with X = x·halfWidth.
  return (2 * config.height * x) / config.halfWidth;
}

export function initialTrackState(): TrackState {
  return { x: -1, direction: 1, dissipated: 0, speed: 0, stopped: false };
}

/**
 * Advances a ball along the valley track by `dt` seconds. Speed is taken from
 * the energy balance (Em₀ − dissipated − m·g·y), so with no friction the
 * mechanical energy is conserved exactly instead of drifting numerically.
 */
export function stepTrack(config: TrackConfig, state: TrackState, dt: number): TrackState {
  // requestAnimationFrame timestamps can precede the clock reading taken when
  // the animation started, so the first frame may report a zero/negative dt.
  if (state.stopped || !(dt > 0)) return state;
  const initialEnergy = config.mass * config.g * config.height;
  let { x, direction, dissipated } = state;
  const substeps = 20;
  const h = dt / substeps;
  // Minimum step speed so the ball can leave a turning point; the energy
  // check below still forbids it from gaining energy.
  const minStepSpeed = 0.05;
  for (let i = 0; i < substeps; i++) {
    const s = slope(config, x);
    const kinetic = initialEnergy - dissipated - config.mass * config.g * trackHeight(config, x);
    const speed = kinetic > 0 ? Math.sqrt((2 * kinetic) / config.mass) : 0;
    const ds = Math.max(speed, minStepSpeed) * h;
    const dx = (direction * ds) / Math.sqrt(1 + s * s) / config.halfWidth;
    const nextX = Math.max(-1, Math.min(1, x + dx));
    const nextKinetic =
      initialEnergy - (dissipated + config.friction * ds) - config.mass * config.g * trackHeight(config, nextX);
    if (nextKinetic < 0 || nextX === x) {
      // Turning point: the ball rolls back only if gravity's component along
      // the track beats friction; otherwise it stays at rest.
      const sinTheta = Math.abs(s) / Math.sqrt(1 + s * s);
      const downhill: 1 | -1 = x > 0 ? -1 : 1;
      if (Math.abs(x) < 1e-3 || config.mass * config.g * sinTheta <= config.friction) {
        return { x, direction, dissipated, speed: 0, stopped: true };
      }
      if (direction === downhill) {
        // Already heading downhill but no energy left to move: at rest.
        return { x, direction, dissipated, speed: 0, stopped: true };
      }
      direction = downhill;
      continue;
    }
    x = nextX;
    dissipated += config.friction * ds;
  }
  const kinetic = initialEnergy - dissipated - config.mass * config.g * trackHeight(config, x);
  const speed = kinetic > 0 ? Math.sqrt((2 * kinetic) / config.mass) : 0;
  return { x, direction, dissipated, speed, stopped: false };
}
