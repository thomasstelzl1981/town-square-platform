import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Camera, Plus, ShoppingCart, ArrowRight } from 'lucide-react';

export default function SmartHomeTile() {
  const navigate = useNavigate();

  return (
    <PageShell>
      <ModulePageHeader title="Smart Home" description="Kamera-Verwaltung und Snapshot-Integration" />

      {/* Meine Kameras — empty state */}
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <div className="p-4 rounded-full bg-primary/10 inline-block mb-4">
            <Camera className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Meine Kameras</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Verbinden Sie eine kompatible IP-Kamera (Reolink, Amcrest), um Live-Snapshots
            direkt in Ihrer Übersicht zu sehen — ohne Cloud-Abo.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="text-xs">Reolink</Badge>
            <Badge variant="outline" className="text-xs">Amcrest</Badge>
            <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0 text-xs">
              HTTP-Snapshot
            </Badge>
          </div>
          <Button className="mt-4" disabled>
            <Plus className="h-4 w-4 mr-2" />
            Kamera hinzufügen (bald verfügbar)
          </Button>
        </CardContent>
      </Card>

      {/* Link to Smart Home Shop */}
      <Card className="glass-card border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Kompatible Kameras ansehen</p>
              <p className="text-xs text-muted-foreground">
                IP-Kameras von Reolink & Amcrest, die direkt mit Ihrem Dashboard funktionieren
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/portal/services/smart-home')}>
              <ArrowRight className="h-4 w-4 mr-1" />
              Zum Shop
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requirements info */}
      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Voraussetzungen</p>
          <ul className="list-disc list-inside space-y-1">
            <li>IP-Kamera mit HTTP-Snapshot-URL (Reolink, Amcrest)</li>
            <li>Lokale IP oder Erreichbarkeit via Port-Forwarding / VPN</li>
            <li>HTTP Basic Auth Zugangsdaten der Kamera</li>
          </ul>
        </CardContent>
      </Card>
    </PageShell>
  );
}
