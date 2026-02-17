/**
 * LennoxPartnerProfil — Dynamisches Partnerprofil mit Service-Kacheln + Inline-Booking
 * Route: /website/tierservice/partner/:slug
 */
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Shield, Phone, Clock, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProviderDetail } from '@/hooks/usePetProviderSearch';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const SERVICE_TAG_LABELS: Record<string, string> = {
  boarding: 'Pension', daycare: 'Tagesstätte', grooming: 'Pflege',
  walking: 'Gassi', training: 'Training', sitting: 'Sitting',
  veterinary: 'Tierarzt', transport: 'Transport', nutrition: 'Ernährung', other: 'Sonstiges',
};

const COLORS = {
  primary: 'hsl(155,35%,25%)',
  bg: 'hsl(40,30%,97%)',
  sand: 'hsl(35,30%,85%)',
  foreground: 'hsl(155,25%,15%)',
  muted: 'hsl(155,10%,45%)',
  coral: 'hsl(10,85%,60%)',
};

export default function LennoxPartnerProfil() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: provider, isLoading } = useProviderDetail(slug);
  const [user, setUser] = useState<any>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u));
  }, []);

  // Load provider services
  const { data: services = [] } = useQuery({
    queryKey: ['pet_services_for_provider', slug],
    queryFn: async () => {
      if (!slug) return [];
      const { data } = await supabase
        .from('pet_services')
        .select('*')
        .eq('provider_id', slug)
        .eq('is_active', true)
        .limit(4);
      return data || [];
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: COLORS.primary }} />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-16 text-center space-y-4">
        <p style={{ color: COLORS.muted }}>Partner nicht gefunden.</p>
        <Link to="/website/tierservice">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-1" /> Zurück
          </Button>
        </Link>
      </div>
    );
  }

  const handleBookingRequest = () => {
    if (!user) {
      navigate(`/website/tierservice/login?returnTo=/website/tierservice/partner/${slug}`);
      return;
    }
    setShowBooking(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 space-y-8">
      {/* Back */}
      <Link to="/website/tierservice" className="inline-flex items-center gap-1 text-sm" style={{ color: COLORS.muted }}>
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      {/* ═══ PARTNER HERO ═══ */}
      <section className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-64 h-48 rounded-xl overflow-hidden shrink-0" style={{ background: `linear-gradient(135deg, hsl(155,30%,90%), hsl(40,25%,90%))` }}>
          {provider.cover_image_url ? (
            <img src={provider.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="h-12 w-12" style={{ color: `${COLORS.primary}44` }} />
            </div>
          )}
        </div>
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold" style={{ color: COLORS.foreground }}>{provider.company_name}</h1>
            <Badge className="text-xs text-white" style={{ background: COLORS.primary }}>
              <Shield className="h-3 w-3 mr-1" /> Geprüfter Partner
            </Badge>
          </div>
          {provider.address && (
            <p className="text-sm flex items-center gap-1" style={{ color: COLORS.muted }}>
              <MapPin className="h-4 w-4" /> {provider.address}
            </p>
          )}
          {provider.bio && (
            <p className="text-sm leading-relaxed line-clamp-3" style={{ color: COLORS.foreground }}>{provider.bio}</p>
          )}
          {provider.rating_avg != null && provider.rating_avg > 0 && (
            <div className="flex items-center gap-1 text-sm" style={{ color: 'hsl(40,90%,45%)' }}>
              <Star className="h-4 w-4 fill-current" />
              {provider.rating_avg.toFixed(1)} Bewertung
            </div>
          )}
        </div>
      </section>

      {/* ═══ SERVICE-MODULE (max 4 Kacheln) ═══ */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: COLORS.foreground }}>Leistungen</h2>
        {services.length === 0 ? (
          <p className="text-sm" style={{ color: COLORS.muted }}>Keine Leistungen hinterlegt.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {services.slice(0, 4).map((s: any) => (
              <Card key={s.id} className="border hover:shadow-md transition-shadow" style={{ borderColor: COLORS.sand, background: 'white' }}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium" style={{ color: COLORS.foreground }}>{s.name}</h3>
                    <Badge variant="secondary" className="text-[10px]" style={{ background: 'hsl(155,20%,92%)', color: COLORS.primary }}>
                      {SERVICE_TAG_LABELS[s.category] || s.category}
                    </Badge>
                  </div>
                  {s.description && <p className="text-xs" style={{ color: COLORS.muted }}>{s.description}</p>}
                  {s.price_cents != null && (
                    <p className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                      ab {(s.price_cents / 100).toFixed(2)} €
                    </p>
                  )}
                  <Button
                    size="sm" className="rounded-full text-white w-full"
                    style={{ background: COLORS.primary }}
                    onClick={() => { setSelectedService(s.id); handleBookingRequest(); }}
                  >
                    Buchung anfragen <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ═══ BOOKING BLOCK (inline) ═══ */}
      {showBooking && user && (
        <BookingBlock
          providerId={provider.id}
          providerName={provider.company_name}
          serviceId={selectedService}
          onClose={() => setShowBooking(false)}
        />
      )}

      {/* ═══ KONTAKT ═══ */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold" style={{ color: COLORS.foreground }}>Kontakt</h2>
        <div className="flex flex-wrap gap-4 text-sm" style={{ color: COLORS.muted }}>
          {provider.phone && (
            <a href={`tel:${provider.phone}`} className="flex items-center gap-1 hover:underline">
              <Phone className="h-4 w-4" /> {provider.phone}
            </a>
          )}
          {provider.email && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {provider.email}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

/** Inline Booking Block */
function BookingBlock({ providerId, providerName, serviceId, onClose }: {
  providerId: string; providerName: string; serviceId: string | null; onClose: () => void;
}) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!dateFrom) { toast.error('Bitte Datum auswählen'); return; }
    setSubmitting(true);
    // TODO: Submit to pet_bookings / Z1 intake
    await new Promise(r => setTimeout(r, 800));
    toast.success(`Buchungsanfrage an ${providerName} gesendet!`);
    setSubmitting(false);
    onClose();
  };

  return (
    <Card className="border-2" style={{ borderColor: COLORS.primary, background: 'white' }}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: COLORS.foreground }}>
            <Calendar className="h-5 w-5" style={{ color: COLORS.primary }} />
            Buchung anfragen
          </h3>
          <button onClick={onClose} className="text-xs underline" style={{ color: COLORS.muted }}>Schließen</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Von</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>Bis</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Anmerkungen</Label>
          <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Besondere Wünsche…" />
        </div>
        <p className="text-xs" style={{ color: COLORS.muted }}>
          💡 5 € Anzahlung online — wird auf den Gesamtpreis angerechnet.
        </p>
        <Button
          className="w-full rounded-full text-white font-semibold"
          style={{ background: COLORS.primary }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Wird gesendet…' : 'Buchung anfragen'}
        </Button>
      </CardContent>
    </Card>
  );
}
