/**
 * ZL WOHNBAU KONTAKT — Zone 3
 * Contact form with lead submission to sot-ncore-lead-submit
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { Mail, Phone, MapPin, Building2, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import heroImg from '@/assets/zlwohnbau/hero-houses.jpg';

const BRAND = '#2D6A4F';

export default function ZLWohnbauKontakt() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', interest: 'allgemein' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/sot-ncore-lead-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}`, 'apikey': anonKey },
        body: JSON.stringify({
          brand: 'zlwohnbau',
          type: form.interest,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          message: form.message.trim(),
        }),
      });
      if (!response.ok) throw new Error('Submit failed');
      toast.success('Vielen Dank für Ihre Nachricht! Wir melden uns schnellstmöglich bei Ihnen.');
      setForm({ name: '', email: '', phone: '', message: '', interest: 'allgemein' });
    } catch (err) {
      console.error('Contact form error:', err);
      toast.error('Fehler beim Senden. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-1 transition-colors`;
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-600';

  return (
    <>
      <SEOHead
        brand="zlwohnbau"
        page={{
          title: 'Kontakt — ZL Wohnbau GmbH',
          description: 'Kontaktieren Sie die ZL Wohnbau GmbH für Wohnraum-Anfragen, Objektangebote oder allgemeine Fragen.',
          path: '/kontakt',
        }}
      />

      {/* Hero with Background Image */}
      <section className="relative py-20 px-4 overflow-hidden">
        <img src={heroImg} alt="ZL Wohnbau Objekte" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/85 to-white/95" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-800">Kontakt</h1>
          <p className="text-lg text-slate-500">Wir freuen uns auf Ihre Nachricht.</p>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold text-slate-800">Nachricht senden</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="zl-interest" className={labelClass}>Interesse</label>
                  <select
                    id="zl-interest"
                    value={form.interest}
                    onChange={e => setForm({ ...form, interest: e.target.value })}
                    className={inputClass}
                    style={{ borderColor: undefined }}
                  >
                    <option value="allgemein">Allgemeine Anfrage</option>
                    <option value="wohnraum">Wohnraum für Mitarbeiter anfragen</option>
                    <option value="objekt">Objekt anbieten</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="zl-name" className={labelClass}>Name *</label>
                  <input
                    id="zl-name" type="text" required maxLength={100}
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className={inputClass} placeholder="Ihr vollständiger Name"
                    style={{ '--tw-ring-color': BRAND } as React.CSSProperties}
                  />
                </div>
                <div>
                  <label htmlFor="zl-email" className={labelClass}>E-Mail *</label>
                  <input
                    id="zl-email" type="email" required maxLength={255}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className={inputClass} placeholder="ihre@email.de"
                  />
                </div>
                <div>
                  <label htmlFor="zl-phone" className={labelClass}>Telefon</label>
                  <input
                    id="zl-phone" type="tel" maxLength={30}
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className={inputClass} placeholder="+49 ..."
                  />
                </div>
                <div>
                  <label htmlFor="zl-message" className={labelClass}>Ihre Nachricht *</label>
                  <textarea
                    id="zl-message" rows={5} required maxLength={2000}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className={`${inputClass} resize-none`}
                    placeholder="Beschreiben Sie kurz Ihr Anliegen..."
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: BRAND }}
                >
                  <Send className="h-4 w-4" />
                  {loading ? 'Wird gesendet...' : 'Nachricht senden'}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">ZL Wohnbau GmbH</h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${BRAND}15` }}>
                      <MapPin className="h-6 w-6" style={{ color: BRAND }} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-slate-800">Adresse</h3>
                      <p className="text-sm text-slate-500">Tisinstraße 19<br />82041 Oberhaching</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${BRAND}15` }}>
                      <Phone className="h-6 w-6" style={{ color: BRAND }} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-slate-800">Telefon</h3>
                      <a href="tel:+498966667788" className="text-sm text-slate-500 hover:text-slate-700">089 66667788</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${BRAND}15` }}>
                      <Mail className="h-6 w-6" style={{ color: BRAND }} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-slate-800">E-Mail</h3>
                      <a href="mailto:info@zl-wohnbau.de" className="text-sm text-slate-500 hover:text-slate-700">info@zl-wohnbau.de</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${BRAND}15` }}>
                      <Building2 className="h-6 w-6" style={{ color: BRAND }} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1 text-slate-800">Geschäftsführer</h3>
                      <p className="text-sm text-slate-500">Otto Stelzl</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-semibold text-lg text-slate-800 mb-3">Für Unternehmen</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Sie sind ein mittelständisches Unternehmen und suchen Wohnraum für Ihre Mitarbeiter?
                    Wir entwickeln gemeinsam eine langfristige Lösung — vom Ankauf bis zur schlüsselfertigen Übergabe.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-semibold text-lg text-slate-800 mb-3">Objekt anbieten</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Sie haben ein Mehrfamilienhaus oder Grundstück in Bayern zu verkaufen?
                    Wir sind ständig auf der Suche nach attraktiven Objekten für unsere Mandanten.
                  </p>
                </div>
                <div className="rounded-xl p-6" style={{ backgroundColor: `${BRAND}08`, border: `1px solid ${BRAND}20` }}>
                  <p className="text-sm font-medium" style={{ color: BRAND }}>Ein Unternehmen der ZL Gruppe</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Gemeinsam mit der ZL Finanzdienstleistungen GmbH (Otto² Advisory) bilden wir die ZL Gruppe — Ihr Partner für Immobilien und Finanzen in Bayern.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JSON-LD ContactPage */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Kontakt — ZL Wohnbau GmbH',
        url: 'https://zl-wohnbau.de/kontakt',
        mainEntity: {
          '@type': 'Organization',
          name: 'ZL Wohnbau GmbH',
          telephone: '+498966667788',
          email: 'info@zl-wohnbau.de',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Tisinstraße 19',
            addressLocality: 'Oberhaching',
            postalCode: '82041',
            addressCountry: 'DE',
          },
        },
      }) }} />
    </>
  );
}
