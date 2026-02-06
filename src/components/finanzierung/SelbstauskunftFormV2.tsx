/**
 * MOD-07: SelbstauskunftFormV2
 * 
 * Scrollable 9-section form based on PDF "selbstauskunft.pdf"
 * NO tabs, NO submenus - just scroll through all sections
 * 
 * Sections:
 * 1. Angaben zur Person (+ Antragsteller 2 optional)
 * 2. Haushalt
 * 3. Beschäftigung (Angestellt ↔ Selbstständig Switch)
 * 4. Bankverbindung
 * 5. Monatliche Einnahmen
 * 6. Monatliche Ausgaben
 * 7. Vermögen (inkl. MOD-04 read-only)
 * 8. Verbindlichkeiten (1:N Tabelle)
 * 9. Erklärungen
 */

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  User, Users, Briefcase, Building2, Landmark, Wallet, 
  PiggyBank, CreditCard, FileCheck, Save, Loader2, 
  Download, Plus, Trash2, Home, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import type { ApplicantProfile } from '@/types/finance';

// Types
interface Liability {
  id: string;
  liability_type: 'immobiliendarlehen' | 'ratenkredit' | 'leasing' | 'sonstige';
  creditor_name: string;
  original_amount: number | null;
  remaining_balance: number | null;
  monthly_rate: number | null;
  interest_rate_fixed_until: string | null;
  end_date: string | null;
}

interface SelbstauskunftFormV2Props {
  profile: ApplicantProfile;
  onSave?: () => void;
  readOnly?: boolean;
}

// Form field component for consistent styling
function FormField({ 
  label, 
  required = false, 
  children,
  hint,
  className = ''
}: { 
  label: string; 
  required?: boolean; 
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Section header component
function SectionHeader({ 
  number, 
  title, 
  icon: Icon,
  description
}: { 
  number: number; 
  title: string; 
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

export function SelbstauskunftFormV2({ profile, onSave, readOnly = false }: SelbstauskunftFormV2Props) {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();

  // Form state - all fields from PDF
  const [formData, setFormData] = React.useState({
    // Section 1: Person
    salutation: profile.salutation || '',
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    birth_name: profile.birth_name || '',
    birth_date: profile.birth_date || '',
    birth_place: profile.birth_place || '',
    birth_country: profile.birth_country || 'DE',
    nationality: profile.nationality || 'DE',
    address_street: profile.address_street || '',
    address_postal_code: profile.address_postal_code || '',
    address_city: profile.address_city || '',
    address_since: profile.address_since || '',
    previous_address_street: profile.previous_address_street || '',
    previous_address_postal_code: profile.previous_address_postal_code || '',
    previous_address_city: profile.previous_address_city || '',
    phone: profile.phone || '',
    phone_mobile: profile.phone_mobile || '',
    email: profile.email || '',
    tax_id: profile.tax_id || '',

    // Section 2: Haushalt
    marital_status: profile.marital_status || '',
    property_separation: profile.property_separation || false,
    children_count: profile.children_count || 0,
    children_birth_dates: profile.children_birth_dates || '',

    // Section 3: Beschäftigung (Switch)
    employment_type: profile.employment_type || 'angestellt',
    employer_name: profile.employer_name || '',
    employed_since: profile.employed_since || '',
    contract_type: profile.contract_type || 'unbefristet',
    probation_until: profile.probation_until || '',
    employer_in_germany: profile.employer_in_germany ?? true,
    salary_currency: profile.salary_currency || 'EUR',
    salary_payments_per_year: profile.salary_payments_per_year || 12,
    has_side_job: profile.has_side_job || false,
    side_job_type: profile.side_job_type || '',
    side_job_since: profile.side_job_since || '',
    vehicles_count: profile.vehicles_count || 0,
    retirement_date: profile.retirement_date || '',
    pension_state_monthly: profile.pension_state_monthly || null,
    pension_private_monthly: profile.pension_private_monthly || null,
    // Self-employed fields
    company_name: profile.company_name || '',
    company_legal_form: profile.company_legal_form || '',
    company_founded: profile.company_founded || '',
    company_industry: profile.company_industry || '',

    // Section 4: Bankverbindung
    iban: profile.iban || '',
    bic: profile.bic || '',

    // Section 5: Einnahmen
    net_income_monthly: profile.net_income_monthly || null,
    self_employed_income_monthly: profile.self_employed_income_monthly || null,
    side_job_income_monthly: profile.side_job_income_monthly || null,
    rental_income_monthly: profile.rental_income_monthly || null,
    child_benefit_monthly: profile.child_benefit_monthly || null,
    alimony_income_monthly: profile.alimony_income_monthly || null,
    other_regular_income_monthly: profile.other_regular_income_monthly || null,

    // Section 6: Ausgaben
    current_rent_monthly: profile.current_rent_monthly || null,
    health_insurance_monthly: profile.health_insurance_monthly || null,
    child_support_amount_monthly: profile.child_support_amount_monthly || null,
    car_leasing_monthly: profile.car_leasing_monthly || null,
    other_fixed_costs_monthly: profile.other_fixed_costs_monthly || null,

    // Section 7: Vermögen
    bank_savings: profile.bank_savings || null,
    securities_value: profile.securities_value || null,
    building_society_value: profile.building_society_value || null,
    life_insurance_value: profile.life_insurance_value || null,
    other_assets_value: profile.other_assets_value || null,

    // Section 9: Erklärungen
    schufa_consent: profile.schufa_consent || false,
    no_insolvency: profile.no_insolvency || false,
    no_tax_arrears: profile.no_tax_arrears || false,
    data_correct_confirmed: profile.data_correct_confirmed || false,
  });

  // Section 8: Liabilities (separate state for 1:N)
  const [liabilities, setLiabilities] = React.useState<Liability[]>([]);
  const [showSecondApplicant, setShowSecondApplicant] = React.useState(false);
  const [showContextPicker, setShowContextPicker] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Fetch landlord contexts for prefill
  const { data: landlordContexts = [] } = useQuery({
    queryKey: ['landlord-contexts-prefill', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('landlord_contexts')
        .select('id, name, context_type, taxable_income_yearly, tax_assessment_type, church_tax, children_count, street, house_number, postal_code, city')
        .eq('tenant_id', activeTenantId)
        .eq('context_type', 'PRIVATE');
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId && !readOnly,
  });

  // Fetch MOD-04 properties for assets section
  const { data: properties = [] } = useQuery({
    queryKey: ['mod04-properties-assets', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, city, postal_code, market_value, purchase_price')
        .eq('tenant_id', activeTenantId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // Fetch liabilities
  const { data: existingLiabilities = [], refetch: refetchLiabilities } = useQuery({
    queryKey: ['applicant-liabilities', profile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applicant_liabilities')
        .select('*')
        .eq('applicant_profile_id', profile.id)
        .order('created_at');
      if (error) throw error;
      return (data || []) as Liability[];
    },
    enabled: !!profile.id && profile.id !== 'dev-mode-profile',
  });

  React.useEffect(() => {
    setLiabilities(existingLiabilities);
  }, [existingLiabilities]);

  // Calculate total property value from MOD-04
  const totalPropertyValue = properties.reduce((sum, p) => sum + (p.market_value || p.purchase_price || 0), 0);

  // Handle field change
  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle context prefill
  const handlePrefillFromContext = async (contextId: string) => {
    const context = landlordContexts.find(c => c.id === contextId);
    if (!context) return;

    // Fetch first member
    const { data: members } = await supabase
      .from('context_members')
      .select('*')
      .eq('context_id', contextId)
      .limit(1);

    const member = members?.[0];

    const updates: Record<string, unknown> = {};
    if (context.children_count) updates.children_count = context.children_count;

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
    }

    setFormData(prev => ({ ...prev, ...updates }));
    setShowContextPicker(false);
    toast.success(`Daten aus "${context.name}" übernommen`);
  };

  // Add liability
  const addLiability = () => {
    const newLiability: Liability = {
      id: `temp-${Date.now()}`,
      liability_type: 'ratenkredit',
      creditor_name: '',
      original_amount: null,
      remaining_balance: null,
      monthly_rate: null,
      interest_rate_fixed_until: null,
      end_date: null,
    };
    setLiabilities(prev => [...prev, newLiability]);
  };

  // Remove liability
  const removeLiability = (id: string) => {
    setLiabilities(prev => prev.filter(l => l.id !== id));
  };

  // Update liability
  const updateLiability = (id: string, field: keyof Liability, value: unknown) => {
    setLiabilities(prev => prev.map(l => 
      l.id === id ? { ...l, [field]: value } : l
    ));
  };

  // Save handler
  const handleSave = async () => {
    if (readOnly || profile.id === 'dev-mode-profile') return;

    setIsSaving(true);
    try {
      // Save profile
      const { error: profileError } = await supabase
        .from('applicant_profiles')
        .update(formData)
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Save liabilities
      for (const liability of liabilities) {
        if (liability.id.startsWith('temp-')) {
          // Insert new
          const { id, ...data } = liability;
          await supabase.from('applicant_liabilities').insert({
            ...data,
            tenant_id: activeTenantId,
            applicant_profile_id: profile.id,
          });
        } else {
          // Update existing
          const { id, ...data } = liability;
          await supabase.from('applicant_liabilities').update(data).eq('id', id);
        }
      }

      toast.success('Selbstauskunft gespeichert');
      refetchLiabilities();
      onSave?.();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate completion
  const requiredFields = [
    'first_name', 'last_name', 'birth_date', 'address_street', 
    'address_postal_code', 'address_city', 'email', 'phone',
    'employment_type', 'net_income_monthly', 'iban'
  ];
  const filledRequired = requiredFields.filter(f => {
    const val = formData[f as keyof typeof formData];
    return val !== null && val !== undefined && val !== '';
  }).length;
  const completionPercent = Math.round((filledRequired / requiredFields.length) * 100);

  return (
    <div className="space-y-8 pb-24">
      {/* Context Picker Dialog */}
      <Dialog open={showContextPicker} onOpenChange={setShowContextPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daten aus Vermietereinheit übernehmen</DialogTitle>
            <DialogDescription>
              Übernehmen Sie Kontaktdaten aus einer bestehenden Vermietereinheit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {landlordContexts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Keine Vermietereinheiten gefunden.
              </p>
            ) : (
              landlordContexts.map(ctx => (
                <Button
                  key={ctx.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handlePrefillFromContext(ctx.id)}
                >
                  <div className="text-left">
                    <p className="font-medium">{ctx.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ctx.street} {ctx.house_number}, {ctx.postal_code} {ctx.city}
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

      {/* Sticky Header with Progress */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b pb-4 pt-2 -mx-4 px-4 lg:-mx-6 lg:px-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Selbstauskunft</h1>
            <Badge variant={completionPercent >= 80 ? 'default' : 'secondary'} className="gap-1">
              {completionPercent >= 80 ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {completionPercent}% vollständig
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {!readOnly && landlordContexts.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowContextPicker(true)}>
                <Download className="h-4 w-4 mr-2" />
                Aus Vermietereinheit
              </Button>
            )}
            {!readOnly && (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Speichern
              </Button>
            )}
          </div>
        </div>
        <Progress value={completionPercent} className="h-2 mt-4" />
      </div>

      {/* ========== SECTION 1: Angaben zur Person ========== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader 
            number={1} 
            title="Angaben zur Person" 
            icon={User}
            description="Persönliche Daten gemäß Ausweisdokument"
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Antragsteller Toggle */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">2. Antragsteller hinzufügen?</span>
            <Switch 
              checked={showSecondApplicant}
              onCheckedChange={setShowSecondApplicant}
              disabled={readOnly}
            />
          </div>

          {/* Antragsteller 1 */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              1. Antragsteller:in
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField label="Anrede">
                <Select value={formData.salutation} onValueChange={v => handleChange('salutation', v)} disabled={readOnly}>
                  <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Herr">Herr</SelectItem>
                    <SelectItem value="Frau">Frau</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Vorname" required>
                <Input 
                  value={formData.first_name} 
                  onChange={e => handleChange('first_name', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="Nachname" required>
                <Input 
                  value={formData.last_name} 
                  onChange={e => handleChange('last_name', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="Geburtsname">
                <Input 
                  value={formData.birth_name} 
                  onChange={e => handleChange('birth_name', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField label="Geburtsdatum" required>
                <Input 
                  type="date"
                  value={formData.birth_date} 
                  onChange={e => handleChange('birth_date', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="Geburtsort">
                <Input 
                  value={formData.birth_place} 
                  onChange={e => handleChange('birth_place', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="Geburtsland">
                <Input 
                  value={formData.birth_country} 
                  onChange={e => handleChange('birth_country', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="Staatsangehörigkeit">
                <Input 
                  value={formData.nationality} 
                  onChange={e => handleChange('nationality', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Straße, Hausnummer" required className="lg:col-span-2">
                <Input 
                  value={formData.address_street} 
                  onChange={e => handleChange('address_street', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="Wohnhaft seit">
                <Input 
                  type="date"
                  value={formData.address_since} 
                  onChange={e => handleChange('address_since', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="PLZ" required>
                <Input 
                  value={formData.address_postal_code} 
                  onChange={e => handleChange('address_postal_code', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="Wohnort" required className="md:col-span-2">
                <Input 
                  value={formData.address_city} 
                  onChange={e => handleChange('address_city', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Vorherige Adresse (Straße)" hint="Falls weniger als 3 Jahre an aktueller Adresse">
                <Input 
                  value={formData.previous_address_street} 
                  onChange={e => handleChange('previous_address_street', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="Vorherige PLZ">
                <Input 
                  value={formData.previous_address_postal_code} 
                  onChange={e => handleChange('previous_address_postal_code', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="Vorheriger Wohnort">
                <Input 
                  value={formData.previous_address_city} 
                  onChange={e => handleChange('previous_address_city', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField label="Telefon (Festnetz)">
                <Input 
                  value={formData.phone} 
                  onChange={e => handleChange('phone', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="Telefon (Mobil)" required>
                <Input 
                  value={formData.phone_mobile} 
                  onChange={e => handleChange('phone_mobile', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="E-Mail" required>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={e => handleChange('email', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>

              <FormField label="Steuer-IdNr.">
                <Input 
                  value={formData.tax_id} 
                  onChange={e => handleChange('tax_id', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>
            </div>
          </div>

          {/* Antragsteller 2 (optional) */}
          {showSecondApplicant && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4 p-4 border border-dashed rounded-lg bg-muted/30">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  2. Antragsteller:in (optional)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Für einen zweiten Antragsteller erstellen Sie bitte ein separates Profil. 
                  Die Verknüpfung erfolgt über die Finanzierungsanfrage.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ========== SECTION 2: Haushalt ========== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader 
            number={2} 
            title="Haushalt" 
            icon={Home}
            description="Familiäre Situation"
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Familienstand">
              <Select value={formData.marital_status} onValueChange={v => handleChange('marital_status', v)} disabled={readOnly}>
                <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ledig">Ledig</SelectItem>
                  <SelectItem value="verheiratet">Verheiratet</SelectItem>
                  <SelectItem value="geschieden">Geschieden</SelectItem>
                  <SelectItem value="verwitwet">Verwitwet</SelectItem>
                  <SelectItem value="getrennt_lebend">Getrennt lebend</SelectItem>
                  <SelectItem value="partnerschaft">Eingetragene Partnerschaft</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Gütertrennung">
              <div className="flex items-center h-10 gap-3">
                <Checkbox 
                  id="property_separation"
                  checked={formData.property_separation}
                  onCheckedChange={v => handleChange('property_separation', v)}
                  disabled={readOnly}
                />
                <Label htmlFor="property_separation" className="text-sm">Ja</Label>
              </div>
            </FormField>

            <FormField label="Anzahl Kinder (ohne Einkommen)">
              <Input 
                type="number"
                min="0"
                value={formData.children_count || ''} 
                onChange={e => handleChange('children_count', parseInt(e.target.value) || 0)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Geburtsdaten der Kinder" hint="Kommagetrennt">
              <Input 
                placeholder="z.B. 2015, 2018"
                value={formData.children_birth_dates} 
                onChange={e => handleChange('children_birth_dates', e.target.value)}
                disabled={readOnly}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ========== SECTION 3: Beschäftigung ========== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader 
            number={3} 
            title="Beschäftigung" 
            icon={Briefcase}
            description="Angaben zur beruflichen Situation"
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employment Type Switch */}
          <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
            <Label className="font-medium">Beschäftigungsart:</Label>
            <div className="flex items-center gap-4">
              <Button
                variant={formData.employment_type !== 'selbststaendig' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChange('employment_type', 'angestellt')}
                disabled={readOnly}
              >
                Angestellt
              </Button>
              <Button
                variant={formData.employment_type === 'selbststaendig' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChange('employment_type', 'selbststaendig')}
                disabled={readOnly}
              >
                Selbstständig
              </Button>
            </div>
          </div>

          {/* Employed Fields */}
          {formData.employment_type !== 'selbststaendig' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Name des Arbeitgebers">
                  <Input 
                    value={formData.employer_name} 
                    onChange={e => handleChange('employer_name', e.target.value)}
                    disabled={readOnly}
                  />
                </FormField>

                <FormField label="Beschäftigt seit">
                  <Input 
                    type="date"
                    value={formData.employed_since} 
                    onChange={e => handleChange('employed_since', e.target.value)}
                    disabled={readOnly}
                  />
                </FormField>

                <FormField label="Vertragsverhältnis">
                  <Select value={formData.contract_type} onValueChange={v => handleChange('contract_type', v)} disabled={readOnly}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unbefristet">Unbefristet</SelectItem>
                      <SelectItem value="befristet">Befristet</SelectItem>
                      <SelectItem value="probezeit">In Probezeit</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField label="Sitz in Deutschland">
                  <div className="flex items-center h-10 gap-3">
                    <Checkbox 
                      id="employer_in_germany"
                      checked={formData.employer_in_germany}
                      onCheckedChange={v => handleChange('employer_in_germany', v)}
                      disabled={readOnly}
                    />
                    <Label htmlFor="employer_in_germany" className="text-sm">Ja</Label>
                  </div>
                </FormField>

                <FormField label="Gehaltswährung">
                  <Select value={formData.salary_currency} onValueChange={v => handleChange('salary_currency', v)} disabled={readOnly}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="CHF">Schweizer Franken (CHF)</SelectItem>
                      <SelectItem value="USD">US-Dollar (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Zahlungen/Jahr">
                  <Select value={String(formData.salary_payments_per_year)} onValueChange={v => handleChange('salary_payments_per_year', parseInt(v))} disabled={readOnly}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12x</SelectItem>
                      <SelectItem value="13">13x</SelectItem>
                      <SelectItem value="14">14x</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Anzahl Kfz im Haushalt">
                  <Input 
                    type="number"
                    min="0"
                    value={formData.vehicles_count || ''} 
                    onChange={e => handleChange('vehicles_count', parseInt(e.target.value) || 0)}
                    disabled={readOnly}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Self-employed Fields */}
          {formData.employment_type === 'selbststaendig' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField label="Firma / Name">
                  <Input 
                    value={formData.company_name} 
                    onChange={e => handleChange('company_name', e.target.value)}
                    disabled={readOnly}
                  />
                </FormField>

                <FormField label="Rechtsform">
                  <Select value={formData.company_legal_form} onValueChange={v => handleChange('company_legal_form', v)} disabled={readOnly}>
                    <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="einzelunternehmen">Einzelunternehmen</SelectItem>
                      <SelectItem value="freiberufler">Freiberufler</SelectItem>
                      <SelectItem value="gbr">GbR</SelectItem>
                      <SelectItem value="gmbh">GmbH</SelectItem>
                      <SelectItem value="ug">UG (haftungsbeschränkt)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Selbstständig seit">
                  <Input 
                    type="date"
                    value={formData.company_founded} 
                    onChange={e => handleChange('company_founded', e.target.value)}
                    disabled={readOnly}
                  />
                </FormField>
              </div>

              <FormField label="Branche">
                <Input 
                  value={formData.company_industry} 
                  onChange={e => handleChange('company_industry', e.target.value)}
                  disabled={readOnly}
                />
              </FormField>
            </div>
          )}

          {/* Nebentätigkeit */}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Checkbox 
                id="has_side_job"
                checked={formData.has_side_job}
                onCheckedChange={v => handleChange('has_side_job', v)}
                disabled={readOnly}
              />
              <Label htmlFor="has_side_job">Zusätzliche Nebentätigkeit</Label>
            </div>

            {formData.has_side_job && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                <FormField label="Art der Nebentätigkeit">
                  <Select value={formData.side_job_type} onValueChange={v => handleChange('side_job_type', v)} disabled={readOnly}>
                    <SelectTrigger><SelectValue placeholder="Auswählen" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nebentaetigkeit">Nebentätigkeit</SelectItem>
                      <SelectItem value="freiberuflich">Freiberuflich</SelectItem>
                      <SelectItem value="selbststaendig">Selbstständig</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Seit">
                  <Input 
                    type="date"
                    value={formData.side_job_since} 
                    onChange={e => handleChange('side_job_since', e.target.value)}
                    disabled={readOnly}
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* Rente */}
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Rentenbeginn (geplant)">
              <Input 
                type="date"
                value={formData.retirement_date} 
                onChange={e => handleChange('retirement_date', e.target.value)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Gesetzliche Rente (mtl.)">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.pension_state_monthly || ''} 
                onChange={e => handleChange('pension_state_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Private Rente (mtl.)">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.pension_private_monthly || ''} 
                onChange={e => handleChange('pension_private_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ========== SECTION 4: Bankverbindung ========== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader 
            number={4} 
            title="Bankverbindung" 
            icon={Landmark}
            description="Kontoverbindung für Gehaltseingänge"
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="IBAN" required>
              <Input 
                placeholder="DE89 3704 0044 0532 0130 00"
                value={formData.iban} 
                onChange={e => handleChange('iban', e.target.value)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="BIC">
              <Input 
                placeholder="COBADEFFXXX"
                value={formData.bic} 
                onChange={e => handleChange('bic', e.target.value)}
                disabled={readOnly}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ========== SECTION 5: Monatliche Einnahmen ========== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader 
            number={5} 
            title="Monatliche Einnahmen" 
            icon={Wallet}
            description="Regelmäßige Einkünfte pro Monat"
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Nettoeinkommen" required>
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.net_income_monthly || ''} 
                onChange={e => handleChange('net_income_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Aus selbstständiger Tätigkeit">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.self_employed_income_monthly || ''} 
                onChange={e => handleChange('self_employed_income_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Nebentätigkeit">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.side_job_income_monthly || ''} 
                onChange={e => handleChange('side_job_income_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Mieteinnahmen">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.rental_income_monthly || ''} 
                onChange={e => handleChange('rental_income_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Kindergeld">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.child_benefit_monthly || ''} 
                onChange={e => handleChange('child_benefit_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Unterhaltseinnahmen">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.alimony_income_monthly || ''} 
                onChange={e => handleChange('alimony_income_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Sonstiges">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.other_regular_income_monthly || ''} 
                onChange={e => handleChange('other_regular_income_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>
          </div>

          <Separator className="my-4" />
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Summe der Einnahmen</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                  (formData.net_income_monthly || 0) +
                  (formData.self_employed_income_monthly || 0) +
                  (formData.side_job_income_monthly || 0) +
                  (formData.rental_income_monthly || 0) +
                  (formData.child_benefit_monthly || 0) +
                  (formData.alimony_income_monthly || 0) +
                  (formData.other_regular_income_monthly || 0)
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== SECTION 6: Monatliche Ausgaben ========== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader 
            number={6} 
            title="Monatliche Ausgaben" 
            icon={CreditCard}
            description="Regelmäßige Belastungen pro Monat"
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Aktuelle Warmmiete">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.current_rent_monthly || ''} 
                onChange={e => handleChange('current_rent_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Private Krankenversicherung">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.health_insurance_monthly || ''} 
                onChange={e => handleChange('health_insurance_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Unterhaltsverpflichtungen">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.child_support_amount_monthly || ''} 
                onChange={e => handleChange('child_support_amount_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Leasing (Kfz)">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.car_leasing_monthly || ''} 
                onChange={e => handleChange('car_leasing_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Sonstige Fixkosten">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.other_fixed_costs_monthly || ''} 
                onChange={e => handleChange('other_fixed_costs_monthly', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>
          </div>

          <Separator className="my-4" />
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Summe der Ausgaben</p>
              <p className="text-2xl font-bold text-destructive">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                  (formData.current_rent_monthly || 0) +
                  (formData.health_insurance_monthly || 0) +
                  (formData.child_support_amount_monthly || 0) +
                  (formData.car_leasing_monthly || 0) +
                  (formData.other_fixed_costs_monthly || 0)
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== SECTION 7: Vermögen ========== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader 
            number={7} 
            title="Vermögen" 
            icon={PiggyBank}
            description="Vorhandene Vermögenswerte"
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Bank-/Sparguthaben">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.bank_savings || ''} 
                onChange={e => handleChange('bank_savings', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Wertpapiere/Aktien">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.securities_value || ''} 
                onChange={e => handleChange('securities_value', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Bausparguthaben">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.building_society_value || ''} 
                onChange={e => handleChange('building_society_value', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Lebens-/Rentenversicherung">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.life_insurance_value || ''} 
                onChange={e => handleChange('life_insurance_value', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>

            <FormField label="Sonstiges Vermögen">
              <Input 
                type="number"
                step="0.01"
                placeholder="€"
                value={formData.other_assets_value || ''} 
                onChange={e => handleChange('other_assets_value', parseFloat(e.target.value) || null)}
                disabled={readOnly}
              />
            </FormField>
          </div>

          {/* MOD-04 Properties (read-only) */}
          {properties.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">Immobilienvermögen (aus MOD-04 Portfolio)</h4>
                  <Badge variant="outline" className="text-xs">Read-only</Badge>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Adresse</TableHead>
                        <TableHead className="text-right">Verkehrswert</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>{p.address}, {p.postal_code} {p.city}</TableCell>
                          <TableCell className="text-right">
                            {p.market_value || p.purchase_price 
                              ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.market_value || p.purchase_price)
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          <Separator />
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Summe des Vermögens</p>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                  (formData.bank_savings || 0) +
                  (formData.securities_value || 0) +
                  (formData.building_society_value || 0) +
                  (formData.life_insurance_value || 0) +
                  (formData.other_assets_value || 0) +
                  totalPropertyValue
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== SECTION 8: Verbindlichkeiten ========== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader 
            number={8} 
            title="Verbindlichkeiten / Restschulden" 
            icon={CreditCard}
            description="Bestehende Kredite und Darlehen"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {liabilities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Keine Verbindlichkeiten eingetragen.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {liabilities.map((liability, index) => (
                <div key={liability.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Verbindlichkeit {index + 1}</span>
                    {!readOnly && (
                      <Button variant="ghost" size="sm" onClick={() => removeLiability(liability.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField label="Art">
                      <Select 
                        value={liability.liability_type} 
                        onValueChange={v => updateLiability(liability.id, 'liability_type', v as Liability['liability_type'])}
                        disabled={readOnly}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immobiliendarlehen">Immobiliendarlehen</SelectItem>
                          <SelectItem value="ratenkredit">Ratenkredit</SelectItem>
                          <SelectItem value="leasing">Leasing</SelectItem>
                          <SelectItem value="sonstige">Sonstige</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Gläubiger">
                      <Input 
                        value={liability.creditor_name} 
                        onChange={e => updateLiability(liability.id, 'creditor_name', e.target.value)}
                        disabled={readOnly}
                      />
                    </FormField>

                    <FormField label="Restschuld (€)">
                      <Input 
                        type="number"
                        step="0.01"
                        value={liability.remaining_balance || ''} 
                        onChange={e => updateLiability(liability.id, 'remaining_balance', parseFloat(e.target.value) || null)}
                        disabled={readOnly}
                      />
                    </FormField>

                    <FormField label="Monatliche Rate (€)">
                      <Input 
                        type="number"
                        step="0.01"
                        value={liability.monthly_rate || ''} 
                        onChange={e => updateLiability(liability.id, 'monthly_rate', parseFloat(e.target.value) || null)}
                        disabled={readOnly}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Zinsbindung bis">
                      <Input 
                        type="date"
                        value={liability.interest_rate_fixed_until || ''} 
                        onChange={e => updateLiability(liability.id, 'interest_rate_fixed_until', e.target.value)}
                        disabled={readOnly}
                      />
                    </FormField>

                    <FormField label="Laufzeit bis">
                      <Input 
                        type="date"
                        value={liability.end_date || ''} 
                        onChange={e => updateLiability(liability.id, 'end_date', e.target.value)}
                        disabled={readOnly}
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!readOnly && (
            <Button variant="outline" onClick={addLiability} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Verbindlichkeit hinzufügen
            </Button>
          )}

          <Separator />
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Summe der Verbindlichkeiten</p>
              <p className="text-2xl font-bold text-destructive">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                  liabilities.reduce((sum, l) => sum + (l.remaining_balance || 0), 0)
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== SECTION 9: Erklärungen ========== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader 
            number={9} 
            title="Erklärungen" 
            icon={FileCheck}
            description="Bestätigungen und Einwilligungen"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox 
                id="schufa_consent"
                checked={formData.schufa_consent}
                onCheckedChange={v => handleChange('schufa_consent', v)}
                disabled={readOnly}
              />
              <div className="space-y-1">
                <Label htmlFor="schufa_consent" className="font-medium">SCHUFA-Einwilligung</Label>
                <p className="text-sm text-muted-foreground">
                  Ich willige ein, dass zur Bearbeitung meines Finanzierungsantrags eine SCHUFA-Auskunft eingeholt werden darf.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox 
                id="no_insolvency"
                checked={formData.no_insolvency}
                onCheckedChange={v => handleChange('no_insolvency', v)}
                disabled={readOnly}
              />
              <div className="space-y-1">
                <Label htmlFor="no_insolvency" className="font-medium">Keine Insolvenz</Label>
                <p className="text-sm text-muted-foreground">
                  Ich versichere, dass gegen mich kein Insolvenzverfahren anhängig ist oder beantragt wurde.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox 
                id="no_tax_arrears"
                checked={formData.no_tax_arrears}
                onCheckedChange={v => handleChange('no_tax_arrears', v)}
                disabled={readOnly}
              />
              <div className="space-y-1">
                <Label htmlFor="no_tax_arrears" className="font-medium">Keine Steuerrückstände</Label>
                <p className="text-sm text-muted-foreground">
                  Ich versichere, dass keine erheblichen Steuerrückstände bestehen.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg bg-primary/5">
              <Checkbox 
                id="data_correct_confirmed"
                checked={formData.data_correct_confirmed}
                onCheckedChange={v => handleChange('data_correct_confirmed', v)}
                disabled={readOnly}
              />
              <div className="space-y-1">
                <Label htmlFor="data_correct_confirmed" className="font-medium">Datenrichtigkeit bestätigen</Label>
                <p className="text-sm text-muted-foreground">
                  Ich bestätige, dass alle vorstehenden Angaben vollständig und wahrheitsgemäß sind.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Save Button (mobile) */}
      {!readOnly && (
        <div className="fixed bottom-6 right-6 lg:hidden">
          <Button size="lg" onClick={handleSave} disabled={isSaving} className="shadow-lg">
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
