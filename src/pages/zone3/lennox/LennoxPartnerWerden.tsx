/**
 * LennoxPartnerWerden — Bewerbungsformular für neue Partner
 * Submit → Zone 1 Pet Desk Intake (pet_z1_customers source: partner_application)
 */
import { useState } from 'react';
import { ArrowLeft, Handshake, CheckCircle, MapPin, Briefcase, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';

const COLORS = {
  primary: 'hsl(155,35%,25%)',
  foreground: 'hsl(155,25%,15%)',
  muted: 'hsl(155,10%,45%)',
  sand: 'hsl(35,30%,85%)',
};

const formSchema = z.object({
  name: z.string().trim().min(2, 'Name erforderlich').max(100),
  email: z.string().trim().email('Ungültige E-Mail').max(255),
  region: z.string().trim().min(2, 'Region angeben').max(100),
  serviceType: z.string().trim().min(2, 'Leistung angeben').max(200),
  message: z.string().trim().max(1000).optional(),
});

const BENEFITS = [
  { icon: MapPin, title: 'Regionale Sichtbarkeit', desc: 'Dein Profil erscheint bei Suchanfragen in deiner Umgebung.' },
  { icon: Briefcase, title: 'Einfache Verwaltung', desc: 'Buchungen, Kalender und Kunden an einem Ort.' },
  { icon: Heart, title: 'Starke Community', desc: 'Werde Teil des Lennox & Friends Netzwerks.' },
];

export default function LennoxPartnerWerden() {
  const [form, setForm] = useState({ name: '', email: '', region: '', serviceType: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message);
      return;
    }
    setLoading(true);
    try {
      // Split name into first/last
      const nameParts = parsed.data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error } = await supabase.from('pet_z1_customers').insert({
        tenant_id: 'a0000000-0000-4000-a000-000000000001',
        first_name: firstName,
        last_name: lastName || firstName,
        email: parsed.data.email,
        address: parsed.data.region,
        notes: [parsed.data.serviceType, parsed.data.message].filter(Boolean).join(' — '),
        source: 'partner_application',
        status: 'new',
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Bewerbung erfolgreich eingereicht!');
    } catch (err: any) {
      toast.error('Fehler beim Senden: ' + (err.message || 'Unbekannt'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center space-y-4">
        <CheckCircle className="h-12 w-12 mx-auto" style={{ color: COLORS.primary }} />
        <h1 className="text-2xl font-bold" style={{ color: COLORS.foreground }}>Vielen Dank!</h1>
        <p style={{ color: COLORS.muted }}>Deine Bewerbung wurde eingereicht. Wir melden uns innerhalb von 48 Stunden.</p>
        <Link to="/website/tierservice">
          <Button variant="outline" className="rounded-full mt-4">Zur Startseite</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 space-y-10">
      <Link to="/website/tierservice" className="inline-flex items-center gap-1 text-sm" style={{ color: COLORS.muted }}>
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      {/* Hero */}
      <div className="text-center space-y-3">
        <Handshake className="h-10 w-10 mx-auto" style={{ color: COLORS.primary }} />
        <h1 className="text-3xl font-bold" style={{ color: COLORS.foreground }}>Partner werden</h1>
        <p className="max-w-lg mx-auto" style={{ color: COLORS.muted }}>
          Du bist Tierbetreuer, Hundesitter oder bietest Pflegedienste an? Werde Teil von Lennox & Friends.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid gap-6 md:grid-cols-3">
        {BENEFITS.map(b => (
          <Card key={b.title} className="border text-center" style={{ borderColor: COLORS.sand, background: 'white' }}>
            <CardContent className="p-5 space-y-2">
              <b.icon className="h-7 w-7 mx-auto" style={{ color: COLORS.primary }} />
              <h3 className="font-semibold text-sm" style={{ color: COLORS.foreground }}>{b.title}</h3>
              <p className="text-xs" style={{ color: COLORS.muted }}>{b.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form */}
      <Card className="max-w-md mx-auto border" style={{ borderColor: COLORS.sand, background: 'white' }}>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold" style={{ color: COLORS.foreground }}>Bewerbungsformular</h2>
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={100} />
          </div>
          <div>
            <Label>E-Mail *</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} maxLength={255} />
          </div>
          <div>
            <Label>Region *</Label>
            <Input placeholder="z.B. München-Süd" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} maxLength={100} />
          </div>
          <div>
            <Label>Angebotene Leistung(en) *</Label>
            <Input placeholder="z.B. Hundepension, Grooming" value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} maxLength={200} />
          </div>
          <div>
            <Label>Nachricht (optional)</Label>
            <Textarea rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} maxLength={1000} />
          </div>
          <Button
            className="w-full rounded-full text-white font-semibold"
            style={{ background: COLORS.primary }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Wird gesendet…' : 'Bewerbung absenden'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
