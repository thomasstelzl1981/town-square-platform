/**
 * CalculationParamsTab — AfA + Steuer parameters
 * R-18 sub-component
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  defaultAfaRate: number;
  onAfaRateChange: (val: number) => void;
}

export function CalculationParamsTab({ defaultAfaRate, onAfaRateChange }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Abschreibung (AfA)</CardTitle>
          <CardDescription>Standard-Abschreibungssätze für Immobilien</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Standard-AfA-Satz (linear)</Label>
            <div className="flex items-center gap-2">
              <Input type="number" step="0.1" value={defaultAfaRate} onChange={(e) => onAfaRateChange(parseFloat(e.target.value) || 2)} className="w-24" />
              <span className="text-muted-foreground">% p.a.</span>
            </div>
            <p className="text-xs text-muted-foreground">Entspricht einer Nutzungsdauer von {Math.round(100 / defaultAfaRate)} Jahren</p>
          </div>
          <div className="space-y-2">
            <Label>Erweiterte AfA-Modelle</Label>
            <div className="space-y-2">
              {['§7i EStG (Denkmal)', '§7h EStG (Sanierung)', '§7b EStG (Neubau)'].map(m => (
                <div key={m} className="flex items-center justify-between p-2 border rounded">
                  <span>{m}</span><Badge variant="outline">Geplant</Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Steuerberechnung</CardTitle>
          <CardDescription>Parameter für die Einkommensteuer-Berechnung</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Bemessungsgrundlage</Label><p className="text-sm text-muted-foreground">BMF PAP 2026 (Programmablaufplan Lohnsteuer)</p></div>
          <div className="space-y-2"><Label>Solidaritätszuschlag</Label><div className="flex items-center gap-2"><span className="text-sm">5,5% auf ESt</span><Badge variant="secondary">Automatisch</Badge></div><p className="text-xs text-muted-foreground">Freigrenze: 18.130 € (Einzelveranlagung) / 36.260 € (Zusammenveranlagung)</p></div>
          <div className="space-y-2"><Label>Kirchensteuer</Label><div className="flex gap-2"><Badge>8% Bayern/BaWü</Badge><Badge>9% Übrige</Badge></div></div>
          <div className="space-y-2"><Label>Veranlagungsarten</Label><div className="flex gap-2"><Badge variant="outline">Grundtabelle</Badge><Badge variant="outline">Splittingtarif</Badge></div></div>
        </CardContent>
      </Card>
    </div>
  );
}
