/**
 * FutureRoomBonitat — 7-Step Financing Wizard
 * 
 * Public wizard (no login required) — freely navigable.
 * All steps can be browsed without filling in any data.
 * Only the final "Finanzierung einreichen" button requires:
 *   1. Contact data (name + email)
 *   2. Bonitätsprüfung completed
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { calcAnnuity, calcHaushaltsrechnung } from '@/engines/finanzierung/engine';
import { 
  ChevronRight, ChevronLeft, CheckCircle2, 
  User, Building2, Calculator, BarChart3, Home as HomeIcon, 
  Shield, Send, UserPlus, Sparkles, AlertTriangle, XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

type Step = 'contact' | 'object' | 'request' | 'calculator' | 'household' | 'bonitat' | 'decision';

interface FormData {
  // Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Object
  objectType: string;
  objectAddress: string;
  objectLivingArea: string;
  objectConstructionYear: string;
  objectLocationQuality: string;
  // Request
  purchasePrice: string;
  equityAmount: string;
  modernizationCosts: string;
  purpose: string;
  maxMonthlyRate: string;
  fixedRatePeriod: string;
  repaymentRate: string;
  // Calculator results
  loanAmount: string;
  interestRate: string;
  monthlyRate: string;
  // Household
  netIncome: string;
  otherIncome: string;
  currentRent: string;
  otherCosts: string;
  employmentType: string;
  employer: string;
}

const initialFormData: FormData = {
  firstName: '', lastName: '', email: '', phone: '',
  objectType: '', objectAddress: '', objectLivingArea: '', objectConstructionYear: '', objectLocationQuality: '',
  purchasePrice: '', equityAmount: '', modernizationCosts: '', purpose: 'kauf', maxMonthlyRate: '', fixedRatePeriod: '10', repaymentRate: '2',
  loanAmount: '', interestRate: '3.5', monthlyRate: '',
  netIncome: '', otherIncome: '', currentRent: '', otherCosts: '', employmentType: '', employer: '',
};

export default function FutureRoomBonitat() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('contact');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [bonitaetChecked, setBonitaetChecked] = useState(false);
  const [bonitaetResult, setBonitaetResult] = useState<'positive' | 'marginal' | 'negative' | null>(null);

  const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
    { id: 'contact', label: 'Kontakt', icon: <User className="h-4 w-4" /> },
    { id: 'object', label: 'Objekt', icon: <Building2 className="h-4 w-4" /> },
    { id: 'request', label: 'Eckdaten', icon: <HomeIcon className="h-4 w-4" /> },
    { id: 'calculator', label: 'Kalkulation', icon: <Calculator className="h-4 w-4" /> },
    { id: 'household', label: 'Haushalt', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'bonitat', label: 'Prüfung', icon: <Shield className="h-4 w-4" /> },
    { id: 'decision', label: 'Abschluss', icon: <Send className="h-4 w-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Free navigation — no validation blocks
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1].id;
      // Reset bonität check when going back to household
      if (currentStep === 'bonitat') {
        setBonitaetChecked(false);
        setBonitaetResult(null);
      }
      setCurrentStep(prevStep);
    }
  };

  // Calculate loan amount dynamically
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  const equity = parseFloat(formData.equityAmount) || 0;
  const modernization = parseFloat(formData.modernizationCosts) || 0;
  const transferTax = purchasePrice * 0.065;
  const notaryCosts = purchasePrice * 0.02;
  const totalCosts = purchasePrice + modernization + transferTax + notaryCosts;
  const loanAmount = Math.max(0, totalCosts - equity);
  const interestRate = parseFloat(formData.interestRate) || 3.5;
  const repaymentRate = parseFloat(formData.repaymentRate) || 2;
  const annuityCalc = loanAmount > 0
    ? calcAnnuity({ loanAmount, interestRatePercent: interestRate, repaymentRatePercent: repaymentRate, fixedRatePeriodYears: 10 })
    : null;
  const monthlyRate = annuityCalc?.monthlyRate ?? 0;

  // Household calc — delegated to engine
  const netIncome = parseFloat(formData.netIncome) || 0;
  const otherIncome = parseFloat(formData.otherIncome) || 0;
  const currentRent = parseFloat(formData.currentRent) || 0;
  const otherCosts = parseFloat(formData.otherCosts) || 0;

  const hhResult = calcHaushaltsrechnung({
    incomes: [
      { label: 'Nettoeinkommen', amount: netIncome, category: 'salary' },
      { label: 'Sonstige Einnahmen', amount: otherIncome, category: 'other' },
    ],
    expenses: [
      { label: 'Sonstige Kosten', amount: otherCosts, category: 'other' },
    ],
    plannedRate: monthlyRate,
  });
  const totalIncome = hhResult.totalIncome;
  const totalExpenses = hhResult.totalExpenses;
  const availableForRate = hhResult.surplus;
  const kdfRatio = totalIncome > 0 ? (monthlyRate / totalIncome) * 100 : 0;

  // Bonität check
  const handleBonitaetCheck = () => {
    if (kdfRatio <= 35) {
      setBonitaetResult('positive');
    } else if (kdfRatio <= 45) {
      setBonitaetResult('marginal');
    } else {
      setBonitaetResult('negative');
    }
    setBonitaetChecked(true);
  };

  // Check readiness for final submit
  const hasContactData = !!(formData.firstName && formData.email);
  const canSubmit = hasContactData && bonitaetChecked;

  // Checklist items for decision step
  const checklistItems = [
    { label: 'Kontaktdaten (Name + E-Mail)', done: hasContactData },
    { label: 'Objektdaten', done: !!formData.objectType },
    { label: 'Finanzierungseckdaten', done: !!formData.purchasePrice },
    { label: 'Haushaltsdaten', done: !!formData.netIncome },
    { label: 'Bonitätsprüfung durchgeführt', done: bonitaetChecked },
  ];

  // Option A: Quick submit
  const handleQuickSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-futureroom-public-submit', {
        body: {
          source: 'zone3_futureroom_wizard',
          contact: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          },
          object: {
            type: formData.objectType,
            address: formData.objectAddress,
            livingArea: parseFloat(formData.objectLivingArea) || null,
            constructionYear: parseInt(formData.objectConstructionYear) || null,
            locationQuality: formData.objectLocationQuality,
          },
          request: {
            purchasePrice,
            equityAmount: equity,
            loanAmount,
            modernizationCosts: modernization,
            purpose: formData.purpose,
            maxMonthlyRate: parseFloat(formData.maxMonthlyRate) || monthlyRate,
            fixedRatePeriod: parseInt(formData.fixedRatePeriod) || 10,
            repaymentRate,
          },
          calculation: {
            interestRate,
            monthlyRate,
            transferTax,
            notaryCosts,
            totalCosts,
          },
          household: {
            netIncome,
            otherIncome,
            currentRent,
            otherCosts,
            employmentType: formData.employmentType,
            employer: formData.employer,
            kdfRatio,
            availableForRate,
          },
        },
      });
      if (error) throw error;
      setPublicId(data?.publicId || 'FR-' + Date.now());
      setSubmitted(true);
      toast.success('Ihre Anfrage wurde erfolgreich eingereicht!');
    } catch (err: unknown) {
      console.error('Submit error:', err);
      toast.error('Fehler beim Einreichen. Bitte versuchen Sie es erneut.');
    } finally {
      setSubmitting(false);
    }
  }, [formData, canSubmit, purchasePrice, equity, loanAmount, modernization, monthlyRate, interestRate, repaymentRate, transferTax, notaryCosts, totalCosts, netIncome, otherIncome, currentRent, otherCosts, kdfRatio, availableForRate]);

  // Option B: Save to localStorage and redirect to login
  const handleCreateAccount = () => {
    localStorage.setItem('futureroom_intake_data', JSON.stringify(formData));
    navigate('/website/futureroom/login?from=bonitat');
  };

  const formatCurrency = (val: number) => val.toLocaleString('de-DE', { maximumFractionDigits: 0 });

  // Confirmation screen after quick submit
  if (submitted) {
    return (
      <div className="py-16" style={{ background: 'hsl(210 25% 97%)' }}>
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="fr-form-card">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'hsl(165 70% 36% / 0.1)' }}>
              <CheckCircle2 className="h-10 w-10" style={{ color: 'hsl(165 70% 36%)' }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'hsl(210 30% 15%)' }}>
              Vielen Dank!
            </h1>
            <p className="text-gray-500 mb-4">
              Ihre Finanzierungsanfrage wurde erfolgreich eingereicht. Ein Finanzierungsmanager wird sich innerhalb von 48 Stunden bei Ihnen melden.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              📧 Sie erhalten in Kürze eine E-Mail mit einer Dokumenten-Checkliste und Ihrer Vorgangsnummer.
              Senden Sie uns Ihre Unterlagen per E-Mail an <span className="font-medium">finanzierung@futureroom.online</span>.
            </p>
            {publicId && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6" style={{ background: 'hsl(165 70% 36% / 0.08)' }}>
                <span className="text-sm text-gray-500">Referenz:</span>
                <span className="font-mono font-bold" style={{ color: 'hsl(165 70% 36%)' }}>{publicId}</span>
              </div>
            )}
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'hsl(165 70% 36% / 0.06)' }}>
              <Shield className="h-5 w-5 flex-shrink-0" style={{ color: 'hsl(165 70% 36%)' }} />
              <span className="text-sm text-left" style={{ color: 'hsl(210 30% 30%)' }}>
                Möchten Sie Ihre Unterlagen selbst pflegen und den Status verfolgen? Erstellen Sie ein kostenloses Konto.
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
              <button onClick={handleCreateAccount} className="fr-btn fr-btn-primary">
                <UserPlus className="h-4 w-4" />
                Konto erstellen
              </button>
              <button onClick={() => navigate('/website/futureroom')} className="fr-btn" style={{ background: 'transparent', border: '2px solid hsl(210 20% 88%)', color: 'hsl(210 30% 15%)' }}>
                Zurück zur Startseite
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12" style={{ background: 'hsl(210 25% 97%)' }}>
      <SEOHead
        brand="futureroom"
        page={{
          title: 'Finanzierung starten — Bonitätsprüfung',
          description: 'Starten Sie Ihre Immobilienfinanzierung: Digitale Selbstauskunft, KI-Bonitätsprüfung und automatische Bankeinreichung. Kostenlos und unverbindlich.',
          path: '/bonitat',
        }}
      />
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(210 30% 15%)' }}>
            Finanzierungsanfrage starten
          </h1>
          <p className="text-gray-500">
            Kostenlos und unverbindlich — klicken Sie sich durch alle Schritte, um einen Überblick zu erhalten.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="fr-progress-bar mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="fr-progress-step">
              <div className={`fr-progress-dot ${
                index < currentStepIndex ? 'completed' : 
                index === currentStepIndex ? 'active' : ''
              }`}>
                {index < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : step.icon}
              </div>
              <span className={`fr-progress-label ${index === currentStepIndex ? 'active' : ''}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="fr-form-card">
          {/* Step: Contact */}
          {currentStep === 'contact' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'hsl(210 30% 15%)' }}>Ihre Kontaktdaten</h2>
                <p className="text-gray-500 text-sm">Wie können wir Sie erreichen?</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="fr-label">Vorname *</label>
                  <input type="text" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} className="fr-input" />
                </div>
                <div>
                  <label className="fr-label">Nachname *</label>
                  <input type="text" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} className="fr-input" />
                </div>
              </div>
              <div>
                <label className="fr-label">E-Mail *</label>
                <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="fr-input" />
              </div>
              <div>
                <label className="fr-label">Telefon</label>
                <input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="fr-input" />
              </div>
            </div>
          )}

          {/* Step: Object */}
          {currentStep === 'object' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'hsl(210 30% 15%)' }}>Das Objekt</h2>
                <p className="text-gray-500 text-sm">Welche Immobilie möchten Sie finanzieren?</p>
              </div>
              <div>
                <label className="fr-label">Objektart</label>
                <select value={formData.objectType} onChange={(e) => handleChange('objectType', e.target.value)} className="fr-input">
                  <option value="">Bitte wählen</option>
                  <option value="etw">Eigentumswohnung</option>
                  <option value="efh">Einfamilienhaus</option>
                  <option value="dhh">Doppelhaushälfte</option>
                  <option value="rh">Reihenhaus</option>
                  <option value="mfh">Mehrfamilienhaus</option>
                  <option value="grundstueck">Grundstück</option>
                </select>
              </div>
              <div>
                <label className="fr-label">Adresse / Standort</label>
                <input type="text" value={formData.objectAddress} onChange={(e) => handleChange('objectAddress', e.target.value)} placeholder="PLZ, Stadt oder Straße" className="fr-input" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="fr-label">Wohnfläche (m²)</label>
                  <input type="number" value={formData.objectLivingArea} onChange={(e) => handleChange('objectLivingArea', e.target.value)} className="fr-input" />
                </div>
                <div>
                  <label className="fr-label">Baujahr</label>
                  <input type="number" value={formData.objectConstructionYear} onChange={(e) => handleChange('objectConstructionYear', e.target.value)} className="fr-input" />
                </div>
              </div>
              <div>
                <label className="fr-label">Lagequalität</label>
                <select value={formData.objectLocationQuality} onChange={(e) => handleChange('objectLocationQuality', e.target.value)} className="fr-input">
                  <option value="">Bitte wählen</option>
                  <option value="sehr_gut">Sehr gut</option>
                  <option value="gut">Gut</option>
                  <option value="mittel">Mittel</option>
                  <option value="einfach">Einfach</option>
                </select>
              </div>
            </div>
          )}

          {/* Step: Request (Eckdaten) */}
          {currentStep === 'request' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'hsl(210 30% 15%)' }}>Finanzierungseckdaten</h2>
                <p className="text-gray-500 text-sm">Die Eckdaten Ihrer Finanzierung</p>
              </div>
              <div>
                <label className="fr-label">Verwendungszweck</label>
                <select value={formData.purpose} onChange={(e) => handleChange('purpose', e.target.value)} className="fr-input">
                  <option value="kauf">Kauf</option>
                  <option value="anschlussfinanzierung">Anschlussfinanzierung</option>
                  <option value="modernisierung">Modernisierung</option>
                  <option value="kapitalanlage">Kapitalanlage</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="fr-label">Kaufpreis (€) *</label>
                  <input type="number" value={formData.purchasePrice} onChange={(e) => handleChange('purchasePrice', e.target.value)} className="fr-input" />
                </div>
                <div>
                  <label className="fr-label">Eigenkapital (€)</label>
                  <input type="number" value={formData.equityAmount} onChange={(e) => handleChange('equityAmount', e.target.value)} className="fr-input" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="fr-label">Modernisierungskosten (€)</label>
                  <input type="number" value={formData.modernizationCosts} onChange={(e) => handleChange('modernizationCosts', e.target.value)} className="fr-input" />
                </div>
                <div>
                  <label className="fr-label">Max. monatliche Rate (€)</label>
                  <input type="number" value={formData.maxMonthlyRate} onChange={(e) => handleChange('maxMonthlyRate', e.target.value)} placeholder="Optional" className="fr-input" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="fr-label">Zinsbindung (Jahre)</label>
                  <select value={formData.fixedRatePeriod} onChange={(e) => handleChange('fixedRatePeriod', e.target.value)} className="fr-input">
                    <option value="5">5 Jahre</option>
                    <option value="10">10 Jahre</option>
                    <option value="15">15 Jahre</option>
                    <option value="20">20 Jahre</option>
                    <option value="25">25 Jahre</option>
                  </select>
                </div>
                <div>
                  <label className="fr-label">Tilgungssatz (%)</label>
                  <input type="number" step="0.1" value={formData.repaymentRate} onChange={(e) => handleChange('repaymentRate', e.target.value)} className="fr-input" />
                </div>
              </div>
            </div>
          )}

          {/* Step: Calculator */}
          {currentStep === 'calculator' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'hsl(210 30% 15%)' }}>Überschlägige Kalkulation</h2>
                <p className="text-gray-500 text-sm">Auf Basis Ihrer Angaben</p>
              </div>
              <div className="p-5 rounded-xl space-y-3" style={{ background: 'hsl(210 25% 97%)' }}>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'hsl(210 20% 88%)' }}>
                  <span className="text-gray-500">Kaufpreis</span>
                  <span className="font-medium" style={{ color: 'hsl(210 30% 15%)' }}>{purchasePrice > 0 ? `${formatCurrency(purchasePrice)} €` : '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'hsl(210 20% 88%)' }}>
                  <span className="text-gray-500">Nebenkosten (ca. 8,5%)</span>
                  <span className="font-medium" style={{ color: 'hsl(210 30% 15%)' }}>{purchasePrice > 0 ? `${formatCurrency(transferTax + notaryCosts)} €` : '—'}</span>
                </div>
                {modernization > 0 && (
                  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'hsl(210 20% 88%)' }}>
                    <span className="text-gray-500">Modernisierung</span>
                    <span className="font-medium" style={{ color: 'hsl(210 30% 15%)' }}>{formatCurrency(modernization)} €</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'hsl(210 20% 88%)' }}>
                  <span className="text-gray-500">Eigenkapital</span>
                  <span className="font-medium" style={{ color: 'hsl(165 70% 36%)' }}>{equity > 0 ? `- ${formatCurrency(equity)} €` : '—'}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-lg" style={{ borderTop: '2px solid hsl(165 70% 36% / 0.3)' }}>
                  <span style={{ color: 'hsl(210 30% 15%)' }}>Darlehensbetrag</span>
                  <span style={{ color: 'hsl(165 70% 36%)' }}>{loanAmount > 0 ? `${formatCurrency(loanAmount)} €` : '—'}</span>
                </div>
              </div>

              <div className="p-5 rounded-xl" style={{ background: 'linear-gradient(135deg, hsl(165 70% 36% / 0.08) 0%, hsl(158 64% 52% / 0.04) 100%)', border: '1px solid hsl(165 70% 36% / 0.2)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5" style={{ color: 'hsl(165 70% 36%)' }} />
                  <span className="font-semibold" style={{ color: 'hsl(210 30% 15%)' }}>Überschlägige Monatsrate</span>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="fr-label">Sollzins (%)</label>
                    <input type="number" step="0.1" value={formData.interestRate} onChange={(e) => handleChange('interestRate', e.target.value)} className="fr-input" />
                  </div>
                  <div>
                    <label className="fr-label">Tilgung (%)</label>
                    <input type="number" step="0.1" value={formData.repaymentRate} onChange={(e) => handleChange('repaymentRate', e.target.value)} className="fr-input" />
                  </div>
                  <div className="flex flex-col justify-end">
                    <span className="text-sm text-gray-500">Monatliche Rate</span>
                    <span className="text-2xl font-bold" style={{ color: 'hsl(165 70% 36%)' }}>
                      {monthlyRate > 0 ? `${formatCurrency(Math.round(monthlyRate))} €` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Household */}
          {currentStep === 'household' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'hsl(210 30% 15%)' }}>Kapitaldienstfähigkeit</h2>
                <p className="text-gray-500 text-sm">Ihre Einnahmen und Ausgaben</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm" style={{ color: 'hsl(165 70% 36%)' }}>Einnahmen</h3>
                  <div>
                    <label className="fr-label">Nettoeinkommen mtl. (€) *</label>
                    <input type="number" value={formData.netIncome} onChange={(e) => handleChange('netIncome', e.target.value)} className="fr-input" />
                  </div>
                  <div>
                    <label className="fr-label">Sonstige Einnahmen mtl. (€)</label>
                    <input type="number" value={formData.otherIncome} onChange={(e) => handleChange('otherIncome', e.target.value)} className="fr-input" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm" style={{ color: 'hsl(0 65% 51%)' }}>Ausgaben</h3>
                  <div>
                    <label className="fr-label">Aktuelle Kaltmiete mtl. (€)</label>
                    <input type="number" value={formData.currentRent} onChange={(e) => handleChange('currentRent', e.target.value)} className="fr-input" />
                  </div>
                  <div>
                    <label className="fr-label">Sonstige Fixkosten mtl. (€)</label>
                    <input type="number" value={formData.otherCosts} onChange={(e) => handleChange('otherCosts', e.target.value)} className="fr-input" />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="fr-label">Beschäftigungsverhältnis</label>
                  <select value={formData.employmentType} onChange={(e) => handleChange('employmentType', e.target.value)} className="fr-input">
                    <option value="">Bitte wählen</option>
                    <option value="angestellt">Angestellt</option>
                    <option value="beamter">Beamter</option>
                    <option value="selbststaendig">Selbstständig</option>
                    <option value="freiberufler">Freiberufler</option>
                    <option value="rentner">Rentner</option>
                  </select>
                </div>
                <div>
                  <label className="fr-label">Arbeitgeber</label>
                  <input type="text" value={formData.employer} onChange={(e) => handleChange('employer', e.target.value)} className="fr-input" />
                </div>
              </div>
              {/* KDF Summary */}
              <div className="p-4 rounded-xl" style={{ background: totalIncome > 0 ? (kdfRatio <= 35 ? 'hsl(165 70% 36% / 0.08)' : kdfRatio <= 45 ? 'hsl(45 100% 51% / 0.08)' : 'hsl(0 65% 51% / 0.08)') : 'hsl(210 25% 97%)' }}>
                <div className="grid gap-4 md:grid-cols-3 text-center">
                  <div>
                    <span className="text-sm text-gray-500">Einkommen gesamt</span>
                    <div className="font-bold text-lg" style={{ color: 'hsl(165 70% 36%)' }}>{totalIncome > 0 ? `${formatCurrency(totalIncome)} €` : '—'}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Rate / Einkommen</span>
                    <div className="font-bold text-lg" style={{ color: totalIncome > 0 ? (kdfRatio <= 35 ? 'hsl(165 70% 36%)' : kdfRatio <= 45 ? 'hsl(45 100% 40%)' : 'hsl(0 65% 51%)') : 'hsl(210 30% 15%)' }}>
                      {totalIncome > 0 ? `${kdfRatio.toFixed(1)}%` : '—'}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Verfügbar für Rate</span>
                    <div className="font-bold text-lg" style={{ color: 'hsl(210 30% 15%)' }}>{totalIncome > 0 ? `${formatCurrency(availableForRate)} €` : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Bonität */}
          {currentStep === 'bonitat' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'hsl(210 30% 15%)' }}>Bonitätsprüfung</h2>
                <p className="text-gray-500 text-sm">Prüfen Sie Ihre Finanzierbarkeit — optional, aber erforderlich für die Einreichung.</p>
              </div>

              {/* Summary of relevant values */}
              <div className="p-5 rounded-xl space-y-3" style={{ background: 'hsl(210 25% 97%)' }}>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'hsl(210 20% 88%)' }}>
                  <span className="text-gray-500">Darlehensbetrag</span>
                  <span className="font-medium" style={{ color: 'hsl(210 30% 15%)' }}>{loanAmount > 0 ? `${formatCurrency(loanAmount)} €` : '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'hsl(210 20% 88%)' }}>
                  <span className="text-gray-500">Monatliche Rate</span>
                  <span className="font-medium" style={{ color: 'hsl(210 30% 15%)' }}>{monthlyRate > 0 ? `${formatCurrency(Math.round(monthlyRate))} €` : '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b" style={{ borderColor: 'hsl(210 20% 88%)' }}>
                  <span className="text-gray-500">Nettoeinkommen</span>
                  <span className="font-medium" style={{ color: 'hsl(210 30% 15%)' }}>{totalIncome > 0 ? `${formatCurrency(totalIncome)} €` : '—'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">KDF-Quote</span>
                  <span className="font-bold" style={{ color: totalIncome > 0 ? (kdfRatio <= 35 ? 'hsl(165 70% 36%)' : kdfRatio <= 45 ? 'hsl(45 100% 40%)' : 'hsl(0 65% 51%)') : 'hsl(210 30% 15%)' }}>
                    {totalIncome > 0 && monthlyRate > 0 ? `${kdfRatio.toFixed(1)}%` : '—'}
                  </span>
                </div>
              </div>

              {/* Check Button */}
              {!bonitaetChecked && (
                <button
                  onClick={handleBonitaetCheck}
                  className="w-full p-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, hsl(165 70% 36%) 0%, hsl(158 64% 42%) 100%)' }}
                >
                  <Shield className="h-5 w-5" />
                  Bonitätsprüfung starten
                </button>
              )}

              {/* Result Banners */}
              {bonitaetChecked && bonitaetResult === 'positive' && (
                <div className="p-5 rounded-xl" style={{ background: 'hsl(165 70% 36% / 0.08)', border: '2px solid hsl(165 70% 36% / 0.3)' }}>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" style={{ color: 'hsl(165 70% 36%)' }} />
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'hsl(165 70% 36%)' }}>Herzlichen Glückwunsch!</h3>
                      <p className="text-sm mt-1" style={{ color: 'hsl(210 30% 30%)' }}>
                        Ihre Bonitätsprüfung war positiv. Mit einer KDF-Quote von {kdfRatio.toFixed(1)}% liegt Ihre Belastung im grünen Bereich. 
                        Sie können Ihre Finanzierung jetzt einreichen.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {bonitaetChecked && bonitaetResult === 'marginal' && (
                <div className="p-5 rounded-xl" style={{ background: 'hsl(45 100% 51% / 0.08)', border: '2px solid hsl(45 100% 51% / 0.3)' }}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-0.5" style={{ color: 'hsl(45 100% 40%)' }} />
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'hsl(45 100% 35%)' }}>Grenzwertig tragfähig</h3>
                      <p className="text-sm mt-1" style={{ color: 'hsl(210 30% 30%)' }}>
                        Ihre KDF-Quote von {kdfRatio.toFixed(1)}% liegt im Grenzbereich. Eine Finanzierung ist möglich, 
                        aber ein Berater wird die Details genauer prüfen. Sie können trotzdem einreichen.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {bonitaetChecked && bonitaetResult === 'negative' && (
                <div className="p-5 rounded-xl" style={{ background: 'hsl(0 65% 51% / 0.08)', border: '2px solid hsl(0 65% 51% / 0.3)' }}>
                  <div className="flex items-start gap-3">
                    <XCircle className="h-6 w-6 flex-shrink-0 mt-0.5" style={{ color: 'hsl(0 65% 51%)' }} />
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: 'hsl(0 65% 45%)' }}>Belastungsquote zu hoch</h3>
                      <p className="text-sm mt-1" style={{ color: 'hsl(210 30% 30%)' }}>
                        Ihre KDF-Quote von {kdfRatio.toFixed(1)}% übersteigt den üblichen Rahmen. 
                        Prüfen Sie Ihre Angaben oder passen Sie Eigenkapital bzw. Kaufpreis an. 
                        Sie können trotzdem einreichen — ein Berater wird sich Ihren Fall ansehen.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Decision (Abschluss) */}
          {currentStep === 'decision' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'hsl(210 30% 15%)' }}>Finanzierung einreichen</h2>
                <p className="text-gray-500 text-sm">Überprüfen Sie Ihre Angaben und reichen Sie Ihre Anfrage ein.</p>
              </div>

              {/* Checklist */}
              <div className="p-5 rounded-xl space-y-3" style={{ background: 'hsl(210 25% 97%)' }}>
                <h3 className="font-semibold text-sm mb-3" style={{ color: 'hsl(210 30% 15%)' }}>Checkliste</h3>
                {checklistItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 py-1.5">
                    {item.done ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: 'hsl(165 70% 36%)' }} />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 flex-shrink-0" style={{ borderColor: 'hsl(210 20% 80%)' }} />
                    )}
                    <span className={`text-sm ${item.done ? 'font-medium' : 'text-gray-400'}`} style={item.done ? { color: 'hsl(210 30% 15%)' } : {}}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Missing data hint */}
              {!canSubmit && (
                <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'hsl(45 100% 51% / 0.08)', border: '1px solid hsl(45 100% 51% / 0.2)' }}>
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'hsl(45 100% 40%)' }} />
                  <span className="text-sm" style={{ color: 'hsl(210 30% 30%)' }}>
                    Bitte füllen Sie die offenen Schritte aus und führen Sie die Bonitätsprüfung durch, bevor Sie einreichen. 
                    Sie können jederzeit über die Navigation zurückgehen.
                  </span>
                </div>
              )}

              {/* Summary */}
              <div className="p-4 rounded-xl text-sm space-y-2" style={{ background: 'hsl(210 25% 97%)' }}>
                <div className="flex justify-between"><span className="text-gray-500">Kontakt</span><span className="font-medium">{formData.firstName ? `${formData.firstName} ${formData.lastName} (${formData.email})` : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Kaufpreis</span><span className="font-medium">{purchasePrice > 0 ? `${formatCurrency(purchasePrice)} €` : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Darlehen</span><span className="font-medium">{loanAmount > 0 ? `${formatCurrency(loanAmount)} €` : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Rate</span><span className="font-medium">{monthlyRate > 0 ? `${formatCurrency(Math.round(monthlyRate))} €/Monat` : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">KDF-Quote</span><span className="font-medium">{totalIncome > 0 && monthlyRate > 0 ? `${kdfRatio.toFixed(1)}%` : '—'}</span></div>
                {bonitaetChecked && (
                  <div className="flex justify-between"><span className="text-gray-500">Bonitätsprüfung</span><span className="font-medium" style={{ color: bonitaetResult === 'positive' ? 'hsl(165 70% 36%)' : bonitaetResult === 'marginal' ? 'hsl(45 100% 40%)' : 'hsl(0 65% 51%)' }}>
                    {bonitaetResult === 'positive' ? '✓ Positiv' : bonitaetResult === 'marginal' ? '⚠ Grenzwertig' : '✗ Hoch'}
                  </span></div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleQuickSubmit}
                disabled={!canSubmit || submitting}
                className="w-full p-5 rounded-xl text-left transition-all"
                style={{ 
                  background: canSubmit 
                    ? 'linear-gradient(135deg, hsl(165 70% 36% / 0.06) 0%, hsl(158 64% 52% / 0.03) 100%)'
                    : 'hsl(210 25% 97%)',
                  border: `2px solid ${canSubmit ? 'hsl(165 70% 36% / 0.3)' : 'hsl(210 20% 88%)'}`,
                  opacity: canSubmit ? 1 : 0.6,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: canSubmit ? 'hsl(165 70% 36% / 0.15)' : 'hsl(210 25% 92%)' }}>
                    <Send className="h-6 w-6" style={{ color: canSubmit ? 'hsl(165 70% 36%)' : 'hsl(210 20% 70%)' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: canSubmit ? 'hsl(210 30% 15%)' : 'hsl(210 20% 60%)' }}>
                      {submitting ? 'Wird eingereicht...' : 'Finanzierung einreichen'}
                    </h3>
                    <p className="text-sm" style={{ color: canSubmit ? 'hsl(210 15% 45%)' : 'hsl(210 15% 65%)' }}>
                      Ein Finanzierungsmanager meldet sich innerhalb von 48 Stunden bei Ihnen.
                    </p>
                  </div>
                </div>
              </button>

              {/* Account option */}
              <button
                onClick={handleCreateAccount}
                className="w-full p-5 rounded-xl text-left transition-all hover:shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, hsl(210 60% 50% / 0.06) 0%, hsl(210 50% 60% / 0.03) 100%)',
                  border: '2px solid hsl(210 60% 50% / 0.3)',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(210 60% 50% / 0.15)' }}>
                    <UserPlus className="h-6 w-6" style={{ color: 'hsl(210 60% 50%)' }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: 'hsl(210 30% 15%)' }}>
                      Konto erstellen & Akte pflegen
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Erstellen Sie ein kostenloses Konto, laden Sie Dokumente hoch und verfolgen Sie den Status Ihrer Finanzierung.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {['Selbstauskunft', 'Dokumenten-Upload', 'Status-Tracking'].map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 rounded-full" style={{ background: 'hsl(210 60% 50% / 0.1)', color: 'hsl(210 60% 50%)' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'hsl(165 70% 36% / 0.06)' }}>
                <Shield className="h-5 w-5 flex-shrink-0" style={{ color: 'hsl(165 70% 36%)' }} />
                <span className="text-sm" style={{ color: 'hsl(165 70% 36%)' }}>
                  Ihre Daten werden verschlüsselt übertragen und DSGVO-konform verarbeitet.
                </span>
              </div>
            </div>
          )}

          {/* Navigation — always visible, always active */}
          {currentStep !== 'decision' && (
            <div className="flex justify-between mt-8 pt-6 border-t" style={{ borderColor: 'hsl(210 20% 88%)' }}>
              <button
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className={`fr-btn ${currentStepIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ background: 'transparent', border: '2px solid hsl(210 20% 88%)', color: 'hsl(210 30% 15%)' }}
              >
                <ChevronLeft className="h-4 w-4" />
                Zurück
              </button>
              <button onClick={handleNext} className="fr-btn fr-btn-primary">
                Weiter
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          {currentStep === 'decision' && (
            <div className="flex justify-start mt-6 pt-6 border-t" style={{ borderColor: 'hsl(210 20% 88%)' }}>
              <button onClick={handleBack} className="fr-btn" style={{ background: 'transparent', border: '2px solid hsl(210 20% 88%)', color: 'hsl(210 30% 15%)' }}>
                <ChevronLeft className="h-4 w-4" />
                Zurück
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
