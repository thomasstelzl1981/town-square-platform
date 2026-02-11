/**
 * Landing Page — Tab 2: Projekt
 * Project description, highlights, gallery placeholder
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, CheckCircle, Home, Flame, Calendar, Ruler } from 'lucide-react';
import { DEMO_PROJECT_DESCRIPTION } from '@/components/projekte/demoProjectData';

interface LandingPageProjektTabProps {
  isDemo: boolean;
  landingPage?: import('@/hooks/useLandingPage').LandingPage | null;
}

const HIGHLIGHTS = [
  'Vollständig energetisch saniert (KfW 70)',
  'Hochwertige Ausstattung mit Eichenparkett',
  'Fußbodenheizung in allen Wohneinheiten',
  'Bodentiefe Fenster mit Dreifachverglasung',
  'Balkone oder Terrassen mit Parkblick',
  'Elektrische Rollläden',
  'Tiefgaragenstellplätze verfügbar',
  'Wenige Gehminuten zum Englischen Garten',
];

export function LandingPageProjektTab({ isDemo }: LandingPageProjektTabProps) {
  const desc = DEMO_PROJECT_DESCRIPTION;

  return (
    <div className="space-y-6">
      {isDemo && (
        <Badge variant="secondary" className="opacity-60">Beispieldaten</Badge>
      )}

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Projektbeschreibung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {desc.description.map((paragraph, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">{paragraph}</p>
          ))}
        </CardContent>
      </Card>

      {/* Key Facts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FactCard icon={Home} label="Einheiten" value={`${desc.total_units} Wohnungen`} />
        <FactCard icon={Ruler} label="Gesamtfläche" value={`${desc.total_living_area?.toLocaleString('de-DE')} m²`} />
        <FactCard icon={Calendar} label="Baujahr / Sanierung" value={`${desc.year_built} / ${desc.renovation_year}`} />
        <FactCard icon={Flame} label="Energieeffizienz" value={`Klasse ${desc.energy_class}`} />
      </div>

      {/* Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {HIGHLIGHTS.map((highlight) => (
              <div key={highlight} className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{highlight}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gallery Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Bildergalerie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {['Außenansicht', 'Wohnzimmer', 'Küche', 'Badezimmer'].map((label) => (
              <div key={label} className="aspect-[4/3] rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Lage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            Die Residenz am Stadtpark befindet sich in einer der begehrtesten Wohnlagen Münchens. 
            In unmittelbarer Nähe zum Englischen Garten gelegen, bietet die Lage eine perfekte Kombination 
            aus urbanem Komfort und naturnahem Wohnen. Einkaufsmöglichkeiten, Restaurants und kulturelle 
            Einrichtungen sind fußläufig erreichbar. Die U-Bahn-Station ist nur 3 Gehminuten entfernt.
          </p>
          <div className="mt-4 aspect-[16/9] rounded-lg bg-muted flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Karte wird nach Veröffentlichung angezeigt</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FactCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
