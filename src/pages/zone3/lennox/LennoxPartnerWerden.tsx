/**
 * LennoxPartnerWerden — Bewerbungsformular für neue Partner
 * Submit → Zone 1 Pet Desk Intake (pet_z1_customers source: partner_application)
 */
import { useState } from 'react';
import { ArrowLeft, CheckCircle, MapPin, Users, Star, Eye, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import partnerHero from '@/assets/lennox/partner_hero.jpg';

const COLORS = {
  forest: 'hsl(155,35%,25%)',
  bark: 'hsl(155,25%,15%)',
  muted: 'hsl(155,10%,45%)',
  sand: 'hsl(35,30%,85%)',
  cream: 'hsl(40,40%,96%)',
};

const formSchema = z.object({
  name: z.string().trim().min(2, 'Name erforderlich').max(100),
  email: z.string().trim().email('Ungültige E-Mail').max(255),
  region: z.string().trim().min(2, 'Region angeben').max(100),
  serviceType: z.string().trim().min(2, 'Leistung angeben').max(200),
  message: z.string().trim().max(1000).optional(),
});

const BENEFITS = [
  { icon: MapPin, title: 'Exklusivität für deine Region', desc: 'Werde alleiniger Lennox-Partner in deinem Gebiet — ohne direkte Konkurrenz auf der Plattform.' },
  { icon: ShoppingBag, title: 'Buchungen über die Plattform', desc: 'Erhalte Anfragen und Buchungen direkt über Lennox & Friends, ohne eigene Vermarktung.' },
  { icon: Users, title: 'Teil einer wachsenden Community', desc: 'Wir bauen ein deutschlandweites Netzwerk geprüfter Hundeprofis auf — werde jetzt Teil davon.' },
  { icon: Eye, title: 'Professionelle Sichtbarkeit', desc: 'Dein Profil, deine Leistungen und Bewertungen — professionell dargestellt für Hundehalter in deiner Nähe.' },
  { icon: Star, title: 'Kuratierte Produkttipps', desc: 'Empfehle ausgewählte Produkte aus dem Lennox Shop und profitiere von unserem Partnerprogramm.' },
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
        <CheckCircle className="h-12 w-12 mx-auto" style={{ color: COLORS.forest }} />
        <h1 className="text-2xl font-bold" style={{ color: COLORS.bark }}>Vielen Dank!</h1>
        <p style={{ color: COLORS.muted }}>Deine Bewerbung wurde eingereicht. Wir melden uns innerhalb von 48 Stunden.</p>
        <Link to="/website/tierservice">
          <Button variant="outline" className="rounded-full mt-4">Zur Startseite</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden" style={{ minHeight: '50vh' }}>
        <div className="absolute inset-0">
          <img src={partnerHero} alt="Lennox Partner Netzwerk" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-5" style={{ minHeight: '50vh' }}>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">Werde Partner in deiner Region</h1>
          <p className="text-white/80 text-base md:text-lg max-w-xl">
            Gemeinsam bauen wir das größte Netzwerk für Hunde-Dienstleister in Deutschland.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 py-10 space-y-12">
        <Link to="/website/tierservice" className="inline-flex items-center gap-1 text-sm" style={{ color: COLORS.muted }}>
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Link>

        {/* ═══ VISION ═══ */}
        <section className="space-y-4 max-w-2xl">
          <h2 className="text-2xl font-bold" style={{ color: COLORS.bark }}>Unsere Vision</h2>
          <p className="leading-relaxed" style={{ color: COLORS.muted }}>
            Unser Ziel ist ein deutschlandweites Netzwerk geprüfter Hundeprofis — eine zentrale Plattform,
            auf der sich jeder Hundehalter Unterstützung holen kann: ob Betreuung während des Urlaubs,
            professionelle Pflege oder einfach einen zuverlässigen Gassi-Service in der Nachbarschaft.
          </p>
          <p className="leading-relaxed" style={{ color: COLORS.muted }}>
            Lennox & Friends ist bereits Teil einer wachsenden Plattform für private Dienstleistungen.
            Gegründet in Bayern, mit langjähriger Erfahrung in der Hundebetreuung, möchten wir sehr bald
            in jeder Region Deutschlands einen exklusiven Partner an unserer Seite haben.
          </p>
          <p className="font-semibold" style={{ color: COLORS.forest }}>
            Werden Sie exklusiver Partner für Ihre Region in unserem Netzwerk.
          </p>
        </section>

        {/* ═══ BENEFITS ═══ */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold" style={{ color: COLORS.bark }}>Ihre Vorteile als Partner</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(b => (
              <Card key={b.title} className="border" style={{ borderColor: COLORS.sand, background: 'white' }}>
                <CardContent className="p-5 space-y-2">
                  <b.icon className="h-7 w-7" style={{ color: COLORS.forest }} />
                  <h3 className="font-semibold text-sm" style={{ color: COLORS.bark }}>{b.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══ FORM ═══ */}
        <Card className="max-w-md mx-auto border" style={{ borderColor: COLORS.sand, background: COLORS.cream }}>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: COLORS.bark }}>Bewerbungsformular</h2>
            <div>
              <Label className="text-sm font-medium" style={{ color: COLORS.bark }}>Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                maxLength={100}
                className="mt-1 border"
                style={{ borderColor: COLORS.sand, color: COLORS.bark, background: 'white' }}
              />
            </div>
            <div>
              <Label className="text-sm font-medium" style={{ color: COLORS.bark }}>E-Mail *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                maxLength={255}
                className="mt-1 border"
                style={{ borderColor: COLORS.sand, color: COLORS.bark, background: 'white' }}
              />
            </div>
            <div>
              <Label className="text-sm font-medium" style={{ color: COLORS.bark }}>Region *</Label>
              <Input
                placeholder="z.B. München-Süd"
                value={form.region}
                onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                maxLength={100}
                className="mt-1 border"
                style={{ borderColor: COLORS.sand, color: COLORS.bark, background: 'white' }}
              />
            </div>
            <div>
              <Label className="text-sm font-medium" style={{ color: COLORS.bark }}>Angebotene Leistung(en) *</Label>
              <Input
                placeholder="z.B. Hundepension, Grooming"
                value={form.serviceType}
                onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))}
                maxLength={200}
                className="mt-1 border"
                style={{ borderColor: COLORS.sand, color: COLORS.bark, background: 'white' }}
              />
            </div>
            <div>
              <Label className="text-sm font-medium" style={{ color: COLORS.bark }}>Nachricht (optional)</Label>
              <Textarea
                rows={3}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                maxLength={1000}
                className="mt-1 border"
                style={{ borderColor: COLORS.sand, color: COLORS.bark, background: 'white' }}
              />
            </div>
            <Button
              className="w-full rounded-full text-white font-semibold"
              style={{ background: COLORS.forest }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Wird gesendet…' : 'Bewerbung absenden'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
