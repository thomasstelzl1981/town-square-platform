/**
 * BrandWidgets — 4 branded tiles linking to Kaufy, FutureRoom, System of a Town, and Acquiary websites.
 * Reusable across all dashboards (Portal, FM, Akquise).
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, ShoppingBag, Landmark, Building2, Search } from 'lucide-react';

export function BrandWidgets() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Kaufy */}
      <Card className="overflow-hidden border-0 shadow-card">
        <CardContent className="p-0 h-full">
          <div className="h-full bg-gradient-to-br from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)] p-5 flex flex-col justify-between text-white min-h-[140px]">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">KAUFY</h3>
                  <p className="text-[10px] text-white/70 uppercase tracking-wider">Marktplatz & Investment</p>
                </div>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Immobilien kaufen, verkaufen und als Kapitalanlage entdecken.
              </p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <Badge className="bg-white/20 text-white border-white/30 text-[10px] hover:bg-white/30">
                Marktplatz
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-[11px] h-7"
                onClick={() => window.open('/website/kaufy', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Website
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FutureRoom */}
      <Card className="overflow-hidden border-0 shadow-card">
        <CardContent className="p-0 h-full">
          <div className="h-full bg-gradient-to-br from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)] p-5 flex flex-col justify-between text-white min-h-[140px]">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    Future<span className="font-light">Room</span>
                  </h3>
                  <p className="text-[10px] text-white/70 uppercase tracking-wider">Finanzierungsorchesterierung</p>
                </div>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                KI-gestützte Aufbereitung und digitale Bankeinreichung.
              </p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <Badge className="bg-white/20 text-white border-white/30 text-[10px] hover:bg-white/30">
                400+ Bankpartner
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-[11px] h-7"
                onClick={() => window.open('/website/futureroom', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Website
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System of a Town */}
      <Card className="overflow-hidden border-0 shadow-card">
        <CardContent className="p-0 h-full">
          <div className="h-full bg-gradient-to-br from-[hsl(0,0%,15%)] to-[hsl(0,0%,30%)] p-5 flex flex-col justify-between text-white min-h-[140px]">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    System<span className="font-light">ofaTown</span>
                  </h3>
                  <p className="text-[10px] text-white/70 uppercase tracking-wider">Management Suite</p>
                </div>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Immobilienverwaltung, KI-Office und operative Steuerung.
              </p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <Badge className="bg-white/20 text-white border-white/30 text-[10px] hover:bg-white/30">
                All-in-One
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-[11px] h-7"
                onClick={() => window.open('/website/sot', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Website
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Acquiary */}
      <Card className="overflow-hidden border-0 shadow-card">
        <CardContent className="p-0 h-full">
          <div className="h-full bg-gradient-to-br from-[hsl(210,80%,50%)] to-[hsl(200,70%,40%)] p-5 flex flex-col justify-between text-white min-h-[140px]">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">ACQUIARY</h3>
                  <p className="text-[10px] text-white/70 uppercase tracking-wider">Sourcing & Akquisition</p>
                </div>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Immobilien-Sourcing, Analyse und strategische Akquisition.
              </p>
            </div>
            <div className="flex items-center justify-between mt-3">
              <Badge className="bg-white/20 text-white border-white/30 text-[10px] hover:bg-white/30">
                Investment House
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-[11px] h-7"
                onClick={() => window.open('/website/acquiary', '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Website
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
