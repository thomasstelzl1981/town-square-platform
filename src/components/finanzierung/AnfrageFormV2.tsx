/**
 * MOD-07: Finanzierungsanfrage Form V2
 * 
 * Scrollable single-page form with 4 sections:
 * A. Vorhaben (Purpose)
 * B. Objektdaten (Property Information)
 * C. Kostenzusammenstellung (Cost Breakdown)
 * D. Finanzierungsplan (Financing Plan)
 * 
 * Object data is stored in finance_requests (NOT applicant_profiles!)
 * Supports prefilling from MOD-04 portfolio
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  FileStack,
  Calculator,
  PiggyBank,
  Save,
  Loader2,
  Check,
  Target,
  Info,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ==============================================
// Types
// ==============================================

interface FinanceRequestData {
  id: string;
  tenant_id: string;
  status: string;
  property_id: string | null;
  object_source: string | null;
  
  // Vorhaben
  purpose: string | null;
  
  // Objektdaten
  object_address: string | null;
  object_type: string | null;
  object_construction_year: number | null;
  object_living_area_sqm: number | null;
  object_land_area_sqm: number | null;
  object_equipment_level: string | null;
  object_location_quality: string | null;
  
  // Kosten
  purchase_price: number | null;
  modernization_costs: number | null;
  notary_costs: number | null;
  transfer_tax: number | null;
  broker_fee: number | null;
  
  // Finanzierungsplan
  equity_amount: number | null;
  loan_amount_requested: number | null;
  fixed_rate_period_years: number | null;
  repayment_rate_percent: number | null;
  max_monthly_rate: number | null;
}

interface AnfrageFormV2Props {
  requestId: string;
  onSubmitSuccess?: () => void;
}

// ==============================================
// Options
// ==============================================

const purposeOptions = [
  { value: 'kauf', label: 'Kauf einer Bestandsimmobilie' },
  { value: 'neubau', label: 'Neubau / Errichtung' },
  { value: 'modernisierung', label: 'Modernisierung / Renovierung' },
  { value: 'umschuldung', label: 'Umschuldung / Anschlussfinanzierung' },
];

const objectTypeOptions = [
  { value: 'eigentumswohnung', label: 'Eigentumswohnung' },
  { value: 'einfamilienhaus', label: 'Einfamilienhaus' },
  { value: 'zweifamilienhaus', label: 'Zweifamilienhaus' },
  { value: 'mehrfamilienhaus', label: 'Mehrfamilienhaus' },
  { value: 'grundstueck', label: 'Grundstück' },
  { value: 'gewerbe', label: 'Gewerbeobjekt' },
];

const equipmentLevelOptions = [
  { value: 'einfach', label: 'Einfach' },
  { value: 'mittel', label: 'Mittel' },
  { value: 'gehoben', label: 'Gehoben' },
  { value: 'luxus', label: 'Luxus' },
];

const locationQualityOptions = [
  { value: 'einfach', label: 'Einfache Lage' },
  { value: 'mittel', label: 'Mittlere Lage' },
  { value: 'gut', label: 'Gute Lage' },
  { value: 'sehr_gut', label: 'Sehr gute Lage' },
];

const fixedRatePeriodOptions = [
  { value: 5, label: '5 Jahre' },
  { value: 10, label: '10 Jahre' },
  { value: 15, label: '15 Jahre' },
  { value: 20, label: '20 Jahre' },
  { value: 25, label: '25 Jahre' },
  { value: 30, label: '30 Jahre' },
];

// ==============================================
// Helper Components
// ==============================================

function SectionHeader({ 
  icon: Icon, 
  title, 
  description, 
  sectionLetter 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  sectionLetter: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
        <span className="font-bold text-lg">{sectionLetter}</span>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CurrencyInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        placeholder={placeholder || '0,00'}
        className="pr-8"
        disabled={disabled}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
    </div>
  );
}

function PercentInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        type="number"
        step="0.1"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        placeholder={placeholder || '0,0'}
        className="pr-8"
        disabled={disabled}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
    </div>
  );
}

// ==============================================
// Main Component
// ==============================================

export default function AnfrageFormV2({ requestId, onSubmitSuccess }: AnfrageFormV2Props) {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<Partial<FinanceRequestData>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Fetch request data
  const { data: request, isLoading } = useQuery({
    queryKey: ['finance-request', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      return data as FinanceRequestData;
    },
    enabled: !!requestId,
  });

  // Fetch portfolio properties for prefilling
  const { data: portfolioProperties } = useQuery({
    queryKey: ['properties-for-prefill', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) return [];

      const { data } = await supabase
        .from('properties')
        .select(`
          id, 
          address, 
          city, 
          postal_code,
          property_type,
          total_area_sqm,
          purchase_price,
          market_value,
          year_built
        `)
        .eq('tenant_id', activeOrganization.id)
        .limit(50);

      return (data || []) as Array<{
        id: string;
        address: string;
        city: string;
        postal_code: string;
        property_type: string | null;
        total_area_sqm: number | null;
        purchase_price: number | null;
        market_value: number | null;
        year_built: number | null;
      }>;
    },
    enabled: !!activeOrganization?.id,
  });

  // Initialize form data
  useEffect(() => {
    if (request) {
      setFormData(request);
    }
  }, [request]);

  // Update form field
  const updateField = <K extends keyof FinanceRequestData>(
    field: K,
    value: FinanceRequestData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<FinanceRequestData>) => {
      const { error } = await supabase
        .from('finance_requests')
        .update({
          purpose: data.purpose,
          object_address: data.object_address,
          object_type: data.object_type,
          object_construction_year: data.object_construction_year,
          object_living_area_sqm: data.object_living_area_sqm,
          object_land_area_sqm: data.object_land_area_sqm,
          object_equipment_level: data.object_equipment_level,
          object_location_quality: data.object_location_quality,
          purchase_price: data.purchase_price,
          modernization_costs: data.modernization_costs,
          notary_costs: data.notary_costs,
          transfer_tax: data.transfer_tax,
          broker_fee: data.broker_fee,
          equity_amount: data.equity_amount,
          loan_amount_requested: data.loan_amount_requested,
          fixed_rate_period_years: data.fixed_rate_period_years,
          repayment_rate_percent: data.repayment_rate_percent,
          max_monthly_rate: data.max_monthly_rate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Änderungen gespeichert');
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['finance-request', requestId] });
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + (error as Error).message);
    },
  });

  // Prefill from MOD-04 property
  const prefillFromProperty = (propertyId: string) => {
    const property = portfolioProperties?.find((p) => p.id === propertyId);
    if (!property) return;

    setFormData(prev => ({
      ...prev,
      property_id: propertyId,
      object_source: 'mod04_property',
      object_address: `${property.address}, ${property.postal_code} ${property.city}`,
      object_type: property.property_type || null,
      object_construction_year: property.year_built || null,
      object_living_area_sqm: property.total_area_sqm || null,
      object_land_area_sqm: null, // Not in properties table
      purchase_price: property.purchase_price || property.market_value || null,
    }));
    setIsDirty(true);
    toast.success('Objektdaten aus Portfolio übernommen');
  };

  // Calculate totals
  const totalCosts = (
    (formData.purchase_price || 0) +
    (formData.modernization_costs || 0) +
    (formData.notary_costs || 0) +
    (formData.transfer_tax || 0) +
    (formData.broker_fee || 0)
  );

  const financingGap = totalCosts - (formData.equity_amount || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isReadOnly = request?.status !== 'draft' && request?.status !== 'collecting';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileStack className="h-6 w-6" />
            Finanzierungsanfrage
          </h1>
          <p className="text-muted-foreground mt-1">
            Objektdaten und Finanzierungswunsch erfassen
          </p>
        </div>
        <Badge variant={request?.status === 'draft' ? 'secondary' : 'default'}>
          {request?.status === 'draft' ? 'Entwurf' : request?.status}
        </Badge>
      </div>

      {/* Property Selector for Prefilling */}
      {portfolioProperties && portfolioProperties.length > 0 && !isReadOnly && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Building2 className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Objekt aus Portfolio übernehmen?</p>
                <p className="text-sm text-muted-foreground">
                  Felder werden automatisch vorausgefüllt
                </p>
              </div>
              <Select onValueChange={prefillFromProperty}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Objekt auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {portfolioProperties.map((prop: any) => (
                    <SelectItem key={prop.id} value={prop.id}>
                      {prop.address}, {prop.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION A: VORHABEN */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader
            icon={Target}
            sectionLetter="A"
            title="Vorhaben"
            description="Was möchten Sie finanzieren?"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Finanzierungszweck" required>
              <Select
                value={formData.purpose || ''}
                onValueChange={(v) => updateField('purpose', v)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bitte wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {purposeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* SECTION B: OBJEKTDATEN */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader
            icon={Building2}
            sectionLetter="B"
            title="Informationen zur Immobilie"
            description="Angaben zum zu finanzierenden Objekt"
          />

          <div className="space-y-6">
            {/* Address */}
            <FormField label="Objektadresse" required>
              <Input
                value={formData.object_address || ''}
                onChange={(e) => updateField('object_address', e.target.value)}
                placeholder="Straße Nr., PLZ Ort"
                disabled={isReadOnly}
              />
            </FormField>

            {/* Type & Year */}
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Objektart" required>
                <Select
                  value={formData.object_type || ''}
                  onValueChange={(v) => updateField('object_type', v)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bitte wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {objectTypeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Baujahr">
                <Input
                  type="number"
                  value={formData.object_construction_year ?? ''}
                  onChange={(e) => updateField('object_construction_year', e.target.value ? Number(e.target.value) : null)}
                  placeholder="z.B. 1985"
                  disabled={isReadOnly}
                />
              </FormField>
            </div>

            {/* Areas */}
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Wohnfläche" hint="in Quadratmetern">
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.object_living_area_sqm ?? ''}
                    onChange={(e) => updateField('object_living_area_sqm', e.target.value ? Number(e.target.value) : null)}
                    placeholder="z.B. 120"
                    className="pr-10"
                    disabled={isReadOnly}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">m²</span>
                </div>
              </FormField>

              <FormField label="Grundstücksfläche" hint="in Quadratmetern">
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.object_land_area_sqm ?? ''}
                    onChange={(e) => updateField('object_land_area_sqm', e.target.value ? Number(e.target.value) : null)}
                    placeholder="z.B. 500"
                    className="pr-10"
                    disabled={isReadOnly}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">m²</span>
                </div>
              </FormField>
            </div>

            {/* Equipment & Location */}
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Ausstattungsniveau">
                <Select
                  value={formData.object_equipment_level || ''}
                  onValueChange={(v) => updateField('object_equipment_level', v)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bitte wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentLevelOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Wohnlage">
                <Select
                  value={formData.object_location_quality || ''}
                  onValueChange={(v) => updateField('object_location_quality', v)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Bitte wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locationQualityOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION C: KOSTEN */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader
            icon={Calculator}
            sectionLetter="C"
            title="Kostenzusammenstellung"
            description="Alle Kosten für das Vorhaben"
          />

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Kaufpreis / Baukosten" required>
                <CurrencyInput
                  value={formData.purchase_price}
                  onChange={(v) => updateField('purchase_price', v)}
                  placeholder="350.000"
                  disabled={isReadOnly}
                />
              </FormField>

              <FormField label="Modernisierungskosten">
                <CurrencyInput
                  value={formData.modernization_costs}
                  onChange={(v) => updateField('modernization_costs', v)}
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </FormField>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-6 md:grid-cols-3">
              <FormField label="Notar & Grundbuch" hint="ca. 1,5–2%">
                <CurrencyInput
                  value={formData.notary_costs}
                  onChange={(v) => updateField('notary_costs', v)}
                  disabled={isReadOnly}
                />
              </FormField>

              <FormField label="Grunderwerbsteuer" hint="3,5–6,5% je Bundesland">
                <CurrencyInput
                  value={formData.transfer_tax}
                  onChange={(v) => updateField('transfer_tax', v)}
                  disabled={isReadOnly}
                />
              </FormField>

              <FormField label="Maklerprovision">
                <CurrencyInput
                  value={formData.broker_fee}
                  onChange={(v) => updateField('broker_fee', v)}
                  disabled={isReadOnly}
                />
              </FormField>
            </div>

            {/* Total Costs Summary */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Gesamtkosten</span>
                <span className="text-xl font-bold">
                  {totalCosts.toLocaleString('de-DE')} €
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION D: FINANZIERUNGSPLAN */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader
            icon={PiggyBank}
            sectionLetter="D"
            title="Finanzierungsplan"
            description="Eigenkapital und Darlehenswunsch"
          />

          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Eigenkapital" required hint="Guthaben, Bausparverträge, etc.">
                <CurrencyInput
                  value={formData.equity_amount}
                  onChange={(v) => updateField('equity_amount', v)}
                  disabled={isReadOnly}
                />
              </FormField>

              <FormField label="Gewünschter Darlehensbetrag" required>
                <CurrencyInput
                  value={formData.loan_amount_requested}
                  onChange={(v) => updateField('loan_amount_requested', v)}
                  disabled={isReadOnly}
                />
              </FormField>
            </div>

            {/* Financing Gap Indicator */}
            {totalCosts > 0 && (
              <div className={cn(
                "p-4 rounded-lg border",
                financingGap === formData.loan_amount_requested 
                  ? "border-primary/30 bg-primary/5" 
                  : "border-muted-foreground/30 bg-muted"
              )}>
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4" />
                  <span>
                    Finanzierungsbedarf: <strong>{financingGap.toLocaleString('de-DE')} €</strong>
                    {financingGap !== formData.loan_amount_requested && (
                      <span className="ml-2 text-muted-foreground">
                        (Darlehenswunsch weicht ab)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            <Separator className="my-4" />

            <div className="grid gap-6 md:grid-cols-3">
              <FormField label="Zinsbindung">
                <Select
                  value={formData.fixed_rate_period_years?.toString() || ''}
                  onValueChange={(v) => updateField('fixed_rate_period_years', v ? Number(v) : null)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fixedRatePeriodOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Anfängliche Tilgung" hint="in % p.a.">
                <PercentInput
                  value={formData.repayment_rate_percent}
                  onChange={(v) => updateField('repayment_rate_percent', v)}
                  placeholder="2,0"
                  disabled={isReadOnly}
                />
              </FormField>

              <FormField label="Max. Monatsrate" hint="inkl. Zins & Tilgung">
                <CurrencyInput
                  value={formData.max_monthly_rate}
                  onChange={(v) => updateField('max_monthly_rate', v)}
                  disabled={isReadOnly}
                />
              </FormField>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fixed Save Bar */}
      {!isReadOnly && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {isDirty ? (
                <span className="flex items-center gap-2 text-destructive">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Ungespeicherte Änderungen
                </span>
              ) : (
                <span className="flex items-center gap-2 text-primary">
                  <Check className="h-4 w-4" />
                  Alle Änderungen gespeichert
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => saveMutation.mutate(formData)}
                disabled={!isDirty || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Speichern
              </Button>
              <Button disabled>
                Zur Selbstauskunft
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
