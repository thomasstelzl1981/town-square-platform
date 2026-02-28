/**
 * KaufyFinanceRequestSheet — Reduced Self-Disclosure + Live KDF Check
 * 
 * Opens from the Kaufy Exposé when user clicks "Finanzierung beantragen".
 * Object data and engine params are already injected — user only fills personal data.
 * Submits via sot-futureroom-public-submit with source 'zone3_kaufy_expose'.
 */
import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  MapPin,
  Send,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

export interface KaufyListingData {
  id: string;
  public_id: string;
  property_id: string;
  title: string;
  asking_price: number;
  property_type: string;
  address: string;
  city: string;
  postal_code: string;
  total_area_sqm: number;
  year_built: number;
  monthly_rent: number;
}

export interface KaufyEngineParams {
  equity: number;
  interestRate: number;
  repaymentRate: number;
  monthlyRate: number;
  loanAmount: number;
  purchasePrice: number;
  totalCosts: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  listing: KaufyListingData;
  engineParams: KaufyEngineParams;
}

interface FormData {
  // Personal
  salutation: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace: string;
  addressStreet: string;
  addressPostalCode: string;
  addressCity: string;
  phone: string;
  email: string;
  maritalStatus: string;
  // Income
  employmentType: string;
  employerName: string;
  employedSince: string;
  netIncomeMonthly: string;
  otherIncomeMonthly: string;
  // Expenses & Assets
  currentRentMonthly: string;
  livingExpensesMonthly: string;
  otherFixedCostsMonthly: string;
  bankSavings: string;
  securitiesValue: string;
  lifeInsuranceValue: string;
}

const initialFormData: FormData = {
  salutation: '',
  firstName: '',
  lastName: '',
  birthDate: '',
  birthPlace: '',
  addressStreet: '',
  addressPostalCode: '',
  addressCity: '',
  phone: '',
  email: '',
  maritalStatus: '',
  employmentType: '',
  employerName: '',
  employedSince: '',
  netIncomeMonthly: '',
  otherIncomeMonthly: '',
  currentRentMonthly: '',
  livingExpensesMonthly: '',
  otherFixedCostsMonthly: '',
  bankSavings: '',
  securitiesValue: '',
  lifeInsuranceValue: '',
};

// ── Helpers ────────────────────────────────────────────────────────────────

const num = (v: string) => parseFloat(v) || 0;

const fmt = (v: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

// ── Component ──────────────────────────────────────────────────────────────

export default function KaufyFinanceRequestSheet({ open, onClose, listing, engineParams }: Props) {
  const [form, setForm] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [bonitaetChecked, setBonitaetChecked] = useState(false);
  const [bonitaetResult, setBonitaetResult] = useState<'positive' | 'negative' | null>(null);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const setSelect = (field: keyof FormData) => (v: string) =>
    setForm(prev => ({ ...prev, [field]: v }));

  // ── Live KDF Check ─────────────────────────────────────────────────────

  const kdf = useMemo(() => {
    const income = num(form.netIncomeMonthly) + num(form.otherIncomeMonthly);
    const expenses =
      num(form.currentRentMonthly) +
      num(form.livingExpensesMonthly) +
      num(form.otherFixedCostsMonthly);
    const surplus = income - expenses - engineParams.monthlyRate;
    const ratio = income > 0 ? ((expenses + engineParams.monthlyRate) / income) * 100 : 0;

    let status: 'green' | 'yellow' | 'red' | 'none' = 'none';
    if (income > 0) {
      if (ratio <= 60) status = 'green';
      else if (ratio <= 80) status = 'yellow';
      else status = 'red';
    }

    return { income, expenses, surplus, ratio, status };
  }, [form.netIncomeMonthly, form.otherIncomeMonthly, form.currentRentMonthly, form.livingExpensesMonthly, form.otherFixedCostsMonthly, engineParams.monthlyRate]);

  // ── Validation ─────────────────────────────────────────────────────────

  const isValid =
    form.firstName.trim() !== '' &&
    form.lastName.trim() !== '' &&
    form.email.trim() !== '' &&
    num(form.netIncomeMonthly) > 0 &&
    consentChecked;

  // ── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);

    try {
      const payload = {
        source: 'zone3_kaufy_expose',
        contact: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        object: {
          type: listing.property_type,
          address: `${listing.address}, ${listing.postal_code} ${listing.city}`,
          livingArea: listing.total_area_sqm,
          constructionYear: listing.year_built,
        },
        request: {
          purchasePrice: engineParams.purchasePrice,
          equityAmount: engineParams.equity,
          loanAmount: engineParams.loanAmount,
        },
        calculation: {
          interestRate: engineParams.interestRate,
          repaymentRate: engineParams.repaymentRate,
          monthlyRate: engineParams.monthlyRate,
          totalCosts: engineParams.totalCosts,
        },
        household: {
          netIncome: num(form.netIncomeMonthly),
          otherIncome: num(form.otherIncomeMonthly),
          currentRent: num(form.currentRentMonthly),
          livingExpenses: num(form.livingExpensesMonthly),
          otherFixedCosts: num(form.otherFixedCostsMonthly),
          employmentType: form.employmentType,
          employerName: form.employerName,
          bankSavings: num(form.bankSavings),
          securitiesValue: num(form.securitiesValue),
          lifeInsuranceValue: num(form.lifeInsuranceValue),
          salutation: form.salutation,
          birthDate: form.birthDate,
          birthPlace: form.birthPlace,
          addressStreet: form.addressStreet,
          addressPostalCode: form.addressPostalCode,
          addressCity: form.addressCity,
          maritalStatus: form.maritalStatus,
          employedSince: form.employedSince,
        },
      };

      const { data, error } = await supabase.functions.invoke('sot-futureroom-public-submit', {
        body: payload,
      });

      if (error) throw error;
      setPublicId(data?.publicId || 'SOT-F-...');
      setSubmitted(true);
      toast.success('Finanzierungsanfrage erfolgreich eingereicht!');
    } catch (err: unknown) {
      console.error('Submit error:', err);
      toast.error((err instanceof Error ? err.message : String(err)) || 'Fehler bei der Einreichung');
    } finally {
      setSubmitting(false);
    }
  };

  // ── KDF Badge ──────────────────────────────────────────────────────────

  const KdfBadge = () => {
    if (kdf.status === 'none') return null;
    const config = {
      green: { icon: CheckCircle2, label: 'Tragfähig', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      yellow: { icon: AlertTriangle, label: 'Knapp', className: 'bg-amber-100 text-amber-800 border-amber-200' },
      red: { icon: XCircle, label: 'Kritisch', className: 'bg-red-100 text-red-800 border-red-200' },
    }[kdf.status];
    const Icon = config.icon;
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${config.className}`}>
        <Icon className="w-4 h-4" />
        <span>{config.label}</span>
        <span className="text-xs opacity-75">({kdf.ratio.toFixed(0)}% Belastung)</span>
      </div>
    );
  };

  // ── Success View ───────────────────────────────────────────────────────

  if (submitted) {
    return (
      <Sheet open={open} onOpenChange={() => { setSubmitted(false); setForm(initialFormData); onClose(); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 p-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Anfrage eingereicht!</h2>
              <p className="text-muted-foreground mb-4">
                Ihre Finanzierungsanfrage wurde erfolgreich übermittelt.
              </p>
              {publicId && (
                <Badge variant="secondary" className="text-sm mb-4">
                  Vorgangsnummer: {publicId}
                </Badge>
              )}
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-left space-y-2 w-full">
              <p className="font-medium">Nächste Schritte:</p>
              <p>📧 Sie erhalten in Kürze eine E-Mail mit einer Dokumenten-Checkliste und Ihrer Vorgangsnummer.</p>
              <p>📎 Senden Sie uns Ihre Unterlagen (Gehaltsabrechnungen, Selbstauskunft etc.) per E-Mail an <span className="font-medium">finanzierung@futureroom.online</span> unter Angabe Ihrer Vorgangsnummer.</p>
              <p>📞 Ein Finanzierungsmanager wird sich innerhalb von 48 Stunden bei Ihnen melden.</p>
            </div>
            <Button onClick={() => { setSubmitted(false); setForm(initialFormData); onClose(); }} className="mt-4">
              Schließen
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // ── Main Form ──────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <SheetHeader>
            <SheetTitle className="text-lg">Finanzierung beantragen</SheetTitle>
            <SheetDescription>
              Füllen Sie Ihre Selbstauskunft aus — das Objekt und die Kalkulation sind bereits hinterlegt.
            </SheetDescription>
          </SheetHeader>

          {/* Object Summary */}
          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="font-medium truncate">{listing.title}</p>
              <p className="text-muted-foreground text-xs">
                {listing.postal_code} {listing.city} · {fmt(engineParams.purchasePrice)} · EK {fmt(engineParams.equity)} · Rate {fmt(engineParams.monthlyRate)}/Mo
              </p>
            </div>
          </div>

          {/* Live KDF Check */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kapitaldienstfähigkeits-Vorcheck</p>
            <KdfBadge />
            {kdf.status !== 'none' && (
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-muted/30 rounded p-2">
                  <p className="text-muted-foreground">Einnahmen</p>
                  <p className="font-semibold">{fmt(kdf.income)}</p>
                </div>
                <div className="bg-muted/30 rounded p-2">
                  <p className="text-muted-foreground">Ausgaben + Rate</p>
                  <p className="font-semibold">{fmt(kdf.expenses + engineParams.monthlyRate)}</p>
                </div>
                <div className="bg-muted/30 rounded p-2">
                  <p className="text-muted-foreground">Überschuss</p>
                  <p className={`font-semibold ${kdf.surplus < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {fmt(kdf.surplus)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Self-Disclosure Accordion */}
          <Accordion type="multiple" defaultValue={['personal']} className="space-y-2">
            {/* Section 1: Personal */}
            <AccordionItem value="personal" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold">Persönliche Daten</AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Anrede</Label>
                    <Select value={form.salutation} onValueChange={setSelect('salutation')}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Herr">Herr</SelectItem>
                        <SelectItem value="Frau">Frau</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Vorname *</Label>
                    <Input className="h-9" value={form.firstName} onChange={set('firstName')} />
                  </div>
                  <div>
                    <Label className="text-xs">Nachname *</Label>
                    <Input className="h-9" value={form.lastName} onChange={set('lastName')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Geburtsdatum</Label>
                    <Input type="date" className="h-9" value={form.birthDate} onChange={set('birthDate')} />
                  </div>
                  <div>
                    <Label className="text-xs">Geburtsort</Label>
                    <Input className="h-9" value={form.birthPlace} onChange={set('birthPlace')} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Straße, Nr.</Label>
                  <Input className="h-9" value={form.addressStreet} onChange={set('addressStreet')} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">PLZ</Label>
                    <Input className="h-9" value={form.addressPostalCode} onChange={set('addressPostalCode')} />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Ort</Label>
                    <Input className="h-9" value={form.addressCity} onChange={set('addressCity')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Telefon</Label>
                    <Input type="tel" className="h-9" value={form.phone} onChange={set('phone')} />
                  </div>
                  <div>
                    <Label className="text-xs">E-Mail *</Label>
                    <Input type="email" className="h-9" value={form.email} onChange={set('email')} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Familienstand</Label>
                  <Select value={form.maritalStatus} onValueChange={setSelect('maritalStatus')}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ledig">Ledig</SelectItem>
                      <SelectItem value="verheiratet">Verheiratet</SelectItem>
                      <SelectItem value="geschieden">Geschieden</SelectItem>
                      <SelectItem value="verwitwet">Verwitwet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 2: Income */}
            <AccordionItem value="income" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold">Beschäftigung & Einkommen</AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div>
                  <Label className="text-xs">Beschäftigungsart</Label>
                  <Select value={form.employmentType} onValueChange={setSelect('employmentType')}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="angestellt">Angestellt</SelectItem>
                      <SelectItem value="selbstaendig">Selbständig</SelectItem>
                      <SelectItem value="beamter">Beamter</SelectItem>
                      <SelectItem value="rentner">Rentner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Arbeitgeber</Label>
                    <Input className="h-9" value={form.employerName} onChange={set('employerName')} />
                  </div>
                  <div>
                    <Label className="text-xs">Beschäftigt seit</Label>
                    <Input type="date" className="h-9" value={form.employedSince} onChange={set('employedSince')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nettoeinkommen/Monat *</Label>
                    <Input type="number" className="h-9" placeholder="€" value={form.netIncomeMonthly} onChange={set('netIncomeMonthly')} />
                  </div>
                  <div>
                    <Label className="text-xs">Sonstige Einnahmen/Mo</Label>
                    <Input type="number" className="h-9" placeholder="€" value={form.otherIncomeMonthly} onChange={set('otherIncomeMonthly')} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Section 3: Expenses */}
            <AccordionItem value="expenses" className="border rounded-lg px-4">
              <AccordionTrigger className="text-sm font-semibold">Ausgaben & Vermögen</AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Kaltmiete aktuell/Mo</Label>
                    <Input type="number" className="h-9" placeholder="€" value={form.currentRentMonthly} onChange={set('currentRentMonthly')} />
                  </div>
                  <div>
                    <Label className="text-xs">Lebenshaltung/Mo</Label>
                    <Input type="number" className="h-9" placeholder="€" value={form.livingExpensesMonthly} onChange={set('livingExpensesMonthly')} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Sonstige Fixkosten/Mo (Leasing, Unterhalt etc.)</Label>
                  <Input type="number" className="h-9" placeholder="€" value={form.otherFixedCostsMonthly} onChange={set('otherFixedCostsMonthly')} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Ersparnisse</Label>
                    <Input type="number" className="h-9" placeholder="€" value={form.bankSavings} onChange={set('bankSavings')} />
                  </div>
                  <div>
                    <Label className="text-xs">Wertpapiere</Label>
                    <Input type="number" className="h-9" placeholder="€" value={form.securitiesValue} onChange={set('securitiesValue')} />
                  </div>
                  <div>
                    <Label className="text-xs">Lebensvers.</Label>
                    <Input type="number" className="h-9" placeholder="€" value={form.lifeInsuranceValue} onChange={set('lifeInsuranceValue')} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

        </div>

        {/* Sticky Submit Footer — Two-Step */}
        <div className="border-t bg-background p-4 shrink-0 space-y-3">
          {/* Consent */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Checkbox
              id="consent"
              checked={consentChecked}
              onCheckedChange={(v) => setConsentChecked(v === true)}
              className="mt-0.5"
            />
            <label htmlFor="consent" className="cursor-pointer leading-relaxed">
              Ich stimme der Verarbeitung meiner Daten zum Zweck der Finanzierungsanfrage zu und habe die Datenschutzerklärung gelesen.
            </label>
          </div>

          {/* Bonitäts-Result Banner */}
          {bonitaetResult === 'positive' && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Ihr Bonitätscheck war positiv. Herzlichen Glückwunsch!</span>
            </div>
          )}
          {bonitaetResult === 'negative' && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>Bitte prüfen Sie Ihre Angaben — die Belastungsquote ist zu hoch.</span>
            </div>
          )}

          {/* Step 1: Bonitätsprüfung */}
          {!bonitaetChecked && (
            <Button
              type="button"
              onClick={() => {
                if (kdf.status === 'green' || kdf.status === 'yellow') {
                  setBonitaetChecked(true);
                  setBonitaetResult('positive');
                } else {
                  setBonitaetResult('negative');
                }
              }}
              disabled={kdf.status === 'none' || !consentChecked}
              className="w-full"
              size="lg"
              variant={bonitaetResult === 'negative' ? 'destructive' : 'default'}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Bonitätsprüfung starten
            </Button>
          )}

          {/* Step 2: Finanzierung einreichen */}
          {bonitaetChecked && (
            <Button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className="w-full"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird eingereicht…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Finanzierung einreichen
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}