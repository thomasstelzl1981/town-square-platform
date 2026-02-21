import { FileText, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PLAYBOOKS = [
  {
    id: 'docs-finder',
    title: 'Dokumentation finden',
    description: 'Sucht und extrahiert relevante API-Dokumentation oder Handbücher.',
    category: 'Research',
  },
  {
    id: 'gesetz-pruefen',
    title: 'Gesetzestext prüfen',
    description: 'Findet und analysiert aktuelle Gesetzestexte und Normen.',
    category: 'Legal',
  },
  {
    id: 'preis-vergleich',
    title: 'Preis-/Produktvergleich',
    description: 'Vergleicht Preise und Features verschiedener Anbieter.',
    category: 'Markt',
  },
  {
    id: 'markt-analyse',
    title: 'Marktanalyse',
    description: 'Recherchiert Marktdaten und erstellt eine strukturierte Zusammenfassung.',
    category: 'Research',
  },
];

const KiBrowserVorlagen = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vorlagen (Playbooks)</h1>
        <p className="text-muted-foreground mt-1">
          Vordefinierte Research-Playbooks für häufige Aufgaben.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLAYBOOKS.map((pb) => (
          <Card key={pb.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {pb.title}
                </CardTitle>
                <Badge variant="outline">{pb.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{pb.description}</p>
              <Button size="sm" variant="outline" disabled>
                <Play className="h-3 w-3 mr-1" />
                Starten
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default KiBrowserVorlagen;
