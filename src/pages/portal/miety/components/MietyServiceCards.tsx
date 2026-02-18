/**
 * MietyServiceCards — Affiliate-Deeplink-Kacheln für Handwerker (MyHammer) und Haushaltshilfe (Betreut.de)
 * Liest PLZ aus miety_homes für vorausgefüllte Deeplinks.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, Users, ExternalLink } from 'lucide-react';

interface MietyServiceCardsProps {
  plz?: string | null;
}

const SERVICES = [
  {
    id: 'myhammer',
    title: 'Handwerker finden',
    description: 'Handwerker und Sanierungsprofis in Ihrer Nähe. MyHammer: 40.000+ geprüfte Fachleute in ganz Deutschland.',
    icon: Wrench,
    cta: 'Handwerker suchen',
    partner: 'MyHammer',
    partnerSub: 'by Instapro Group',
    buildUrl: (plz?: string | null) => {
      const base = 'https://www.my-hammer.de/auftragnehmer-suchen';
      const params = new URLSearchParams({
        utm_source: 'armstrong',
        utm_medium: 'portal',
        utm_campaign: 'miety_sanierung',
      });
      if (plz) params.set('plz', plz);
      return `${base}?${params.toString()}`;
    },
  },
  {
    id: 'betreut',
    title: 'Haushaltshilfe finden',
    description: 'Haushaltshilfen, Putzfrauen und Alltagshelfer in Ihrer Nähe. Betreut.de: Deutschlands größte Plattform für Betreuung.',
    icon: Users,
    cta: 'Haushaltshilfe suchen',
    partner: 'betreut.de',
    partnerSub: 'by Care.com',
    buildUrl: () => 'https://www.betreut.de/haushaltshilfe',
  },
] as const;

export function MietyServiceCards({ plz }: MietyServiceCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SERVICES.map((svc) => {
        const Icon = svc.icon;
        return (
          <Card key={svc.id} className="glass-card group hover:border-primary/30 transition-colors">
            <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">{svc.title}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-medium border-primary/20 text-primary">
                    Partner
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {svc.description}
                </p>
                {plz && (
                  <p className="text-xs text-muted-foreground mt-2">
                    PLZ: <span className="font-medium text-foreground">{plz}</span> (aus Profil)
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-between group-hover:border-primary/40"
                  asChild
                >
                  <a href={svc.buildUrl(plz)} target="_blank" rel="noopener noreferrer">
                    {svc.cta}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{svc.partner}</span>
                  <span>{svc.partnerSub}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
