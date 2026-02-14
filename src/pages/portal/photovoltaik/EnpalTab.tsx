/**
 * Enpal Tab — PV-Anlagen mieten oder kaufen über Enpal
 * Marketplace-Integration im CI der Plattform
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import {
  Sun, Zap, Battery, ThermometerSun, Shield, ArrowRight,
  CheckCircle2, Euro, Calendar, Wrench, ExternalLink,
} from 'lucide-react';

const ENPAL_PRODUCTS = [
  {
    title: 'Solaranlage mieten',
    subtitle: 'Ab 98 €/Monat',
    icon: Sun,
    highlights: [
      '0 € Anzahlung',
      'Rundum-Sorglos-Paket inkl. Wartung & Versicherung',
      'Hocheffiziente 480 Wp All-Black Module',
      '20 Jahre Mietvertrag, danach Übernahme für 1 €',
      'Installation in 6-8 Wochen',
    ],
    badge: 'Beliebt',
    badgeVariant: 'default' as const,
  },
  {
    title: 'Solaranlage kaufen',
    subtitle: 'Einmalzahlung oder Finanzierung',
    icon: Euro,
    highlights: [
      'Sofort Eigentümer der Anlage',
      'Höhere Rendite langfristig',
      'Flexible Finanzierungsoptionen',
      'Herstellergarantie bis 25 Jahre',
      'Optional: Wartungsvertrag',
    ],
    badge: 'Flexibel',
    badgeVariant: 'secondary' as const,
  },
  {
    title: 'Stromspeicher',
    subtitle: 'Mehr Eigenverbrauch',
    icon: Battery,
    highlights: [
      'Bis zu 80 % Eigenverbrauchsquote',
      'Notstromfähig (optional)',
      'Nachrüstbar für Bestandsanlagen',
      'Integration mit Wärmepumpe',
      'Intelligentes Energiemanagement',
    ],
    badge: 'Add-on',
    badgeVariant: 'outline' as const,
  },
  {
    title: 'Wärmepumpe',
    subtitle: 'Ab 7.800 € mit Förderung',
    icon: ThermometerSun,
    highlights: [
      'Bis zu 70 % staatliche Förderung',
      'Kombination mit PV für maximale Ersparnis',
      'Heizen & Kühlen in einem Gerät',
      'Fördermittelservice inklusive',
      'Markengeräte (Daikin, Vaillant, Viessmann)',
    ],
    badge: 'Förderung',
    badgeVariant: 'secondary' as const,
  },
];

const ENPAL_BENEFITS = [
  { icon: Shield, label: 'TÜV-zertifiziert', desc: 'Geprüfte Qualität und Sicherheit' },
  { icon: Wrench, label: 'Rundum-Service', desc: 'Installation, Wartung, Versicherung' },
  { icon: Calendar, label: 'Schnelle Installation', desc: '6-8 Wochen nach Vertragsschluss' },
  { icon: Zap, label: 'Sofort sparen', desc: 'Ab dem ersten Tag Stromkosten senken' },
];

export default function EnpalTab() {
  return (
    <PageShell>
      <ModulePageHeader
        title="ENPAL"
        description="Solaranlage mieten oder kaufen — Partner-Angebote für Ihre Immobilien"
      />

      {/* Benefits Bar */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {ENPAL_BENEFITS.map((b) => (
          <Card key={b.label} className="border-primary/10">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <b.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{b.label}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Product Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {ENPAL_PRODUCTS.map((product) => (
          <Card key={product.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <product.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{product.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{product.subtitle}</p>
                  </div>
                </div>
                <Badge variant={product.badgeVariant}>{product.badge}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {product.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full gap-2" variant="outline">
                Angebot anfragen <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA Section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 text-center space-y-3">
          <Sun className="h-8 w-8 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">Ersparnis berechnen</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Finden Sie heraus, wie viel Sie mit einer Solaranlage auf Ihrem Dach sparen können.
            Unverbindlich und kostenlos — direkt für Ihre Immobilien aus dem Portfolio.
          </p>
          <Button className="gap-2" onClick={() => window.open('https://www.enpal.de/informieren-c1', '_blank')}>
            <ExternalLink className="h-4 w-4" /> Jetzt Ersparnis berechnen
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
