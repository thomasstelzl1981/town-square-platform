import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, BookOpen, Building2 } from 'lucide-react';

interface LegalBlockProps {
  landRegisterShort?: string;
  wegFlag?: boolean;
  meaOrTeNo?: string;
  managerContact?: { name?: string; phone?: string; email?: string };
}

export function LegalBlock({
  landRegisterShort,
  wegFlag,
  meaOrTeNo,
  managerContact,
}: LegalBlockProps) {
  const hasData = landRegisterShort || meaOrTeNo || managerContact;

  if (!hasData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Recht / IDs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Keine rechtlichen Daten hinterlegt</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Recht / IDs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {landRegisterShort && (
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              Grundbuch
            </span>
            <span className="font-mono text-xs">{landRegisterShort}</span>
          </div>
        )}

        {wegFlag !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">WEG-Objekt</span>
            <span>{wegFlag ? 'Ja' : 'Nein'}</span>
          </div>
        )}

        {meaOrTeNo && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">MEA / TE-Nr.</span>
            <span className="font-mono text-xs">{meaOrTeNo}</span>
          </div>
        )}

        {managerContact && (managerContact.name || managerContact.phone) && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              WEG-Verwalter
            </p>
            {managerContact.name && <p className="text-sm">{managerContact.name}</p>}
            {managerContact.phone && (
              <p className="text-xs text-muted-foreground">{managerContact.phone}</p>
            )}
            {managerContact.email && (
              <p className="text-xs text-muted-foreground">{managerContact.email}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
