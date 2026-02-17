/**
 * usePetBookings — Hooks for booking CRUD and provider services/availability
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────
export interface PetService {
  id: string;
  provider_id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  category: string;
  duration_minutes: number;
  price_cents: number;
  price_type: string;
  species_allowed: string[];
  is_active: boolean;
  created_at: string;
  provider?: PetProvider;
}

export interface PetProvider {
  id: string;
  tenant_id: string;
  user_id: string | null;
  company_name: string;
  provider_type: string;
  status: string;
  verified_at: string | null;
  rating_avg: number;
  bio: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  operating_hours: any;
  created_at: string;
}

export interface PetBooking {
  id: string;
  tenant_id: string;
  pet_id: string;
  service_id: string;
  provider_id: string;
  client_user_id: string | null;
  status: string;
  scheduled_date: string;
  scheduled_time_start: string | null;
  scheduled_time_end: string | null;
  duration_minutes: number | null;
  price_cents: number;
  client_notes: string | null;
  provider_notes: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  completed_at: string | null;
  created_at: string;
  // Joined
  pet?: { name: string; species: string; breed: string | null };
  service?: { title: string; category: string };
  provider?: { company_name: string };
}

export interface ProviderAvailability {
  id: string;
  provider_id: string;
  tenant_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_bookings: number;
  is_active: boolean;
}

// ─── Provider Services ──────────────────────────────────────
export function useProviderServices(providerId?: string) {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pet_services', providerId],
    queryFn: async () => {
      if (!activeTenantId || !providerId) return [];
      const { data, error } = await supabase
        .from('pet_services')
        .select('*')
        .eq('provider_id', providerId)
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PetService[];
    },
    enabled: !!activeTenantId && !!providerId,
  });
}

export function useAllActiveServices() {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pet_services_all', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('pet_services')
        .select('*, pet_providers!inner(id, company_name, status)')
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true)
        .eq('pet_providers.status', 'active' as any)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((s: any) => ({ ...s, provider: s.pet_providers })) as PetService[];
    },
    enabled: !!activeTenantId,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  const { activeTenantId } = useAuth();
  return useMutation({
    mutationFn: async (data: Partial<PetService>) => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      const { error } = await supabase.from('pet_services').insert({ ...data, tenant_id: activeTenantId } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_services'] }); toast.success('Service erstellt'); },
    onError: () => toast.error('Fehler beim Erstellen'),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PetService> & { id: string }) => {
      const { error } = await supabase.from('pet_services').update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_services'] }); toast.success('Service aktualisiert'); },
    onError: () => toast.error('Fehler beim Speichern'),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pet_services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_services'] }); toast.success('Service gelöscht'); },
    onError: () => toast.error('Fehler beim Löschen'),
  });
}

// ─── Provider (own) ─────────────────────────────────────────
export function useMyProvider() {
  const { activeTenantId, user } = useAuth();
  return useQuery({
    queryKey: ['my_pet_provider', activeTenantId, user?.id],
    queryFn: async () => {
      if (!activeTenantId || !user?.id) return null;
      // 1. Try direct user_id match
      const { data: directMatch } = await supabase
        .from('pet_providers')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (directMatch) return directMatch as PetProvider;
      // 2. Fallback: first active provider of this tenant
      const { data: tenantProvider } = await supabase
        .from('pet_providers')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      return (tenantProvider as PetProvider) || null;
    },
    enabled: !!activeTenantId && !!user?.id,
  });
}

// ─── Availability ───────────────────────────────────────────
export function useProviderAvailability(providerId?: string) {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pet_availability', providerId],
    queryFn: async () => {
      if (!activeTenantId || !providerId) return [];
      const { data, error } = await supabase
        .from('pet_provider_availability')
        .select('*')
        .eq('provider_id', providerId)
        .eq('tenant_id', activeTenantId)
        .order('day_of_week');
      if (error) throw error;
      return (data || []) as ProviderAvailability[];
    },
    enabled: !!activeTenantId && !!providerId,
  });
}

export function useSaveAvailability() {
  const qc = useQueryClient();
  const { activeTenantId } = useAuth();
  return useMutation({
    mutationFn: async ({ providerId, slots }: { providerId: string; slots: Omit<ProviderAvailability, 'id' | 'provider_id' | 'tenant_id'>[] }) => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      // Delete existing, re-insert
      await supabase.from('pet_provider_availability').delete().eq('provider_id', providerId).eq('tenant_id', activeTenantId);
      if (slots.length > 0) {
        const { error } = await supabase.from('pet_provider_availability').insert(
          slots.map(s => ({ ...s, provider_id: providerId, tenant_id: activeTenantId })) as any
        );
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_availability'] }); toast.success('Verfügbarkeit gespeichert'); },
    onError: () => toast.error('Fehler beim Speichern'),
  });
}

// ─── Bookings ───────────────────────────────────────────────
export function useBookings(filters?: { providerId?: string; clientUserId?: string; status?: string[] }) {
  const { activeTenantId } = useAuth();
  return useQuery({
    queryKey: ['pet_bookings', activeTenantId, filters],
    queryFn: async () => {
      if (!activeTenantId) return [];
      let q = supabase
        .from('pet_bookings')
        .select('*, pets!inner(name, species, breed), pet_services!inner(title, category), pet_providers!inner(company_name)')
        .eq('tenant_id', activeTenantId)
        .order('scheduled_date', { ascending: false });
      if (filters?.providerId) q = q.eq('provider_id', filters.providerId);
      if (filters?.clientUserId) q = q.eq('client_user_id', filters.clientUserId);
      if (filters?.status?.length) q = q.in('status', filters.status as any);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((b: any) => ({
        ...b,
        pet: b.pets,
        service: b.pet_services,
        provider: b.pet_providers,
      })) as PetBooking[];
    },
    enabled: !!activeTenantId,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  const { activeTenantId, user } = useAuth();
  return useMutation({
    mutationFn: async (data: { pet_id: string; service_id: string; provider_id: string; scheduled_date: string; scheduled_time_start?: string; duration_minutes?: number; price_cents?: number; client_notes?: string }) => {
      if (!activeTenantId) throw new Error('Kein Tenant');
      const { error } = await supabase.from('pet_bookings').insert({
        ...data,
        tenant_id: activeTenantId,
        client_user_id: user?.id || null,
        status: 'requested',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_bookings'] }); toast.success('Buchung angefragt'); },
    onError: () => toast.error('Fehler bei der Buchung'),
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updates: any = { status };
      if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      if (notes) updates.provider_notes = notes;
      const { error } = await supabase.from('pet_bookings').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pet_bookings'] }); toast.success('Status aktualisiert'); },
    onError: () => toast.error('Fehler beim Aktualisieren'),
  });
}
