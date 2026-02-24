/**
 * useIntakeContext — Lightweight event bus for Magic Intake state broadcasting
 * 
 * Since Armstrong lives in a portal outside the ProjekteDashboard component tree,
 * we use a simple global event emitter pattern instead of React Context.
 * 
 * Producer: ProjekteDashboard emits state changes via emitIntakeState()
 * Consumers: ArmstrongChipBar + useArmstrongAdvisor subscribe via useIntakeListener()
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export type IntakeStep = 'upload' | 'analyzing' | 'review' | 'creating' | 'created' | null;

export interface IntakeState {
  step: IntakeStep;
  unitsCount: number;
  projectName: string;
  warnings: { type: 'error' | 'warning'; message: string }[];
  /** Summary stats for Armstrong commentary */
  avgPricePerSqm?: number;
  totalArea?: number;
  totalPrice?: number;
  wegCount?: number;
  projectType?: string;
}

const INITIAL_STATE: IntakeState = {
  step: null,
  unitsCount: 0,
  projectName: '',
  warnings: [],
};

// ── Global event bus (singleton) ─────────────────────────────────────────────

type IntakeListener = (state: IntakeState) => void;

let currentState: IntakeState = { ...INITIAL_STATE };
const listeners = new Set<IntakeListener>();

/**
 * Emit a new intake state — called by ProjekteDashboard
 */
export function emitIntakeState(state: IntakeState) {
  currentState = state;
  listeners.forEach(fn => fn(state));
}

/**
 * Reset intake state — called when leaving MOD-13 or resetting form
 */
export function resetIntakeState() {
  emitIntakeState({ ...INITIAL_STATE });
}

/**
 * Get current intake state (synchronous read)
 */
export function getIntakeState(): IntakeState {
  return currentState;
}

// ── Consumer hook ────────────────────────────────────────────────────────────

/**
 * Subscribe to intake state changes. Returns current state + reactive updates.
 */
export function useIntakeListener(): IntakeState {
  const [state, setState] = useState<IntakeState>(currentState);

  useEffect(() => {
    const handler: IntakeListener = (newState) => setState(newState);
    listeners.add(handler);
    // Sync with current state on mount
    setState(currentState);
    return () => { listeners.delete(handler); };
  }, []);

  return state;
}

// ── Producer hook ────────────────────────────────────────────────────────────

/**
 * Provides emit/reset functions for ProjekteDashboard.
 * Auto-resets on unmount so Armstrong doesn't show stale intake chips.
 */
export function useIntakeEmitter() {
  const emit = useCallback((state: IntakeState) => {
    emitIntakeState(state);
  }, []);

  const reset = useCallback(() => {
    resetIntakeState();
  }, []);

  // Auto-reset when ProjekteDashboard unmounts
  useEffect(() => {
    return () => { resetIntakeState(); };
  }, []);

  return { emit, reset };
}
