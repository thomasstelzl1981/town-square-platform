/**
 * usePetRooms — CRUD hooks for pet_rooms and pet_room_assignments
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PetRoom {
  id: string;
  provider_id: string;
  tenant_id: string;
  name: string;
  room_type: string;
  capacity: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PetRoomAssignment {
  id: string;
  room_id: string;
  booking_id: string;
  pet_id: string;
  tenant_id: string;
  check_in_at: string | null;
  check_out_at: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  pet?: { name: string; species: string; breed: string | null };
  booking?: { scheduled_date: string; scheduled_time_start: string | null; status: string };
}

// ─── Rooms ──────────────────────────────────────────────
export function useProviderRooms(providerId?: string) {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pet_rooms', providerId],
    queryFn: async () => {
      if (!activeTenantId || !providerId) return [];
      const { data, error } = await supabase
        .from('pet_rooms')
        .select('*')
        .eq('provider_id', providerId)
        .eq('tenant_id', activeTenantId)
        .order('sort_order')
        .order('name');
      if (error) throw error;
      return (data || []) as PetRoom[];
    },
    enabled: !!activeTenantId && !!providerId,
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  const { activeTenantId } = useAuth();
  return useMutation({
    mutationFn: async (data: Partial<PetRoom>) => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      const { error } = await supabase.from('pet_rooms').insert({ ...data, tenant_id: activeTenantId } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_rooms'] }); toast.success('Raum erstellt'); },
    onError: () => toast.error('Fehler beim Erstellen'),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PetRoom> & { id: string }) => {
      const { error } = await supabase.from('pet_rooms').update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_rooms'] }); toast.success('Raum aktualisiert'); },
    onError: () => toast.error('Fehler beim Speichern'),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pet_rooms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_rooms'] }); toast.success('Raum gelöscht'); },
    onError: () => toast.error('Fehler beim Löschen'),
  });
}

// ─── Room Assignments ───────────────────────────────────
export function useRoomAssignments(providerId?: string) {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pet_room_assignments', providerId],
    queryFn: async () => {
      if (!activeTenantId || !providerId) return [];
      // Get rooms first, then assignments for those rooms
      const { data: rooms } = await supabase
        .from('pet_rooms')
        .select('id')
        .eq('provider_id', providerId)
        .eq('tenant_id', activeTenantId);
      if (!rooms?.length) return [];
      const roomIds = rooms.map(r => r.id);
      const { data, error } = await supabase
        .from('pet_room_assignments')
        .select('*, pets!inner(name, species, breed), pet_bookings!inner(scheduled_date, scheduled_time_start, status)')
        .in('room_id', roomIds)
        .eq('tenant_id', activeTenantId)
        .is('check_out_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        ...a,
        pet: a.pets,
        booking: a.pet_bookings,
      })) as PetRoomAssignment[];
    },
    enabled: !!activeTenantId && !!providerId,
  });
}

export function useAssignPetToRoom() {
  const qc = useQueryClient();
  const { activeTenantId } = useAuth();
  return useMutation({
    mutationFn: async (data: { room_id: string; booking_id: string; pet_id: string }) => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      const { error } = await supabase.from('pet_room_assignments').insert({
        ...data,
        tenant_id: activeTenantId,
        check_in_at: new Date().toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_room_assignments'] }); toast.success('Tier zugewiesen'); },
    onError: () => toast.error('Fehler bei Zuordnung'),
  });
}

export function useCheckOutFromRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('pet_room_assignments')
        .update({ check_out_at: new Date().toISOString() } as any)
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_room_assignments'] }); toast.success('Tier ausgecheckt'); },
    onError: () => toast.error('Fehler beim Check-Out'),
  });
}

// ─── Pension Calendar Assignments ───────────────────────────
export interface PensionCalendarAssignment {
  id: string;
  room_id: string;
  pet_id: string;
  booking_id: string | null;
  tenant_id: string;
  check_in_at: string;
  check_out_at: string | null;
  notes: string | null;
  created_at: string;
  pet?: { name: string; species: string; breed: string | null };
}

export function usePensionCalendarAssignments(providerId?: string, startDate?: string, endDate?: string) {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pension_calendar_assignments', providerId, startDate, endDate],
    queryFn: async () => {
      if (!activeTenantId || !providerId) return [];
      const { data: rooms } = await supabase
        .from('pet_rooms')
        .select('id')
        .eq('provider_id', providerId)
        .eq('tenant_id', activeTenantId);
      if (!rooms?.length) return [];
      const roomIds = rooms.map(r => r.id);
      let query = supabase
        .from('pet_room_assignments')
        .select('*, pets!inner(name, species, breed)')
        .in('room_id', roomIds)
        .eq('tenant_id', activeTenantId)
        .order('check_in_at', { ascending: true });
      // Filter: assignments overlapping with [startDate, endDate]
      if (startDate) {
        query = query.or(`check_out_at.gte.${startDate},check_out_at.is.null`);
      }
      if (endDate) {
        query = query.lte('check_in_at', endDate);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((a: any) => ({
        ...a,
        pet: a.pets,
      })) as PensionCalendarAssignment[];
    },
    enabled: !!activeTenantId && !!providerId && !!startDate && !!endDate,
  });
}

export function useCreatePensionAssignment() {
  const qc = useQueryClient();
  const { activeTenantId } = useAuth();
  return useMutation({
    mutationFn: async (data: { room_id: string; pet_id: string; check_in_at: string; check_out_at: string; notes?: string }) => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      const { error } = await supabase.from('pet_room_assignments').insert({
        room_id: data.room_id,
        pet_id: data.pet_id,
        tenant_id: activeTenantId,
        check_in_at: data.check_in_at,
        check_out_at: data.check_out_at,
        notes: data.notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pension_calendar_assignments'] }); qc.invalidateQueries({ queryKey: ['pet_room_assignments'] }); toast.success('Buchung erstellt'); },
    onError: () => toast.error('Fehler beim Erstellen der Buchung'),
  });
}

export function useUpdatePensionAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; room_id?: string; pet_id?: string; check_in_at?: string; check_out_at?: string; notes?: string }) => {
      const { error } = await supabase.from('pet_room_assignments').update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pension_calendar_assignments'] }); qc.invalidateQueries({ queryKey: ['pet_room_assignments'] }); toast.success('Buchung aktualisiert'); },
    onError: () => toast.error('Fehler beim Speichern'),
  });
}

export function useDeletePensionAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pet_room_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pension_calendar_assignments'] }); qc.invalidateQueries({ queryKey: ['pet_room_assignments'] }); toast.success('Buchung gelöscht'); },
    onError: () => toast.error('Fehler beim Löschen'),
  });
}
