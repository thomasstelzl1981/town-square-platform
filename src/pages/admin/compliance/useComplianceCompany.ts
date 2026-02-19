/**
 * Hook: CRUD for compliance_company_profile (single-row Platform SSOT)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDataEventLedger } from '@/hooks/useDataEventLedger';
import { toast } from 'sonner';

export interface CompanyProfile {
  id: string;
  company_name: string;
  legal_form: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  managing_directors: any;
  commercial_register: any;
  vat_id: string | null;
  supervisory_authority: string | null;
  website_url: string | null;
  last_updated_at: string;
  last_updated_by: string | null;
}

export function useComplianceCompany() {
  const qc = useQueryClient();
  const { logEvent } = useDataEventLedger();

  const query = useQuery({
    queryKey: ['compliance-company-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_company_profile' as any)
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CompanyProfile | null;
    },
  });

  const upsert = useMutation({
    mutationFn: async (profile: Partial<CompanyProfile>) => {
      const existing = query.data;
      if (existing?.id) {
        const { error } = await supabase
          .from('compliance_company_profile' as any)
          .update({ ...profile, last_updated_at: new Date().toISOString() } as any)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('compliance_company_profile' as any)
          .insert(profile as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance-company-profile'] });
      toast.success('Firmendaten gespeichert');
      logEvent({ zone: 'Z1', eventType: 'legal.company.updated', direction: 'mutate', source: 'admin' });
    },
    onError: (err: any) => toast.error('Fehler: ' + err.message),
  });

  return { profile: query.data, isLoading: query.isLoading, upsert };
}
