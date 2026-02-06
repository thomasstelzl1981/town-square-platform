import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FormSection, FormInput, FormRow } from '@/components/shared';
import { 
  User, Briefcase, Home, Wallet, Building2, FileText, 
  PiggyBank, CreditCard, Save, Loader2, CheckCircle2, Download, Calculator, Baby, Church
} from 'lucide-react';
import { useUpdateApplicantProfile } from '@/hooks/useFinanceRequest';
import type { ApplicantProfile, ApplicantFormData, ProfileType, TaxAssessmentType } from '@/types/finance';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { calculateTax } from '@/lib/taxCalculator';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface SelbstauskunftFormProps {
  profile: ApplicantProfile;
  onSave?: () => void;
  readOnly?: boolean;
}

export function SelbstauskunftForm({ profile, onSave, readOnly = false }: SelbstauskunftFormProps) {
  const [formData, setFormData] = React.useState<Partial<ApplicantFormData>>({
    profile_type: profile.profile_type || 'private',
    party_role: profile.party_role || 'primary',
    // Identity
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    birth_date: profile.birth_date || '',
    birth_place: profile.birth_place || '',
    nationality: profile.nationality || 'DE',
    marital_status: profile.marital_status || null,
    address_street: profile.address_street || '',
    address_postal_code: profile.address_postal_code || '',
    address_city: profile.address_city || '',
    phone: profile.phone || '',
    email: profile.email || '',
    id_document_type: profile.id_document_type || 'PA',
    id_document_number: profile.id_document_number || '',
    id_document_valid_until: profile.id_document_valid_until || '',
    tax_id: profile.tax_id || '',
    iban: profile.iban || '',
    // NEW: Tax basis fields
    taxable_income_yearly: profile.taxable_income_yearly || null,
    church_tax: profile.church_tax || false,
    tax_assessment_type: profile.tax_assessment_type || 'SPLITTING',
    marginal_tax_rate: profile.marginal_tax_rate || null,
    // Household
    adults_count: profile.adults_count || 1,
    children_count: profile.children_count || 0,
    children_ages: profile.children_ages || '',
    child_support_obligation: profile.child_support_obligation || false,
    child_support_amount_monthly: profile.child_support_amount_monthly || null,
    child_benefit_monthly: profile.child_benefit_monthly || null,
    other_regular_income_monthly: profile.other_regular_income_monthly || null,
    other_income_description: profile.other_income_description || '',
    // Employment
    employer_name: profile.employer_name || '',
    employer_location: profile.employer_location || '',
    employer_industry: profile.employer_industry || '',
    employment_type: profile.employment_type || null,
    position: profile.position || '',
    employed_since: profile.employed_since || '',
    probation_until: profile.probation_until || '',
    net_income_monthly: profile.net_income_monthly || null,
    bonus_yearly: profile.bonus_yearly || null,
    // Company (Entrepreneur)
    company_name: profile.company_name || '',
    company_legal_form: profile.company_legal_form || '',
    company_address: profile.company_address || '',
    company_founded: profile.company_founded || '',
    company_register_number: profile.company_register_number || '',
    company_vat_id: profile.company_vat_id || '',
    company_industry: profile.company_industry || '',
    company_employees: profile.company_employees || null,
    company_ownership_percent: profile.company_ownership_percent || null,
    company_managing_director: profile.company_managing_director || false,
    // Expenses
    current_rent_monthly: profile.current_rent_monthly || null,
    living_expenses_monthly: profile.living_expenses_monthly || null,
    car_leasing_monthly: profile.car_leasing_monthly || null,
    health_insurance_monthly: profile.health_insurance_monthly || null,
    other_fixed_costs_monthly: profile.other_fixed_costs_monthly || null,
    // Assets
    bank_savings: profile.bank_savings || null,
    securities_value: profile.securities_value || null,
    building_society_value: profile.building_society_value || null,
    life_insurance_value: profile.life_insurance_value || null,
    other_assets_value: profile.other_assets_value || null,
    other_assets_description: profile.other_assets_description || '',
    // Financing
    purpose: profile.purpose || null,
    object_address: profile.object_address || '',
    object_type: profile.object_type || '',
    purchase_price: profile.purchase_price || null,
    ancillary_costs: profile.ancillary_costs || null,
    modernization_costs: profile.modernization_costs || null,
    planned_rent_monthly: profile.planned_rent_monthly || null,
    rental_status: profile.rental_status || null,
    equity_amount: profile.equity_amount || null,
    equity_source: profile.equity_source || '',
    loan_amount_requested: profile.loan_amount_requested || null,
    fixed_rate_period_years: profile.fixed_rate_period_years || 10,
    repayment_rate_percent: profile.repayment_rate_percent || 2,
    max_monthly_rate: profile.max_monthly_rate || null,
    // Declarations
    schufa_consent: profile.schufa_consent || false,
    no_insolvency: profile.no_insolvency || false,
    no_tax_arrears: profile.no_tax_arrears || false,
    data_correct_confirmed: profile.data_correct_confirmed || false,
  });

  const { activeTenantId } = useAuth();
  const updateProfile = useUpdateApplicantProfile();
  const [activeTab, setActiveTab] = React.useState('identity');
  const [showContextPicker, setShowContextPicker] = React.useState(false);

  // Fetch landlord contexts for data transfer (Phase 5 Option A)
  const { data: landlordContexts = [] } = useQuery({
    queryKey: ['landlord-contexts-for-transfer', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('landlord_contexts')
        .select('id, name, context_type, taxable_income_yearly, tax_assessment_type, church_tax, children_count, tax_rate_percent, street, house_number, postal_code, city')
        .eq('tenant_id', activeTenantId)
        .eq('context_type', 'PRIVATE');
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId && !readOnly,
  });

  // Fetch context members for the selected context
  const fetchContextMembers = async (contextId: string) => {
    const { data, error } = await supabase
      .from('context_members')
      .select('*')
      .eq('context_id', contextId)
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  };

  const handleTransferFromContext = async (contextId: string) => {
    const context = landlordContexts.find(c => c.id === contextId);
    if (!context) return;

    // Fetch first member for personal data
    const member = await fetchContextMembers(contextId);

    // Transfer data
    const updates: Partial<ApplicantFormData> = {};

    // From context
    if (context.taxable_income_yearly) {
      updates.taxable_income_yearly = context.taxable_income_yearly;
    }
    if (context.tax_assessment_type) {
      updates.tax_assessment_type = context.tax_assessment_type as TaxAssessmentType;
    }
    if (context.church_tax !== null) {
      updates.church_tax = context.church_tax;
    }
    if (context.children_count !== null) {
      updates.children_count = context.children_count;
    }

    // From first member (if available)
    if (member) {
      if (member.first_name) updates.first_name = member.first_name;
      if (member.last_name) updates.last_name = member.last_name;
      if (member.email) updates.email = member.email;
      if (member.phone) updates.phone = member.phone;
      if (member.street && member.house_number) {
        updates.address_street = `${member.street} ${member.house_number}`.trim();
      }
      if (member.postal_code) updates.address_postal_code = member.postal_code;
      if (member.city) updates.address_city = member.city;
      if (member.birth_date) updates.birth_date = member.birth_date;
      if (member.profession) updates.position = member.profession;
    }

    // Apply updates
    setFormData(prev => ({ ...prev, ...updates }));
    setShowContextPicker(false);
    toast.success(`Daten aus "${context.name}" übernommen`);
  };

  const handleChange = (field: keyof ApplicantFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await updateProfile.mutateAsync({
      profileId: profile.id,
      data: formData,
    });
    onSave?.();
  };

  // Calculate completion percentage
  const requiredFields = formData.profile_type === 'entrepreneur' 
    ? ['first_name', 'last_name', 'birth_date', 'email', 'tax_id', 'company_name', 'net_income_monthly', 'purchase_price', 'loan_amount_requested']
    : ['first_name', 'last_name', 'birth_date', 'email', 'tax_id', 'net_income_monthly', 'purchase_price', 'loan_amount_requested'];
  
  const filledRequired = requiredFields.filter(f => {
    const val = formData[f as keyof typeof formData];
    return val !== null && val !== undefined && val !== '';
  }).length;
  const completionPercent = Math.round((filledRequired / requiredFields.length) * 100);

  return (
    <div className="space-y-6">
      {/* Context Picker Dialog for Data Transfer */}
      <Dialog open={showContextPicker} onOpenChange={setShowContextPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daten aus Vermietereinheit übernehmen</DialogTitle>
            <DialogDescription>
              Wählen Sie eine Vermietereinheit, um Steuerdaten und Kontaktdaten zu übernehmen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {landlordContexts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Keine Vermietereinheiten vom Typ "Privat" gefunden.
              </p>
            ) : (
              landlordContexts.map(ctx => (
                <Button
                  key={ctx.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handleTransferFromContext(ctx.id)}
                >
                  <div className="text-left">
                    <p className="font-medium">{ctx.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ctx.taxable_income_yearly 
                        ? `zVE: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(ctx.taxable_income_yearly)} · ${ctx.tax_assessment_type === 'SPLITTING' ? 'Splitting' : 'Einzel'}`
                        : 'Keine Steuerdaten hinterlegt'}
                    </p>
                  </div>
                </Button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContextPicker(false)}>
              Abbrechen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header with Progress + Transfer Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Badge variant={formData.profile_type === 'entrepreneur' ? 'secondary' : 'outline'}>
            {formData.profile_type === 'entrepreneur' ? 'Unternehmer' : 'Privatperson'}
          </Badge>
          <Badge variant={formData.party_role === 'co_applicant' ? 'secondary' : 'outline'}>
            {formData.party_role === 'co_applicant' ? 'Mitantragsteller' : 'Hauptantragsteller'}
          </Badge>
          {!readOnly && landlordContexts.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowContextPicker(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Daten aus Vermietereinheit
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 w-64">
          <Progress value={completionPercent} className="flex-1" />
          <span className="text-sm font-medium">{completionPercent}%</span>
        </div>
      </div>

      {/* Profile Type Switch */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Antragsteller-Typ:</Label>
            <Select
              value={formData.profile_type}
              onValueChange={(v) => handleChange('profile_type', v as ProfileType)}
              disabled={readOnly}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Privatperson / Familie</SelectItem>
                <SelectItem value="entrepreneur">Unternehmer / Selbstständig</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="identity" className="gap-1">
            <User className="h-3 w-3" />
            <span className="hidden lg:inline">Identität</span>
          </TabsTrigger>
          <TabsTrigger value="household" className="gap-1">
            <Home className="h-3 w-3" />
            <span className="hidden lg:inline">Haushalt</span>
          </TabsTrigger>
          <TabsTrigger value="employment" className="gap-1">
            <Briefcase className="h-3 w-3" />
            <span className="hidden lg:inline">Einkommen</span>
          </TabsTrigger>
          {formData.profile_type === 'entrepreneur' && (
            <TabsTrigger value="company" className="gap-1">
              <Building2 className="h-3 w-3" />
              <span className="hidden lg:inline">Firma</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="expenses" className="gap-1">
            <CreditCard className="h-3 w-3" />
            <span className="hidden lg:inline">Ausgaben</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-1">
            <PiggyBank className="h-3 w-3" />
            <span className="hidden lg:inline">Vermögen</span>
          </TabsTrigger>
          <TabsTrigger value="financing" className="gap-1">
            <Wallet className="h-3 w-3" />
            <span className="hidden lg:inline">Finanzierung</span>
          </TabsTrigger>
          <TabsTrigger value="declarations" className="gap-1">
            <FileText className="h-3 w-3" />
            <span className="hidden lg:inline">Erklärungen</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Identity */}
        <TabsContent value="identity" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Persönliche Daten
              </CardTitle>
              <CardDescription>
                Angaben zur Person gemäß Ausweisdokument
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormSection>
                <FormRow>
                  <FormInput
                    label="Vorname"
                    name="first_name"
                    value={formData.first_name || ''}
                    onChange={e => handleChange('first_name', e.target.value)}
                    required
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Nachname"
                    name="last_name"
                    value={formData.last_name || ''}
                    onChange={e => handleChange('last_name', e.target.value)}
                    required
                    disabled={readOnly}
                  />
                </FormRow>
                <FormRow>
                  <FormInput
                    label="Geburtsdatum"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date || ''}
                    onChange={e => handleChange('birth_date', e.target.value)}
                    required
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Geburtsort"
                    name="birth_place"
                    value={formData.birth_place || ''}
                    onChange={e => handleChange('birth_place', e.target.value)}
                    disabled={readOnly}
                  />
                </FormRow>
                <FormRow>
                  <FormInput
                    label="Staatsangehörigkeit"
                    name="nationality"
                    value={formData.nationality || ''}
                    onChange={e => handleChange('nationality', e.target.value)}
                    placeholder="DE"
                    disabled={readOnly}
                  />
                  <div className="space-y-2">
                    <Label>Familienstand</Label>
                    <Select
                      value={formData.marital_status || ''}
                      onValueChange={(v) => handleChange('marital_status', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ledig">Ledig</SelectItem>
                        <SelectItem value="verheiratet">Verheiratet</SelectItem>
                        <SelectItem value="geschieden">Geschieden</SelectItem>
                        <SelectItem value="verwitwet">Verwitwet</SelectItem>
                        <SelectItem value="getrennt">Getrennt lebend</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormRow>
              </FormSection>

              <FormSection title="Anschrift">
                <FormRow>
                  <FormInput
                    label="Straße"
                    name="address_street"
                    value={formData.address_street || ''}
                    onChange={e => handleChange('address_street', e.target.value)}
                    className="flex-[3]"
                    disabled={readOnly}
                  />
                </FormRow>
                <FormRow className="grid-cols-3">
                  <FormInput
                    label="PLZ"
                    name="address_postal_code"
                    value={formData.address_postal_code || ''}
                    onChange={e => handleChange('address_postal_code', e.target.value)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Stadt"
                    name="address_city"
                    value={formData.address_city || ''}
                    onChange={e => handleChange('address_city', e.target.value)}
                    className="col-span-2"
                    disabled={readOnly}
                  />
                </FormRow>
              </FormSection>

              <FormSection title="Kontakt">
                <FormRow>
                  <FormInput
                    label="Telefon"
                    name="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={e => handleChange('phone', e.target.value)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="E-Mail"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={e => handleChange('email', e.target.value)}
                    required
                    disabled={readOnly}
                  />
                </FormRow>
              </FormSection>

              <FormSection title="Ausweisdokument">
                <FormRow className="grid-cols-3">
                  <div className="space-y-2">
                    <Label>Dokumenttyp</Label>
                    <Select
                      value={formData.id_document_type || 'PA'}
                      onValueChange={(v) => handleChange('id_document_type', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PA">Personalausweis</SelectItem>
                        <SelectItem value="RP">Reisepass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <FormInput
                    label="Ausweisnummer"
                    name="id_document_number"
                    value={formData.id_document_number || ''}
                    onChange={e => handleChange('id_document_number', e.target.value)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Gültig bis"
                    name="id_document_valid_until"
                    type="date"
                    value={formData.id_document_valid_until || ''}
                    onChange={e => handleChange('id_document_valid_until', e.target.value)}
                    disabled={readOnly}
                  />
                </FormRow>
              </FormSection>

              <FormSection title="Steuer & Bank">
                <FormRow>
                  <FormInput
                    label="Steuer-ID"
                    name="tax_id"
                    value={formData.tax_id || ''}
                    onChange={e => handleChange('tax_id', e.target.value)}
                    required
                    hint="11-stellige Steuer-Identifikationsnummer"
                    disabled={readOnly}
                  />
                  <FormInput
                    label="IBAN"
                    name="iban"
                    value={formData.iban || ''}
                    onChange={e => handleChange('iban', e.target.value)}
                    placeholder="DE..."
                    disabled={readOnly}
                  />
                </FormRow>

                {/* NEW: Tax basis fields */}
                <div className="mt-4 p-4 border rounded-lg bg-primary/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <Label className="font-medium">Steuerbasis für Finanzierung</Label>
                  </div>
                  <FormRow>
                    <FormInput
                      label="Zu versteuerndes Einkommen (zVE)"
                      name="taxable_income_yearly"
                      type="number"
                      value={formData.taxable_income_yearly || ''}
                      onChange={e => handleChange('taxable_income_yearly', parseFloat(e.target.value) || null)}
                      hint="Jährliches zVE in Euro"
                      disabled={readOnly}
                    />
                    <div className="space-y-2">
                      <Label>Veranlagungsart</Label>
                      <Select
                        value={formData.tax_assessment_type || 'SPLITTING'}
                        onValueChange={(v) => handleChange('tax_assessment_type', v)}
                        disabled={readOnly}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EINZEL">Einzelveranlagung</SelectItem>
                          <SelectItem value="SPLITTING">Zusammenveranlagung (Splitting)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </FormRow>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="church_tax_profile"
                        checked={formData.church_tax || false}
                        onCheckedChange={(checked) => handleChange('church_tax', !!checked)}
                        disabled={readOnly}
                      />
                      <Label htmlFor="church_tax_profile" className="cursor-pointer flex items-center gap-1">
                        <Church className="h-3 w-3" />
                        Kirchensteuerpflicht
                      </Label>
                    </div>
                  </div>
                  {formData.taxable_income_yearly && formData.taxable_income_yearly > 0 && (
                    <div className="text-sm text-muted-foreground pt-2 border-t">
                      {(() => {
                        const result = calculateTax({
                          taxableIncome: formData.taxable_income_yearly || 0,
                          assessmentType: (formData.tax_assessment_type as TaxAssessmentType) || 'SPLITTING',
                          churchTax: formData.church_tax || false,
                          childrenCount: formData.children_count || 0,
                        });
                        return (
                          <span>
                            <strong>Berechnet:</strong> Grenzsteuersatz {result.marginalTaxRate}% · 
                            Effektiv {result.effectiveTaxRate}%
                            {result.solidaritySurcharge > 0 && ' (inkl. Soli)'}
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </FormSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Household */}
        <TabsContent value="household" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Haushalt & Familie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormSection>
                <FormRow>
                  <FormInput
                    label="Erwachsene im Haushalt"
                    name="adults_count"
                    type="number"
                    min={1}
                    value={formData.adults_count || 1}
                    onChange={e => handleChange('adults_count', parseInt(e.target.value) || 1)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Kinder im Haushalt"
                    name="children_count"
                    type="number"
                    min={0}
                    value={formData.children_count || 0}
                    onChange={e => handleChange('children_count', parseInt(e.target.value) || 0)}
                    disabled={readOnly}
                  />
                </FormRow>
                {(formData.children_count || 0) > 0 && (
                  <FormInput
                    label="Alter der Kinder"
                    name="children_ages"
                    value={formData.children_ages || ''}
                    onChange={e => handleChange('children_ages', e.target.value)}
                    placeholder="z.B. 5, 8, 12"
                    disabled={readOnly}
                  />
                )}
              </FormSection>

              <FormSection title="Unterhalt">
                <div className="flex items-center gap-3 mb-4">
                  <Checkbox
                    id="child_support_obligation"
                    checked={formData.child_support_obligation || false}
                    onCheckedChange={(v) => handleChange('child_support_obligation', !!v)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="child_support_obligation">Unterhaltspflichten vorhanden</Label>
                </div>
                {formData.child_support_obligation && (
                  <FormInput
                    label="Unterhalt mtl. (€)"
                    name="child_support_amount_monthly"
                    type="number"
                    value={formData.child_support_amount_monthly || ''}
                    onChange={e => handleChange('child_support_amount_monthly', parseFloat(e.target.value) || null)}
                    disabled={readOnly}
                  />
                )}
              </FormSection>

              <FormSection title="Weitere Einkünfte">
                <FormRow>
                  <FormInput
                    label="Kindergeld mtl. (€)"
                    name="child_benefit_monthly"
                    type="number"
                    value={formData.child_benefit_monthly || ''}
                    onChange={e => handleChange('child_benefit_monthly', parseFloat(e.target.value) || null)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Sonstige Einkünfte mtl. (€)"
                    name="other_regular_income_monthly"
                    type="number"
                    value={formData.other_regular_income_monthly || ''}
                    onChange={e => handleChange('other_regular_income_monthly', parseFloat(e.target.value) || null)}
                    hint="z.B. Mieten, Renten, Kapitalerträge"
                    disabled={readOnly}
                  />
                </FormRow>
                <FormInput
                  label="Beschreibung sonstige Einkünfte"
                  name="other_income_description"
                  value={formData.other_income_description || ''}
                  onChange={e => handleChange('other_income_description', e.target.value)}
                  disabled={readOnly}
                />
              </FormSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Employment */}
        <TabsContent value="employment" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Einkommen & Beschäftigung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormSection>
                <FormRow>
                  <FormInput
                    label="Arbeitgeber"
                    name="employer_name"
                    value={formData.employer_name || ''}
                    onChange={e => handleChange('employer_name', e.target.value)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Standort"
                    name="employer_location"
                    value={formData.employer_location || ''}
                    onChange={e => handleChange('employer_location', e.target.value)}
                    disabled={readOnly}
                  />
                </FormRow>
                <FormRow>
                  <FormInput
                    label="Branche"
                    name="employer_industry"
                    value={formData.employer_industry || ''}
                    onChange={e => handleChange('employer_industry', e.target.value)}
                    disabled={readOnly}
                  />
                  <div className="space-y-2">
                    <Label>Beschäftigungsart</Label>
                    <Select
                      value={formData.employment_type || ''}
                      onValueChange={(v) => handleChange('employment_type', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unbefristet">Unbefristet</SelectItem>
                        <SelectItem value="befristet">Befristet</SelectItem>
                        <SelectItem value="beamter">Beamter</SelectItem>
                        <SelectItem value="selbststaendig">Selbstständig</SelectItem>
                        <SelectItem value="rentner">Rentner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormRow>
                <FormRow>
                  <FormInput
                    label="Position / Beruf"
                    name="position"
                    value={formData.position || ''}
                    onChange={e => handleChange('position', e.target.value)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Beschäftigt seit"
                    name="employed_since"
                    type="date"
                    value={formData.employed_since || ''}
                    onChange={e => handleChange('employed_since', e.target.value)}
                    disabled={readOnly}
                  />
                </FormRow>
                {formData.employment_type === 'befristet' && (
                  <FormInput
                    label="Probezeit bis"
                    name="probation_until"
                    type="date"
                    value={formData.probation_until || ''}
                    onChange={e => handleChange('probation_until', e.target.value)}
                    disabled={readOnly}
                  />
                )}
              </FormSection>

              <FormSection title="Einkommen">
                <FormRow>
                  <FormInput
                    label="Nettoeinkommen mtl. (€)"
                    name="net_income_monthly"
                    type="number"
                    value={formData.net_income_monthly || ''}
                    onChange={e => handleChange('net_income_monthly', parseFloat(e.target.value) || null)}
                    required
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Sonderzahlungen p.a. (€)"
                    name="bonus_yearly"
                    type="number"
                    value={formData.bonus_yearly || ''}
                    onChange={e => handleChange('bonus_yearly', parseFloat(e.target.value) || null)}
                    hint="Urlaubs-/Weihnachtsgeld, Boni"
                    disabled={readOnly}
                  />
                </FormRow>
              </FormSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Company (Entrepreneur only) */}
        {formData.profile_type === 'entrepreneur' && (
          <TabsContent value="company" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Unternehmen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormSection>
                  <FormRow>
                    <FormInput
                      label="Firmenname"
                      name="company_name"
                      value={formData.company_name || ''}
                      onChange={e => handleChange('company_name', e.target.value)}
                      required
                      disabled={readOnly}
                    />
                    <FormInput
                      label="Rechtsform"
                      name="company_legal_form"
                      value={formData.company_legal_form || ''}
                      onChange={e => handleChange('company_legal_form', e.target.value)}
                      placeholder="GmbH, UG, GbR, etc."
                      required
                      disabled={readOnly}
                    />
                  </FormRow>
                  <FormInput
                    label="Firmenanschrift"
                    name="company_address"
                    value={formData.company_address || ''}
                    onChange={e => handleChange('company_address', e.target.value)}
                    disabled={readOnly}
                  />
                  <FormRow>
                    <FormInput
                      label="Gründungsdatum"
                      name="company_founded"
                      type="date"
                      value={formData.company_founded || ''}
                      onChange={e => handleChange('company_founded', e.target.value)}
                      required
                      disabled={readOnly}
                    />
                    <FormInput
                      label="Handelsregister-Nr."
                      name="company_register_number"
                      value={formData.company_register_number || ''}
                      onChange={e => handleChange('company_register_number', e.target.value)}
                      disabled={readOnly}
                    />
                  </FormRow>
                  <FormRow>
                    <FormInput
                      label="USt-IdNr."
                      name="company_vat_id"
                      value={formData.company_vat_id || ''}
                      onChange={e => handleChange('company_vat_id', e.target.value)}
                      placeholder="DE..."
                      disabled={readOnly}
                    />
                    <FormInput
                      label="Branche"
                      name="company_industry"
                      value={formData.company_industry || ''}
                      onChange={e => handleChange('company_industry', e.target.value)}
                      disabled={readOnly}
                    />
                  </FormRow>
                  <FormRow>
                    <FormInput
                      label="Mitarbeiterzahl"
                      name="company_employees"
                      type="number"
                      value={formData.company_employees || ''}
                      onChange={e => handleChange('company_employees', parseInt(e.target.value) || null)}
                      disabled={readOnly}
                    />
                    <FormInput
                      label="Beteiligung (%)"
                      name="company_ownership_percent"
                      type="number"
                      step="0.01"
                      value={formData.company_ownership_percent || ''}
                      onChange={e => handleChange('company_ownership_percent', parseFloat(e.target.value) || null)}
                      disabled={readOnly}
                    />
                  </FormRow>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="company_managing_director"
                      checked={formData.company_managing_director || false}
                      onCheckedChange={(v) => handleChange('company_managing_director', !!v)}
                      disabled={readOnly}
                    />
                    <Label htmlFor="company_managing_director">Geschäftsführer</Label>
                  </div>
                </FormSection>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab: Expenses */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Monatliche Ausgaben
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormSection>
                <FormRow>
                  <FormInput
                    label="Aktuelle Miete / Wohnkosten (€)"
                    name="current_rent_monthly"
                    type="number"
                    value={formData.current_rent_monthly || ''}
                    onChange={e => handleChange('current_rent_monthly', parseFloat(e.target.value) || null)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Lebenshaltung (€)"
                    name="living_expenses_monthly"
                    type="number"
                    value={formData.living_expenses_monthly || ''}
                    onChange={e => handleChange('living_expenses_monthly', parseFloat(e.target.value) || null)}
                    hint="Pauschale für Lebensmittel, etc."
                    disabled={readOnly}
                  />
                </FormRow>
                <FormRow>
                  <FormInput
                    label="Kfz / Leasing (€)"
                    name="car_leasing_monthly"
                    type="number"
                    value={formData.car_leasing_monthly || ''}
                    onChange={e => handleChange('car_leasing_monthly', parseFloat(e.target.value) || null)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Krankenversicherung (€)"
                    name="health_insurance_monthly"
                    type="number"
                    value={formData.health_insurance_monthly || ''}
                    onChange={e => handleChange('health_insurance_monthly', parseFloat(e.target.value) || null)}
                    hint="PKV, Zusatzversicherung"
                    disabled={readOnly}
                  />
                </FormRow>
                <FormInput
                  label="Sonstige Fixkosten (€)"
                  name="other_fixed_costs_monthly"
                  type="number"
                  value={formData.other_fixed_costs_monthly || ''}
                  onChange={e => handleChange('other_fixed_costs_monthly', parseFloat(e.target.value) || null)}
                  disabled={readOnly}
                />
              </FormSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Assets */}
        <TabsContent value="assets" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Vermögen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormSection>
                <FormRow>
                  <FormInput
                    label="Bankguthaben / Tagesgeld (€)"
                    name="bank_savings"
                    type="number"
                    value={formData.bank_savings || ''}
                    onChange={e => handleChange('bank_savings', parseFloat(e.target.value) || null)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Wertpapiere / Depot (€)"
                    name="securities_value"
                    type="number"
                    value={formData.securities_value || ''}
                    onChange={e => handleChange('securities_value', parseFloat(e.target.value) || null)}
                    disabled={readOnly}
                  />
                </FormRow>
                <FormRow>
                  <FormInput
                    label="Bausparen (€)"
                    name="building_society_value"
                    type="number"
                    value={formData.building_society_value || ''}
                    onChange={e => handleChange('building_society_value', parseFloat(e.target.value) || null)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Lebensversicherung Rückkaufswert (€)"
                    name="life_insurance_value"
                    type="number"
                    value={formData.life_insurance_value || ''}
                    onChange={e => handleChange('life_insurance_value', parseFloat(e.target.value) || null)}
                    disabled={readOnly}
                  />
                </FormRow>
                <FormRow>
                  <FormInput
                    label="Sonstiges Vermögen (€)"
                    name="other_assets_value"
                    type="number"
                    value={formData.other_assets_value || ''}
                    onChange={e => handleChange('other_assets_value', parseFloat(e.target.value) || null)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Beschreibung sonstiges Vermögen"
                    name="other_assets_description"
                    value={formData.other_assets_description || ''}
                    onChange={e => handleChange('other_assets_description', e.target.value)}
                    disabled={readOnly}
                  />
                </FormRow>
              </FormSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Financing */}
        <TabsContent value="financing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Finanzierungswunsch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormSection>
                <div className="space-y-2">
                  <Label>Verwendungszweck</Label>
                  <Select
                    value={formData.purpose || ''}
                    onValueChange={(v) => handleChange('purpose', v)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eigennutzung">Kauf Eigennutzung</SelectItem>
                      <SelectItem value="kapitalanlage">Kauf Kapitalanlage</SelectItem>
                      <SelectItem value="neubau">Neubau</SelectItem>
                      <SelectItem value="modernisierung">Modernisierung / Sanierung</SelectItem>
                      <SelectItem value="umschuldung">Umschuldung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FormSection>

              <FormSection title="Objekt">
                <FormInput
                  label="Objektadresse"
                  name="object_address"
                  value={formData.object_address || ''}
                  onChange={e => handleChange('object_address', e.target.value)}
                  disabled={readOnly}
                />
                <FormRow>
                  <FormInput
                    label="Objektart"
                    name="object_type"
                    value={formData.object_type || ''}
                    onChange={e => handleChange('object_type', e.target.value)}
                    placeholder="ETW, MFH, EFH, etc."
                    disabled={readOnly}
                  />
                  <div className="space-y-2">
                    <Label>Vermietungsstatus</Label>
                    <Select
                      value={formData.rental_status || ''}
                      onValueChange={(v) => handleChange('rental_status', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vermietet">Vermietet</SelectItem>
                        <SelectItem value="leer">Leerstehend</SelectItem>
                        <SelectItem value="teil">Teilvermietet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormRow>
              </FormSection>

              <FormSection title="Kosten">
                <FormRow>
                  <FormInput
                    label="Kaufpreis (€)"
                    name="purchase_price"
                    type="number"
                    value={formData.purchase_price || ''}
                    onChange={e => handleChange('purchase_price', parseFloat(e.target.value) || null)}
                    required
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Nebenkosten (€)"
                    name="ancillary_costs"
                    type="number"
                    value={formData.ancillary_costs || ''}
                    onChange={e => handleChange('ancillary_costs', parseFloat(e.target.value) || null)}
                    hint="GrESt, Notar, Makler"
                    disabled={readOnly}
                  />
                </FormRow>
                <FormRow>
                  <FormInput
                    label="Modernisierung (€)"
                    name="modernization_costs"
                    type="number"
                    value={formData.modernization_costs || ''}
                    onChange={e => handleChange('modernization_costs', parseFloat(e.target.value) || null)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Geplante Miete mtl. (€)"
                    name="planned_rent_monthly"
                    type="number"
                    value={formData.planned_rent_monthly || ''}
                    onChange={e => handleChange('planned_rent_monthly', parseFloat(e.target.value) || null)}
                    hint="Nur bei Kapitalanlage"
                    disabled={readOnly}
                  />
                </FormRow>
              </FormSection>

              <FormSection title="Eigenkapital & Darlehen">
                <FormRow>
                  <FormInput
                    label="Eigenkapital (€)"
                    name="equity_amount"
                    type="number"
                    value={formData.equity_amount || ''}
                    onChange={e => handleChange('equity_amount', parseFloat(e.target.value) || null)}
                    required
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Herkunft Eigenkapital"
                    name="equity_source"
                    value={formData.equity_source || ''}
                    onChange={e => handleChange('equity_source', e.target.value)}
                    placeholder="Erspartes, Schenkung, etc."
                    disabled={readOnly}
                  />
                </FormRow>
                <FormRow>
                  <FormInput
                    label="Darlehensbetrag (€)"
                    name="loan_amount_requested"
                    type="number"
                    value={formData.loan_amount_requested || ''}
                    onChange={e => handleChange('loan_amount_requested', parseFloat(e.target.value) || null)}
                    required
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Max. Rate mtl. (€)"
                    name="max_monthly_rate"
                    type="number"
                    value={formData.max_monthly_rate || ''}
                    onChange={e => handleChange('max_monthly_rate', parseFloat(e.target.value) || null)}
                    disabled={readOnly}
                  />
                </FormRow>
                <FormRow>
                  <FormInput
                    label="Zinsbindung (Jahre)"
                    name="fixed_rate_period_years"
                    type="number"
                    value={formData.fixed_rate_period_years || 10}
                    onChange={e => handleChange('fixed_rate_period_years', parseInt(e.target.value) || 10)}
                    disabled={readOnly}
                  />
                  <FormInput
                    label="Tilgung (%)"
                    name="repayment_rate_percent"
                    type="number"
                    step="0.1"
                    value={formData.repayment_rate_percent || 2}
                    onChange={e => handleChange('repayment_rate_percent', parseFloat(e.target.value) || 2)}
                    disabled={readOnly}
                  />
                </FormRow>
              </FormSection>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Declarations */}
        <TabsContent value="declarations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Selbsterklärungen
              </CardTitle>
              <CardDescription>
                Bitte bestätigen Sie die folgenden Erklärungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="schufa_consent"
                    checked={formData.schufa_consent || false}
                    onCheckedChange={(v) => handleChange('schufa_consent', !!v)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="schufa_consent" className="text-sm leading-relaxed">
                    Ich willige in die Einholung einer Schufa-Auskunft ein.
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="no_insolvency"
                    checked={formData.no_insolvency || false}
                    onCheckedChange={(v) => handleChange('no_insolvency', !!v)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="no_insolvency" className="text-sm leading-relaxed">
                    Ich erkläre, dass gegen mich keine Mahn-/Vollstreckungsbescheide, 
                    Insolvenzverfahren oder eidesstattliche Versicherungen vorliegen.
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="no_tax_arrears"
                    checked={formData.no_tax_arrears || false}
                    onCheckedChange={(v) => handleChange('no_tax_arrears', !!v)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="no_tax_arrears" className="text-sm leading-relaxed">
                    Ich erkläre, dass keine Steuerrückstände bestehen.
                  </Label>
                </div>

                <div className="flex items-start gap-3 pt-4 border-t">
                  <Checkbox
                    id="data_correct_confirmed"
                    checked={formData.data_correct_confirmed || false}
                    onCheckedChange={(v) => handleChange('data_correct_confirmed', !!v)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="data_correct_confirmed" className="text-sm leading-relaxed font-medium">
                    Ich bestätige die Richtigkeit aller Angaben.
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      {!readOnly && (
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Speichern
          </Button>
        </div>
      )}
    </div>
  );
}
