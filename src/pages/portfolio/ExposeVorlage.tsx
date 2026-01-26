import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Camera, Building2, MapPin, FileText, Link2 } from 'lucide-react';

export default function ExposeVorlage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header mit Navigation */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/portal/immobilien/portfolio')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div className="flex-1">
          <Badge variant="secondary">Vorlage / Beispiel-Exposé</Badge>
        </div>
      </div>

      {/* Bildbereich (Placeholder) */}
      <Card className="overflow-hidden">
        <div className="aspect-video bg-muted flex flex-col items-center justify-center border-b">
          <div className="p-4 rounded-full bg-muted-foreground/10 mb-4">
            <Camera className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">Hier erscheinen Ihre Objektfotos</p>
          <p className="text-sm text-muted-foreground/70">analog ImmobilienScout24</p>
        </div>
      </Card>

      {/* Header Section - Scout-Style */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">[Objekttyp]</p>
              <CardTitle className="text-xl">[Straße / Hausnummer]</CardTitle>
              <p className="text-muted-foreground">[PLZ] [Ort], [Land]</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Objekt-Code</p>
              <p className="font-mono font-medium">[––––]</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Daten-Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Lage & Adresse */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Lage & Adresse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Straße" value="–" />
            <InfoRow label="PLZ" value="–" />
            <InfoRow label="Ort" value="–" />
            <InfoRow label="Land" value="–" />
          </CardContent>
        </Card>

        {/* Baujahr & Zustand */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Baujahr & Zustand
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Baujahr (BJ)" value="–" />
            <InfoRow label="Sanierungsjahr" value="–" />
            <InfoRow label="BNL" value="–" />
            <InfoRow label="Wohnfläche" value="– qm" />
          </CardContent>
        </Card>

        {/* Grundbuch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grundbuch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Grundbuch von" value="–" />
            <InfoRow label="Grundbuchblatt" value="–" />
            <InfoRow label="Band" value="–" />
            <InfoRow label="Flurstück" value="–" />
            <InfoRow label="TE-Nummer" value="–" />
            <InfoRow label="Notartermin" value="–" />
          </CardContent>
        </Card>

        {/* Finanzierung (Bestand) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Finanzierung (Bestand)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Kaufpreis" value="–" />
            <Separator className="my-2" />
            <InfoRow label="Darlehensnr." value="–" />
            <InfoRow label="Bank" value="–" />
            <InfoRow label="Urspr. Darlehen" value="–" />
            <InfoRow label="Restschuld" value="–" />
            <InfoRow label="Zins" value="– %" />
            <InfoRow label="Zinsbindung bis" value="–" />
            <InfoRow label="Zinsbelastung ca." value="–" />
            <InfoRow label="Rate" value="–" />
          </CardContent>
        </Card>

        {/* Energie & Heizung */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Energie & Heizung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Energieträger" value="–" />
            <InfoRow label="Heizart" value="–" />
          </CardContent>
        </Card>

        {/* Miete */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Miete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Warmmiete" value="–" />
            <InfoRow label="NK-Vorauszahlung" value="–" />
          </CardContent>
        </Card>
      </div>

      {/* Beschreibung */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Beschreibung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            [Hier erscheint Ihre Objektbeschreibung...]
          </p>
        </CardContent>
      </Card>

      {/* Modul-Verknüpfungen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Modul-Verknüpfungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <ModuleLink title="MOD-05 MSV" status="Inaktiv" />
            <ModuleLink title="MOD-06 Verkauf" status="Inaktiv" />
            <ModuleLink title="MOD-07 Finanz." status="–" />
            <ModuleLink title="MOD-09 Partner" status="Nicht sichtbar" />
            <ModuleLink title="Zone 3 Kaufy" status="Nicht publiziert" />
          </div>
        </CardContent>
      </Card>

      {/* Info-Hinweis */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Dies ist eine Vorlage.</strong> Erstellen Sie eine neue Immobilie oder importieren Sie 
            Ihr Portfolio per Excel, um ein vollständiges Exposé mit echten Daten zu sehen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function ModuleLink({ title, status }: { title: string; status: string }) {
  return (
    <div className="p-3 rounded-lg border text-center">
      <p className="text-xs font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">○ {status}</p>
    </div>
  );
}
