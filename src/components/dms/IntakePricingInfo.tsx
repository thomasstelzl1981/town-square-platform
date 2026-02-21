/**
 * IntakePricingInfo — Credit/cost transparency block for the Magic Intake Center.
 * Shows pricing per document, example calculation, and link to credit balance.
 */

import { Coins, Calculator, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const PRICING_ITEMS = [
  { label: 'Preis pro Dokument', value: '1 Credit', detail: '= 0,25 €' },
  { label: 'Datenraum-Scan', value: 'Kostenlos', detail: 'Vorher sehen, was es kostet' },
  { label: 'Beispiel: 20 Dokumente', value: '20 Credits', detail: '= 5,00 €' },
];

export function IntakePricingInfo() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Kosten & Credits
        </h3>
      </div>
      <Card className="border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-foreground leading-relaxed">
              Jede KI-Analyse eines Dokuments kostet <strong>1 Credit (0,25 €)</strong>. 
              Der Scan Ihres Datenraums ist kostenlos — Sie sehen den Kostenvoranschlag, 
              bevor Sie die Extraktion freigeben.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRICING_ITEMS.map((item) => (
              <div key={item.label} className="p-3 rounded-lg border border-border/50 bg-muted/30 text-center space-y-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calculator className="h-3.5 w-3.5" />
            <span>Credits können jederzeit im Profil aufgeladen werden.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
