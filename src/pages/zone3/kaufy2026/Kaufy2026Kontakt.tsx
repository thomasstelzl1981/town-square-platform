/**
 * Kaufy2026Kontakt — Kontaktseite für KAUFY
 * Submits to sot-lead-inbox edge function
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { Mail, Phone, MapPin, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Kaufy2026Kontakt() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', interest: 'allgemein' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/sot-ncore-lead-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}`, 'apikey': anonKey },
        body: JSON.stringify({ brand: 'kaufy', type: form.interest, name: form.name, email: form.email, phone: form.phone || null, message: form.message }),
      });
      if (!response.ok) throw new Error('Submit failed');
      setSent(true);
      toast.success('Ihre Nachricht wurde erfolgreich gesendet.');
    } catch (err) {
      console.error('Contact form error:', err);
      toast.error('Fehler beim Senden. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <>
        <SEOHead brand="kaufy" page={{ title: 'Nachricht gesendet', description: 'Ihre Nachricht wurde erfolgreich gesendet.', path: '/kontakt', noIndex: true }} />
        <section className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-[hsl(210,80%,55%)]" />
            <h1 className="mb-4 text-3xl font-bold text-[hsl(220,20%,10%)]">Vielen Dank!</h1>
            <p className="text-[hsl(215,16%,47%)] leading-relaxed mb-8">Ihre Nachricht ist bei uns eingegangen. Wir melden uns innerhalb von 24 Stunden bei Ihnen.</p>
            <a href="/website/kaufy" className="inline-flex items-center gap-2 text-sm text-[hsl(210,80%,55%)] hover:text-[hsl(210,80%,45%)]">
              Zurück zur Startseite <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </>
    );
  }

  const inputClass = 'w-full rounded-lg border border-[hsl(214,32%,91%)] bg-white px-4 py-2.5 text-sm text-[hsl(220,20%,10%)] placeholder:text-[hsl(215,16%,65%)] focus:border-[hsl(210,80%,55%)] focus:outline-none focus:ring-1 focus:ring-[hsl(210,80%,55%)]';

  return (
    <>
      <SEOHead
        brand="kaufy"
        page={{
          title: 'Kontakt — Beratung anfragen',
          description: 'Kontaktieren Sie KAUFY für eine unverbindliche Beratung zu Kapitalanlageimmobilien, Finanzierung und Vermarktung.',
          path: '/kontakt',
        }}
      />

      <section className="py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-[hsl(220,20%,10%)]">Kontakt</h1>
          <p className="text-lg text-[hsl(215,16%,47%)]">Wir beraten Sie gerne zu Kapitalanlageimmobilien. Schreiben Sie uns — wir melden uns innerhalb von 24 Stunden.</p>
        </div>
      </section>

      <section className="pb-24 px-4">
        <div className="mx-auto max-w-5xl grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[hsl(214,32%,91%)] bg-white p-8 shadow-sm space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[hsl(215,16%,47%)]">Interesse</label>
                <select value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })} className={inputClass}>
                  <option value="allgemein">Allgemeine Beratung</option>
                  <option value="investment">Investment / Kauf</option>
                  <option value="vermieter">Vermietung</option>
                  <option value="vertrieb">Vertriebspartnerschaft</option>
                </select>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[hsl(215,16%,47%)]">Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Ihr Name" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[hsl(215,16%,47%)]">E-Mail *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="ihre@email.de" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[hsl(215,16%,47%)]">Telefon</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+49 ..." />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[hsl(215,16%,47%)]">Nachricht *</label>
                <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className={`${inputClass} resize-none`} placeholder="Beschreiben Sie Ihr Anliegen..." />
              </div>
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(220,20%,10%)] px-6 py-3 text-sm font-semibold text-white hover:bg-[hsl(220,20%,20%)] disabled:opacity-50 transition-colors">
                <Send className="h-4 w-4" />
                {loading ? 'Wird gesendet...' : 'Nachricht senden'}
              </button>
              <p className="text-xs text-[hsl(215,16%,65%)] text-center">Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.</p>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-semibold text-[hsl(220,20%,10%)]">Direkt erreichen</h3>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(210,80%,55%,0.1)]"><Mail className="h-5 w-5 text-[hsl(210,80%,55%)]" /></div>
                <div><p className="text-sm font-medium text-[hsl(220,20%,10%)]">E-Mail</p><a href="mailto:info@kaufy.immo" className="text-sm text-[hsl(210,80%,55%)] hover:underline">info@kaufy.immo</a></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(210,80%,55%,0.1)]"><MapPin className="h-5 w-5 text-[hsl(210,80%,55%)]" /></div>
                <div><p className="text-sm font-medium text-[hsl(220,20%,10%)]">Standort</p><p className="text-sm text-[hsl(215,16%,47%)]">Deutschland</p></div>
              </div>
            </div>
            <div className="rounded-xl bg-[hsl(210,80%,55%,0.06)] border border-[hsl(210,80%,55%,0.15)] p-5">
              <p className="text-xs text-[hsl(215,16%,47%)] leading-relaxed"><strong className="text-[hsl(220,20%,10%)]">Erstberatung kostenlos.</strong> Wir nehmen uns Zeit, Ihre Situation zu verstehen.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
