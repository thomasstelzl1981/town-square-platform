/**
 * usePets — CRUD-Hook für Haustiere
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Pet {
  id: string;
  tenant_id: string;
  owner_user_id: string | null;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  chip_number: string | null;
  photo_url: string | null;
  allergies: string[];
  neutered: boolean;
  vet_name: string | null;
  insurance_provider: string | null;
  insurance_policy_no: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PetVaccination {
  id: string;
  pet_id: string;
  tenant_id: string;
  vaccination_type: string;
  vaccine_name: string | null;
  administered_at: string;
  next_due_at: string | null;
  vet_name: string | null;
  batch_number: string | null;
  document_node_id: string | null;
  notes: string | null;
  created_at: string;
}

export function usePets() {
  const { activeTenantId, user } = useAuth();

  return useQuery({
    queryKey: ['pets', activeTenantId, user?.id],
    queryFn: async () => {
      if (!activeTenantId || !user?.id) return [];
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('owner_user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Pet[];
    },
    enabled: !!activeTenantId && !!user?.id,
  });
}

export function usePet(petId: string | undefined) {
  const { activeTenantId } = useAuth();

  return useQuery({
    queryKey: ['pet', petId],
    queryFn: async () => {
      if (!petId || !activeTenantId) return null;
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .eq('tenant_id', activeTenantId)
        .single();
      if (error) throw error;
      return data as Pet;
    },
    enabled: !!petId && !!activeTenantId,
  });
}

export function usePetVaccinations(petId: string | undefined) {
  const { activeTenantId } = useAuth();

  return useQuery({
    queryKey: ['pet_vaccinations', petId],
    queryFn: async () => {
      if (!petId || !activeTenantId) return [];
      const { data, error } = await supabase
        .from('pet_vaccinations')
        .select('*')
        .eq('pet_id', petId)
        .eq('tenant_id', activeTenantId)
        .order('administered_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PetVaccination[];
    },
    enabled: !!petId && !!activeTenantId,
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();
  const { activeTenantId, user } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<Pet>) => {
      if (!activeTenantId) throw new Error('Kein aktiver Tenant');
      const { data: pet, error } = await supabase
        .from('pets')
        .insert({
          ...data,
          tenant_id: activeTenantId,
          owner_user_id: user?.id || null,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Create DMS folder structure for the pet
      const petRecord = pet as Pet;
      try {
        await createPetDMSFolders(activeTenantId, petRecord.id, petRecord.name);
      } catch (dmsErr) {
        console.warn('DMS folder creation failed (non-blocking):', dmsErr);
      }

      return petRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast.success('Tier angelegt');
    },
    onError: () => toast.error('Fehler beim Anlegen'),
  });
}

const PET_DMS_SUBFOLDERS = ['01_Impfpass', '02_Tierarzt', '03_Versicherung', '04_Fotos', '05_Sonstiges'];

async function createPetDMSFolders(tenantId: string, petId: string, petName: string) {
  // Find or create module root
  const { data: rootFolder } = await supabase
    .from('storage_nodes')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('module_code', 'MOD_05')
    .is('parent_id', null)
    .eq('node_type', 'folder')
    .maybeSingle();

  let rootId = rootFolder?.id;
  if (!rootId) {
    const { data: newRoot } = await supabase
      .from('storage_nodes')
      .insert({ tenant_id: tenantId, name: 'Haustiere', node_type: 'folder', module_code: 'MOD_05', auto_created: true } as any)
      .select('id')
      .single();
    rootId = newRoot?.id;
  }

  // Create pet folder
  const { data: petFolder } = await supabase
    .from('storage_nodes')
    .insert({
      tenant_id: tenantId, name: petName, node_type: 'folder', module_code: 'MOD_05',
      entity_type: 'pet', entity_id: petId, parent_id: rootId, auto_created: true,
    } as any)
    .select('id')
    .single();

  if (!petFolder?.id) return;

  // Create sub-folders
  await supabase.from('storage_nodes').insert(
    PET_DMS_SUBFOLDERS.map(name => ({
      tenant_id: tenantId, name, node_type: 'folder', module_code: 'MOD_05',
      entity_type: 'pet', entity_id: petId, parent_id: petFolder.id, auto_created: true,
    })) as any
  );
}

export function useUpdatePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Pet> & { id: string }) => {
      const { error } = await supabase
        .from('pets')
        .update(data as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      queryClient.invalidateQueries({ queryKey: ['pet', vars.id] });
      toast.success('Tier aktualisiert');
    },
    onError: () => toast.error('Fehler beim Speichern'),
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast.success('Tier gelöscht');
    },
    onError: () => toast.error('Fehler beim Löschen'),
  });
}
