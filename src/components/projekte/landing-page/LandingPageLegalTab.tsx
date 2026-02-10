/**
 * Landing Page — Tab 4: Legal & Dokumente
 * DMS document list + disclaimer
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface LandingPageLegalTabProps {
  isDemo: boolean;
}

const DEMO_DOCUMENTS = [
  { name: 'Projekt-Exposé', type: 'PDF', size: '4.2 MB', category: 'Exposé' },
  { name: 'Preisliste', type: 'PDF', size: '1.1 MB', category: 'Preisliste' },
  { name: 'Grundrisse (alle Einheiten)', type: 'PDF', size: '8.5 MB', category: 'Grundrisse' },
  { name: 'Energieausweis', type: 'PDF', size: '0.5 MB', category: 'Energieausweis' },
  { name: 'Teilungserklärung (Auszug)', type: 'PDF', size: '2.3 MB', category: 'Rechtliches' },
  { name: 'Muster-Kaufvertrag', type: 'PDF', size: '1.8 MB', category: 'Verträge' },
];

export function LandingPageLegalTab({ isDemo }: LandingPageLegalTabProps) {
  const handleDownload = (docName: string) => {
    toast.info('Download', { description: `"${docName}" — im Demo-Modus nicht verfügbar.` });
  };

  return (
    <div className="space-y-6">
      {isDemo && (
        <Badge variant="secondary" className="opacity-60">Beispieldaten — Musterdokumente</Badge>
      )}

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Projektunterlagen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {DEMO_DOCUMENTS.map((doc) => (
              <div key={doc.name} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type} · {doc.size}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleDownload(doc.name)}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rechtliche Hinweise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Die auf dieser Seite dargestellten Informationen dienen ausschließlich der allgemeinen 
            Information und stellen kein verbindliches Angebot dar. Alle Angaben wurden sorgfältig 
            zusammengestellt, für deren Richtigkeit und Vollständigkeit kann jedoch keine Gewähr 
            übernommen werden.
          </p>
          <p>
            Die dargestellten Renditeberechnungen basieren auf den zum Zeitpunkt der Erstellung 
            gültigen Annahmen und dienen lediglich der Orientierung. Tatsächliche Erträge können 
            von den prognostizierten Werten abweichen. Wir empfehlen die Konsultation eines 
            unabhängigen Steuerberaters.
          </p>
          <p>
            Grundrisse und Visualisierungen können von der tatsächlichen Ausführung abweichen. 
            Maßgeblich ist der notarielle Kaufvertrag.
          </p>
        </CardContent>
      </Card>

      {/* Data Protection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Datenschutz
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Ihre Daten werden gemäß der Datenschutz-Grundverordnung (DSGVO) verarbeitet. 
            Weitere Informationen finden Sie in unserer Datenschutzerklärung. 
            Anfragen und Daten werden ausschließlich zur Bearbeitung Ihres Anliegens verwendet 
            und nicht an Dritte weitergegeben.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
