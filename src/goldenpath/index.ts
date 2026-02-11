/**
 * Golden Path Module V1.0 — Re-Exports
 */

// Engine (core)
export {
  registerGoldenPath,
  getGoldenPath,
  getAllGoldenPaths,
  evaluateStep,
  evaluateGoldenPath,
  evaluatePhase,
  checkPreconditions,
  checkContracts,
  getNextStep,
  isCompleted,
  validateNoDirectCross,
  canEnterRoute,
  canRunAction,
  nextStep,
} from './engine';

// Hook
export { useGoldenPath } from './useGoldenPath';

// Guard
export { GoldenPathGuard } from './GoldenPathGuard';

// DEV Validator
export { validateGoldenPaths } from './devValidator';

// Context Resolvers
export { registerContextResolver, getContextResolver } from './contextResolvers';
