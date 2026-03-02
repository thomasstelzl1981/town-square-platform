/**
 * Hook: Tenancy Applicant Management (Vermietung/Bewerbermanagement)
 * Manages rental applicants for vacant units
 * Uses applicant_profiles table with profile_type='rental_applicant'
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ApplicantStatus = 'new' | 'screening' | 'shortlisted' | 'viewing_scheduled' | 'viewing_done' | 'approved' | 'rejected' | 'withdrawn';

export const APPLICANT_STATUS_LABELS: Record<ApplicantStatus, string> = {
  new: 'Neu',
  screening: 'In Prüfung',
  shortlisted: 'Vorauswahl',
  viewing_scheduled: 'Besichtigung geplant',
  viewing_done: 'Besichtigung erfolgt',
  approved: 'Zugesagt',
  rejected: 'Abgesagt',
  withdrawn: 'Zurückgezogen',
};

export const APPLICANT_STATUS_ORDER: ApplicantStatus[] = [
  'new', 'screening', 'shortlisted', 'viewing_scheduled', 'viewing_done', 'approved', 'rejected', 'withdrawn'
];

export interface RentalApplicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: ApplicantStatus;
  netIncome: number | null;
  householdSize: number | null;
  desiredMoveIn: string | null;
  notes: string | null;
  createdAt: string;
  viewingDate: string | null;
}

export function useTenancyApplicants(unitId?: string) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tenancy-applicants', tenantId, unitId],
    queryFn: async () => {
      if (!tenantId) return [];
      let q = supabase
        .from('applicant_profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('profile_type', 'rental_applicant')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      // Note: unitId filtering would need a dedicated column or metadata
      const { data, error } = await q;
      if (error) throw error;
      
      return (data || []).map(d => ({
        id: d.id,
        firstName: d.first_name || '',
        lastName: d.last_name || '',
        email: d.email,
        phone: d.phone,
        status: (d.purpose as ApplicantStatus) || 'new',
        netIncome: d.net_income_monthly,
        householdSize: d.adults_count,
        desiredMoveIn: d.address_since,
        notes: d.other_income_description,
        createdAt: d.created_at,
        viewingDate: d.probation_until,
      })) as RentalApplicant[];
    },
    enabled: !!tenantId,
  });

  const createApplicant = useMutation({
    mutationFn: async (input: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      netIncome?: number;
      householdSize?: number;
      desiredMoveIn?: string;
      notes?: string;
    }) => {
      if (!tenantId) throw new Error('No tenant');
      const { data, error } = await supabase
        .from('applicant_profiles')
        .insert({
          tenant_id: tenantId,
          profile_type: 'rental_applicant',
          party_role: 'primary',
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email || null,
          phone: input.phone || null,
          net_income_monthly: input.netIncome || null,
          adults_count: input.householdSize || null,
          address_since: input.desiredMoveIn || null,
          other_income_description: input.notes || null,
          purpose: 'new',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancy-applicants'] });
      toast.success('Bewerber angelegt');
    },
    onError: (e) => toast.error(`Fehler: ${e.message}`),
  });

  const updateApplicantStatus = useMutation({
    mutationFn: async ({ id, status, viewingDate }: { id: string; status: ApplicantStatus; viewingDate?: string }) => {
      const updates: Record<string, unknown> = {
        purpose: status,
        updated_at: new Date().toISOString(),
      };
      if (viewingDate) updates.probation_until = viewingDate;
      const { error } = await supabase
        .from('applicant_profiles')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancy-applicants'] });
      toast.success('Status aktualisiert');
    },
  });

  const scheduleViewing = useMutation({
    mutationFn: async ({ applicantId, date, notes }: { applicantId: string; date: string; notes?: string }) => {
      // Update applicant status
      await supabase
        .from('applicant_profiles')
        .update({ 
          purpose: 'viewing_scheduled',
          probation_until: date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicantId);
      
      // TODO: Create calendar event in KalenderTab when calendar integration is available
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenancy-applicants'] });
      toast.success('Besichtigung geplant');
    },
  });

  // Stats
  const stats = {
    total: query.data?.length || 0,
    new: query.data?.filter(a => a.status === 'new').length || 0,
    screening: query.data?.filter(a => a.status === 'screening').length || 0,
    shortlisted: query.data?.filter(a => a.status === 'shortlisted').length || 0,
    viewingsScheduled: query.data?.filter(a => a.status === 'viewing_scheduled').length || 0,
    approved: query.data?.filter(a => a.status === 'approved').length || 0,
  };

  return {
    applicants: query.data || [],
    stats,
    isLoading: query.isLoading,
    createApplicant,
    updateApplicantStatus,
    scheduleViewing,
    statusLabels: APPLICANT_STATUS_LABELS,
    statusOrder: APPLICANT_STATUS_ORDER,
  };
}
