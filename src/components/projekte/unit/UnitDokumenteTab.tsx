/**
 * UnitDokumenteTab — Documents tab for a unit
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface UnitDokumenteTabProps {
  unitNumber: string;
  dmsFolder: any | null;
}

export function UnitDokumenteTab({ unitNumber, dmsFolder }: UnitDokumenteTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Einheiten-Dokumente</CardTitle>
        <CardDescription>Dokumente speziell für WE-{unitNumber}</CardDescription>
      </CardHeader>
      <CardContent>
        {dmsFolder ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{dmsFolder.name}</span>
            </div>
            <p className="text-muted-foreground text-sm">Dokumente können im DMS-Modul hochgeladen werden.</p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Kein DMS-Ordner für diese Einheit gefunden.</p>
            <p className="text-sm mt-2">Beim Anlegen neuer Projekte wird automatisch eine Ordnerstruktur erstellt.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
