/**
 * useDemoAcquisition — Synthetic demo data for GP-SUCHMANDAT cross-zone flow
 * 
 * Provides:
 * - searchMandates → Zone 2 (Portal: Investment-Suchmandat Grid)
 * - amCases → Zone 1 (AM-Cockpit: eingehendes Mandat)
 * 
 * Toggle: GP-SUCHMANDAT
 * 
 * @see src/manifests/demoDataManifest.ts
 */

import { useMemo } from 'react';
import { useDemoToggles } from '@/hooks/useDemoToggles';

// ============================================================================
// Demo IDs
// ============================================================================

export const DEMO_SEARCH_MANDATE_ID = 'demo-search-mandate-001';
export const DEMO_AM_CASE_ID = 'demo-am-case-001';

export const isDemoAcquisitionId = (id: string): boolean =>
  id === DEMO_SEARCH_MANDATE_ID || id === DEMO_AM_CASE_ID;

// ============================================================================
// Shape: SearchMandate (Zone 2 — Investment-Suche)
// ============================================================================

export interface DemoSearchMandate {
  id: string;
  title: string;
  assetFocus: string[];
  region: string;
  budgetMin: number;
  budgetMax: number;
  yieldTarget: number;
  status: string;
  matchCount: number;
  createdAt: string;
  isDemo: boolean;
}

// ============================================================================
// Shape: AM Case (Zone 1 — Akquise Manager Cockpit)
// ============================================================================

export interface DemoAMCase {
  id: string;
  mandateCode: string;
  clientName: string;
  assetFocus: string[];
  region: string;
  budgetMax: number;
  pipelineCount: number;
  status: string;
  createdAt: string;
  isDemo: boolean;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useDemoAcquisition() {
  const { isEnabled } = useDemoToggles();
  const active = isEnabled('GP-SUCHMANDAT');

  const searchMandates = useMemo<DemoSearchMandate[]>(() => {
    if (!active) return [];
    return [{
      id: DEMO_SEARCH_MANDATE_ID,
      title: 'MFH NRW ab 1 Mio',
      assetFocus: ['MFH'],
      region: 'NRW',
      budgetMin: 1000000,
      budgetMax: 3000000,
      yieldTarget: 5.0,
      status: 'active',
      matchCount: 12,
      createdAt: '2025-02-01T10:00:00.000Z',
      isDemo: true,
    }];
  }, [active]);

  const amCases = useMemo<DemoAMCase[]>(() => {
    if (!active) return [];
    return [{
      id: DEMO_AM_CASE_ID,
      mandateCode: 'AM-DEMO-001',
      clientName: 'Investoren GbR Rhein',
      assetFocus: ['MFH'],
      region: 'Köln/Düsseldorf',
      budgetMax: 5000000,
      pipelineCount: 8,
      status: 'sourcing',
      createdAt: '2025-02-01T10:00:00.000Z',
      isDemo: true,
    }];
  }, [active]);

  return {
    active,
    searchMandates,
    amCases,
  };
}
