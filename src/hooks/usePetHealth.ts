/**
 * usePetHealth — CRUD hooks for vaccinations & medical records
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PetMedicalRecord {
  id: string;
  pet_id: string;
  tenant_id: string;
  record_type: string;
  title: string;
  description: string | null;
  record_date: string;
  vet_name: string | null;
  diagnosis: string | null;
  treatment: string | null;
  medication: string | null;
  cost_amount: number | null;
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function usePetMedicalRecords(petId: string | undefined) {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pet_medical_records', petId],
    queryFn: async () => {
      if (!petId || !activeTenantId) return [];
      const { data, error } = await supabase
        .from('pet_medical_records' as any)
        .select('*')
        .eq('pet_id', petId)
        .eq('tenant_id', activeTenantId)
        .order('record_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PetMedicalRecord[];
    },
    enabled: !!petId && !!activeTenantId,
  });
}

export function useCreateVaccination() {
  const qc = useQueryClient();
  const { activeTenantId } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      pet_id: string;
      vaccination_type: string;
      vaccine_name?: string;
      administered_at: string;
      next_due_at?: string;
      vet_name?: string;
      batch_number?: string;
      notes?: string;
    }) => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      const { error } = await supabase
        .from('pet_vaccinations')
        .insert({ ...data, tenant_id: activeTenantId } as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['pet_vaccinations', vars.pet_id] });
      toast.success('Impfung erfasst');
    },
    onError: () => toast.error('Fehler beim Speichern'),
  });
}

export function useDeleteVaccination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, petId }: { id: string; petId: string }) => {
      const { error } = await supabase.from('pet_vaccinations').delete().eq('id', id);
      if (error) throw error;
      return petId;
    },
    onSuccess: (petId) => {
      qc.invalidateQueries({ queryKey: ['pet_vaccinations', petId] });
      toast.success('Impfung gelöscht');
    },
    onError: () => toast.error('Fehler beim Löschen'),
  });
}

export function useCreateMedicalRecord() {
  const qc = useQueryClient();
  const { activeTenantId } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      pet_id: string;
      record_type: string;
      title: string;
      record_date: string;
      description?: string;
      vet_name?: string;
      diagnosis?: string;
      treatment?: string;
      medication?: string;
      cost_amount?: number;
      follow_up_date?: string;
      notes?: string;
    }) => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      const { error } = await supabase
        .from('pet_medical_records' as any)
        .insert({ ...data, tenant_id: activeTenantId });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['pet_medical_records', vars.pet_id] });
      toast.success('Eintrag erfasst');
    },
    onError: () => toast.error('Fehler beim Speichern'),
  });
}

export function useDeleteMedicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, petId }: { id: string; petId: string }) => {
      const { error } = await supabase.from('pet_medical_records' as any).delete().eq('id', id);
      if (error) throw error;
      return petId;
    },
    onSuccess: (petId) => {
      qc.invalidateQueries({ queryKey: ['pet_medical_records', petId] });
      toast.success('Eintrag gelöscht');
    },
    onError: () => toast.error('Fehler beim Löschen'),
  });
}
