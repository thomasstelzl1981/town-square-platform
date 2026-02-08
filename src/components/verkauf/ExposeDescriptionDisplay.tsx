/**
 * ExposeDescriptionDisplay - Read-only Anzeige der Objektbeschreibung
 * SSOT: Bearbeitung erfolgt im Tab "Akte" (EditableAddressBlock)
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExposeDescriptionDisplayProps {
  description: string | null;
}

const ExposeDescriptionDisplay = ({ description }: ExposeDescriptionDisplayProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Objektbeschreibung</CardTitle>
          <span className="text-xs text-muted-foreground">
            (bearbeiten im Tab "Akte")
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {description ? (
          <p className="text-sm whitespace-pre-wrap line-clamp-[12]">{description}</p>
        ) : (
          <p className="text-sm text-muted-foreground/70 italic">
            Noch keine Beschreibung vorhanden. 
            Erstellen Sie eine im Tab "Akte" unter "Lage & Beschreibung".
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ExposeDescriptionDisplay;
