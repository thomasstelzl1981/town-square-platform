/**
 * NCORE KONTAKT — Dual-type contact form (Projekt / Kooperation)
 * Submits leads via direct edge function call
 * SEO: ContactPage schema
 */
import { Helmet } from 'react-helmet';
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
        <Helmet>
          <title>Nachricht gesendet — Ncore Business Consulting</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <section className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-emerald-400" />
            <h1 className="mb-4 text-3xl font-bold">Vielen Dank!</h1>
            <p className="text-white/50 leading-relaxed mb-8">
              Ihre Nachricht ist bei uns eingegangen. Wir melden uns innerhalb von 24 Stunden bei Ihnen.
            </p>
            <a
              href="/website/ncore"
              className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
            >
              Zurück zur Startseite <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Kontakt — Ncore Business Consulting</title>
        <meta name="description" content="Kontaktieren Sie Ncore Business Consulting für ein unverbindliches Erstgespräch zu Digitalisierung, Stiftungen oder Geschäftsmodellen. Projektanfrage oder Kooperation." />
        <meta property="og:title" content="Kontakt — Ncore Business Consulting" />
        <meta property="og:url" content="https://ncore.online/kontakt" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Kontakt — Ncore Business Consulting",
          "url": "https://ncore.online/kontakt",
          "mainEntity": {
            "@type": "Organization",
            "@id": "https://ncore.online/#organization",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "info@ncore.online",
              "availableLanguage": ["Deutsch", "Englisch"],
            },
          },
        })}</script>
      </Helmet>

      <section className="py-28 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl">
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Kontakt</span> aufnehmen
            </h1>
            <p className="text-lg text-white/50 max-w-2xl">
              Ob Projektanfrage oder Kooperationswunsch — wir freuen uns auf Ihre Nachricht
              und melden uns innerhalb von 24 Stunden.
            </p>
          </div>

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
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-emerald-900/20 bg-emerald-950/10 hover:border-emerald-900/30'
                    }`}
                  >
                    <opt.icon className={`mb-2 h-5 w-5 ${type === opt.key ? 'text-emerald-400' : 'text-white/30'}`} />
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-white/35">{opt.desc}</p>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                      placeholder="Ihr vollständiger Name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">E-Mail *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                      placeholder="ihre@email.de"
                    />
                  </div>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Telefon</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                      placeholder="+49 ..."
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Unternehmen</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={e => setForm({ ...form, company: e.target.value })}
                      className="w-full rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                      placeholder="Firmenname"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">Nachricht *</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-4 py-3 text-sm text-white placeholder-white/20 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-none"
                    placeholder={type === 'projekt' ? 'Beschreiben Sie Ihr Projekt oder Ihre Herausforderung...' : 'Wie können wir zusammenarbeiten?'}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-sm font-semibold text-black transition-all hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Wird gesendet...' : (
                    <>
                      Nachricht senden <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-2xl border border-emerald-900/25 bg-emerald-950/15 p-6 space-y-6">
                <h3 className="text-sm font-semibold text-white/60">Direkt erreichen</h3>
                <div className="flex items-start gap-4">
                  <Mail className="mt-0.5 h-5 w-5 text-emerald-400/60" />
                  <div>
                    <p className="text-sm font-medium">E-Mail</p>
                    <a href="mailto:info@ncore.online" className="text-sm text-emerald-400 hover:text-emerald-300">info@ncore.online</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="mt-0.5 h-5 w-5 text-emerald-400/60" />
                  <div>
                    <p className="text-sm font-medium">Telefon</p>
                    <p className="text-sm text-white/40">Auf Anfrage</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="mt-0.5 h-5 w-5 text-emerald-400/60" />
                  <div>
                    <p className="text-sm font-medium">Standort</p>
                    <p className="text-sm text-white/40">Deutschland</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-900/25 bg-emerald-950/15 p-6">
                <h3 className="text-sm font-semibold text-white/60 mb-4">Beratungsfelder</h3>
                <ul className="space-y-2 text-sm text-white/35">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/50" /> Digitalisierung & KI</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/50" /> Stiftungen & Vermögensschutz</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/50" /> Geschäftsmodelle & Vertrieb</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/50" /> Netzwerk-Orchestrierung</li>
                </ul>
              </div>

              <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-5">
                <p className="text-xs text-white/40 leading-relaxed">
                  <strong className="text-white/60">Datenschutz:</strong> Ihre Daten werden ausschließlich
                  zur Bearbeitung Ihrer Anfrage verwendet und nicht an Dritte weitergegeben.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
