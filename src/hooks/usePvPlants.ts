/**
 * Hook for PV Plants CRUD operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const QUERY_KEY = 'pv-plants';

export interface PvPlant {
  id: string;
  name: string;
  status: string;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  location_notes: string | null;
  kwp: number | null;
  commissioning_date: string | null;
  wr_manufacturer: string | null;
  wr_model: string | null;
  has_battery: boolean;
  battery_kwh: number | null;
  mastr_account_present: boolean;
  mastr_plant_id: string | null;
  mastr_unit_id: string | null;
  mastr_status: string | null;
  grid_operator: string | null;
  energy_supplier: string | null;
  customer_reference: string | null;
  feed_in_meter_no: string | null;
  feed_in_meter_operator: string | null;
  feed_in_start_reading: number | null;
  consumption_meter_no: string | null;
  consumption_meter_operator: string | null;
  consumption_start_reading: number | null;
  provider: string;
  last_sync_at: string | null;
  data_quality: string | null;
  dms_root_node_id: string | null;
  tenant_id: string;
  owner_user_id: string | null;
  owner_org_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePvPlantInput {
  name: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
  kwp?: number;
  commissioning_date?: string;
  provider?: string;
  wr_manufacturer?: string;
  wr_model?: string;
}

export function usePvPlants() {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;
  const queryClient = useQueryClient();

  const { data: plants = [], isLoading, error } = useQuery({
    queryKey: [QUERY_KEY, tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('pv_plants')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PvPlant[];
    },
    enabled: !!tenantId,
  });

  const createPlant = useMutation({
    mutationFn: async (input: CreatePvPlantInput) => {
      if (!tenantId || !profile?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('pv_plants')
        .insert({
          ...input,
          tenant_id: tenantId,
          owner_user_id: profile.id,
          provider: input.provider || 'demo',
        })
        .select()
        .single();
      if (error) throw error;
      return data as PvPlant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('PV-Anlage angelegt');
    },
    onError: (err: Error) => {
      toast.error('Fehler: ' + err.message);
    },
  });

  const updatePlant = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PvPlant> & { id: string }) => {
      const { data, error } = await supabase
        .from('pv_plants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PvPlant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Gespeichert');
    },
    onError: (err: Error) => {
      toast.error('Fehler: ' + err.message);
    },
  });

  const deletePlant = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pv_plants')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Anlage gelöscht');
    },
    onError: (err: Error) => {
      toast.error('Fehler: ' + err.message);
    },
  });

  return { plants, isLoading, error, createPlant, updatePlant, deletePlant, tenantId };
}

export function usePvPlant(plantId: string | undefined) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;

  return useQuery({
    queryKey: [QUERY_KEY, 'detail', plantId],
    queryFn: async () => {
      if (!plantId || !tenantId) return null;
      const { data, error } = await supabase
        .from('pv_plants')
        .select('*')
        .eq('id', plantId)
        .single();
      if (error) throw error;
      return data as PvPlant;
    },
    enabled: !!plantId && !!tenantId,
  });
}
