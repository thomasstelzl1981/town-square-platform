/**
 * Hook for unified Sales Reservations
 * Replaces both `reservations` (MOD-04) and `dev_project_reservations` (MOD-13)
 * with the unified `sales_reservations` table.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const SALES_RESERVATIONS_KEY = 'sales-reservations';

export type SalesReservationStatus = 'pending' | 'confirmed' | 'notary_scheduled' | 'completed' | 'cancelled' | 'expired';

export interface SalesReservation {
  id: string;
  case_id: string | null;
  listing_id: string | null;
  project_id: string | null;
  unit_id: string | null;
  inquiry_id: string | null;
  buyer_contact_id: string | null;
  partner_org_id: string | null;
  partner_user_id: string | null;
  reserved_price: number | null;
  commission_amount: number | null;
  commission_rate: number | null;
  reservation_date: string | null;
  expiry_date: string | null;
  notary_date: string | null;
  confirmation_date: string | null;
  completion_date: string | null;
  cancellation_date: string | null;
  owner_confirmed_at: string | null;
  buyer_confirmed_at: string | null;
  status: string;
  cancellation_reason: string | null;
  notes: string | null;
  created_by: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  // Joined
  buyer_contact?: { id: string; first_name: string; last_name: string; email?: string } | null;
  partner_org?: { id: string; name: string } | null;
  unit?: Record<string, unknown> | null;
}

export interface CreateSalesReservationInput {
  case_id?: string;
  listing_id?: string;
  project_id?: string;
  unit_id?: string;
  inquiry_id?: string;
  buyer_contact_id?: string;
  partner_org_id?: string;
  partner_user_id?: string;
  reserved_price?: number;
  commission_amount?: number;
  commission_rate?: number;
  expiry_date?: string;
  notary_date?: string;
  notes?: string;
  status?: string;
}

/**
 * Unified hook for sales reservations.
 * Optionally filter by project_id (MOD-13) or listing_id (MOD-04/06).
 */
export function useSalesReservations(options?: {
  projectId?: string;
  listingId?: string;
  caseId?: string;
}) {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = profile?.active_tenant_id;

  const queryKey = [SALES_RESERVATIONS_KEY, options?.projectId, options?.listingId, options?.caseId];

  const { data: reservations = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('sales_reservations')
        .select(`
          *,
          buyer_contact:contacts!sales_reservations_buyer_contact_id_fkey(id, first_name, last_name, email),
          partner_org:organizations!sales_reservations_partner_org_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

      if (options?.projectId) query = query.eq('project_id', options.projectId);
      if (options?.listingId) query = query.eq('listing_id', options.listingId);
      if (options?.caseId) query = query.eq('case_id', options.caseId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as SalesReservation[];
    },
    enabled: !!tenantId,
  });

  // Stats
  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    notaryScheduled: reservations.filter(r => r.status === 'notary_scheduled').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
    expired: reservations.filter(r => r.status === 'expired').length,
    totalReservedValue: reservations
      .filter(r => !['cancelled', 'expired'].includes(r.status))
      .reduce((sum, r) => sum + (r.reserved_price || 0), 0),
    totalCommission: reservations
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.commission_amount || 0), 0),
  };

  const createReservation = useMutation({
    mutationFn: async (input: CreateSalesReservationInput) => {
      if (!tenantId) throw new Error('No tenant selected');
      const { data, error } = await supabase
        .from('sales_reservations')
        .insert({
          ...input,
          tenant_id: tenantId,
          created_by: user?.id,
          reservation_date: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SalesReservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_RESERVATIONS_KEY] });
      toast.success('Reservierung erstellt');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Erstellen: ' + error.message);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      additionalFields,
    }: {
      id: string;
      status: SalesReservationStatus;
      additionalFields?: Partial<SalesReservation>;
    }) => {
      const updates: Record<string, unknown> = { status, ...additionalFields };
      const now = new Date().toISOString();
      if (status === 'confirmed') updates.confirmation_date = now;
      if (status === 'completed') updates.completion_date = now;
      if (status === 'cancelled') updates.cancellation_date = now;

      const { data, error } = await supabase
        .from('sales_reservations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SalesReservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_RESERVATIONS_KEY] });
      toast.success('Status aktualisiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  const updateReservation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SalesReservation> & { id: string }) => {
      const { data, error } = await supabase
        .from('sales_reservations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as SalesReservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_RESERVATIONS_KEY] });
      toast.success('Reservierung aktualisiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  const deleteReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sales_reservations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_RESERVATIONS_KEY] });
      toast.success('Reservierung gelöscht');
    },
    onError: (error: Error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  const getReservationByUnit = (unitId: string) =>
    reservations.find(r => r.unit_id === unitId && !['cancelled', 'expired'].includes(r.status));

  return {
    reservations,
    stats,
    isLoading,
    error,
    refetch,
    createReservation,
    updateStatus,
    updateReservation,
    deleteReservation,
    getReservationByUnit,
  };
}
