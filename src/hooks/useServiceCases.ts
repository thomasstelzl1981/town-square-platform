import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================
export type ServiceCaseStatus = 
  | 'draft' 
  | 'scope_pending' 
  | 'scope_draft' 
  | 'scope_finalized'
  | 'ready_to_send'
  | 'sent' 
  | 'offers_received'
  | 'under_review'
  | 'awarded' 
  | 'in_progress'
  | 'completed' 
  | 'cancelled';

export type ScopeStatus = 'pending' | 'ai_analyzing' | 'draft' | 'finalized';
export type ScopeSource = 'none' | 'ai_generated' | 'external_lv' | 'manual';

export type ServiceCaseCategory = 
  | 'sanitaer' 
  | 'elektro' 
  | 'maler' 
  | 'dach' 
  | 'fenster' 
  | 'heizung' 
  | 'gutachter'
  | 'hausverwaltung'
  | 'sonstige';

export interface ServiceCase {
  id: string;
  tenant_id: string;
  property_id: string;
  unit_id: string | null;
  public_id: string;
  tender_id: string | null;
  category: ServiceCaseCategory;
  title: string;
  description: string | null;
  status: ServiceCaseStatus;
  scope_status: ScopeStatus;
  scope_source: ScopeSource;
  scope_description: string | null;
  scope_line_items: Record<string, unknown>[];
  scope_attachments: Record<string, unknown>[];
  cost_estimate_min: number | null;
  cost_estimate_max: number | null;
  cost_estimate_mid: number | null;
  budget_estimate: number | null;
  awarded_amount: number | null;
  awarded_to_contact_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  deadline_offers: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // Joined data
  property?: {
    id: string;
    address: string;
    city: string;
    postal_code: string;
    code: string | null;
  };
  unit?: {
    id: string;
    unit_number: string;
    code: string | null;
  } | null;
}

export interface CreateServiceCaseData {
  property_id: string;
  unit_id?: string | null;
  category: ServiceCaseCategory;
  title: string;
  description?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch all service cases for the active tenant
 */
export function useServiceCases() {
  const { activeTenantId } = useAuth();
  
  return useQuery({
    queryKey: ['service_cases', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      
      const { data, error } = await supabase
        .from('service_cases')
        .select(`
          *,
          property:properties!service_cases_property_id_fkey(
            id, address, city, postal_code, code
          ),
          unit:units!service_cases_unit_id_fkey(
            id, unit_number, code
          )
        `)
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as ServiceCase[];
    },
    enabled: !!activeTenantId,
  });
}

/**
 * Fetch a single service case by ID
 */
export function useServiceCase(caseId: string | undefined) {
  const { activeTenantId } = useAuth();
  
  return useQuery({
    queryKey: ['service_case', caseId],
    queryFn: async () => {
      if (!caseId) return null;
      
      const { data, error } = await supabase
        .from('service_cases')
        .select(`
          *,
          property:properties!service_cases_property_id_fkey(
            id, address, city, postal_code, code
          ),
          unit:units!service_cases_unit_id_fkey(
            id, unit_number, code
          )
        `)
        .eq('id', caseId)
        .single();
      
      if (error) throw error;
      return data as unknown as ServiceCase;
    },
    enabled: !!caseId && !!activeTenantId,
  });
}

/**
 * Create a new service case
 */
export function useCreateServiceCase() {
  const { activeTenantId, user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateServiceCaseData) => {
      if (!activeTenantId) throw new Error('No active tenant');
      
      const { data: result, error } = await supabase
        .from('service_cases')
        .insert({
          tenant_id: activeTenantId,
          property_id: data.property_id,
          unit_id: data.unit_id || null,
          category: data.category,
          title: data.title,
          description: data.description || null,
          status: 'draft',
          scope_status: 'pending',
          contact_name: data.contact_name || null,
          contact_phone: data.contact_phone || null,
          contact_email: data.contact_email || null,
          created_by: user?.id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_cases', activeTenantId] });
      toast.success('Sanierungsvorgang angelegt');
    },
    onError: (error) => {
      console.error('Error creating service case:', error);
      toast.error('Fehler beim Anlegen des Vorgangs');
    },
  });
}

/**
 * Update a service case
 */
export function useUpdateServiceCase() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ServiceCase> & { id: string }) => {
      // Remove joined properties that can't be updated
      const { property, unit, ...cleanUpdates } = updates;
      
      const { data, error } = await supabase
        .from('service_cases')
        .update(cleanUpdates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service_cases', activeTenantId] });
      queryClient.invalidateQueries({ queryKey: ['service_case', data.id] });
    },
    onError: (error) => {
      console.error('Error updating service case:', error);
      toast.error('Fehler beim Aktualisieren des Vorgangs');
    },
  });
}

/**
 * Get statistics for service cases
 */
export function useServiceCaseStats() {
  const { activeTenantId } = useAuth();
  
  return useQuery({
    queryKey: ['service_case_stats', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      
      const { data, error } = await supabase
        .from('service_cases')
        .select('status, category, scope_status')
        .eq('tenant_id', activeTenantId);
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        byStatus: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        byScopeStatus: {} as Record<string, number>,
      };
      
      data.forEach((item) => {
        stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
        stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;
        if (item.scope_status) {
          stats.byScopeStatus[item.scope_status] = (stats.byScopeStatus[item.scope_status] || 0) + 1;
        }
      });
      
      return stats;
    },
    enabled: !!activeTenantId,
  });
}
