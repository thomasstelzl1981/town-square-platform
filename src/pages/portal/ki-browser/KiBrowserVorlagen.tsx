import { FileText, Play, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const PLAYBOOKS = [
  {
    id: 'docs-finder',
    title: 'Dokumentation finden',
    description: 'Sucht und extrahiert relevante API-Dokumentation oder Handbücher.',
    category: 'Research',
    urls: ['https://docs.github.com', 'https://developer.mozilla.org'],
  },
  {
    id: 'gesetz-pruefen',
    title: 'Gesetzestext prüfen',
    description: 'Findet und analysiert aktuelle Gesetzestexte und Normen.',
    category: 'Legal',
    urls: ['https://gesetze-im-internet.de'],
  },
  {
    id: 'preis-vergleich',
    title: 'Preis-/Produktvergleich',
    description: 'Vergleicht Preise und Features verschiedener Anbieter.',
    category: 'Markt',
    urls: [],
  },
  {
    id: 'markt-analyse',
    title: 'Marktanalyse Immobilien',
    description: 'Recherchiert Marktdaten von Immobilienportalen und erstellt eine strukturierte Zusammenfassung.',
    category: 'Research',
    urls: ['https://immobilienscout24.de', 'https://immowelt.de'],
  },
  {
    id: 'foerder-check',
    title: 'Förderprogramm-Check',
    description: 'Prüft aktuelle KfW- und BAFA-Förderprogramme für Immobilienprojekte.',
    category: 'Finance',
    urls: ['https://kfw.de'],
  },
  {
    id: 'hr-register',
    title: 'Handelsregister-Abfrage',
    description: 'Recherchiert Unternehmensdaten im Handelsregister.',
    category: 'Legal',
    urls: ['https://handelsregister.de'],
  },
];

const KiBrowserVorlagen = () => {
  const navigate = useNavigate();

  const handleStartPlaybook = (playbookId: string) => {
    navigate('/portal/ki-browser/session');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vorlagen (Playbooks)</h1>
        <p className="text-muted-foreground mt-1">
          Vordefinierte Research-Playbooks für häufige Aufgaben.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLAYBOOKS.map((pb) => (
          <Card key={pb.id} className="hover:shadow-md transition-shadow">
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
              {pb.urls.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {pb.urls.map((url) => (
                    <Badge key={url} variant="outline" className="text-xs font-mono">
                      <Globe className="h-2.5 w-2.5 mr-1" />
                      {new URL(url).hostname}
                    </Badge>
                  ))}
                </div>
              )}
              <Button size="sm" variant="outline" onClick={() => handleStartPlaybook(pb.id)}>
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
