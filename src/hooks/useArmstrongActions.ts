/**
 * useArmstrongActions — Hook for Armstrong Actions Catalog
 * 
 * Combines the static manifest with dynamic overrides from DB.
 * Calculates effective_status per action.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { armstrongActions, ArmstrongAction } from "@/manifests/armstrongManifest";
import type { OverrideStatus } from "@/types/armstrong";

export interface ActionOverride {
  id: string;
  action_code: string;
  scope_type: 'global' | 'org';
  org_id: string | null;
  status_override: OverrideStatus;
  restricted_reason: string | null;
  disabled_until: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArmstrongActionWithOverride extends ArmstrongAction {
  effective_status: OverrideStatus;
  override?: ActionOverride;
}

/**
 * Fetches action overrides from database
 */
async function fetchActionOverrides(): Promise<ActionOverride[]> {
  const { data, error } = await supabase
    .from('armstrong_action_overrides')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching action overrides:', error);
    return [];
  }

  return (data || []) as ActionOverride[];
}

/**
 * Calculate effective status for an action based on overrides
 * Priority: global override > org override > manifest status (mapped)
 */
function calculateEffectiveStatus(
  action: ArmstrongAction,
  overrides: ActionOverride[],
  currentOrgId?: string
): { status: OverrideStatus; override?: ActionOverride } {
  // Check for global override first
  const globalOverride = overrides.find(
    o => o.action_code === action.action_code && o.scope_type === 'global'
  );

  if (globalOverride) {
    // Check if disabled_until has passed
    if (globalOverride.disabled_until) {
      const disabledUntil = new Date(globalOverride.disabled_until);
      if (disabledUntil < new Date()) {
        // Override has expired, use manifest status
        return { status: mapManifestStatus(action.status) };
      }
    }
    return { status: globalOverride.status_override, override: globalOverride };
  }

  // Check for org-specific override
  if (currentOrgId) {
    const orgOverride = overrides.find(
      o => o.action_code === action.action_code && 
           o.scope_type === 'org' && 
           o.org_id === currentOrgId
    );

    if (orgOverride) {
      if (orgOverride.disabled_until) {
        const disabledUntil = new Date(orgOverride.disabled_until);
        if (disabledUntil < new Date()) {
          return { status: mapManifestStatus(action.status) };
        }
      }
      return { status: orgOverride.status_override, override: orgOverride };
    }
  }

  // No override, use manifest status (mapped to override status)
  return { status: mapManifestStatus(action.status) };
}

/**
 * Map manifest ActionStatus to OverrideStatus
 */
function mapManifestStatus(status: 'draft' | 'active' | 'deprecated'): OverrideStatus {
  switch (status) {
    case 'active': return 'active';
    case 'draft': return 'restricted';
    case 'deprecated': return 'disabled';
    default: return 'active';
  }
}

/**
 * Hook to get all Armstrong actions with effective status
 */
export function useArmstrongActions(currentOrgId?: string) {
  const { data: overrides, isLoading, error, refetch } = useQuery({
    queryKey: ['armstrong-action-overrides'],
    queryFn: fetchActionOverrides,
    staleTime: 30000, // 30 seconds
  });

  const actionsWithOverrides: ArmstrongActionWithOverride[] = armstrongActions.map(action => {
    const { status, override } = calculateEffectiveStatus(
      action,
      overrides || [],
      currentOrgId
    );
    return {
      ...action,
      effective_status: status,
      override,
    };
  });

  // Stats
  const stats = {
    total: actionsWithOverrides.length,
    active: actionsWithOverrides.filter(a => a.effective_status === 'active').length,
    restricted: actionsWithOverrides.filter(a => a.effective_status === 'restricted').length,
    disabled: actionsWithOverrides.filter(a => a.effective_status === 'disabled').length,
    withOverrides: actionsWithOverrides.filter(a => a.override).length,
  };

  return {
    actions: actionsWithOverrides,
    overrides: overrides || [],
    stats,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to create/update an action override (platform_admin only)
 */
export function useActionOverrideMutation() {
  const createOrUpdateOverride = async (override: {
    action_code: string;
    scope_type: 'global' | 'org';
    org_id?: string;
    status_override: OverrideStatus;
    restricted_reason?: string;
    disabled_until?: string;
  }) => {
    const { data, error } = await supabase
      .from('armstrong_action_overrides')
      .upsert({
        action_code: override.action_code,
        scope_type: override.scope_type,
        org_id: override.org_id || null,
        status_override: override.status_override,
        restricted_reason: override.restricted_reason || null,
        disabled_until: override.disabled_until || null,
      }, {
        onConflict: 'action_code,scope_type,org_id',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteOverride = async (id: string) => {
    const { error } = await supabase
      .from('armstrong_action_overrides')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  return { createOrUpdateOverride, deleteOverride };
}
