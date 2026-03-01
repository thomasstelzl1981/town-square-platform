/**
 * FutureRoomKontakt — Banking-Style Kontaktseite
 */
import { SEOHead } from '@/components/zone3/shared/SEOHead';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function FutureRoomKontakt() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', interest: 'finanzierung' });
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
        body: JSON.stringify({ brand: 'futureroom', type: form.interest, name: form.name, email: form.email, phone: form.phone || null, message: form.message }),
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

  const inputClass = 'w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:border-[hsl(165,70%,36%)] focus:outline-none focus:ring-1 focus:ring-[hsl(165,70%,36%)]';

  if (sent) {
    return (
      <div className="py-24 text-center" style={{ background: 'hsl(210 25% 97%)' }}>
        <SEOHead brand="futureroom" page={{ title: 'Nachricht gesendet', description: 'Ihre Nachricht wurde erfolgreich gesendet.', path: '/kontakt', noIndex: true }} />
        <CheckCircle2 className="mx-auto mb-6 h-16 w-16" style={{ color: 'hsl(165 70% 36%)' }} />
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'hsl(210 30% 15%)' }}>Vielen Dank!</h1>
        <p className="text-gray-500 mb-8">Wir melden uns innerhalb von 24 Stunden bei Ihnen.</p>
        <Link to="/website/futureroom" className="fr-btn fr-btn-primary">Zurück zur Startseite</Link>
      </div>
    );
  }

  return (
    <div style={{ background: 'hsl(210 25% 97%)' }}>
      <SEOHead brand="futureroom" page={{ title: 'Kontakt — Finanzierungsberatung', description: 'Kontaktieren Sie FutureRoom für eine unverbindliche Finanzierungsberatung. Über 400 Bankpartner, persönliche Betreuung.', path: '/kontakt' }} />
      
      <section className="py-20 px-4 text-center">
        <h1 className="text-3xl font-bold mb-3" style={{ color: 'hsl(210 30% 15%)' }}>Kontakt</h1>
        <p className="text-gray-500 max-w-xl mx-auto">Fragen zur Finanzierung? Wir sind für Sie da.</p>
      </section>

      <section className="pb-24 px-4">
        <div className="mx-auto max-w-5xl grid gap-12 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">Interesse</label>
              <select value={form.interest} onChange={e => setForm({ ...form, interest: e.target.value })} className={inputClass}>
                <option value="finanzierung">Immobilienfinanzierung</option>
                <option value="karriere">Karriere als Finanzierungsmanager</option>
                <option value="allgemein">Allgemeine Anfrage</option>
              </select>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div><label className="mb-1.5 block text-sm font-medium text-gray-600">Name *</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Ihr Name" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-600">E-Mail *</label><input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="ihre@email.de" /></div>
            </div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-600">Telefon</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+49 ..." /></div>
            <div><label className="mb-1.5 block text-sm font-medium text-gray-600">Nachricht *</label><textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className={`${inputClass} resize-none`} placeholder="Beschreiben Sie Ihr Anliegen..." /></div>
            <button type="submit" disabled={loading} className="fr-btn fr-btn-primary w-full justify-center"><Send className="h-4 w-4" />{loading ? 'Wird gesendet...' : 'Nachricht senden'}</button>
          </form>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-semibold" style={{ color: 'hsl(210 30% 15%)' }}>Direkt erreichen</h3>
              <div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: 'hsl(165 70% 36% / 0.1)' }}><Mail className="h-5 w-5" style={{ color: 'hsl(165 70% 36%)' }} /></div><div><p className="text-sm font-medium" style={{ color: 'hsl(210 30% 15%)' }}>E-Mail</p><a href="mailto:info@futureroom.online" className="text-sm hover:underline" style={{ color: 'hsl(165 70% 36%)' }}>info@futureroom.online</a></div></div>
              <div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: 'hsl(165 70% 36% / 0.1)' }}><Phone className="h-5 w-5" style={{ color: 'hsl(165 70% 36%)' }} /></div><div><p className="text-sm font-medium" style={{ color: 'hsl(210 30% 15%)' }}>Telefon — Armstrong KI-Assistent</p><a href="tel:+498941432401" className="text-sm hover:underline" style={{ color: 'hsl(165 70% 36%)' }}>+49 89 4143 2401</a><p className="text-xs text-gray-400 mt-0.5">Rufen Sie an — unser KI-Assistent hilft Ihnen sofort weiter.</p></div></div>
              <div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: 'hsl(165 70% 36% / 0.1)' }}><MapPin className="h-5 w-5" style={{ color: 'hsl(165 70% 36%)' }} /></div><div><p className="text-sm font-medium" style={{ color: 'hsl(210 30% 15%)' }}>Standort</p><p className="text-sm text-gray-500">Deutschland</p></div></div>
            </div>
            <div className="rounded-xl p-5" style={{ background: 'hsl(165 70% 36% / 0.06)', border: '1px solid hsl(165 70% 36% / 0.15)' }}>
              <p className="text-xs text-gray-600 leading-relaxed"><strong style={{ color: 'hsl(210 30% 15%)' }}>Erstgespräch ist unverbindlich und kostenfrei.</strong> Ihre Daten werden DSGVO-konform behandelt.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
