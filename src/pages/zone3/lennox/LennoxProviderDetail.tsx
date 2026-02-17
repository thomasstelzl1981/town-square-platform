/**
 * LennoxProviderDetail — Public provider profile page
 * Route: /website/tierservice/anbieter/:providerId
 */
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Phone, Mail, Clock, PawPrint, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProviderDetail } from '@/hooks/usePetProviderSearch';
import { usePublicProviderServices, usePublicProviderAvailability } from '@/hooks/usePublicPetProvider';

const categoryLabels: Record<string, string> = {
  betreuung: 'Betreuung',
  gassi: 'Gassi-Service',
  pflege: 'Pflege',
  training: 'Training',
  tierarzt: 'Tierarzt',
  pension: 'Pension',
  sonstiges: 'Sonstiges',
};

const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

export default function LennoxProviderDetail() {
  const { providerId } = useParams<{ providerId: string }>();
  const { data: provider, isLoading } = useProviderDetail(providerId);
  const { data: services = [] } = usePublicProviderServices(providerId);
  const { data: availability = [] } = usePublicProviderAvailability(providerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(25,85%,55%)] border-t-transparent" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-[hsl(25,15%,55%)]">Anbieter nicht gefunden.</p>
        <Link to="/website/tierservice">
          <Button variant="outline" className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-1" /> Zurück zur Suche
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Back link */}
      <Link to="/website/tierservice" className="inline-flex items-center gap-1 text-sm text-[hsl(25,15%,55%)] hover:text-[hsl(25,85%,55%)] transition-colors">
        <ArrowLeft className="h-4 w-4" /> Alle Anbieter
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {(provider as any).cover_image_url ? (
          <img src={(provider as any).cover_image_url} alt="" className="w-24 h-24 rounded-2xl object-cover shrink-0" />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[hsl(25,50%,92%)] to-[hsl(35,40%,88%)] flex items-center justify-center shrink-0">
            <PawPrint className="h-10 w-10 text-[hsl(25,85%,55%,0.5)]" />
          </div>
        )}
        <div className="space-y-2 min-w-0">
          <h1 className="text-2xl font-bold text-[hsl(25,30%,15%)]">{provider.company_name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[hsl(25,15%,45%)]">
            {provider.rating_avg != null && provider.rating_avg > 0 && (
              <span className="flex items-center gap-1 text-[hsl(40,90%,45%)]">
                <Star className="h-4 w-4 fill-current" /> {provider.rating_avg.toFixed(1)}
              </span>
            )}
            {provider.address && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {provider.address}</span>
            )}
          </div>
          {provider.bio && <p className="text-sm text-[hsl(25,15%,45%)] leading-relaxed">{provider.bio}</p>}
          <div className="flex gap-3 text-xs text-[hsl(25,15%,55%)]">
            {provider.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{provider.phone}</span>}
            {provider.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{provider.email}</span>}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-[hsl(25,85%,55%)] to-[hsl(35,80%,50%)] p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg">Termin buchen</h3>
          <p className="text-white/80 text-sm">Registriere dich kostenlos und buche direkt online.</p>
        </div>
        <Link to="/auth">
          <Button variant="secondary" className="rounded-full font-semibold whitespace-nowrap">
            Jetzt buchen <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[hsl(25,30%,15%)]">Leistungen</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map(s => (
              <Card key={s.id} className="border-[hsl(35,30%,90%)] bg-white">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium text-sm text-[hsl(25,30%,15%)]">{s.title}</h3>
                    {s.price_cents != null && s.price_cents > 0 && (
                      <span className="text-sm font-semibold text-[hsl(25,85%,55%)]">
                        {(s.price_cents / 100).toFixed(2)} €
                      </span>
                    )}
                  </div>
                  {s.description && <p className="text-xs text-[hsl(25,15%,55%)] line-clamp-2">{s.description}</p>}
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="secondary" className="text-[10px] bg-[hsl(35,40%,94%)] text-[hsl(25,30%,35%)]">
                      {categoryLabels[s.category] || s.category}
                    </Badge>
                    {s.duration_minutes > 0 && (
                      <span className="text-[10px] text-[hsl(25,15%,55%)]">{s.duration_minutes} Min.</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Availability */}
      {availability.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[hsl(25,30%,15%)]">Öffnungszeiten</h2>
          <Card className="border-[hsl(35,30%,90%)] bg-white">
            <CardContent className="p-4">
              <div className="space-y-2">
                {availability.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-[hsl(25,20%,30%)] font-medium">{dayNames[a.day_of_week]}</span>
                    <span className="text-[hsl(25,15%,55%)] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {a.start_time?.slice(0, 5)} – {a.end_time?.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
