/**
 * MOD-07: SelbstauskunftFormV2
 * 
 * 3-column side-by-side layout: Label | AS1 | AS2
 * Sections 2 (Haushalt) and 9 (Erklärungen) are shared (single-column).
 * Co-applicant column is always visible; auto-created on first input.
 */

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  User, Users, Briefcase, Building2, Landmark, Wallet, 
  PiggyBank, CreditCard, FileCheck, Save, Loader2, 
  Download, Plus, Trash2, Home,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import type { ApplicantProfile } from '@/types/finance';
import {
  PersonSection, EmploymentSection, BankSection, IncomeSection,
  ExpensesSection, AssetsSection, createEmptyApplicantFormData,
  type ApplicantFormData,
} from './ApplicantPersonFields';

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

export interface SelbstauskunftFormV2Props {
  profile: ApplicantProfile;
  coApplicantProfile?: ApplicantProfile;
  onCoApplicantToggle?: (enabled: boolean) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

// Form field component
function FormField({ label, required = false, children, hint, className = '' }: { 
  label: string; required?: boolean; children: React.ReactNode; hint?: string; className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-sm font-medium">
        {label}{required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Section header
function SectionHeader({ number, title, icon: Icon, description }: { 
  number: number; title: string; icon: React.ElementType; description?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">{number}</div>
      <div className="flex-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2"><Icon className="h-4 w-4" />{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export function profileToFormData(p: ApplicantProfile): ApplicantFormData {
  return {
    salutation: p.salutation || '', first_name: p.first_name || '', last_name: p.last_name || '',
    birth_name: p.birth_name || '', birth_date: p.birth_date || '', birth_place: p.birth_place || '',
    birth_country: p.birth_country || 'DE', nationality: p.nationality || 'DE',
    address_street: p.address_street || '', address_postal_code: p.address_postal_code || '',
    address_city: p.address_city || '', address_since: p.address_since || '',
    previous_address_street: p.previous_address_street || '',
    previous_address_postal_code: p.previous_address_postal_code || '',
    previous_address_city: p.previous_address_city || '',
    phone: p.phone || '', phone_mobile: p.phone_mobile || '', email: p.email || '', tax_id: p.tax_id || '',
    employment_type: p.employment_type || 'angestellt', employer_name: p.employer_name || '',
    employed_since: p.employed_since || '', contract_type: p.contract_type || 'unbefristet',
    probation_until: p.probation_until || '', employer_in_germany: p.employer_in_germany ?? true,
    salary_currency: p.salary_currency || 'EUR', salary_payments_per_year: p.salary_payments_per_year || 12,
    has_side_job: p.has_side_job || false, side_job_type: p.side_job_type || '',
    side_job_since: p.side_job_since || '', vehicles_count: p.vehicles_count || 0,
    retirement_date: p.retirement_date || '', pension_state_monthly: p.pension_state_monthly || null,
    pension_private_monthly: p.pension_private_monthly || null,
    company_name: p.company_name || '', company_legal_form: p.company_legal_form || '',
    company_founded: p.company_founded || '', company_industry: p.company_industry || '',
    iban: p.iban || '', bic: p.bic || '',
    net_income_monthly: p.net_income_monthly || null, self_employed_income_monthly: p.self_employed_income_monthly || null,
    side_job_income_monthly: p.side_job_income_monthly || null, rental_income_monthly: p.rental_income_monthly || null,
    child_benefit_monthly: p.child_benefit_monthly || null, alimony_income_monthly: p.alimony_income_monthly || null,
    other_regular_income_monthly: p.other_regular_income_monthly || null,
    current_rent_monthly: p.current_rent_monthly || null, health_insurance_monthly: p.health_insurance_monthly || null,
    child_support_amount_monthly: p.child_support_amount_monthly || null,
    car_leasing_monthly: p.car_leasing_monthly || null, other_fixed_costs_monthly: p.other_fixed_costs_monthly || null,
    bank_savings: p.bank_savings || null, securities_value: p.securities_value || null,
    building_society_value: p.building_society_value || null, life_insurance_value: p.life_insurance_value || null,
    other_assets_value: p.other_assets_value || null,
  };
}

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

export function SelbstauskunftFormV2({ profile, coApplicantProfile, onCoApplicantToggle, onSave, readOnly = false }: SelbstauskunftFormV2Props) {
  const { activeTenantId } = useAuth();

  // Primary form state
  const [formData, setFormData] = React.useState(() => profileToFormData(profile));
  // Shared fields (Haushalt + Erklärungen) stored on primary
  const [sharedData, setSharedData] = React.useState({
    marital_status: profile.marital_status || '',
    property_separation: profile.property_separation || false,
    children_count: profile.children_count || 0,
    children_birth_dates: profile.children_birth_dates || '',
    schufa_consent: profile.schufa_consent || false,
    no_insolvency: profile.no_insolvency || false,
    no_tax_arrears: profile.no_tax_arrears || false,
    data_correct_confirmed: profile.data_correct_confirmed || false,
  });

  // Co-applicant form state (always initialized)
  const [coFormData, setCoFormData] = React.useState<ApplicantFormData>(() =>
    coApplicantProfile ? profileToFormData(coApplicantProfile) : createEmptyApplicantFormData()
  );

  // Track if co-applicant profile has been auto-created
  const coCreatedRef = React.useRef(!!coApplicantProfile);

  // Update co-form when profile loads
  React.useEffect(() => {
    if (coApplicantProfile) {
      setCoFormData(profileToFormData(coApplicantProfile));
      coCreatedRef.current = true;
    }
  }, [coApplicantProfile]);

  // Liabilities
  const [liabilities, setLiabilities] = React.useState<Liability[]>([]);
  const [coLiabilities, setCoLiabilities] = React.useState<Liability[]>([]);
  const [showContextPicker, setShowContextPicker] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Fetch landlord contexts
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

  // Fetch MOD-04 properties
  const { data: properties = [] } = useQuery({
    queryKey: ['mod04-properties-assets', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase.from('properties')
        .select('id, address, city, postal_code, market_value, purchase_price')
        .eq('tenant_id', activeTenantId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // Fetch liabilities for primary
  const { data: existingLiabilities = [], refetch: refetchLiabilities } = useQuery({
    queryKey: ['applicant-liabilities', profile.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('applicant_liabilities')
        .select('*').eq('applicant_profile_id', profile.id).order('created_at');
      if (error) throw error;
      return (data || []) as Liability[];
    },
    enabled: !!profile.id && profile.id !== 'dev-mode-profile',
  });

  // Fetch liabilities for co-applicant
  const { data: existingCoLiabilities = [], refetch: refetchCoLiabilities } = useQuery({
    queryKey: ['applicant-liabilities-co', coApplicantProfile?.id],
    queryFn: async () => {
      if (!coApplicantProfile?.id) return [];
      const { data, error } = await supabase.from('applicant_liabilities')
        .select('*').eq('applicant_profile_id', coApplicantProfile.id).order('created_at');
      if (error) throw error;
      return (data || []) as Liability[];
    },
    enabled: !!coApplicantProfile?.id,
  });

  React.useEffect(() => { setLiabilities(existingLiabilities); }, [existingLiabilities]);
  React.useEffect(() => { setCoLiabilities(existingCoLiabilities); }, [existingCoLiabilities]);

  const handleChange = (field: string, value: unknown) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSharedChange = (field: string, value: unknown) => setSharedData(prev => ({ ...prev, [field]: value }));
  const handleCoChange = (field: string, value: unknown) => setCoFormData(prev => ({ ...prev, [field]: value }));

  // Auto-create co-applicant on first input
  const handleCoFirstInput = React.useCallback(() => {
    if (!coCreatedRef.current) {
      coCreatedRef.current = true;
      onCoApplicantToggle?.(true);
    }
  }, [onCoApplicantToggle]);

  // Context prefill
  const handlePrefillFromContext = async (contextId: string) => {
    const context = landlordContexts.find(c => c.id === contextId);
    if (!context) return;
    const { data: members } = await supabase.from('context_members').select('*').eq('context_id', contextId).limit(1);
    const member = members?.[0];
    const updates: Record<string, unknown> = {};
    if (context.children_count) updates.children_count = context.children_count;
    if (member) {
      if (member.first_name) updates.first_name = member.first_name;
      if (member.last_name) updates.last_name = member.last_name;
      if (member.email) updates.email = member.email;
      if (member.phone) updates.phone = member.phone;
      if (member.street && member.house_number) updates.address_street = `${member.street} ${member.house_number}`.trim();
      if (member.postal_code) updates.address_postal_code = member.postal_code;
      if (member.city) updates.address_city = member.city;
      if (member.birth_date) updates.birth_date = member.birth_date;
    }
    setFormData(prev => ({ ...prev, ...updates }));
    setShowContextPicker(false);
    toast.success(`Daten aus "${context.name}" übernommen`);
  };

  // Liability helpers
  const createLiability = (): Liability => ({
    id: `temp-${Date.now()}`, liability_type: 'ratenkredit', creditor_name: '',
    original_amount: null, remaining_balance: null, monthly_rate: null,
    interest_rate_fixed_until: null, end_date: null,
  });

  const saveLiabilitiesForProfile = async (items: Liability[], profileId: string) => {
    for (const liability of items) {
      if (liability.id.startsWith('temp-')) {
        const { id, ...data } = liability;
        await supabase.from('applicant_liabilities').insert({
          ...data, tenant_id: activeTenantId, applicant_profile_id: profileId,
        });
      } else {
        const { id, ...data } = liability;
        await supabase.from('applicant_liabilities').update(data).eq('id', id);
      }
    }
  };

  // Save handler
  const handleSave = async () => {
    if (readOnly || profile.id === 'dev-mode-profile') return;
    setIsSaving(true);
    try {
      const { error: profileError } = await supabase.from('applicant_profiles')
        .update({ ...formData, ...sharedData }).eq('id', profile.id);
      if (profileError) throw profileError;

      await saveLiabilitiesForProfile(liabilities, profile.id);

      if (coApplicantProfile?.id) {
        const { error: coError } = await supabase.from('applicant_profiles')
          .update(coFormData).eq('id', coApplicantProfile.id);
        if (coError) throw coError;
        await saveLiabilitiesForProfile(coLiabilities, coApplicantProfile.id);
      }

      toast.success('Selbstauskunft gespeichert');
      refetchLiabilities();
      if (coApplicantProfile?.id) refetchCoLiabilities();
      onSave?.();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  // Completion
  const requiredFields = ['first_name', 'last_name', 'birth_date', 'address_street', 'address_postal_code', 'address_city', 'email', 'phone', 'employment_type', 'net_income_monthly', 'iban'];
  const filledRequired = requiredFields.filter(f => {
    const val = formData[f as keyof typeof formData];
    return val !== null && val !== undefined && val !== '';
  }).length;
  const completionPercent = Math.round((filledRequired / requiredFields.length) * 100);

  // Check if co-applicant has any data
  const hasCoData = coApplicantProfile || Object.entries(coFormData).some(([k, v]) => {
    if (['employment_type', 'contract_type', 'employer_in_germany', 'salary_currency', 'salary_payments_per_year', 'has_side_job', 'vehicles_count', 'birth_country', 'nationality'].includes(k)) return false;
    return v !== '' && v !== null && v !== undefined && v !== false && v !== 0;
  });

  // Dual section props
  const dualProps = {
    formData,
    coFormData,
    onChange: handleChange,
    onCoChange: handleCoChange,
    readOnly,
    onCoFirstInput: handleCoFirstInput,
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Context Picker Dialog */}
      <Dialog open={showContextPicker} onOpenChange={setShowContextPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daten aus Vermietereinheit übernehmen</DialogTitle>
            <DialogDescription>Übernehmen Sie Kontaktdaten aus einer bestehenden Vermietereinheit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {landlordContexts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Keine Vermietereinheiten gefunden.</p>
            ) : (
              landlordContexts.map(ctx => (
                <Button key={ctx.id} variant="outline" className="w-full justify-start h-auto py-3" onClick={() => handlePrefillFromContext(ctx.id)}>
                  <div className="text-left">
                    <p className="font-medium">{ctx.name}</p>
                    <p className="text-xs text-muted-foreground">{ctx.street} {ctx.house_number}, {ctx.postal_code} {ctx.city}</p>
                  </div>
                </Button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContextPicker(false)}>Abbrechen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b pb-4 pt-2 -mx-4 px-4 lg:-mx-6 lg:px-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Selbstauskunft</h1>
            <Badge variant={completionPercent >= 80 ? 'default' : 'secondary'} className="gap-1">
              {completionPercent >= 80 ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
              {completionPercent}% vollständig
            </Badge>
            {hasCoData && (
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                2 Antragsteller
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!readOnly && landlordContexts.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setShowContextPicker(true)}>
                <Download className="h-4 w-4 mr-2" />Aus Vermietereinheit
              </Button>
            )}
            {!readOnly && (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Speichern
              </Button>
            )}
          </div>
        </div>
        <Progress value={completionPercent} className="h-2 mt-4" />
      </div>

      {/* ===== SECTION 1: Person (3-column) ===== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader number={1} title="Angaben zur Person" icon={User} description="Persönliche Daten gemäß Ausweisdokument" />
        </CardHeader>
        <CardContent>
          <PersonSection {...dualProps} />
        </CardContent>
      </Card>

      {/* ===== SECTION 2: Haushalt (shared, single-column) ===== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader number={2} title="Haushalt" icon={Home} description="Familiäre Situation (gilt für beide Antragsteller)" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Familienstand">
              <Select value={sharedData.marital_status} onValueChange={v => handleSharedChange('marital_status', v)} disabled={readOnly}>
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
                <Checkbox checked={sharedData.property_separation} onCheckedChange={v => handleSharedChange('property_separation', v)} disabled={readOnly} />
                <Label className="text-sm">Ja</Label>
              </div>
            </FormField>
            <FormField label="Anzahl Kinder (ohne Einkommen)">
              <Input type="number" min="0" value={sharedData.children_count || ''} onChange={e => handleSharedChange('children_count', parseInt(e.target.value) || 0)} disabled={readOnly} />
            </FormField>
            <FormField label="Geburtsdaten der Kinder" hint="Kommagetrennt">
              <Input placeholder="z.B. 2015, 2018" value={sharedData.children_birth_dates} onChange={e => handleSharedChange('children_birth_dates', e.target.value)} disabled={readOnly} />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 3: Beschäftigung (3-column) ===== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader number={3} title="Beschäftigung" icon={Briefcase} description="Angaben zur beruflichen Situation" />
        </CardHeader>
        <CardContent>
          <EmploymentSection {...dualProps} />
        </CardContent>
      </Card>

      {/* ===== SECTION 4: Bankverbindung (3-column) ===== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader number={4} title="Bankverbindung" icon={Landmark} description="Kontoverbindung für Gehaltseingänge" />
        </CardHeader>
        <CardContent>
          <BankSection {...dualProps} />
        </CardContent>
      </Card>

      {/* ===== SECTION 5: Einnahmen (3-column) ===== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader number={5} title="Monatliche Einnahmen" icon={Wallet} description="Regelmäßige Einkünfte pro Monat" />
        </CardHeader>
        <CardContent>
          <IncomeSection {...dualProps} />
        </CardContent>
      </Card>

      {/* ===== SECTION 6: Ausgaben (3-column) ===== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader number={6} title="Monatliche Ausgaben" icon={CreditCard} description="Regelmäßige Belastungen pro Monat" />
        </CardHeader>
        <CardContent>
          <ExpensesSection {...dualProps} />
        </CardContent>
      </Card>

      {/* ===== SECTION 7: Vermögen (3-column) ===== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader number={7} title="Vermögen" icon={PiggyBank} description="Vorhandene Vermögenswerte" />
        </CardHeader>
        <CardContent className="space-y-6">
          <AssetsSection {...dualProps} />

          {/* MOD-04 Properties (read-only, shared) */}
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
        </CardContent>
      </Card>

      {/* ===== SECTION 8: Verbindlichkeiten ===== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader number={8} title="Verbindlichkeiten / Restschulden" icon={CreditCard} description="Bestehende Kredite und Darlehen" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary liabilities */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">1. Antragsteller:in</h3>
            {liabilities.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground"><p>Keine Verbindlichkeiten eingetragen.</p></div>
            ) : (
              <div className="space-y-4">
                {liabilities.map((liability, index) => (
                  <LiabilityRow key={liability.id} liability={liability} index={index} readOnly={readOnly}
                    onUpdate={(field, value) => setLiabilities(prev => prev.map(l => l.id === liability.id ? { ...l, [field]: value } : l))}
                    onRemove={() => setLiabilities(prev => prev.filter(l => l.id !== liability.id))}
                  />
                ))}
              </div>
            )}
            {!readOnly && (
              <Button variant="outline" onClick={() => setLiabilities(prev => [...prev, createLiability()])} className="w-full">
                <Plus className="h-4 w-4 mr-2" />Verbindlichkeit hinzufügen
              </Button>
            )}
            <Separator />
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Summe der Verbindlichkeiten</p>
                <p className="text-2xl font-bold text-destructive">{eurFormat.format(liabilities.reduce((s, l) => s + (l.remaining_balance || 0), 0))}</p>
              </div>
            </div>
          </div>

          {/* Co-applicant liabilities */}
          <Separator className="my-6" />
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">2. Antragsteller:in</h3>
            {coLiabilities.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground"><p>Keine Verbindlichkeiten eingetragen.</p></div>
            ) : (
              <div className="space-y-4">
                {coLiabilities.map((liability, index) => (
                  <LiabilityRow key={liability.id} liability={liability} index={index} readOnly={readOnly}
                    onUpdate={(field, value) => setCoLiabilities(prev => prev.map(l => l.id === liability.id ? { ...l, [field]: value } : l))}
                    onRemove={() => setCoLiabilities(prev => prev.filter(l => l.id !== liability.id))}
                  />
                ))}
              </div>
            )}
            {!readOnly && (
              <Button variant="outline" onClick={() => { handleCoFirstInput(); setCoLiabilities(prev => [...prev, createLiability()]); }} className="w-full">
                <Plus className="h-4 w-4 mr-2" />Verbindlichkeit hinzufügen (2. AS)
              </Button>
            )}
            <Separator />
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Summe der Verbindlichkeiten</p>
                <p className="text-2xl font-bold text-destructive">{eurFormat.format(coLiabilities.reduce((s, l) => s + (l.remaining_balance || 0), 0))}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 9: Erklärungen (shared) ===== */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader number={9} title="Erklärungen" icon={FileCheck} description="Bestätigungen und Einwilligungen (gilt für alle Antragsteller)" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox checked={sharedData.schufa_consent} onCheckedChange={v => handleSharedChange('schufa_consent', v)} disabled={readOnly} />
            <div className="space-y-1">
              <Label className="font-medium">SCHUFA-Einwilligung</Label>
              <p className="text-sm text-muted-foreground">Ich willige ein, dass zur Bearbeitung meines Finanzierungsantrags eine SCHUFA-Auskunft eingeholt werden darf.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox checked={sharedData.no_insolvency} onCheckedChange={v => handleSharedChange('no_insolvency', v)} disabled={readOnly} />
            <div className="space-y-1">
              <Label className="font-medium">Keine Insolvenz</Label>
              <p className="text-sm text-muted-foreground">Ich versichere, dass gegen mich kein Insolvenzverfahren anhängig ist oder beantragt wurde.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox checked={sharedData.no_tax_arrears} onCheckedChange={v => handleSharedChange('no_tax_arrears', v)} disabled={readOnly} />
            <div className="space-y-1">
              <Label className="font-medium">Keine Steuerrückstände</Label>
              <p className="text-sm text-muted-foreground">Ich versichere, dass keine erheblichen Steuerrückstände bestehen.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 border rounded-lg bg-primary/5">
            <Checkbox checked={sharedData.data_correct_confirmed} onCheckedChange={v => handleSharedChange('data_correct_confirmed', v)} disabled={readOnly} />
            <div className="space-y-1">
              <Label className="font-medium">Datenrichtigkeit bestätigen</Label>
              <p className="text-sm text-muted-foreground">Ich bestätige, dass alle vorstehenden Angaben vollständig und wahrheitsgemäß sind.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Save Button (mobile) */}
      {!readOnly && (
        <div className="fixed bottom-6 right-6 lg:hidden">
          <Button size="lg" onClick={handleSave} disabled={isSaving} className="shadow-lg">
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          </Button>
        </div>
      )}
    </div>
  );
}

// Liability row component
function LiabilityRow({ liability, index, readOnly, onUpdate, onRemove }: {
  liability: Liability; index: number; readOnly: boolean;
  onUpdate: (field: keyof Liability, value: unknown) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">Verbindlichkeit {index + 1}</span>
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Art</Label>
          <Select value={liability.liability_type} onValueChange={v => onUpdate('liability_type', v)} disabled={readOnly}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="immobiliendarlehen">Immobiliendarlehen</SelectItem>
              <SelectItem value="ratenkredit">Ratenkredit</SelectItem>
              <SelectItem value="leasing">Leasing</SelectItem>
              <SelectItem value="sonstige">Sonstige</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Gläubiger</Label>
          <Input value={liability.creditor_name} onChange={e => onUpdate('creditor_name', e.target.value)} disabled={readOnly} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Restschuld (€)</Label>
          <Input type="number" step="0.01" value={liability.remaining_balance || ''} onChange={e => onUpdate('remaining_balance', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Monatliche Rate (€)</Label>
          <Input type="number" step="0.01" value={liability.monthly_rate || ''} onChange={e => onUpdate('monthly_rate', parseFloat(e.target.value) || null)} disabled={readOnly} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Zinsbindung bis</Label>
          <Input type="date" value={liability.interest_rate_fixed_until || ''} onChange={e => onUpdate('interest_rate_fixed_until', e.target.value)} disabled={readOnly} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Laufzeit bis</Label>
          <Input type="date" value={liability.end_date || ''} onChange={e => onUpdate('end_date', e.target.value)} disabled={readOnly} />
        </div>
      </div>
    </div>
  );
}
