/**
 * Landing Page — Publishing/Domain Section
 * UI placeholder for domain connection (Phase 2 functionality)
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Link2, Server } from 'lucide-react';

interface LandingPagePublishSectionProps {
  landingPage?: import('@/hooks/useLandingPage').LandingPage | null;
}

export function LandingPagePublishSection({ landingPage }: LandingPagePublishSectionProps) {
  const options = [
    {
      icon: Link2,
      title: 'Domain verbinden',
      desc: 'Eigene Domain via Cloudflare DNS anbinden',
      status: 'Nicht konfiguriert',
      action: 'Einrichten',
    },
    {
      icon: Globe,
      title: 'Domain buchen',
      desc: 'Neue Domain registrieren und automatisch verbinden',
      status: 'Nicht konfiguriert',
      action: 'Domain suchen',
    },
    {
      icon: Server,
      title: 'kaufy.app Subdomain',
      desc: 'Kostenlose Subdomain unter kaufy.app',
      status: 'Verfügbar',
      action: 'Aktivieren',
    },
  ];

  return (
    <div className="space-y-4 pt-6 border-t">
      <div>
        <h3 className="text-lg font-semibold">Veröffentlichen & Domain</h3>
        <p className="text-sm text-muted-foreground">Verbinden Sie eine Domain, um Ihre Landingpage live zu schalten</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <Card key={opt.title} className="border-dashed">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{opt.title}</h4>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">{opt.status}</Badge>
                  <Button variant="outline" size="sm" disabled>{opt.action}</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
