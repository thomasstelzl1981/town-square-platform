/**
 * AroundhomePartnerCard — 6 Kategorie-Kacheln mit AWIN-Deeplinks für Sanierungsprojekte
 * AWIN Advertiser ID: 68536
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  DoorOpen,
  Flame,
  Layers,
  Bath,
  CookingPot,
  Sun,
} from 'lucide-react';

const AWIN_BASE = 'https://www.awin1.com/cread.php?awinmid=68536&awinaffid=YOUR_AFF_ID&ued=';

const CATEGORIES = [
  { slug: 'fenster', label: 'Fenster & Türen', icon: DoorOpen },
  { slug: 'heizung', label: 'Heizung & Energie', icon: Flame },
  { slug: 'daemmung', label: 'Dämmung & Fassade', icon: Layers },
  { slug: 'badezimmer', label: 'Badezimmer', icon: Bath },
  { slug: 'kuechen', label: 'Küche', icon: CookingPot },
  { slug: 'solaranlage', label: 'Solar & Photovoltaik', icon: Sun },
] as const;

function buildDeeplink(slug: string) {
  const target = encodeURIComponent(`https://www.aroundhome.de/${slug}/`);
  return `${AWIN_BASE}${target}`;
}

export function AroundhomePartnerCard() {
  return (
    <Card className="glass-card">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ExternalLink className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Sanierungspartner finden — Aroundhome</h3>
              <p className="text-xs text-muted-foreground">
                Bis zu 3 kostenlose Angebote von geprüften Fachfirmen in Ihrer Region
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-medium border-primary/20 text-primary shrink-0">
            Partner
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Finden Sie zertifizierte Fachbetriebe für Ihr Sanierungsprojekt. Aroundhome vermittelt
          kostenlos bis zu 3 Angebote von geprüften Fachfirmen in Ihrer Region.
        </p>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <a
                key={cat.slug}
                href={buildDeeplink(cat.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="h-full border-border/30 hover:border-primary/40 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium leading-tight">{cat.label}</p>
                    <Button variant="link" size="sm" className="text-xs p-0 h-auto text-primary">
                      Angebote <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span className="font-medium">Aroundhome</span>
          <span>Deutschlands größter Vermittler für Sanierung</span>
        </div>
      </CardContent>
    </Card>
  );
}
