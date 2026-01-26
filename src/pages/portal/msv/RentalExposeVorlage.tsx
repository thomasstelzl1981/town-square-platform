import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Camera, 
  Building2, 
  MapPin, 
  FileText, 
  Home, 
  Megaphone, 
  Download 
} from 'lucide-react';

export default function RentalExposeVorlage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header mit Navigation */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/portal/msv/vermietung')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div className="flex-1">
          <Badge variant="secondary">Vorlage / Beispiel-Vermietungsexposé</Badge>
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
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
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

      {/* Kennzahlen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">– €</p>
            <p className="text-sm text-muted-foreground">Kaltmiete</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-primary">– €</p>
            <p className="text-sm text-muted-foreground">Warmmiete</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">– m²</p>
            <p className="text-sm text-muted-foreground">Wohnfläche</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">–</p>
            <p className="text-sm text-muted-foreground">Zimmer</p>
          </CardContent>
        </Card>
      </div>

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

        {/* Objekt & Einheit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Objekt & Einheit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Objekttyp" value="–" />
            <InfoRow label="Baujahr (BJ)" value="–" />
            <InfoRow label="Einheit" value="–" />
            <InfoRow label="Wohnfläche" value="– m²" />
          </CardContent>
        </Card>

        {/* Mietkosten */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mietkosten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Kaltmiete" value="–" />
            <InfoRow label="Nebenkosten (ca.)" value="–" />
            <Separator className="my-2" />
            <InfoRow label="Warmmiete" value="–" highlight />
            <InfoRow label="Kaution" value="–" />
            <InfoRow label="Verfügbar ab" value="–" />
          </CardContent>
        </Card>

        {/* Veröffentlichung */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Veröffentlichung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span className="text-sm">ImmobilienScout24</span>
              </div>
              <Badge variant="outline">Nicht veröffentlicht</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                <span className="text-sm">Kleinanzeigen</span>
              </div>
              <Badge variant="outline">Nicht veröffentlicht</Badge>
            </div>
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

      {/* Aktionen */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <Button disabled>
              <Home className="h-4 w-4 mr-2" />
              Bei Scout24 veröffentlichen
            </Button>
            <Button variant="outline" disabled>
              <Megaphone className="h-4 w-4 mr-2" />
              Zu Kleinanzeigen exportieren
            </Button>
            <Button variant="outline" disabled>
              <Download className="h-4 w-4 mr-2" />
              Als PDF exportieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info-Hinweis */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Dies ist eine Vorlage.</strong> Erstellen Sie ein neues Vermietungsinserat, um ein 
            vollständiges Exposé mit echten Daten zu sehen und auf den Portalen zu veröffentlichen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'font-semibold text-primary' : 'font-medium text-right'}>{value}</span>
    </div>
  );
}