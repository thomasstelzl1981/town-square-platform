/**
 * OTTO² ADVISORY KONTAKT — Zone 3
 * Contact form submits to sot-lead-inbox with source: otto_advisory_kontakt
 * SEO: Kontakt, Finanzberatung, Termin
 * Design: Light, warm, Telis-Finanz-Stil
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';


export default function OttoKontakt() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', interest: 'allgemein' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/sot-ncore-lead-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}`, 'apikey': anonKey },
        body: JSON.stringify({
          brand: 'otto',
          type: form.interest,
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          message: form.message,
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Kontakt — Otto² Advisory',
    url: 'https://otto2advisory.com/kontakt',
    mainEntity: {
      '@type': 'Organization',
      name: 'ZL Finanzdienstleistungen GmbH',
      email: 'info@otto2advisory.com',
    },
  };

  const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-300 focus:border-[#0055A4] focus:outline-none focus:ring-1 focus:ring-[#0055A4]';
  const labelClass = 'mb-1.5 block text-sm font-medium text-slate-600';

  return (
    <>
      <SEOHead
        brand="otto"
        page={{
          title: 'Kontakt — Termin vereinbaren',
          description: 'Kontaktieren Sie Otto² Advisory für ein unverbindliches Beratungsgespräch. Wir beraten Sie zu Finanzierung, Vorsorge und Vermögensaufbau.',
          path: '/kontakt',
        }}
      />

      {/* Hero */}
      <section className="py-20 px-4 md:py-28 bg-slate-50">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl text-slate-800">
            <span className="text-[#0055A4]">Kontakt</span>
          </h1>
          <p className="text-lg text-slate-500">
            Wir freuen uns auf Ihre Nachricht. Vereinbaren Sie einen Termin oder stellen Sie uns Ihre Fragen.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-8 px-4 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-2xl font-bold text-slate-800">Nachricht senden</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="otto-interest" className={labelClass}>Interesse</label>
                  <select
                    id="otto-interest"
                    value={form.interest}
                    onChange={e => setForm({ ...form, interest: e.target.value })}
                    className={inputClass}
                  >
                    <option value="allgemein">Allgemeine Beratung</option>
                    <option value="unternehmer">Unternehmensberatung</option>
                    <option value="finanzierung">Finanzierung</option>
                    <option value="vorsorge">Vorsorge & Vermögen</option>
                    <option value="versicherung">Versicherung</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="otto-name" className={labelClass}>Name *</label>
                  <input
                    id="otto-name" type="text" required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className={inputClass} placeholder="Ihr vollständiger Name"
                  />
                </div>
                <div>
                  <label htmlFor="otto-email" className={labelClass}>E-Mail *</label>
                  <input
                    id="otto-email" type="email" required value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className={inputClass} placeholder="ihre@email.de"
                  />
                </div>
                <div>
                  <label htmlFor="otto-phone" className={labelClass}>Telefon</label>
                  <input
                    id="otto-phone" type="tel" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className={inputClass} placeholder="+49 ..."
                  />
                </div>
                <div>
                  <label htmlFor="otto-message" className={labelClass}>Ihre Nachricht *</label>
                  <textarea
                    id="otto-message" rows={5} required value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className={`${inputClass} resize-none`}
                    placeholder="Beschreiben Sie kurz Ihr Anliegen..."
                  />
                </div>
                <button
                  type="submit" disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0055A4] px-6 py-3 text-sm font-semibold text-white hover:bg-[#004690] disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {loading ? 'Wird gesendet...' : 'Nachricht senden'}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="mb-4 text-2xl font-bold text-slate-800">Ihre Ansprechpartner</h2>
                <p className="text-slate-500">
                  Otto Stelzl und Thomas Otto Stelzl stehen Ihnen für alle Fragen rund um Ihre Finanzplanung zur Verfügung.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0055A4]/10">
                    <Mail className="h-6 w-6 text-[#0055A4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-slate-800">E-Mail</h3>
                    <a href="mailto:info@otto2advisory.com" className="text-[#0055A4] hover:underline text-sm">
                      info@otto2advisory.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0055A4]/10">
                    <Phone className="h-6 w-6 text-[#0055A4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-slate-800">Telefon — Armstrong KI-Assistent</h3>
                    <a href="tel:+4994224845" className="text-[#0055A4] hover:underline text-sm">
                      +49 9422 4845
                    </a>
                    <p className="text-xs text-slate-400 mt-1">Rufen Sie an — unser KI-Assistent hilft Ihnen sofort weiter.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0055A4]/10">
                    <MapPin className="h-6 w-6 text-[#0055A4]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-slate-800">Standort</h3>
                    <p className="text-sm text-slate-500">
                      ZL Finanzdienstleistungen GmbH<br />
                      Ruselstraße 16<br />
                      94327 Bogen
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="mt-8 rounded-xl border border-[#0055A4]/15 bg-[#0055A4]/5 p-6">
                <p className="text-sm text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Ihr Erstgespräch ist unverbindlich und kostenfrei.</strong><br />
                  Wir nehmen uns Zeit, Ihre Situation zu verstehen, bevor wir über Lösungen sprechen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
