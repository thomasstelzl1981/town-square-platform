/**
 * OTTO² ADVISORY KONTAKT — Zone 3
 * Contact form submits to sot-lead-inbox with source: otto_advisory_kontakt
 * SEO: Kontakt, Finanzberatung, Termin
 */
import { Helmet } from 'react-helmet';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function OttoKontakt() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', interest: 'allgemein' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('sot-lead-inbox', {
        body: {
          lead_source: 'otto_advisory_kontakt',
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          message: form.message,
          interest: form.interest,
          website: 'otto2advisory.com',
        },
      });
      if (error) throw error;
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
      name: 'Komplett ZL Finanzdienstleistungen GmbH',
      email: 'info@otto2advisory.com',
    },
  };

  return (
    <>
      <Helmet>
        <title>Kontakt — Otto² Advisory | Termin vereinbaren</title>
        <meta name="description" content="Kontaktieren Sie Otto² Advisory für ein unverbindliches Beratungsgespräch. Wir beraten Sie zu Finanzierung, Vorsorge und Vermögensaufbau." />
        <link rel="canonical" href="https://otto2advisory.com/kontakt" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      <section className="py-20 px-4 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            <span className="text-blue-400">Kontakt</span>
          </h1>
          <p className="text-lg text-white/60">
            Wir freuen uns auf Ihre Nachricht. Vereinbaren Sie einen Termin oder stellen Sie uns Ihre Fragen.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="py-8 px-4 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <div className="rounded-2xl border border-blue-900/30 bg-blue-950/10 p-8">
              <h2 className="mb-6 text-2xl font-bold">Nachricht senden</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="otto-interest" className="mb-1.5 block text-sm font-medium text-white/70">Interesse</label>
                  <select
                    id="otto-interest"
                    value={form.interest}
                    onChange={e => setForm({ ...form, interest: e.target.value })}
                    className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="allgemein">Allgemeine Beratung</option>
                    <option value="unternehmer">Unternehmensberatung</option>
                    <option value="finanzierung">Finanzierung</option>
                    <option value="vorsorge">Vorsorge & Vermögen</option>
                    <option value="versicherung">Versicherung</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="otto-name" className="mb-1.5 block text-sm font-medium text-white/70">Name *</label>
                  <input
                    id="otto-name"
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ihr vollständiger Name"
                  />
                </div>
                <div>
                  <label htmlFor="otto-email" className="mb-1.5 block text-sm font-medium text-white/70">E-Mail *</label>
                  <input
                    id="otto-email"
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="ihre@email.de"
                  />
                </div>
                <div>
                  <label htmlFor="otto-phone" className="mb-1.5 block text-sm font-medium text-white/70">Telefon</label>
                  <input
                    id="otto-phone"
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="+49 ..."
                  />
                </div>
                <div>
                  <label htmlFor="otto-message" className="mb-1.5 block text-sm font-medium text-white/70">Ihre Nachricht *</label>
                  <textarea
                    id="otto-message"
                    rows={5}
                    required
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-lg border border-blue-900/30 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    placeholder="Beschreiben Sie kurz Ihr Anliegen..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {loading ? 'Wird gesendet...' : 'Nachricht senden'}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="mb-4 text-2xl font-bold">Ihre Ansprechpartner</h2>
                <p className="text-white/50">
                  Otto Stelzl und Thomas Otto Stelzl stehen Ihnen für alle Fragen rund um Ihre Finanzplanung zur Verfügung.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                    <Mail className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">E-Mail</h3>
                    <a href="mailto:info@otto2advisory.com" className="text-blue-400 hover:underline text-sm">
                      info@otto2advisory.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                    <Phone className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Telefon</h3>
                    <a href="tel:+498915893341" className="text-blue-400 hover:underline text-sm">
                      089 / 158 933 41-0
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                    <MapPin className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Standort</h3>
                    <p className="text-sm text-white/50">
                      Komplett ZL Finanzdienstleistungen GmbH<br />
                      Deutschland
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-950/20 p-6">
                <p className="text-sm text-white/60 leading-relaxed">
                  <strong className="text-white/80">Ihr Erstgespräch ist unverbindlich und kostenfrei.</strong><br />
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
