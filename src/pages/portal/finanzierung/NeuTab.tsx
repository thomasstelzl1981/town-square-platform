/**
 * MOD-07 Finanzierung - Neue Finanzierung Tab
 * 
 * Wizard: Owner-Kontext bestätigen → finance_request anlegen → Grunddaten
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, Building2, Home, Briefcase, FileText, 
  ArrowRight, Loader2, CheckCircle2 
} from 'lucide-react';
import { useCreateFinanceRequest } from '@/hooks/useFinanceRequest';

type ObjectSourceType = 'mod04_property' | 'mod08_favorite' | 'custom';

export default function NeuTab() {
  const navigate = useNavigate();
  const createRequest = useCreateFinanceRequest();
  const [step, setStep] = React.useState(1);
  const [objectSource, setObjectSource] = React.useState<ObjectSourceType | null>(null);

  const handleCreate = async () => {
    const result = await createRequest.mutateAsync({
      object_source: objectSource || undefined,
    });
    if (result?.id) {
      navigate(`/portal/finanzierung/kalkulation`);
    }
  };

  const objectSourceOptions = [
    {
      value: 'mod04_property' as ObjectSourceType,
      icon: Building2,
      title: 'Bestandsobjekt',
      description: 'Ein Objekt aus Ihrem Portfolio (MOD-04)',
    },
    {
      value: 'mod08_favorite' as ObjectSourceType,
      icon: Home,
      title: 'Favorit',
      description: 'Ein gemerktes Objekt aus dem Marktplatz (MOD-08)',
    },
    {
      value: 'custom' as ObjectSourceType,
      icon: FileText,
      title: 'Eigenes Objekt',
      description: 'Objektdaten manuell eingeben',
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Plus className="h-6 w-6" />
          Neue Finanzierung
        </h2>
        <p className="text-muted-foreground">
          Starten Sie eine neue Finanzierungsanfrage in wenigen Schritten
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        <Badge variant={step >= 1 ? 'default' : 'outline'}>1. Kontext</Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant={step >= 2 ? 'default' : 'outline'}>2. Objektquelle</Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant={step >= 3 ? 'default' : 'outline'}>3. Anlegen</Badge>
      </div>

      {/* Step 1: Context Confirmation */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Eigentümer-Kontext bestätigen
            </CardTitle>
            <CardDescription>
              Ihre Finanzierung wird mit Ihrem aktiven Eigentümer-Kontext verknüpft
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Aktiver Kontext:</strong> Privat-Eigentümer
                {/* TODO: Dynamic context from MOD-04 */}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Alle Daten der Finanzierung (Selbstauskunft, Dokumente, Objekt) werden 
              diesem Kontext zugeordnet.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate('/portal/finanzierung')}>
                Abbrechen
              </Button>
              <Button onClick={() => setStep(2)}>
                Kontext bestätigen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Object Source Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Objektquelle wählen
            </CardTitle>
            <CardDescription>
              Woher stammt das Objekt für Ihre Finanzierung?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {objectSourceOptions.map((option) => (
                <div
                  key={option.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    objectSource === option.value 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setObjectSource(option.value)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <option.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{option.title}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    {objectSource === option.value && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>
                Zurück
              </Button>
              <Button onClick={() => setStep(3)} disabled={!objectSource}>
                Weiter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Create Request */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Finanzierung anlegen
            </CardTitle>
            <CardDescription>
              Überprüfen Sie Ihre Auswahl und legen Sie die Finanzierung an
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Eigentümer-Kontext:</span>
                <span className="font-medium">Privat-Eigentümer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Objektquelle:</span>
                <span className="font-medium">
                  {objectSourceOptions.find(o => o.value === objectSource)?.title}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Nach dem Anlegen können Sie das Objekt auswählen und Ihre Kalkulation erstellen.
            </p>
            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>
                Zurück
              </Button>
              <Button onClick={handleCreate} disabled={createRequest.isPending}>
                {createRequest.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Finanzierung anlegen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
