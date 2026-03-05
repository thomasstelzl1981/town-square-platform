/**
 * VerwaltungGesamtergebnis — Summary card for Anlage V tax results
 * Extracted from VerwaltungTab R-30
 */
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText } from 'lucide-react';

const fmt = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface GesamtErgebnis {
  totalIncome: number;
  totalCosts: number;
  surplus: number;
  confirmed: number;
  total: number;
}

interface Props {
  ergebnis: GesamtErgebnis;
  contextName: string;
  onGenerateErklaerung: () => void;
}

export function VerwaltungGesamtergebnis({ ergebnis, contextName, onGenerateErklaerung }: Props) {
  return (
    <Card className={cn("border-2", ergebnis.confirmed === ergebnis.total ? "border-primary/30" : "border-border")}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-sm">Gesamtergebnis — {contextName}</h4>
          <Badge className={cn(
            "text-xs",
            ergebnis.confirmed === ergebnis.total
              ? "bg-primary/10 text-primary border-0"
              : "bg-muted text-muted-foreground border-0"
          )}>
            {ergebnis.confirmed}/{ergebnis.total} bestätigt
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Einnahmen</p>
            <p className="font-semibold">{fmt(ergebnis.totalIncome)} €</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Werbungskosten</p>
            <p className="font-semibold">{fmt(ergebnis.totalCosts)} €</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Überschuss / Verlust</p>
            <p className={cn(
              "font-bold text-lg",
              ergebnis.surplus >= 0 ? "text-primary" : "text-destructive"
            )}>
              {ergebnis.surplus >= 0 ? '+' : ''}{fmt(ergebnis.surplus)} €
            </p>
          </div>
        </div>

        {ergebnis.confirmed < ergebnis.total && (
          <div className="mt-4 p-3 rounded-lg bg-accent/50 flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              {ergebnis.total - ergebnis.confirmed} Objekt(e) noch nicht bestätigt.
              Erst nach Bestätigung aller Objekte kann die Steuererklärung generiert werden.
            </p>
          </div>
        )}

        {ergebnis.confirmed === ergebnis.total && (
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={onGenerateErklaerung}>
              <FileText className="h-4 w-4 mr-1" />
              Anlage V erzeugen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
