import { FunctionApproachGrapher, type FunctionApproachGrapherParams } from './function-approach-grapher';

// Keyed lookup, same pattern as packages/theme/icon.tsx's `ICONS` map --
// adding a new simulator later means writing one component and adding one
// entry here, nothing else.
export const SIMULATORS = {
  'function-approach-grapher': FunctionApproachGrapher,
} as const;

export type SimulatorKey = keyof typeof SIMULATORS;

export function isValidSimulatorKey(value: string): value is SimulatorKey {
  return value in SIMULATORS;
}

export type { FunctionApproachGrapherParams };
