/**
 * ENG-SLC — Sales Lifecycle Controller: Engine
 * 
 * Pure functions implementing SLC logic. NO side effects, NO DB calls, NO UI imports.
 * 
 * @engine ENG-SLC
 * @version 1.0.0
 */

import type {
  SLCPhase,
  SLCEvent,
  SLCCase,
  SLCEventType,
  ChannelProjection,
} from './spec';
import {
  SLC_PHASE_ORDER,
  SLC_EVENT_PHASE_MAP,
  SLC_STUCK_THRESHOLDS,
} from './spec';

// ─── Phase Determination ──────────────────────────────────────

/**
 * Determines the current phase based on the event history.
 * Walks through events chronologically and applies phase transitions.
 */
export function determineCurrentPhase(events: Pick<SLCEvent, 'event_type' | 'created_at'>[]): SLCPhase {
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let phase: SLCPhase = 'mandate_active';

  for (const event of sorted) {
    const nextPhase = SLC_EVENT_PHASE_MAP[event.event_type as SLCEventType];
    if (nextPhase) {
      phase = nextPhase;
    }
  }

  return phase;
}

/**
 * Checks whether a given phase transition is valid (forward-only, no skipping terminal).
 */
export function isValidTransition(from: SLCPhase, to: SLCPhase): boolean {
  // Allow transition to closed_lost from any non-terminal phase
  if (to === 'closed_lost' && from !== 'closed_won' && from !== 'closed_lost') {
    return true;
  }
  // Allow reopening: closed_lost → mandate_active (Admin/Z1 only)
  if (from === 'closed_lost' && to === 'mandate_active') {
    return true;
  }
  // No other transitions from terminal phases
  if (from === 'closed_won' || from === 'closed_lost') {
    return false;
  }
  const fromIdx = SLC_PHASE_ORDER.indexOf(from);
  const toIdx = SLC_PHASE_ORDER.indexOf(to);
  // Must move forward
  return toIdx > fromIdx;
}

// ─── Drift Detection ──────────────────────────────────────────

/**
 * Computes drift status for channel publications.
 * A channel is "drifted" when expected_hash ≠ last_synced_hash.
 */
export function computeChannelDrift(
  publications: Pick<ChannelProjection, 'expected_hash' | 'last_synced_hash' | 'channel' | 'listing_id'>[]
): ChannelProjection[] {
  return publications.map((pub) => ({
    ...pub,
    last_synced_at: null,
    is_drifted: pub.expected_hash !== null &&
      pub.last_synced_hash !== null &&
      pub.expected_hash !== pub.last_synced_hash,
  }));
}

/**
 * Returns the count of drifted channels.
 */
export function countDriftedChannels(projections: ChannelProjection[]): number {
  return projections.filter((p) => p.is_drifted).length;
}

// ─── Stuck Detection ──────────────────────────────────────────

/**
 * Checks if a sales case is "stuck" — i.e. has been in the current phase
 * longer than the threshold allows.
 */
export function isStuck(
  currentPhase: SLCPhase,
  phaseEnteredAt: string | Date,
  referenceDate: Date = new Date()
): boolean {
  const threshold = SLC_STUCK_THRESHOLDS[currentPhase];
  if (!threshold) return false;

  const enteredAt = typeof phaseEnteredAt === 'string' ? new Date(phaseEnteredAt) : phaseEnteredAt;
  const daysDiff = (referenceDate.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24);

  return daysDiff > threshold;
}

/**
 * Returns the phase index (0-based) for progress visualization.
 */
export function getPhaseIndex(phase: SLCPhase): number {
  const idx = SLC_PHASE_ORDER.indexOf(phase);
  return idx >= 0 ? idx : 0;
}

/**
 * Calculates progress percentage (0-100) based on phase.
 */
export function getPhaseProgress(phase: SLCPhase): number {
  if (phase === 'closed_lost') return 100;
  const idx = SLC_PHASE_ORDER.indexOf(phase);
  if (idx < 0) return 0;
  return Math.round((idx / (SLC_PHASE_ORDER.length - 1)) * 100);
}

// ─── Event Summary ────────────────────────────────────────────

/**
 * Groups events by category for timeline display.
 */
export function groupEventsByCategory(events: Pick<SLCEvent, 'event_type'>[]): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const evt of events) {
    const category = evt.event_type.split('.')[0];
    groups[category] = (groups[category] || 0) + 1;
  }
  return groups;
}

/**
 * Finds the last event of a given type from a list of events.
 */
export function findLastEventOfType(
  events: SLCEvent[],
  eventType: SLCEventType
): SLCEvent | undefined {
  const sorted = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return sorted.find((e) => e.event_type === eventType);
}
