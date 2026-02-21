import { Globe, Play, Square, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const KiBrowserSession = () => {
  const [sessionActive, setSessionActive] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Browser Session</h1>
          <p className="text-muted-foreground mt-1">
            Armstrong navigiert kontrolliert im Web.
          </p>
        </div>
        <div className="flex gap-2">
          {!sessionActive ? (
            <Button onClick={() => setSessionActive(true)}>
              <Play className="h-4 w-4 mr-2" />
              Session starten
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setSessionActive(false)}>
              <Square className="h-4 w-4 mr-2" />
              Session beenden
            </Button>
          )}
        </div>
      </div>

      {!sessionActive ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Keine aktive Session</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Starten Sie eine neue Session, um Armstrong im Web navigieren zu lassen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Armstrong Chat + Step Proposals */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Armstrong</CardTitle>
                  <Badge className="bg-green-500/10 text-green-700 border-green-200">
                    Aktiv
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Session bereit. Geben Sie eine URL oder Suchanfrage ein.</p>
              </CardContent>
            </Card>

            {/* Step Proposal Card */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Nächster Schritt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Warte auf Anweisungen...
                </p>
                <div className="flex gap-2">
                  <Button size="sm" disabled>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Genehmigen
                  </Button>
                  <Button size="sm" variant="outline" disabled>
                    <XCircle className="h-3 w-3 mr-1" />
                    Ablehnen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Browser View */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Browser-Ansicht</CardTitle>
                <Badge variant="outline">MVP: Text-Modus</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Hier werden die abgerufenen Webinhalte als Markdown angezeigt.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Step Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {sessionActive 
              ? 'Noch keine Schritte ausgeführt.' 
              : 'Starten Sie eine Session, um die Timeline zu sehen.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KiBrowserSession;
