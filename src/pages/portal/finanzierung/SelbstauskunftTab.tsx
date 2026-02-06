/**
 * MOD-07: Selbstauskunft Tab
 * Displays persistent applicant profile (finance_request_id IS NULL)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, Building, CheckCircle, AlertCircle, 
  FileEdit, Loader2, RefreshCw 
} from 'lucide-react';
import { SelbstauskunftForm } from '@/components/finanzierung/SelbstauskunftForm';
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
  first_name: null,
  last_name: null,
  birth_date: null,
  birth_place: null,
  nationality: null,
  marital_status: null,
  address_street: null,
  address_postal_code: null,
  address_city: null,
  phone: null,
  email: null,
  id_document_type: null,
  id_document_number: null,
  id_document_valid_until: null,
  tax_id: null,
  iban: null,
  // NEW: Tax basis fields
  taxable_income_yearly: null,
  church_tax: null,
  tax_assessment_type: null,
  marginal_tax_rate: null,
  adults_count: null,
  children_count: null,
  children_ages: null,
  child_support_obligation: null,
  child_support_amount_monthly: null,
  child_benefit_monthly: null,
  other_regular_income_monthly: null,
  other_income_description: null,
  employer_name: null,
  employer_location: null,
  employer_industry: null,
  employment_type: null,
  position: null,
  employed_since: null,
  probation_until: null,
  net_income_monthly: null,
  bonus_yearly: null,
  company_name: null,
  company_legal_form: null,
  company_address: null,
  company_founded: null,
  company_register_number: null,
  company_vat_id: null,
  company_industry: null,
  company_employees: null,
  company_ownership_percent: null,
  company_managing_director: null,
  current_rent_monthly: null,
  living_expenses_monthly: null,
  car_leasing_monthly: null,
  health_insurance_monthly: null,
  other_fixed_costs_monthly: null,
  bank_savings: null,
  securities_value: null,
  building_society_value: null,
  life_insurance_value: null,
  other_assets_value: null,
  other_assets_description: null,
  purpose: null,
  object_address: null,
  object_type: null,
  purchase_price: null,
  ancillary_costs: null,
  modernization_costs: null,
  planned_rent_monthly: null,
  rental_status: null,
  equity_amount: null,
  equity_source: null,
  loan_amount_requested: null,
  fixed_rate_period_years: null,
  repayment_rate_percent: null,
  max_monthly_rate: null,
  schufa_consent: null,
  no_insolvency: null,
  no_tax_arrears: null,
  data_correct_confirmed: null,
  completion_score: null,
  finance_request_id: null,
  last_synced_from_finapi_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export default function SelbstauskunftTab() {
  const { activeOrganization } = useAuth();
  const devMode = isDevMode() && !activeOrganization?.id;

  // Fetch persistent applicant profile (finance_request_id IS NULL)
  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['persistent-applicant-profile', activeOrganization?.id],
    queryFn: async (): Promise<ApplicantProfile | null> => {
      // DEV MODE: Return empty profile structure
      if (!activeOrganization?.id) {
        return createEmptyProfile();
      }

      // First, try to find persistent profile
      const { data, error } = await supabase
        .from('applicant_profiles')
        .select('*')
        .eq('tenant_id', activeOrganization.id)
        .is('finance_request_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // If no persistent profile exists, create one
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

  // Calculate completion score
  const calculateCompletionScore = () => {
    if (!profile) return 0;

    const requiredFields = [
      'first_name', 'last_name', 'email', 'phone',
      'birth_date', 'address_street', 'address_city', 'address_postal_code',
      'employment_type', 'net_income_monthly',
    ];

    const filledFields = requiredFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  const completionScore = calculateCompletionScore();
  const isReadyToSubmit = completionScore >= 80;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* DEV MODE Banner */}
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

      {/* Header with Completion Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meine Selbstauskunft
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Vollständigkeit</span>
              <span className="text-sm text-muted-foreground">{completionScore}%</span>
            </div>
            <Progress value={completionScore} className="h-2" />
          </div>

          <div className="flex items-center gap-2">
            {isReadyToSubmit ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Bereit zur Einreichung
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Daten unvollständig
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {isReadyToSubmit 
                ? 'Ihre Daten sind vollständig für eine Finanzierungsanfrage.' 
                : 'Bitte ergänzen Sie die fehlenden Angaben.'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Profile Type Tabs */}
      <Tabs defaultValue={profile?.profile_type || 'private'}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="private" className="gap-2">
            <User className="h-4 w-4" />
            Privatperson
          </TabsTrigger>
          <TabsTrigger value="business" className="gap-2">
            <Building className="h-4 w-4" />
            Unternehmer / Selbstständig
          </TabsTrigger>
        </TabsList>

        <TabsContent value="private" className="mt-6">
          {(profile || devMode) && (
            <SelbstauskunftForm
              profile={profile || createEmptyProfile()}
              onSave={() => refetch()}
              readOnly={devMode}
            />
          )}
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          {(profile || devMode) && (
            <SelbstauskunftForm
              profile={profile || createEmptyProfile()}
              onSave={() => refetch()}
              readOnly={devMode}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Info Box */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileEdit className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Dauerhafte Selbstauskunft</p>
              <p className="mt-1">
                Diese Daten werden dauerhaft gespeichert und bei jeder neuen Finanzierungsanfrage 
                automatisch verwendet. Sie können die Daten jederzeit aktualisieren.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
