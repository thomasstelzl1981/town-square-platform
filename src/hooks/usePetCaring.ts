/**
 * usePetCaring — Hooks for pet caring events CRUD
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PetCaringEvent {
  id: string;
  tenant_id: string;
  pet_id: string;
  event_type: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  completed_at: string | null;
  is_completed: boolean;
  recurring_interval_days: number | null;
  reminder_enabled: boolean;
  reminder_minutes_before: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  pet?: { name: string; species: string };
}

export const CARING_EVENT_TYPES: Record<string, { label: string; emoji: string }> = {
  feeding: { label: 'Fütterung', emoji: '🍖' },
  walking: { label: 'Spaziergang', emoji: '🚶' },
  grooming: { label: 'Pflege', emoji: '✂️' },
  medication: { label: 'Medikament', emoji: '💊' },
  vet_appointment: { label: 'Tierarzt', emoji: '🏥' },
  vaccination: { label: 'Impfung', emoji: '💉' },
  deworming: { label: 'Entwurmung', emoji: '🐛' },
  flea_treatment: { label: 'Flohschutz', emoji: '🛡️' },
  training: { label: 'Training', emoji: '🎓' },
  weight_check: { label: 'Gewichtskontrolle', emoji: '⚖️' },
  other: { label: 'Sonstiges', emoji: '📋' },
};

export function useCaringEvents(filters?: { petId?: string; upcoming?: boolean; overdue?: boolean }) {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pet_caring_events', activeTenantId, filters],
    queryFn: async () => {
      if (!activeTenantId) return [];
      let q = supabase
        .from('pet_caring_events')
        .select('*, pets!inner(name, species)')
        .eq('tenant_id', activeTenantId)
        .order('scheduled_at', { ascending: true });

      if (filters?.petId) q = q.eq('pet_id', filters.petId);
      if (filters?.overdue) {
        q = q.eq('is_completed', false).lt('scheduled_at', new Date().toISOString());
      }
      if (filters?.upcoming) {
        q = q.eq('is_completed', false).gte('scheduled_at', new Date().toISOString());
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((e: any) => ({ ...e, pet: e.pets })) as PetCaringEvent[];
    },
    enabled: !!activeTenantId,
  });
}

export function useCreateCaringEvent() {
  const qc = useQueryClient();
  const { activeTenantId, user } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      pet_id: string;
      event_type: string;
      title: string;
      description?: string;
      scheduled_at: string;
      recurring_interval_days?: number;
      reminder_enabled?: boolean;
    }) => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      const { error } = await supabase.from('pet_caring_events').insert({
        ...data,
        tenant_id: activeTenantId,
        created_by: user?.id || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pet_caring_events'] });
      toast.success('Pflege-Event erstellt');
    },
    onError: () => toast.error('Fehler beim Erstellen'),
  });
}

export function useCompleteCaringEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pet_caring_events')
        .update({ is_completed: true, completed_at: new Date().toISOString() } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pet_caring_events'] });
      toast.success('Als erledigt markiert');
    },
    onError: () => toast.error('Fehler beim Aktualisieren'),
  });
}

export function useDeleteCaringEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pet_caring_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pet_caring_events'] });
      toast.success('Event gelöscht');
    },
    onError: () => toast.error('Fehler beim Löschen'),
  });
}
