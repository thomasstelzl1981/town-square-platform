/**
 * MOD-07: Selbstauskunft Tab
 * Displays persistent applicant profile using V2 scrollable form
 * Supports primary + co-applicant via linked profiles
 */

import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/shared/PageShell';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { SelbstauskunftFormV2 } from '@/components/finanzierung/SelbstauskunftFormV2';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { toast } from 'sonner';
import type { ApplicantProfile } from '@/types/finance';

// DEV MODE: Check if we're in development (no org required)
const isDevMode = () => {
  const hostname = window.location.hostname;
  return hostname.includes('lovableproject.com') || 
         hostname.includes('localhost') || 
         hostname.includes('preview');
};

// Empty profile for dev mode
const createEmptyProfile = (): ApplicantProfile => ({
  id: 'dev-mode-profile',
  tenant_id: 'dev-tenant',
  profile_type: 'private',
  party_role: 'primary',
  salutation: null, first_name: null, last_name: null, birth_name: null,
  birth_date: null, birth_place: null, birth_country: 'DE', nationality: null,
  marital_status: null, address_street: null, address_postal_code: null,
  address_city: null, address_since: null, previous_address_street: null,
  previous_address_postal_code: null, previous_address_city: null,
  phone: null, phone_mobile: null, email: null,
  id_document_type: null, id_document_number: null, id_document_valid_until: null,
  tax_id: null, property_separation: null, adults_count: null,
  children_count: null, children_ages: null, children_birth_dates: null,
  child_support_obligation: false, child_support_amount_monthly: null,
  child_benefit_monthly: null, other_regular_income_monthly: null,
  other_income_description: null, employer_name: null, employer_location: null,
  employer_industry: null, employment_type: null, position: null,
  employed_since: null, contract_type: null, probation_until: null,
  employer_in_germany: true, salary_currency: 'EUR', salary_payments_per_year: 12,
  net_income_monthly: null, bonus_yearly: null, has_side_job: null,
  side_job_type: null, side_job_since: null, side_job_income_monthly: null,
  vehicles_count: null, retirement_date: null, pension_state_monthly: null,
  pension_private_monthly: null, company_name: null, company_legal_form: null,
  company_address: null, company_founded: null, company_register_number: null,
  company_vat_id: null, company_industry: null, company_employees: null,
  company_ownership_percent: null, company_managing_director: null,
  self_employed_income_monthly: null, iban: null, bic: null,
  rental_income_monthly: null, alimony_income_monthly: null,
  current_rent_monthly: null, living_expenses_monthly: null,
  car_leasing_monthly: null, health_insurance_monthly: null,
  other_fixed_costs_monthly: null, bank_savings: null, securities_value: null,
  building_society_value: null, life_insurance_value: null,
  other_assets_value: null, other_assets_description: null,
  taxable_income_yearly: null, church_tax: null, tax_assessment_type: null,
  marginal_tax_rate: null, purpose: null, object_address: null,
  object_type: null, purchase_price: null, ancillary_costs: null,
  modernization_costs: null, planned_rent_monthly: null, rental_status: null,
  equity_amount: null, equity_source: null, loan_amount_requested: null,
  fixed_rate_period_years: null, repayment_rate_percent: null,
  max_monthly_rate: null, schufa_consent: false, no_insolvency: false,
  no_tax_arrears: false, data_correct_confirmed: false,
  completion_score: 0, finance_request_id: null,
  last_synced_from_finapi_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export default function SelbstauskunftTab() {
  const { activeOrganization } = useAuth();
  const devMode = isDevMode() && !activeOrganization?.id;

  // Fetch persistent primary applicant profile
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['persistent-applicant-profile', activeOrganization?.id],
    queryFn: async (): Promise<ApplicantProfile | null> => {
      if (!activeOrganization?.id) return createEmptyProfile();

      const { data, error } = await supabase
        .from('applicant_profiles')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .is('finance_request_id', null)
        .in('party_role', ['primary'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from('applicant_profiles')
          .insert({
            tenant_id: activeOrganization.id,
            profile_type: 'private',
            party_role: 'primary',
          })
          .select()
          .single();
        if (createError) throw createError;
        return newProfile as unknown as ApplicantProfile;
      }

      return data as unknown as ApplicantProfile;
    },
    enabled: !!activeOrganization?.id || devMode,
  });

  // Fetch co-applicant profile (linked to primary)
  const { data: coApplicantProfile, refetch: refetchCo } = useQuery({
    queryKey: ['co-applicant-profile', profile?.id],
    queryFn: async (): Promise<ApplicantProfile | null> => {
      if (!profile?.id || profile.id === 'dev-mode-profile') return null;

      const { data, error } = await supabase
        .from('applicant_profiles')
        .select('*')
        .eq('linked_primary_profile_id', profile.id)
        .eq('party_role', 'co_applicant')
        .is('finance_request_id', null)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as ApplicantProfile | null;
    },
    enabled: !!profile?.id && profile.id !== 'dev-mode-profile',
  });

  // Create co-applicant when toggle is enabled
  const handleCoApplicantToggle = async (enabled: boolean) => {
    if (!enabled || coApplicantProfile || !profile?.id || !activeOrganization?.id) return;

    try {
      const { error } = await supabase
        .from('applicant_profiles')
        .insert({
          tenant_id: activeOrganization.id,
          profile_type: 'private',
          party_role: 'co_applicant',
          linked_primary_profile_id: profile.id,
        });

      if (error) throw error;
      refetchCo();
      toast.success('Profil für 2. Antragsteller:in erstellt');
    } catch (error) {
      console.error('Error creating co-applicant:', error);
      toast.error('Fehler beim Erstellen des 2. Antragstellers');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageShell>
      {devMode && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Dev-Modus: Formular-Struktur zur Ansicht (keine Speicherung möglich)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <ModulePageHeader title="Private Selbstauskunft" description="Ihre permanente Bonitätsauskunft" />

      {(profile || devMode) && (
        <SelbstauskunftFormV2
          profile={profile || createEmptyProfile()}
          coApplicantProfile={coApplicantProfile ?? undefined}
          onCoApplicantToggle={handleCoApplicantToggle}
          onSave={() => { refetch(); refetchCo(); }}
          readOnly={devMode}
        />
      )}
    </PageShell>
  );
}
