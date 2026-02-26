/**
 * ServiceWidget — Affiliate-Deeplink Widget (MyHammer / Betreut.de)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, Users, ExternalLink } from 'lucide-react';

const SERVICES: Record<string, {
  title: string;
  description: string;
  icon: typeof Wrench;
  cta: string;
  partner: string;
  partnerSub: string;
  buildUrl: (plz?: string | null) => string;
}> = {
  myhammer: {
    title: 'Handwerker finden',
    description: 'MyHammer: 40.000+ geprüfte Fachleute in ganz Deutschland.',
    icon: Wrench,
    cta: 'Handwerker suchen',
    partner: 'MyHammer',
    partnerSub: 'by Instapro Group',
    buildUrl: (plz) => {
      const params = new URLSearchParams({ utm_source: 'armstrong', utm_medium: 'portal', utm_campaign: 'miety_sanierung' });
      if (plz) params.set('plz', plz);
      return `https://www.my-hammer.de/auftragnehmer-suchen?${params.toString()}`;
    },
  },
  betreut: {
    title: 'Haushaltshilfe finden',
    description: 'Betreut.de: Deutschlands größte Plattform für Betreuung.',
    icon: Users,
    cta: 'Haushaltshilfe suchen',
    partner: 'betreut.de',
    partnerSub: 'by Care.com',
    buildUrl: () => 'https://www.betreut.de/haushaltshilfe',
  },
};

interface ServiceWidgetProps {
  serviceId: string;
  plz?: string | null;
}

export function ServiceWidget({ serviceId, plz }: ServiceWidgetProps) {
  const svc = SERVICES[serviceId];
  if (!svc) return null;

  const Icon = svc.icon;

  return (
    <Card className="glass-card group hover:border-primary/30 transition-colors h-full flex flex-col">
      <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-sm">{svc.title}</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-medium border-primary/20 text-primary">Partner</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{svc.description}</p>
          {plz && (
            <p className="text-xs text-muted-foreground mt-2">PLZ: <span className="font-medium text-foreground">{plz}</span></p>
          )}
        </div>
        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-between group-hover:border-primary/40" asChild>
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
}
