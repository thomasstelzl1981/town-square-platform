/**
 * AcquiaryKontakt — Investment-House Style Kontaktseite
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { Mail, MapPin, Send, CheckCircle2, Shield } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function AcquiaryKontakt() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '', interest: 'ankauf' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/sot-ncore-lead-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}`, 'apikey': anonKey },
        body: JSON.stringify({ brand: 'acquiary', type: form.interest, name: form.name, email: form.email, company: form.company || null, message: form.message }),
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
      <div className="acquiary-page py-24 text-center">
        <SEOHead brand="acquiary" page={{ title: 'Nachricht gesendet', description: 'Ihre Nachricht wurde erfolgreich gesendet.', path: '/kontakt', noIndex: true }} />
        <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-[hsl(207,90%,54%)]" />
        <h1 className="text-3xl font-bold mb-4 text-[hsl(220,25%,12%)]">Vielen Dank.</h1>
        <p className="text-[hsl(220,10%,42%)] mb-8">Wir melden uns diskret innerhalb von 24 Stunden.</p>
        <Link to="/website/acquiary" className="aq-btn aq-btn-primary">Zurück</Link>
      </div>
    );
  }

  const inputClass = 'w-full rounded-lg border border-[hsl(220,15%,90%)] bg-white px-4 py-2.5 text-sm text-[hsl(220,25%,12%)] placeholder:text-[hsl(220,10%,70%)] focus:border-[hsl(207,90%,54%)] focus:outline-none focus:ring-1 focus:ring-[hsl(207,90%,54%)]';

  return (
    <>
      <SEOHead brand="acquiary" page={{ title: 'Kontakt — Diskrete Anfrage', description: 'Kontaktieren Sie ACQUIARY für diskrete Immobilien-Akquise. NDA-geschützt, vertraulich und professionell.', path: '/kontakt' }} />

      <section className="py-20 px-4 text-center">
        <h1 className="text-3xl font-bold mb-3 text-[hsl(220,25%,12%)]">Kontakt</h1>
        <p className="text-[hsl(220,10%,42%)] max-w-xl mx-auto">Diskrete Anfragen werden vertraulich behandelt. Alle Gespräche unterliegen strikter NDA-Vertraulichkeit.</p>
      </section>

      <section className="pb-24 px-4">
        <div className="mx-auto max-w-4xl grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-[hsl(220,15%,90%)] bg-white p-8 shadow-sm space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[hsl(220,10%,42%)]">Anliegen</label>
                <select value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })} className={inputClass}>
                  <option value="ankauf">Ankaufsmandat</option>
                  <option value="angebot">Objekt anbieten</option>
                  <option value="kooperation">Kooperation / Netzwerk</option>
                  <option value="allgemein">Allgemeine Anfrage</option>
                </select>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div><label className="mb-1.5 block text-sm font-medium text-[hsl(220,10%,42%)]">Name *</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Ihr Name" /></div>
                <div><label className="mb-1.5 block text-sm font-medium text-[hsl(220,10%,42%)]">E-Mail *</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="ihre@email.de" /></div>
              </div>
              <div><label className="mb-1.5 block text-sm font-medium text-[hsl(220,10%,42%)]">Unternehmen</label><input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className={inputClass} placeholder="Firmenname" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-[hsl(220,10%,42%)]">Nachricht *</label><textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className={`${inputClass} resize-none`} placeholder="Beschreiben Sie Ihr Anliegen..." /></div>
              <button type="submit" disabled={loading} className="aq-btn aq-btn-primary w-full justify-center"><Send className="h-4 w-4" />{loading ? 'Wird gesendet...' : 'Anfrage senden'}</button>
            </form>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-[hsl(220,15%,90%)] bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(207,90%,54%,0.1)]"><Mail className="h-5 w-5 text-[hsl(207,90%,54%)]" /></div><div><p className="text-sm font-medium text-[hsl(220,25%,12%)]">E-Mail</p><a href="mailto:info@acquiary.de" className="text-sm text-[hsl(207,90%,54%)] hover:underline">info@acquiary.de</a></div></div>
              <div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(207,90%,54%,0.1)]"><MapPin className="h-5 w-5 text-[hsl(207,90%,54%)]" /></div><div><p className="text-sm font-medium text-[hsl(220,25%,12%)]">Standort</p><p className="text-sm text-[hsl(220,10%,42%)]">Deutschland</p></div></div>
            </div>
            <div className="rounded-xl border border-[hsl(207,90%,54%,0.15)] bg-[hsl(207,90%,54%,0.04)] p-5 flex items-start gap-3">
              <Shield className="h-5 w-5 text-[hsl(207,90%,54%)] shrink-0 mt-0.5" />
              <p className="text-xs text-[hsl(220,10%,42%)] leading-relaxed"><strong className="text-[hsl(220,25%,12%)]">NDA-geschützt.</strong> Alle Anfragen werden strikt vertraulich behandelt.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
