/**
 * GenerateCaseCard — Transition from draft to real finance case.
 * Idle: compact card with "Finanzierungsfall anlegen" button
 * Created: expands to show PDF preview (60%) + Document Room (40%)
 */
import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ApplicantFormData } from './ApplicantPersonFields';
import type { PropertyAsset } from './PropertyAssetsCard';
import FinanceApplicationPreview from './FinanceApplicationPreview';
import CaseDocumentRoom from './CaseDocumentRoom';
import DocumentReadinessIndicator from './DocumentReadinessIndicator';

type CaseState = 'idle' | 'generating' | 'created';

interface Props {
  formData: ApplicantFormData;
  coFormData: ApplicantFormData;
  propertyAssets: PropertyAsset[];
  objectData?: {
    address?: string;
    type?: string;
    livingArea?: string;
    yearBuilt?: string;
    purchasePrice?: number;
  };
  financeData?: {
    loanAmount?: number;
    equityAmount?: number;
    purpose?: string;
    brokerFee?: number;
    notaryCosts?: number;
    transferTax?: number;
    modernizationCosts?: number;
  };
}

export default function GenerateCaseCard({
  formData, coFormData, propertyAssets, objectData, financeData,
}: Props) {
  const { activeTenantId, user } = useAuth();
  const [state, setState] = useState<CaseState>('idle');
  const [publicId, setPublicId] = useState('');
  const [requestId, setRequestId] = useState('');

  const customerName = [formData.first_name, formData.last_name].filter(Boolean).join(' ') || 'Kunde';

  // Validation: minimum fields
  const canGenerate = !!(
    formData.first_name && formData.last_name &&
    financeData?.loanAmount &&
    objectData?.address
  );

  const handleGenerate = async () => {
    if (!activeTenantId) {
      toast.error('Kein aktiver Mandant');
      return;
    }
    setState('generating');
    try {
      // 1. Create finance_request
      const { data: fr, error: frErr } = await supabase
        .from('finance_requests')
        .insert({
          tenant_id: activeTenantId,
          created_by: user?.id ?? null,
          status: 'ready_for_submission',
          purpose: financeData?.purpose || 'kauf',
          purchase_price: objectData?.purchasePrice ?? null,
          loan_amount_requested: financeData?.loanAmount ?? null,
          equity_amount: financeData?.equityAmount ?? null,
          object_address: objectData?.address ?? null,
          object_type: objectData?.type ?? null,
          object_living_area_sqm: objectData?.livingArea ? Number(objectData.livingArea) : null,
          object_construction_year: objectData?.yearBuilt ? Number(objectData.yearBuilt) : null,
          broker_fee: financeData?.brokerFee ?? null,
          notary_costs: financeData?.notaryCosts ?? null,
          transfer_tax: financeData?.transferTax ?? null,
          modernization_costs: financeData?.modernizationCosts ?? null,
        })
        .select('id, public_id')
        .single();

      if (frErr) throw frErr;
      if (!fr) throw new Error('Kein Datensatz zurückgegeben');

      const frId = fr.id;
      const frPublicId = fr.public_id || frId.slice(0, 8).toUpperCase();

      // 2. Create primary applicant profile
      const { data: profile, error: profErr } = await supabase
        .from('applicant_profiles')
        .insert({
          tenant_id: activeTenantId,
          finance_request_id: frId,
          profile_type: 'self_disclosure',
          party_role: 'primary',
          first_name: formData.first_name,
          last_name: formData.last_name,
          birth_date: formData.birth_date || null,
          address_street: formData.address_street,
          address_postal_code: formData.address_postal_code,
          address_city: formData.address_city,
          nationality: formData.nationality,
          employment_type: formData.employment_type,
          employer_name: formData.employer_name,
          employed_since: formData.employed_since || null,
          net_income_monthly: formData.net_income_monthly,
          has_rental_properties: formData.has_rental_properties,
          rental_income_monthly: formData.rental_income_monthly,
          email: formData.email,
          phone: formData.phone,
        })
        .select('id')
        .single();

      if (profErr) throw profErr;

      // 3. Co-applicant (if filled)
      if (coFormData.first_name && coFormData.last_name) {
        await supabase
          .from('applicant_profiles')
          .insert({
            tenant_id: activeTenantId,
            finance_request_id: frId,
            profile_type: 'self_disclosure',
            party_role: 'co_applicant',
            linked_primary_profile_id: profile?.id,
            first_name: coFormData.first_name,
            last_name: coFormData.last_name,
            birth_date: coFormData.birth_date || null,
            employment_type: coFormData.employment_type,
            employer_name: coFormData.employer_name,
            net_income_monthly: coFormData.net_income_monthly,
            has_rental_properties: coFormData.has_rental_properties,
          });
      }

      // 4. Property assets
      if (propertyAssets.length > 0 && profile?.id) {
        await supabase
          .from('applicant_property_assets')
          .insert(
            propertyAssets.map((p, i) => ({
              tenant_id: activeTenantId,
              applicant_profile_id: profile.id,
              property_index: i + 1,
              property_type: p.property_type || null,
              address: p.address || null,
              living_area_sqm: p.living_area_sqm,
              rented_area_sqm: p.rented_area_sqm,
              commercial_area_sqm: p.commercial_area_sqm,
              construction_year: p.construction_year,
              purchase_price: p.purchase_price,
              estimated_value: p.estimated_value,
              net_rent_monthly: p.net_rent_monthly,
              units_count: p.units_count,
              loan1_lender: p.loan1_lender || null,
              loan1_balance: p.loan1_balance,
              loan1_rate_monthly: p.loan1_rate_monthly,
              loan1_interest_rate: p.loan1_interest_rate,
              loan2_lender: p.loan2_lender || null,
              loan2_balance: p.loan2_balance,
              loan2_rate_monthly: p.loan2_rate_monthly,
              loan2_interest_rate: p.loan2_interest_rate,
            }))
          );
      }

      // 5. Create storage folder
      const { data: folder } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: activeTenantId,
          name: frPublicId,
          node_type: 'folder',
          module_code: 'MOD_11',
        })
        .select('id')
        .single();

      // 6. Link folder to request
      if (folder?.id) {
        await supabase
          .from('finance_requests')
          .update({ storage_folder_id: folder.id })
          .eq('id', frId);
      }

      setPublicId(frPublicId);
      setRequestId(frId);
      setState('created');
      toast.success(`Finanzierungsfall ${frPublicId} erfolgreich angelegt`);
    } catch (err: any) {
      console.error('Generate case error:', err);
      toast.error('Fehler beim Anlegen: ' + (err?.message || 'Unbekannt'));
      setState('idle');
    }
  };

  const employmentType = formData.employment_type || undefined;

  // === IDLE STATE ===
  if (state === 'idle' || state === 'generating') {
    return (
      <Card className="glass-card overflow-hidden border-primary/20">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b bg-muted/20 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">Finanzierungsakte fertigstellen</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x">
            {/* Left: Description + Button */}
            <div className="lg:col-span-3 p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Wenn Sie die Finanzierungsakte anlegen, entsteht der Datenraum für{' '}
                <span className="font-semibold text-foreground">{customerName}</span>.
                Dort können Sie dann die Objektunterlagen und Finanzierungsunterlagen
                vervollständigen oder erfassen. Die Akte kann erst eingereicht werden,
                wenn alle erforderlichen Unterlagen vorhanden sind.
              </p>
              <Button
                size="lg"
                disabled={!canGenerate || state === 'generating'}
                onClick={handleGenerate}
                className="gap-2"
              >
                {state === 'generating' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Wird angelegt...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Finanzierungsfall anlegen
                  </>
                )}
              </Button>
              {!canGenerate && (
                <p className="text-xs text-destructive">
                  Bitte füllen Sie mindestens Name, Darlehenssumme und Objektadresse aus.
                </p>
              )}
            </div>
            {/* Right: Document readiness preview (all red) */}
            <div className="lg:col-span-2 p-4">
              <h4 className="text-sm font-semibold mb-3">Datenraum (Vorschau)</h4>
              <DocumentReadinessIndicator
                employmentType={employmentType}
                compact
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // === CREATED STATE ===
  return (
    <Card className="glass-card overflow-hidden border-green-500/30">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-emerald-500/5 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div className="flex-1">
            <h3 className="text-base font-semibold">
              Finanzierungsakte <span className="font-mono text-primary">{publicId}</span>
            </h3>
            <p className="text-xs text-muted-foreground">Fall erfolgreich angelegt — bereit für die Einreichung</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled>
            <ExternalLink className="h-3.5 w-3.5" /> Einreichung öffnen
          </Button>
        </div>

        {/* Split layout: PDF Preview (60%) + Document Room (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x min-h-[500px]">
          {/* PDF Preview */}
          <div className="lg:col-span-3 p-4">
            <FinanceApplicationPreview
              publicId={publicId}
              formData={formData}
              coFormData={coFormData}
              propertyAssets={propertyAssets}
              objectData={objectData}
              financeData={financeData}
            />
          </div>

          {/* Document Room */}
          <div className="lg:col-span-2 p-4">
            <h4 className="text-sm font-semibold mb-3">Datenraum</h4>
            <CaseDocumentRoom requestId={requestId} publicId={publicId} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
