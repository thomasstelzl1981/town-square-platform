/**
 * Hook for managing Project Reservations
 * MOD-13 PROJEKTE
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DevProjectReservation, CreateReservationInput, ReservationStatus } from '@/types/projekte';

const QUERY_KEY = 'dev-project-reservations';

export function useProjectReservations(projectId: string | undefined) {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = profile?.active_tenant_id;

  // Fetch reservations for project
  const { data: reservations = [], isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEY, projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('dev_project_reservations')
        .select(`
          *,
          unit:dev_project_units(*),
          buyer_contact:contacts(id, first_name, last_name, email),
          partner_org:organizations!dev_project_reservations_partner_org_id_fkey(id, name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as DevProjectReservation[];
    },
    enabled: !!projectId,
  });

  // Statistics
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

  // Create reservation
  const createReservation = useMutation({
    mutationFn: async (input: CreateReservationInput) => {
      if (!tenantId) throw new Error('No tenant selected');
      
      const { data, error } = await supabase
        .from('dev_project_reservations')
        .insert({
          ...input,
          tenant_id: tenantId,
          created_by: user?.id,
          reservation_date: new Date().toISOString(),
        })
        .select(`
          *,
          unit:dev_project_units(*),
          buyer_contact:contacts(id, first_name, last_name, email),
          partner_org:organizations!dev_project_reservations_partner_org_id_fkey(id, name)
        `)
        .single();
      
      if (error) throw error;
      return data as unknown as DevProjectReservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-project-units', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
      toast.success('Reservierung erstellt');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Erstellen: ' + error.message);
    },
  });

  // Update reservation status
  const updateStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      additionalFields 
    }: { 
      id: string; 
      status: ReservationStatus;
      additionalFields?: Partial<DevProjectReservation>;
    }) => {
      const updates: Partial<DevProjectReservation> = {
        status,
        ...additionalFields,
      };
      
      // Set appropriate date fields based on status
      const now = new Date().toISOString();
      if (status === 'confirmed') updates.confirmation_date = now;
      if (status === 'completed') updates.completion_date = now;
      if (status === 'cancelled') updates.cancellation_date = now;
      
      const { data, error } = await supabase
        .from('dev_project_reservations')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          unit:dev_project_units(*),
          buyer_contact:contacts(id, first_name, last_name, email),
          partner_org:organizations!dev_project_reservations_partner_org_id_fkey(id, name)
        `)
        .single();
      
      if (error) throw error;
      return data as unknown as DevProjectReservation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-project-units', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
      
      const statusLabels: Record<ReservationStatus, string> = {
        pending: 'Ausstehend',
        confirmed: 'Bestätigt',
        notary_scheduled: 'Notartermin vereinbart',
        completed: 'Abgeschlossen',
        cancelled: 'Storniert',
        expired: 'Abgelaufen',
      };
      toast.success(`Status geändert: ${statusLabels[data.status]}`);
    },
    onError: (error: Error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  // Update reservation
  const updateReservation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DevProjectReservation> & { id: string }) => {
      const { data, error } = await supabase
        .from('dev_project_reservations')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          unit:dev_project_units(*),
          buyer_contact:contacts(id, first_name, last_name, email),
          partner_org:organizations!dev_project_reservations_partner_org_id_fkey(id, name)
        `)
        .single();
      
      if (error) throw error;
      return data as unknown as DevProjectReservation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, projectId] });
      toast.success('Reservierung aktualisiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  // Delete reservation
  const deleteReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dev_project_reservations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-project-units', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
      toast.success('Reservierung gelöscht');
    },
    onError: (error: Error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  // Get reservation by unit
  const getReservationByUnit = (unitId: string) => {
    return reservations.find(r => 
      r.unit_id === unitId && 
      !['cancelled', 'expired'].includes(r.status)
    );
  };

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
