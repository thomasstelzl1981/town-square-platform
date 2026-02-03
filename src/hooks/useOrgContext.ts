/**
 * Organization Context Hook
 * 
 * P0-PERF: Optimized to use data from AuthContext instead of redundant fetches.
 * Manages active organization context for multi-tenant operations.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type OrgType = 'internal' | 'platform' | 'partner' | 'subpartner' | 'client' | 'renter';

export interface OrgContextData {
  activeOrgId: string | null;
  activeOrgType: OrgType | null;
  activeOrgName: string;
  canSwitch: boolean;
  availableOrgs: Array<{
    id: string;
    name: string;
    type: OrgType;
    isActive: boolean;
  }>;
  switchOrg: (orgId: string) => Promise<void>;
  isLoading: boolean;
}

const LOCAL_STORAGE_KEY = 'sot_active_org_id';

export function useOrgContext(): OrgContextData {
  const { 
    activeOrganization, 
    memberships, 
    switchTenant, 
    isDevelopmentMode 
  } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);

  // P0-PERF: Build available orgs directly from AuthContext data
  // No more redundant fetch - AuthContext already has activeOrganization with name + org_type
  const availableOrgs = useMemo(() => {
    if (isDevelopmentMode && memberships.length <= 1) {
      // Dev mode: single org from activeOrganization
      return activeOrganization ? [{
        id: activeOrganization.id,
        name: activeOrganization.name,
        type: (activeOrganization.org_type as OrgType) || 'client',
        isActive: true,
      }] : [];
    }

    // Multi-org: map from memberships, use activeOrganization for the active one
    return memberships.map((m) => {
      const isActive = m.tenant_id === activeOrganization?.id;
      return {
        id: m.tenant_id,
        name: isActive ? activeOrganization!.name : `Org ${m.tenant_id.slice(0, 8)}`,
        type: isActive ? (activeOrganization?.org_type as OrgType) : 'client',
        isActive,
      };
    });
  }, [memberships, activeOrganization, isDevelopmentMode]);

  const switchOrg = useCallback(async (orgId: string) => {
    setIsLoading(true);
    try {
      await switchTenant(orgId);
      localStorage.setItem(LOCAL_STORAGE_KEY, orgId);
    } finally {
      setIsLoading(false);
    }
  }, [switchTenant]);

  return {
    activeOrgId: activeOrganization?.id || null,
    activeOrgType: (activeOrganization?.org_type as OrgType) || null,
    activeOrgName: activeOrganization?.name || 'Entwicklungs-Tenant',
    canSwitch: availableOrgs.length > 1,
    availableOrgs,
    switchOrg,
    isLoading,
  };
}

/**
 * Get org type badge color
 */
export function getOrgTypeBadgeColor(type: OrgType | null): string {
  switch (type) {
    case 'internal':
    case 'platform':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'partner':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'subpartner':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
    case 'client':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'renter':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

/**
 * Get org type display label (German)
 */
export function getOrgTypeLabel(type: OrgType | null): string {
  switch (type) {
    case 'internal':
      return 'Internal';
    case 'platform':
      return 'Plattform';
    case 'partner':
      return 'Partner';
    case 'subpartner':
      return 'Subpartner';
    case 'client':
      return 'Kunde';
    case 'renter':
      return 'Mieter';
    default:
      return 'Unbekannt';
  }
}
