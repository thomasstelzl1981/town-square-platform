/**
 * usePetStaff — CRUD hooks for pet_staff (Mitarbeiter)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PetStaff {
  id: string;
  provider_id: string;
  tenant_id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  services: string[];
  work_hours: Record<string, any>;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useProviderStaff(providerId?: string) {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pet_staff', providerId],
    queryFn: async () => {
      if (!activeTenantId || !providerId) return [];
      const { data, error } = await supabase
        .from('pet_staff')
        .select('*')
        .eq('provider_id', providerId)
        .eq('tenant_id', activeTenantId)
        .order('sort_order')
        .order('name');
      if (error) throw error;
      return (data || []) as PetStaff[];
    },
    enabled: !!activeTenantId && !!providerId,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  const { activeTenantId } = useAuth();
  return useMutation({
    mutationFn: async (data: Partial<PetStaff>) => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      const { error } = await supabase.from('pet_staff').insert({ ...data, tenant_id: activeTenantId } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_staff'] }); toast.success('Mitarbeiter erstellt'); },
    onError: () => toast.error('Fehler beim Erstellen'),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PetStaff> & { id: string }) => {
      const { error } = await supabase.from('pet_staff').update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_staff'] }); toast.success('Mitarbeiter aktualisiert'); },
    onError: () => toast.error('Fehler beim Speichern'),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pet_staff').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_staff'] }); toast.success('Mitarbeiter gelöscht'); },
    onError: () => toast.error('Fehler beim Löschen'),
  });
}

/* ── Vacation Hooks ── */

export interface PetStaffVacation {
  id: string;
  staff_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  vacation_type: string;
  notes: string | null;
  created_at: string;
}

export function useStaffVacations(staffId?: string) {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pet_staff_vacations', staffId],
    queryFn: async () => {
      if (!activeTenantId || !staffId) return [];
      const { data, error } = await supabase
        .from('pet_staff_vacations' as any)
        .select('*')
        .eq('staff_id', staffId)
        .eq('tenant_id', activeTenantId)
        .order('start_date');
      if (error) throw error;
      return (data || []) as unknown as PetStaffVacation[];
    },
    enabled: !!activeTenantId && !!staffId,
  });
}

/** Load ALL vacations for all staff of a provider in a date range */
export function useAllStaffVacations(providerId?: string, startDate?: string, endDate?: string) {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pet_staff_vacations_all', providerId, startDate, endDate],
    queryFn: async () => {
      if (!activeTenantId || !providerId) return [];
      // Get staff IDs for this provider
      const { data: staffList } = await supabase
        .from('pet_staff')
        .select('id')
        .eq('provider_id', providerId)
        .eq('tenant_id', activeTenantId);
      if (!staffList?.length) return [];
      const staffIds = staffList.map(s => s.id);
      let query = supabase
        .from('pet_staff_vacations' as any)
        .select('*')
        .in('staff_id', staffIds)
        .eq('tenant_id', activeTenantId);
      if (startDate) query = query.lte('start_date', endDate!);
      if (endDate) query = query.gte('end_date', startDate!);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as PetStaffVacation[];
    },
    enabled: !!activeTenantId && !!providerId && !!startDate && !!endDate,
  });
}

export function useCreateVacation() {
  const qc = useQueryClient();
  const { activeTenantId } = useAuth();
  return useMutation({
    mutationFn: async (data: Partial<PetStaffVacation>) => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      const { error } = await supabase.from('pet_staff_vacations' as any).insert({ ...data, tenant_id: activeTenantId } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_staff_vacations'] }); qc.invalidateQueries({ queryKey: ['pet_staff_vacations_all'] }); toast.success('Urlaub eingetragen'); },
    onError: () => toast.error('Fehler beim Erstellen'),
  });
}

export function useDeleteVacation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pet_staff_vacations' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_staff_vacations'] }); qc.invalidateQueries({ queryKey: ['pet_staff_vacations_all'] }); toast.success('Urlaub gelöscht'); },
    onError: () => toast.error('Fehler beim Löschen'),
  });
}
