import { Globe, Shield, Search, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const KiBrowserUebersicht = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">KI-Browser</h1>
        <p className="text-muted-foreground mt-1">
          Armstrong navigiert kontrolliert im Web — mit Quellen, Screenshots und strukturierten Ergebnissen.
        </p>
      </div>

      {/* Policy Status */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
          <Shield className="h-3 w-3 mr-1" />
          Safe Mode aktiv
        </Badge>
        <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
          No-Credential Mode
        </Badge>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200">
          Form Submit blockiert
        </Badge>
      </div>

      {/* Was kann / Was nicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              Was kann der KI-Browser?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>✅ Webseiten öffnen und Inhalte lesen</p>
            <p>✅ Suchanfragen durchführen</p>
            <p>✅ Texte, Links und Tabellen extrahieren</p>
            <p>✅ Strukturierte Berichte mit Quellen erstellen</p>
            <p>✅ Screenshots als Belege speichern</p>
            <p>✅ Vergleichstabellen generieren</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-destructive" />
              Was ist blockiert?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>🚫 Passwörter / OTPs eingeben</p>
            <p>🚫 Dateien hochladen</p>
            <p>🚫 Bezahlen / Checkout</p>
            <p>🚫 Löschen / Destructive Actions</p>
            <p>🚫 Banking- & Crypto-Websites</p>
            <p>🚫 Captchas automatisiert lösen</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/portal/ki-browser/session')}
            className="mr-3"
          >
            <Globe className="h-4 w-4 mr-2" />
            Neue Session starten
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/portal/ki-browser/vorlagen')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Vorlage verwenden
          </Button>
        </CardContent>
      </Card>

      {/* Session History (Placeholder) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Letzte Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Keine Sessions vorhanden. Starten Sie eine neue Session, um zu beginnen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KiBrowserUebersicht;
