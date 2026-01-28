import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, FolderOpen, Info } from 'lucide-react';

export default function DokumenteTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Finanzierungsdokumente
          </CardTitle>
          <CardDescription>
            Dokumente werden pro Finanzierungsantrag verwaltet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">Dokumenten-Verwaltung</p>
              <p className="text-muted-foreground">
                Dokumente sind direkt mit dem jeweiligen Finanzierungsantrag verknüpft. 
                Öffnen Sie einen Antrag unter "Fälle" und wechseln Sie zum Tab "Dokumente", 
                um Unterlagen hochzuladen und zu verwalten.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Erforderliche Dokumenttypen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { name: 'Personalausweis / Reisepass', required: true },
              { name: 'Gehaltsnachweise (3 Monate)', required: true },
              { name: 'Steuerbescheid', required: true },
              { name: 'Kontoauszüge (3 Monate)', required: true },
              { name: 'Selbstauskunft (ausgefüllt)', required: true },
              { name: 'Kaufvertrag / Exposé', required: false },
              { name: 'Grundbuchauszug', required: false },
              { name: 'Flurkarte / Lageplan', required: false },
            ].map((doc, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{doc.name}</span>
                {doc.required && (
                  <span className="ml-auto text-xs text-primary font-medium">Pflicht</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
