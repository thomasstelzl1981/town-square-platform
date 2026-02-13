/**
 * KI-Telefon-Assistent — Placeholder Overview
 * 
 * MOD-05 repurposed: Future home of AI phone assistant functionality.
 */
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Sparkles, Clock } from 'lucide-react';

export default function KiTelefonUebersicht() {
  return (
    <PageShell>
      <ModulePageHeader
        title="KI-Telefon-Assistent"
        description="Ihr intelligenter Telefonassistent — automatisierte Anrufbearbeitung für Ihre Immobilienverwaltung."
      />

      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-primary/10 p-6 mb-6">
            <Phone className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Kommt bald</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Der KI-Telefon-Assistent übernimmt eingehende Anrufe, beantwortet häufige Fragen 
            und leitet wichtige Anliegen an Sie weiter — rund um die Uhr.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              KI-gestützte Anrufannahme
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              24/7 erreichbar
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
