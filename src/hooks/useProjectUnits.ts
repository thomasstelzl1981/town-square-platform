/**
 * Hook for managing Project Units
 * MOD-13 PROJEKTE
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DevProjectUnit, CreateProjectUnitInput } from '@/types/projekte';

const QUERY_KEY = 'dev-project-units';

export function useProjectUnits(projectId: string | undefined) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = profile?.active_tenant_id;

  // Fetch units for project
  const { data: units = [], isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEY, projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('dev_project_units')
        .select('*')
        .eq('project_id', projectId)
        .order('unit_number');
      
      if (error) throw error;
      return data as DevProjectUnit[];
    },
    enabled: !!projectId,
  });

  // Unit statistics
  const stats = {
    total: units.length,
    available: units.filter(u => u.status === 'available').length,
    reserved: units.filter(u => u.status === 'reserved').length,
    sold: units.filter(u => u.status === 'sold').length,
    blocked: units.filter(u => u.status === 'blocked').length,
    totalArea: units.reduce((sum, u) => sum + (u.area_sqm || 0), 0),
    totalListPrice: units.reduce((sum, u) => sum + (u.list_price || 0), 0),
    avgPricePerSqm: units.length > 0 
      ? units.reduce((sum, u) => sum + (u.price_per_sqm || 0), 0) / units.length 
      : 0,
  };

  // Helper: seed DMS folders for a unit
  const seedUnitDMS = async (unit: DevProjectUnit) => {
    if (!tenantId || !projectId) return;
    
    try {
      // Find the "Einheiten" folder for this project
      const { data: einheitenFolder } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('dev_project_id', projectId)
        .eq('name', 'Einheiten')
        .eq('node_type', 'folder')
        .limit(1)
        .single();
      
      if (!einheitenFolder) return;
      
      // Create unit folder
      const { data: unitFolder } = await supabase
        .from('storage_nodes')
        .insert({
          name: `WE-${unit.unit_number}`,
          node_type: 'folder',
          parent_id: einheitenFolder.id,
          tenant_id: tenantId,
          dev_project_id: projectId,
          dev_project_unit_id: unit.id,
        })
        .select()
        .single();
      
      if (!unitFolder) return;
      
      // Create unit subfolders
      const subfolders = ['01_grundriss', '02_bilder', '03_verkaufsunterlagen', '04_vertraege_reservierung', '99_sonstiges'];
      await supabase.from('storage_nodes').insert(
        subfolders.map(name => ({
          name,
          node_type: 'folder' as const,
          parent_id: unitFolder.id,
          tenant_id: tenantId,
          dev_project_id: projectId,
          dev_project_unit_id: unit.id,
        }))
      );
    } catch (err) {
      console.warn('Unit-DMS-Seeding fehlgeschlagen für', unit.unit_number, err);
    }
  };

  // Create unit
  const createUnit = useMutation({
    mutationFn: async (input: CreateProjectUnitInput) => {
      if (!tenantId) throw new Error('No tenant selected');
      
      // Calculate price_per_sqm if we have both values
      const price_per_sqm = input.list_price && input.area_sqm && input.area_sqm > 0
        ? Math.round(input.list_price / input.area_sqm)
        : undefined;
      
      const { data, error } = await supabase
        .from('dev_project_units')
        .insert({
          ...input,
          tenant_id: tenantId,
          price_per_sqm,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as DevProjectUnit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
      toast.success('Einheit erstellt');
      // Seed DMS folders for the new unit
      seedUnitDMS(data);
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Erstellen: ' + error.message);
    },
  });

  // Bulk create units
  const createUnits = useMutation({
    mutationFn: async (inputs: CreateProjectUnitInput[]) => {
      if (!tenantId) throw new Error('No tenant selected');
      
      const unitsWithTenant = inputs.map(input => ({
        ...input,
        tenant_id: tenantId,
        price_per_sqm: input.list_price && input.area_sqm && input.area_sqm > 0
          ? Math.round(input.list_price / input.area_sqm)
          : null,
      }));
      
      const { data, error } = await supabase
        .from('dev_project_units')
        .insert(unitsWithTenant)
        .select();
      
      if (error) throw error;
      return data as DevProjectUnit[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
      toast.success(`${data.length} Einheiten erstellt`);
      // Seed DMS folders for each new unit
      data.forEach(unit => seedUnitDMS(unit));
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Erstellen: ' + error.message);
    },
  });

  // Update unit
  const updateUnit = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DevProjectUnit> & { id: string }) => {
      // Recalculate price_per_sqm if needed
      let price_per_sqm = updates.price_per_sqm;
      if (updates.list_price !== undefined || updates.area_sqm !== undefined) {
        const currentUnit = units.find(u => u.id === id);
        const listPrice = updates.list_price ?? currentUnit?.list_price;
        const areaSqm = updates.area_sqm ?? currentUnit?.area_sqm;
        if (listPrice && areaSqm && areaSqm > 0) {
          price_per_sqm = Math.round(listPrice / areaSqm);
        }
      }
      
      const { data, error } = await supabase
        .from('dev_project_units')
        .update({ ...updates, price_per_sqm })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as DevProjectUnit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
      toast.success('Einheit aktualisiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Aktualisieren: ' + error.message);
    },
  });

  // Delete unit
  const deleteUnit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dev_project_units')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
      toast.success('Einheit gelöscht');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Löschen: ' + error.message);
    },
  });

  return {
    units,
    stats,
    isLoading,
    error,
    refetch,
    createUnit,
    createUnits,
    updateUnit,
    deleteUnit,
  };
}
