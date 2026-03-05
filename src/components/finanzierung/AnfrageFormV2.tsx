/**
 * MOD-07: Finanzierungsanfrage Form V2 — Orchestrator (R-5 Refactored)
 * 
 * Object data is stored in finance_requests (NOT applicant_profiles!)
 * Supports prefilling from MOD-04 portfolio
 */
import { useState, useEffect } from 'react';
import { FINANZIERUNG_DEFAULTS } from '@/engines/finanzierung/spec';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmitFinanceRequest } from '@/hooks/useSubmitFinanceRequest';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, FileStack, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FinanceRequestData } from './anfrageFormTypes';
import { AnfrageFormSectionA } from './AnfrageFormSectionA';
import { AnfrageFormSectionB } from './AnfrageFormSectionB';
import { AnfrageFormSectionC } from './AnfrageFormSectionC';
import { AnfrageFormSectionD } from './AnfrageFormSectionD';
import { AnfrageFormFooter } from './AnfrageFormFooter';

interface AnfrageFormV2Props {
  requestId: string;
  onSubmitSuccess?: () => void;
}

export default function AnfrageFormV2({ requestId, onSubmitSuccess }: AnfrageFormV2Props) {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<Partial<FinanceRequestData>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const submitMutation = useSubmitFinanceRequest();

  // === Queries ===
  const { data: completionData } = useQuery({
    queryKey: ['self-disclosure-completion', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return { score: 0 };
      const { data } = await supabase.from('applicant_profiles').select('completion_score')
        .eq('tenant_id', activeOrganization.id).eq('party_role', 'primary')
        .order('updated_at', { ascending: false }).limit(1).maybeSingle();
      return { score: data?.completion_score ?? 0 };
    },
    enabled: !!activeOrganization?.id,
  });

  const completionScore = completionData?.score ?? 0;
  const canSubmit = completionScore >= FINANZIERUNG_DEFAULTS.minCompletionScore;

  const { data: request, isLoading } = useQuery({
    queryKey: ['finance-request', requestId],
    queryFn: async () => {
      const { data, error } = await supabase.from('finance_requests').select('*').eq('id', requestId).single();
      if (error) throw error;
      return data as FinanceRequestData;
    },
    enabled: !!requestId,
  });

  const { data: portfolioProperties } = useQuery({
    queryKey: ['properties-for-prefill', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];
      const { data } = await supabase.from('properties')
        .select('id, address, city, postal_code, property_type, total_area_sqm, purchase_price, market_value, year_built')
        .eq('tenant_id', activeOrganization.id).limit(50);
      return (data || []) as Array<{ id: string; address: string; city: string; postal_code: string; property_type: string | null; total_area_sqm: number | null; purchase_price: number | null; market_value: number | null; year_built: number | null; }>;
    },
    enabled: !!activeOrganization?.id,
  });

  useEffect(() => { if (request) setFormData(request); }, [request]);

  // === Handlers ===
  const updateField = <K extends keyof FinanceRequestData>(field: K, value: FinanceRequestData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<FinanceRequestData>) => {
      const { error } = await supabase.from('finance_requests').update({
        purpose: data.purpose, object_address: data.object_address, object_type: data.object_type,
        object_construction_year: data.object_construction_year, object_living_area_sqm: data.object_living_area_sqm,
        object_land_area_sqm: data.object_land_area_sqm, object_equipment_level: data.object_equipment_level,
        object_location_quality: data.object_location_quality, purchase_price: data.purchase_price,
        modernization_costs: data.modernization_costs, notary_costs: data.notary_costs, transfer_tax: data.transfer_tax,
        broker_fee: data.broker_fee, equity_amount: data.equity_amount, loan_amount_requested: data.loan_amount_requested,
        fixed_rate_period_years: data.fixed_rate_period_years, repayment_rate_percent: data.repayment_rate_percent,
        max_monthly_rate: data.max_monthly_rate, updated_at: new Date().toISOString(),
      }).eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Änderungen gespeichert'); setIsDirty(false); queryClient.invalidateQueries({ queryKey: ['finance-request', requestId] }); },
    onError: (error) => { toast.error('Fehler beim Speichern: ' + (error as Error).message); },
  });

  const prefillFromProperty = (propertyId: string) => {
    const property = portfolioProperties?.find((p) => p.id === propertyId);
    if (!property) return;
    setFormData(prev => ({
      ...prev, property_id: propertyId, object_source: 'mod04_property',
      object_address: `${property.address}, ${property.postal_code} ${property.city}`,
      object_type: property.property_type || null, object_construction_year: property.year_built || null,
      object_living_area_sqm: property.total_area_sqm || null, object_land_area_sqm: null,
      purchase_price: property.purchase_price || property.market_value || null,
    }));
    setIsDirty(true);
    toast.success('Objektdaten aus Portfolio übernommen');
  };

  // === Derived ===
  const totalCosts = (formData.purchase_price || 0) + (formData.modernization_costs || 0) + (formData.notary_costs || 0) + (formData.transfer_tax || 0) + (formData.broker_fee || 0);
  const financingGap = totalCosts - (formData.equity_amount || 0);
  const isReadOnly = request?.status !== 'draft' && request?.status !== 'collecting';

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3"><FileStack className="h-6 w-6" />Finanzierungsanfrage</h1>
          <p className="text-muted-foreground mt-1">Objektdaten und Finanzierungswunsch erfassen</p>
        </div>
        <div className="flex items-center gap-3">
          {!isReadOnly && <Badge variant={canSubmit ? 'default' : 'secondary'} className="text-xs">Selbstauskunft: {completionScore}%</Badge>}
          <Badge variant={getStatusBadgeVariant(request?.status || 'draft')}>{getStatusLabel(request?.status || 'draft')}</Badge>
        </div>
      </div>

      {/* Property Prefill */}
      {portfolioProperties && portfolioProperties.length > 0 && !isReadOnly && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Building2 className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Objekt aus Portfolio übernehmen?</p>
                <p className="text-sm text-muted-foreground">Felder werden automatisch vorausgefüllt</p>
              </div>
              <Select onValueChange={prefillFromProperty}>
                <SelectTrigger className="w-[280px]"><SelectValue placeholder="Objekt auswählen..." /></SelectTrigger>
                <SelectContent>
                  {portfolioProperties.map((prop) => (<SelectItem key={prop.id} value={prop.id}>{prop.address}, {prop.city}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <AnfrageFormSectionA formData={formData} updateField={updateField} isReadOnly={isReadOnly} />
      <AnfrageFormSectionB formData={formData} updateField={updateField} isReadOnly={isReadOnly} />
      <AnfrageFormSectionC formData={formData} updateField={updateField} isReadOnly={isReadOnly} totalCosts={totalCosts} />
      <AnfrageFormSectionD formData={formData} updateField={updateField} isReadOnly={isReadOnly} totalCosts={totalCosts} financingGap={financingGap} />

      {!isReadOnly && (
        <AnfrageFormFooter
          isDirty={isDirty} canSubmit={canSubmit} completionScore={completionScore}
          savePending={saveMutation.isPending} submitPending={submitMutation.isPending}
          showSubmitDialog={showSubmitDialog} onSave={() => saveMutation.mutate(formData)}
          onSubmitClick={() => setShowSubmitDialog(true)}
          onSubmitConfirm={() => { submitMutation.mutate({ requestId, onSuccess: () => { setShowSubmitDialog(false); navigate('/portal/finanzierung/status'); } }); }}
          onSubmitDialogChange={setShowSubmitDialog}
        />
      )}
    </div>
  );
}
