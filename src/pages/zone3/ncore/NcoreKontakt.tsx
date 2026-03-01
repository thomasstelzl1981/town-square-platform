/**
 * NCORE KONTAKT — Redesign: Light form, dark hero, preserved lead submission
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { useState } from 'react';
import { Mail, Phone, MapPin, ArrowRight, CheckCircle2, Send, Briefcase, Handshake } from 'lucide-react';
import { toast } from 'sonner';

type InquiryType = 'projekt' | 'kooperation';

export default function NcoreKontakt() {
  const [type, setType] = useState<InquiryType>('projekt');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setSending(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/sot-ncore-lead-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          type,
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          company: form.company || null,
          message: form.message,
        }),
      });

      if (!response.ok) throw new Error('Submit failed');
      setSent(true);
      toast.success('Ihre Nachricht wurde erfolgreich gesendet.');
    } catch (err) {
      console.error('Contact submit error:', err);
      toast.error('Fehler beim Senden. Bitte schreiben Sie uns direkt an info@ncore.online.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <>
        <SEOHead brand="ncore" page={{ title: 'Nachricht gesendet', description: 'Ihre Nachricht wurde erfolgreich gesendet.', path: '/kontakt', noIndex: true }} />
        <section className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-emerald-400" />
            <h1 className="mb-4 text-3xl font-bold">Vielen Dank!</h1>
            <p className="text-slate-400 leading-relaxed mb-8">
              Ihre Nachricht ist bei uns eingegangen. Wir melden uns innerhalb von 24 Stunden bei Ihnen.
            </p>
            <a href="/website/ncore" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300">
              Zurück zur Startseite <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <SEOHead
        brand="ncore"
        page={{
          title: 'Kontakt',
          description: 'Kontaktieren Sie Ncore Business Consulting für ein unverbindliches Erstgespräch zu Digitalisierung, Stiftungen oder Geschäftsmodellen.',
          path: '/kontakt',
        }}
      />

      {/* ── Hero — Dark ── */}
      <section className="py-28 px-4">
        <div className="mx-auto max-w-5xl">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Kontakt</span> aufnehmen
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Ob Projektanfrage oder Kooperationswunsch — wir freuen uns auf Ihre Nachricht und melden uns innerhalb von 24 Stunden.
          </p>
        </div>
      </section>

      {/* ── Form — Light ── */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="grid gap-12 md:grid-cols-5">
            {/* Form */}
            <div className="md:col-span-3">
              {/* Type Selector */}
              <div className="mb-8 grid grid-cols-2 gap-3">
                {[
                  { key: 'projekt' as InquiryType, icon: Briefcase, label: 'Projektanfrage', desc: 'Sie suchen Beratung' },
                  { key: 'kooperation' as InquiryType, icon: Handshake, label: 'Kooperation', desc: 'Sie möchten zusammenarbeiten' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setType(opt.key)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      type === opt.key
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-emerald-200'
                    }`}
                  >
                    <opt.icon className={`mb-2 h-5 w-5 ${type === opt.key ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="Ihr vollständiger Name" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">E-Mail *</label>
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="ihre@email.de" />
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Telefon</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="+49 ..." />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Unternehmen</label>
                    <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                      placeholder="Firmenname" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Nachricht *</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                    placeholder={type === 'projekt' ? 'Beschreiben Sie Ihr Projekt...' : 'Wie können wir zusammenarbeiten?'} />
                </div>
                <button type="submit" disabled={sending}
                  className="w-full rounded-lg bg-emerald-500 py-3.5 text-sm font-semibold text-slate-900 transition-all hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {sending ? 'Wird gesendet...' : <><Send className="h-4 w-4" /> Nachricht senden</>}
                </button>
                <p className="text-xs text-slate-400 text-center">Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.</p>
              </form>
            </div>

            {/* Contact Info */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-semibold text-slate-700">Direkt erreichen</h3>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">E-Mail</p>
                    <a href="mailto:info@ncore.online" className="text-sm text-emerald-600 hover:text-emerald-500">info@ncore.online</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Telefon — Armstrong KI-Assistent</p>
                    <a href="tel:+498941433040" className="text-sm text-emerald-600 hover:text-emerald-500">+49 89 4143 3040</a>
                    <p className="text-xs text-slate-400 mt-0.5">Rufen Sie an — unser KI-Assistent hilft sofort weiter.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Standort</p>
                    <p className="text-sm text-slate-500">Deutschland</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Beratungsfelder</h3>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Digitalisierung & KI</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Stiftungen & Vermögensschutz</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Geschäftsmodelle & Vertrieb</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Netzwerk-Orchestrierung</li>
                </ul>
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-700">Datenschutz:</strong> Ihre Daten werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
