/**
 * useDemoFinanceCase — Synthetic demo data for GP-FINANZIERUNG cross-zone flow
 * 
 * Provides:
 * - financeRequests → Zone 2 (Portal: Finanzierungsanfrage Grid)
 * - fmCases → Zone 1 (FM-Cockpit: eingehender Fall)
 * 
 * Toggle: GP-FINANZIERUNG
 * 
 * @see src/manifests/demoDataManifest.ts
 */

import { useMemo } from 'react';
import { useDemoToggles } from '@/hooks/useDemoToggles';

// ============================================================================
// Demo Finance Request IDs
// ============================================================================

export const DEMO_FINANCE_REQUEST_ID = 'demo-finance-request-001';
export const DEMO_FM_CASE_ID = 'demo-fm-case-001';

export const isDemoFinanceId = (id: string): boolean =>
  id === DEMO_FINANCE_REQUEST_ID || id === DEMO_FM_CASE_ID;

// ============================================================================
// Shape: FinanceRequest (Zone 2)
// ============================================================================

export interface DemoFinanceRequest {
  id: string;
  title: string;
  purchasePrice: number;
  loanAmount: number;
  interestRate: number;
  monthlyRate: number;
  status: string;
  objectAddress: string;
  applicantName: string;
  createdAt: string;
  isDemo: boolean;
}

// ============================================================================
// Shape: FM Case (Zone 1 — Finanzierungsmanager Cockpit)
// ============================================================================

export interface DemoFMCase {
  id: string;
  caseNumber: string;
  applicantName: string;
  objectAddress: string;
  loanVolume: number;
  status: string;
  phase: string;
  createdAt: string;
  isDemo: boolean;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useDemoFinanceCase() {
  const { isEnabled } = useDemoToggles();
  const active = isEnabled('GP-FINANZIERUNG');

  const financeRequests = useMemo<DemoFinanceRequest[]>(() => {
    if (!active) return [];
    return [{
      id: DEMO_FINANCE_REQUEST_ID,
      title: 'ETW Düsseldorf — Kapitalanlage',
      purchasePrice: 320000,
      loanAmount: 280000,
      interestRate: 3.2,
      monthlyRate: 1200,
      status: 'submitted',
      objectAddress: 'Königsallee 55, 40212 Düsseldorf',
      applicantName: 'Max Muster',
      createdAt: '2025-01-20T10:00:00.000Z',
      isDemo: true,
    }];
  }, [active]);

  const fmCases = useMemo<DemoFMCase[]>(() => {
    if (!active) return [];
    return [{
      id: DEMO_FM_CASE_ID,
      caseNumber: 'FM-DEMO-001',
      applicantName: 'Max Muster',
      objectAddress: 'Königsallee 55, 40212 Düsseldorf',
      loanVolume: 280000,
      status: 'in_review',
      phase: 'document_check',
      createdAt: '2025-01-20T10:00:00.000Z',
      isDemo: true,
    }];
  }, [active]);

  return {
    active,
    financeRequests,
    fmCases,
  };
}
