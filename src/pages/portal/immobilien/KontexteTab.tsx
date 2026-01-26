import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ArrowRight, Plus, ClipboardList } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function KontexteTab() {
  const navigate = useNavigate();
  const { activeOrganization } = useAuth();

  // Standard-Kontext aus der aktuellen Organisation
  const defaultContext = {
    name: activeOrganization?.name || 'Meine Firma',
    type: activeOrganization?.org_type === 'client' ? 'BUSINESS' : 'PRIVATE',
    regime: 'FIBU',
  };

  return (
    <div className="space-y-6">
      {/* Standard-Kontext (aus Stammdaten) */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Standard-Kontext (aus Stammdaten)</CardTitle>
              <CardDescription>
                Automatisch aus Ihren Firmendaten übernommen
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoItem label="Name" value={defaultContext.name} />
            <InfoItem 
              label="Typ" 
              value={
                <Badge variant={defaultContext.type === 'BUSINESS' ? 'default' : 'secondary'}>
                  {defaultContext.type === 'BUSINESS' ? 'Geschäftlich' : 'Privat'}
                </Badge>
              } 
            />
            <InfoItem 
              label="Regime" 
              value={
                <Badge variant="outline">{defaultContext.regime}</Badge>
              } 
            />
            <InfoItem label="Objekte" value="– (alle nicht zugeordneten)" />
          </div>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/portal/stammdaten/firma')}
          >
            Stammdaten bearbeiten
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Weitere Kontexte */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Weitere Kontexte</h2>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 rounded-full bg-muted mb-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">Keine weiteren Kontexte angelegt</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Erstellen Sie zusätzliche Vermieter-Kontexte, um Objekte nach steuerlichen 
              oder organisatorischen Kriterien zu gruppieren.
            </p>
            <Button variant="outline" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Kontext anlegen
              <Badge variant="secondary" className="ml-2 text-xs">
                in Entwicklung
              </Badge>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info-Box */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> Vermieter-Kontexte ermöglichen die Trennung von Objekten nach 
            unterschiedlichen steuerlichen Regimes (FIBU, EÜR, Vermögensverwaltung) oder 
            Eigentümerstrukturen. Alle Objekte ohne explizite Zuordnung gehören zum Standard-Kontext.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="font-medium">{value}</div>
    </div>
  );
}
