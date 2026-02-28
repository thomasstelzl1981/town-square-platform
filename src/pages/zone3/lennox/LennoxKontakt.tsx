/**
 * LennoxKontakt — Alpine Chic Kontaktseite
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { Mail, MapPin, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { LENNOX as C } from './lennoxTheme';

export default function LennoxKontakt() {
  const [form, setForm] = useState({ name: '', email: '', message: '', interest: 'allgemein' });
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
        body: JSON.stringify({ brand: 'lennox', type: form.interest, name: form.name, email: form.email, message: form.message }),
      });
      if (!response.ok) throw new Error('Submit failed');
      setSent(true);
      toast.success('Nachricht gesendet!');
    } catch (err) {
      console.error('Contact form error:', err);
      toast.error('Fehler beim Senden. Bitte schreiben Sie uns direkt an info@lennoxandfriends.app.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full rounded-lg border px-4 py-2.5 text-sm placeholder:text-gray-300 focus:outline-none focus:ring-1`;

  if (sent) {
    return (
      <>
        <SEOHead brand="lennox" page={{ title: 'Nachricht gesendet', description: 'Ihre Nachricht wurde gesendet.', path: '/kontakt', noIndex: true }} />
        <section className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <CheckCircle2 className="mx-auto mb-6 h-16 w-16" style={{ color: C.forest }} />
            <h1 className="mb-4 text-3xl font-bold" style={{ color: C.bark }}>Vielen Dank!</h1>
            <p style={{ color: C.barkMuted }} className="leading-relaxed mb-8">Wir melden uns schnellstmöglich bei Ihnen.</p>
            <Link to="/website/tierservice" className="inline-flex items-center gap-2 text-sm hover:underline" style={{ color: C.forest }}>Zurück zur Startseite <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <SEOHead brand="lennox" page={{ title: 'Kontakt — Lennox & Friends', description: 'Kontaktieren Sie Lennox & Friends für Fragen zu Hundebetreuung, Partnerschaft oder unserem Netzwerk.', path: '/kontakt' }} />

      <section className="py-20 px-4 text-center">
        <h1 className="text-3xl font-bold mb-3" style={{ color: C.bark }}>Kontakt</h1>
        <p style={{ color: C.barkMuted }}>Fragen zu unserem Netzwerk? Wir freuen uns auf Ihre Nachricht.</p>
      </section>

      <section className="pb-24 px-4">
        <div className="mx-auto max-w-4xl grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="rounded-2xl border bg-white p-8 shadow-sm space-y-5" style={{ borderColor: C.sandLight }}>
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: C.barkMuted }}>Interesse</label>
                <select value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })} className={inputClass} style={{ borderColor: C.sandLight, color: C.bark, '--tw-ring-color': C.forest } as any}>
                  <option value="allgemein">Allgemeine Frage</option>
                  <option value="betreuung">Hundebetreuung</option>
                  <option value="partner">Partner werden</option>
                  <option value="shop">Shop & Produkte</option>
                </select>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div><label className="mb-1.5 block text-sm font-medium" style={{ color: C.barkMuted }}>Name *</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} style={{ borderColor: C.sandLight, color: C.bark } as any} placeholder="Ihr Name" /></div>
                <div><label className="mb-1.5 block text-sm font-medium" style={{ color: C.barkMuted }}>E-Mail *</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} style={{ borderColor: C.sandLight, color: C.bark } as any} placeholder="ihre@email.de" /></div>
              </div>
              <div><label className="mb-1.5 block text-sm font-medium" style={{ color: C.barkMuted }}>Nachricht *</label><textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className={`${inputClass} resize-none`} style={{ borderColor: C.sandLight, color: C.bark } as any} placeholder="Ihre Nachricht..." /></div>
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-colors" style={{ background: C.forest }}>
                <Send className="h-4 w-4" />{loading ? 'Wird gesendet...' : 'Nachricht senden'}
              </button>
            </form>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-5" style={{ borderColor: C.sandLight }}>
              <div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: `${C.forest}15` }}><Mail className="h-5 w-5" style={{ color: C.forest }} /></div><div><p className="text-sm font-medium" style={{ color: C.bark }}>E-Mail</p><a href="mailto:info@lennoxandfriends.app" className="text-sm hover:underline" style={{ color: C.forest }}>info@lennoxandfriends.app</a></div></div>
              <div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: `${C.forest}15` }}><MapPin className="h-5 w-5" style={{ color: C.forest }} /></div><div><p className="text-sm font-medium" style={{ color: C.bark }}>Standort</p><p className="text-sm" style={{ color: C.barkMuted }}>Deutschland</p></div></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
