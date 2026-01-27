import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Globe, 
  Calendar, 
  FileSignature, 
  CheckCircle2,
  ArrowRight,
  Euro,
  Building2,
  AlertCircle
} from 'lucide-react';

const SoFunktioniertsTab = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Intro */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">So funktioniert der Verkauf</h2>
        <p className="text-muted-foreground">
          Mit System of a Town verkaufen Sie Ihre Immobilie einfach und transparent. 
          Ob Sie direkt über unseren Marktplatz Kaufy inserieren oder unser Partner-Netzwerk nutzen – 
          wir begleiten Sie Schritt für Schritt.
        </p>
      </div>

      {/* Hinweis-Box */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Dieses Modul ist für Bestandsimmobilien
            </p>
            <p className="text-muted-foreground mt-1">
              Für Bauträger, Aufteiler und Projektentwickler mit vielen Einheiten wird ein 
              separates Modul entwickelt.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Ihr Weg zum Verkauf</h3>
        
        <div className="relative space-y-0">
          {/* Connecting line */}
          <div className="absolute left-6 top-12 bottom-12 w-0.5 bg-border" />
          
          {/* Step 1 */}
          <div className="relative flex gap-4 pb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center z-10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 pt-2">
              <h4 className="font-medium">Schritt 1: Objekt wählen</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Wählen Sie im Tab "Objekte" die Immobilie aus Ihrem Portfolio, 
                die Sie verkaufen möchten. Ein Klick öffnet das Verkaufsexposé.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative flex gap-4 pb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center z-10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 pt-2">
              <h4 className="font-medium">Schritt 2: Exposé erstellen</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Unser KI-Assistent Armstrong erstellt automatisch eine ansprechende Beschreibung. 
                Sie können alles anpassen: Titel, Preis, Provision und Unterlagen.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative flex gap-4 pb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center z-10">
              <FileSignature className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 pt-2">
              <h4 className="font-medium">Schritt 3: Exposé freigeben</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Sobald alle Pflichtfelder ausgefüllt sind, geben Sie Ihr Exposé frei. 
                Damit bestätigen Sie die Richtigkeit Ihrer Angaben.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs">Titel</Badge>
                <Badge variant="outline" className="text-xs">Preis</Badge>
                <Badge variant="outline" className="text-xs">Provision</Badge>
                <Badge variant="outline" className="text-xs">Min. 1 Bild</Badge>
                <Badge variant="outline" className="text-xs">Energieausweis</Badge>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative flex gap-4 pb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center z-10">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 pt-2">
              <h4 className="font-medium">Schritt 4: Partner-Freigabe erteilen</h4>
              <p className="text-sm text-muted-foreground mt-1">
                <strong>Pflichtschritt für jede Veröffentlichung.</strong> Legen Sie die Provision 
                für Vertriebspartner fest (3-15% netto) und akzeptieren Sie die Systemgebühr.
              </p>
              <Card className="mt-3 bg-muted/50">
                <CardContent className="p-3 text-sm">
                  <p className="font-medium mb-2">Ihre Kosten bei erfolgreicher Vermittlung:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Euro className="h-3 w-3" />
                      100 EUR bei Beauftragung des Kaufvertragsentwurfs
                    </li>
                    <li className="flex items-center gap-2">
                      <Euro className="h-3 w-3" />
                      1.900 EUR nach Notartermin (bei BNL-Eingang)
                    </li>
                    <li className="flex items-center gap-2 font-medium text-foreground pt-1 border-t mt-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Gesamt: 2.000 EUR erfolgsabhängig
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Step 5 */}
          <div className="relative flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center z-10">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 pt-2">
              <h4 className="font-medium">Schritt 5: Veröffentlichen</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Nach der Partner-Freigabe können Sie zusätzlich auf der Kaufy-Website 
                veröffentlichen. Leads von Kaufy gehen an unsere Vertriebspartner.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                <div className="p-3 rounded-lg border bg-card text-center">
                  <Users className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <p className="text-xs font-medium">Partner-Netzwerk</p>
                  <p className="text-[10px] text-muted-foreground">Automatisch aktiv</p>
                </div>
                <div className="p-3 rounded-lg border bg-card text-center">
                  <Globe className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                  <p className="text-xs font-medium">Kaufy-Website</p>
                  <p className="text-[10px] text-muted-foreground">Optional zuschaltbar</p>
                </div>
                <div className="p-3 rounded-lg border bg-card text-center opacity-60">
                  <FileText className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">Scout24</p>
                  <p className="text-[10px] text-muted-foreground">Demnächst</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verkaufsprozess */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nach der Veröffentlichung</CardTitle>
          <CardDescription>
            Der weitere Ablauf bis zum Notartermin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-purple-600">1</span>
            </div>
            <div>
              <p className="font-medium text-sm">Anfrage eingeht</p>
              <p className="text-xs text-muted-foreground">
                Interessenten melden sich über Kaufy oder werden von Partnern vermittelt.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-purple-600">2</span>
            </div>
            <div>
              <p className="font-medium text-sm">Reservierung</p>
              <p className="text-xs text-muted-foreground">
                Sie erhalten eine Reservierungsanfrage im Tab "Vorgänge" und können annehmen oder ablehnen.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-purple-600">3</span>
            </div>
            <div>
              <p className="font-medium text-sm">Notarauftrag</p>
              <p className="text-xs text-muted-foreground">
                Nach Annahme der Reservierung beauftragen Sie den Kaufvertragsentwurf.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-purple-600">4</span>
            </div>
            <div>
              <p className="font-medium text-sm">Notartermin & Übergabe</p>
              <p className="text-xs text-muted-foreground">
                Nach dem Notartermin und BNL-Eingang ist der Verkauf abgeschlossen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex gap-3">
        <Button onClick={() => navigate('/portal/verkauf/objekte')} className="gap-2">
          Jetzt Objekt auswählen
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SoFunktioniertsTab;
