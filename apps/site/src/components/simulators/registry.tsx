import { FunctionApproachGrapher, type FunctionApproachGrapherParams } from './function-approach-grapher';
import { EnergyTrack } from './physics/energy-track';
import { KeplerOrbit } from './physics/kepler-orbit';
import { KineticEnergyExplorer } from './physics/kinetic-energy-explorer';
import { SpringEnergy } from './physics/spring-energy';
import { SurfaceGravity } from './physics/surface-gravity';
import { UniversalGravitation } from './physics/universal-gravitation';
import { WorkEnergyBlock } from './physics/work-energy-block';

// Keyed lookup, same pattern as packages/theme/icon.tsx's `ICONS` map --
// adding a new simulator later means writing one component and adding one
// entry here, nothing else.
export const SIMULATORS = {
  'function-approach-grapher': FunctionApproachGrapher,
  'kinetic-energy-explorer': KineticEnergyExplorer,
  'work-energy-block': WorkEnergyBlock,
  'energy-track': EnergyTrack,
  'spring-energy': SpringEnergy,
  'kepler-orbit': KeplerOrbit,
  'universal-gravitation': UniversalGravitation,
  'surface-gravity': SurfaceGravity,
} as const;

export type SimulatorKey = keyof typeof SIMULATORS;

export function isValidSimulatorKey(value: string): value is SimulatorKey {
  return value in SIMULATORS;
}

export type { FunctionApproachGrapherParams };
