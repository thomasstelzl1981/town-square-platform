/**
 * LennoxPartnerProfil — Dynamisches Partnerprofil mit Service-Kacheln + Inline-Booking
 * Verwendet eigenständiges Z3-Auth (getrennt vom Portal)
 * Buchung schreibt via Edge Proxy in pet_service_cases (PLC-Engine)
 * P0 FIX: Uses useCreateZ3Case instead of useCreateCase (no Supabase Auth needed)
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
import { useState } from 'react';
import { toast } from 'sonner';
import { useZ3Auth } from '@/hooks/useZ3Auth';
import { useCreateZ3Case } from '@/hooks/usePetServiceCases';
import { LENNOX as C, SERVICE_TAG_LABELS } from './lennoxTheme';
import { SEOHead } from '@/components/zone3/shared/SEOHead';

export default function LennoxPartnerProfil() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: provider, isLoading } = useProviderDetail(slug);
  const { z3User, z3SessionToken } = useZ3Auth();
  const [showBooking, setShowBooking] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: C.forest }} />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-4xl mx-auto px-5 py-16 text-center space-y-4">
        <p style={{ color: C.barkMuted }}>Partner nicht gefunden.</p>
        <Link to="/website/tierservice">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-1" /> Zurück
          </Button>
        </Link>
      </div>
    );
  }

  const handleBookingRequest = () => {
    if (!z3User) {
      navigate(`/website/tierservice/login?returnTo=/website/tierservice/partner/${slug}`);
      return;
    }
    setShowBooking(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 space-y-8">
      <SEOHead
        brand="lennox"
        page={{
          title: provider ? `${provider.company_name} — Partner-Profil` : 'Partner-Profil',
          description: provider ? `${provider.company_name}: Geprüfter Lennox & Friends Partner. Leistungen, Bewertungen und Buchung.` : 'Lennox & Friends Partner-Profil.',
          path: `/partner/${slug || ''}`,
          noIndex: !provider,
        }}
      />
      {/* Back */}
      <Link to="/website/tierservice" className="inline-flex items-center gap-1 text-sm" style={{ color: C.barkMuted }}>
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>

      {/* ═══ PARTNER HERO ═══ */}
      <section className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-64 h-48 rounded-xl overflow-hidden shrink-0" style={{ background: `linear-gradient(135deg, ${C.sandLight}, ${C.cream})` }}>
          {provider.cover_image_url ? (
            <img src={provider.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="h-12 w-12" style={{ color: `${C.forest}44` }} />
            </div>
          )}
        </div>
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold" style={{ color: C.bark }}>{provider.company_name}</h1>
            <Badge className="text-xs text-white" style={{ background: C.forest }}>
              <Shield className="h-3 w-3 mr-1" /> Geprüfter Partner
            </Badge>
          </div>
          {provider.address && (
            <p className="text-sm flex items-center gap-1" style={{ color: C.barkMuted }}>
              <MapPin className="h-4 w-4" /> {provider.address}
            </p>
          )}
          {provider.bio && (
            <p className="text-sm leading-relaxed line-clamp-3" style={{ color: C.bark }}>{provider.bio}</p>
          )}
          {provider.rating_avg != null && provider.rating_avg > 0 && (
            <div className="flex items-center gap-1 text-sm" style={{ color: C.gold }}>
              <Star className="h-4 w-4 fill-current" />
              {provider.rating_avg.toFixed(1)} Bewertung
            </div>
          )}
        </div>
      </section>

      {/* ═══ GALERIE ═══ */}
      {(provider as any).gallery_images?.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4" style={{ color: C.bark }}>Impressionen</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {((provider as any).gallery_images as string[]).map((url: string, i: number) => (
              <img key={i} src={url} alt={`Galerie ${i + 1}`} className="w-full aspect-[4/3] rounded-xl object-cover" />
            ))}
          </div>
        </section>
      )}

      {/* ═══ SERVICE-MODULE (max 4 Kacheln) ═══ */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: C.bark }}>Leistungen</h2>
        {services.length === 0 ? (
          <p className="text-sm" style={{ color: C.barkMuted }}>Keine Leistungen hinterlegt.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {services.slice(0, 4).map((s: any) => (
              <Card key={s.id} className="border hover:shadow-md transition-shadow" style={{ borderColor: C.sand, background: 'white' }}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium" style={{ color: C.bark }}>{s.title}</h3>
                    <Badge variant="secondary" className="text-[10px]" style={{ background: `${C.forest}15`, color: C.forest }}>
                      {SERVICE_TAG_LABELS[s.category] || s.category}
                    </Badge>
                  </div>
                  {s.description && <p className="text-xs" style={{ color: C.barkMuted }}>{s.description}</p>}
                  {s.price_cents != null && (
                    <p className="text-sm font-semibold" style={{ color: C.forest }}>
                      ab {(s.price_cents / 100).toFixed(2)} €
                    </p>
                  )}
                  <Button
                    size="sm" className="rounded-full text-white w-full"
                    style={{ background: C.forest }}
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
      {showBooking && z3User && z3SessionToken && (
        <BookingBlock
          providerId={provider.id}
          providerName={provider.company_name}
          serviceId={selectedService}
          z3User={z3User}
          z3SessionToken={z3SessionToken}
          onClose={() => setShowBooking(false)}
        />
      )}

      {/* ═══ KONTAKT ═══ */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold" style={{ color: C.bark }}>Kontakt</h2>
        <div className="flex flex-wrap gap-4 text-sm" style={{ color: C.barkMuted }}>
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

/** Inline Booking Block — writes to pet_service_cases via Z3 Edge Proxy (P0 fix) */
function BookingBlock({ providerId, providerName, serviceId, z3User, z3SessionToken, onClose }: {
  providerId: string; providerName: string; serviceId: string | null;
  z3User: { id: string; email: string | null; first_name: string | null; last_name: string | null };
  z3SessionToken: string;
  onClose: () => void;
}) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [notes, setNotes] = useState('');
  const createCase = useCreateZ3Case();

  const handleSubmit = async () => {
    if (!dateFrom) { toast.error('Bitte Datum auswählen'); return; }
    if (!serviceId) { toast.error('Bitte Service auswählen'); return; }

    createCase.mutate({
      session_token: z3SessionToken,
      provider_id: providerId,
      service_id: serviceId,
      scheduled_start: dateFrom,
      scheduled_end: dateTo || null,
      customer_notes: notes || null,
    }, {
      onSuccess: () => {
        toast.success(`Buchungsanfrage an ${providerName} gesendet!`);
        onClose();
      },
    });
  };

  return (
    <Card className="border-2" style={{ borderColor: C.forest, background: 'white' }}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: C.bark }}>
            <Calendar className="h-5 w-5" style={{ color: C.forest }} />
            Buchung anfragen
          </h3>
          <button onClick={onClose} className="text-xs underline" style={{ color: C.barkMuted }}>Schließen</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Von</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              min={new Date().toISOString().split('T')[0]} style={{ borderColor: C.sand }} />
          </div>
          <div>
            <Label>Bis</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              min={dateFrom || new Date().toISOString().split('T')[0]} style={{ borderColor: C.sand }} />
          </div>
        </div>
        <div>
          <Label>Anmerkungen</Label>
          <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Besondere Wünsche…"
            maxLength={500} style={{ borderColor: C.sand }} />
        </div>
        <Button className="w-full rounded-full text-white font-semibold" style={{ background: C.forest }}
          onClick={handleSubmit} disabled={createCase.isPending}>
          {createCase.isPending ? 'Wird gesendet…' : 'Buchung anfragen'}
        </Button>
      </CardContent>
    </Card>
  );
}
