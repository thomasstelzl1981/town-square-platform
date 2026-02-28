/**
 * OTTO FINANZIERUNG — FutureRoom Pattern
 * Multi-step wizard for financing requests (Bonitätsdaten)
 * Submit via sot-futureroom-public-submit with source: zone3_otto_advisory
 * SEO: Baufinanzierung beantragen, Immobilienfinanzierung, Bonitätscheck
 * Design: Light, warm, Telis-Finanz-Stil
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { Landmark, ArrowRight, ArrowLeft, CheckCircle2, FileText, Shield, Users, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type WizardStep = 'intro' | 'person' | 'income' | 'property' | 'summary';

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'intro', label: 'Start' },
  { key: 'person', label: 'Person' },
  { key: 'income', label: 'Einkommen' },
  { key: 'property', label: 'Objekt' },
  { key: 'summary', label: 'Zusammenfassung' },
];

export default function OttoFinanzierung() {
  const [step, setStep] = useState<WizardStep>('intro');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState({
    salutation: 'Herr', firstName: '', lastName: '', email: '', phone: '', birthDate: '',
    employmentType: 'angestellt', netIncome: '', employer: '', employedSince: '',
    purchasePrice: '', equity: '', objectType: 'eigentumswohnung', objectLocation: '', loanAmount: '', message: '',
  });

  const update = (field: string, value: string) => setData(prev => ({ ...prev, [field]: value }));
  const currentIdx = STEPS.findIndex(s => s.key === step);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('sot-futureroom-public-submit', {
        body: {
          source: 'zone3_otto_advisory',
          applicant: { salutation: data.salutation, first_name: data.firstName, last_name: data.lastName, email: data.email, phone: data.phone || undefined, birth_date: data.birthDate || undefined },
          income: { employment_type: data.employmentType, net_income_monthly: data.netIncome ? Number(data.netIncome) : undefined, employer_name: data.employer || undefined, employed_since: data.employedSince || undefined },
          property: { purchase_price: data.purchasePrice ? Number(data.purchasePrice) : undefined, equity_amount: data.equity ? Number(data.equity) : undefined, object_type: data.objectType, object_address: data.objectLocation || undefined, loan_amount_requested: data.loanAmount ? Number(data.loanAmount) : undefined },
          message: data.message || undefined,
        },
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Ihre Finanzierungsanfrage wurde erfolgreich eingereicht!');
    } catch (err) {
      console.error('Financing submit error:', err);
      toast.error('Fehler beim Einreichen. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Service',
    name: 'Finanzierung beantragen — Otto² Advisory',
    provider: { '@type': 'Organization', name: 'ZL Finanzdienstleistungen GmbH' },
    description: 'Immobilienfinanzierung digital beantragen. Bonitätsdaten strukturiert erfassen — schnell, sicher und unverbindlich.',
    serviceType: 'Immobilienfinanzierung',
  };

  const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:border-[#0055A4] focus:outline-none focus:ring-1 focus:ring-[#0055A4]';
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-600';

  if (submitted) {
    return (
      <>
        <SEOHead brand="otto" page={{ title: 'Anfrage eingereicht', description: 'Ihre Finanzierungsanfrage wurde erfolgreich eingereicht.', path: '/finanzierung', noIndex: true }} />
        <section className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <div className="rounded-full bg-green-50 p-6 mb-6">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-slate-800">Vielen Dank!</h1>
          <p className="mb-2 max-w-md text-slate-500">
            Ihre Finanzierungsanfrage wurde erfolgreich eingereicht. Wir prüfen Ihre Daten und melden uns innerhalb von 24 Stunden bei Ihnen.
          </p>
          <p className="text-sm text-slate-400 mb-8">Eine Bestätigung wurde an {data.email} gesendet.</p>
        </section>
      </>
    );
  }

  return (
    <>
      <SEOHead
        brand="otto"
        page={{
          title: 'Finanzierung beantragen — Immobilienfinanzierung',
          description: 'Starten Sie Ihre Immobilienfinanzierung digital. Bonitätsdaten strukturiert erfassen — schnell, sicher und unverbindlich bei Otto² Advisory.',
          path: '/finanzierung',
        }}
        services={[{ name: 'Finanzierung beantragen', description: 'Immobilienfinanzierung digital beantragen. Bonitätsdaten strukturiert erfassen.' }]}
      />

      <section className="py-20 px-4 md:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#0055A4]/20 bg-[#0055A4]/5 px-4 py-1.5 text-xs text-[#0055A4] font-medium">
            <Landmark className="h-3.5 w-3.5" /> Finanzierung
          </div>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl text-slate-800">
            Finanzierung <span className="text-[#0055A4]">beantragen</span>
          </h1>
          <p className="mb-10 text-lg text-slate-500 max-w-2xl">
            Starten Sie Ihre Finanzierungsanfrage direkt hier — schnell, sicher und unverbindlich.
          </p>

          {/* Progress */}
          <div className="mb-10 flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${i <= currentIdx ? 'bg-[#0055A4]' : 'bg-slate-200'}`} />
                <p className={`mt-1.5 text-[10px] ${i <= currentIdx ? 'text-[#0055A4] font-medium' : 'text-slate-300'}`}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            {step === 'intro' && (
              <div className="space-y-6">
                <div className="flex items-start gap-4 rounded-xl bg-[#0055A4]/5 p-5 border border-[#0055A4]/10">
                  <Shield className="h-6 w-6 text-[#0055A4] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1 text-slate-800">Ihre Daten sind sicher</h3>
                    <p className="text-sm text-slate-500">Alle Angaben werden verschlüsselt übertragen und nur für die Bearbeitung Ihrer Anfrage verwendet.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { icon: FileText, title: 'Daten erfassen', desc: 'Person, Einkommen, Objekt' },
                    { icon: Users, title: 'Prüfung', desc: 'Wir prüfen Ihre Bonität' },
                    { icon: CheckCircle2, title: 'Angebote', desc: 'Individuelle Konditionen' },
                  ].map(item => (
                    <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                      <item.icon className="mx-auto mb-2 h-8 w-8 text-[#0055A4]/60" />
                      <h4 className="text-sm font-semibold text-slate-700">{item.title}</h4>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 'person' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4 text-slate-800">Persönliche Daten</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Anrede</label>
                    <select value={data.salutation} onChange={e => update('salutation', e.target.value)} className={inputClass}>
                      <option value="Herr">Herr</option><option value="Frau">Frau</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Geburtsdatum</label>
                    <input type="date" value={data.birthDate} onChange={e => update('birthDate', e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><label className={labelClass}>Vorname *</label><input type="text" required value={data.firstName} onChange={e => update('firstName', e.target.value)} className={inputClass} placeholder="Max" /></div>
                  <div><label className={labelClass}>Nachname *</label><input type="text" required value={data.lastName} onChange={e => update('lastName', e.target.value)} className={inputClass} placeholder="Mustermann" /></div>
                </div>
                <div><label className={labelClass}>E-Mail *</label><input type="email" required value={data.email} onChange={e => update('email', e.target.value)} className={inputClass} placeholder="max@email.de" /></div>
                <div><label className={labelClass}>Telefon</label><input type="tel" value={data.phone} onChange={e => update('phone', e.target.value)} className={inputClass} placeholder="+49 ..." /></div>
              </div>
            )}

            {step === 'income' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4 text-slate-800">Einkommen & Beschäftigung</h2>
                <div><label className={labelClass}>Beschäftigungsart</label>
                  <select value={data.employmentType} onChange={e => update('employmentType', e.target.value)} className={inputClass}>
                    <option value="angestellt">Angestellt</option><option value="selbststaendig">Selbstständig</option><option value="beamter">Beamter</option><option value="rentner">Rentner</option>
                  </select>
                </div>
                <div><label className={labelClass}>Nettoeinkommen monatlich (€) *</label><input type="number" required value={data.netIncome} onChange={e => update('netIncome', e.target.value)} className={inputClass} placeholder="3.500" /></div>
                <div><label className={labelClass}>Arbeitgeber</label><input type="text" value={data.employer} onChange={e => update('employer', e.target.value)} className={inputClass} placeholder="Firma GmbH" /></div>
                <div><label className={labelClass}>Beschäftigt seit</label><input type="date" value={data.employedSince} onChange={e => update('employedSince', e.target.value)} className={inputClass} /></div>
              </div>
            )}

            {step === 'property' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4 text-slate-800">Objekt & Finanzierung</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div><label className={labelClass}>Objektart</label>
                    <select value={data.objectType} onChange={e => update('objectType', e.target.value)} className={inputClass}>
                      <option value="eigentumswohnung">Eigentumswohnung</option><option value="einfamilienhaus">Einfamilienhaus</option><option value="mehrfamilienhaus">Mehrfamilienhaus</option><option value="grundstueck">Grundstück</option><option value="gewerbe">Gewerbeimmobilie</option>
                    </select>
                  </div>
                  <div><label className={labelClass}>Standort</label><input type="text" value={data.objectLocation} onChange={e => update('objectLocation', e.target.value)} className={inputClass} placeholder="PLZ oder Ort" /></div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div><label className={labelClass}>Kaufpreis (€)</label><input type="number" value={data.purchasePrice} onChange={e => update('purchasePrice', e.target.value)} className={inputClass} placeholder="350.000" /></div>
                  <div><label className={labelClass}>Eigenkapital (€)</label><input type="number" value={data.equity} onChange={e => update('equity', e.target.value)} className={inputClass} placeholder="70.000" /></div>
                  <div><label className={labelClass}>Darlehenswunsch (€)</label><input type="number" value={data.loanAmount} onChange={e => update('loanAmount', e.target.value)} className={inputClass} placeholder="280.000" /></div>
                </div>
                <div><label className={labelClass}>Anmerkungen</label><textarea rows={3} value={data.message} onChange={e => update('message', e.target.value)} className={`${inputClass} resize-none`} placeholder="Weitere Informationen zu Ihrem Vorhaben..." /></div>
              </div>
            )}

            {step === 'summary' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4 text-slate-800">Zusammenfassung</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ['Name', `${data.salutation} ${data.firstName} ${data.lastName}`],
                    ['E-Mail', data.email],
                    ['Telefon', data.phone || '—'],
                    ['Beschäftigung', data.employmentType],
                    ['Nettoeinkommen', data.netIncome ? `${Number(data.netIncome).toLocaleString('de-DE')} €` : '—'],
                    ['Kaufpreis', data.purchasePrice ? `${Number(data.purchasePrice).toLocaleString('de-DE')} €` : '—'],
                    ['Eigenkapital', data.equity ? `${Number(data.equity).toLocaleString('de-DE')} €` : '—'],
                    ['Darlehenswunsch', data.loanAmount ? `${Number(data.loanAmount).toLocaleString('de-DE')} €` : '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between rounded-lg bg-slate-50 px-4 py-3 border border-slate-100">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="text-sm font-medium text-slate-800">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-[#0055A4]/5 p-4 border border-[#0055A4]/10">
                  <p className="text-xs text-slate-500">
                    Mit dem Absenden bestätigen Sie, dass Ihre Angaben korrekt sind. Die Anfrage ist unverbindlich und kostenfrei.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              {currentIdx > 0 ? (
                <button onClick={() => setStep(STEPS[currentIdx - 1].key)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-sm text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Zurück
                </button>
              ) : <div />}

              {step === 'summary' ? (
                <button onClick={handleSubmit} disabled={loading || !data.firstName || !data.lastName || !data.email}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0055A4] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#004690] disabled:opacity-50 transition-colors">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {loading ? 'Wird eingereicht...' : 'Anfrage einreichen'}
                </button>
              ) : (
                <button onClick={() => setStep(STEPS[currentIdx + 1].key)}
                  disabled={step === 'person' && (!data.firstName || !data.lastName || !data.email)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0055A4] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#004690] disabled:opacity-50 transition-colors">
                  Weiter <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
