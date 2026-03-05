/**
 * UnitPreiseTab — Pricing and commission tab
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { DevProjectUnit } from '@/types/projekte';

interface UnitPreiseTabProps {
  unit: DevProjectUnit;
  onUpdate: (updates: Partial<DevProjectUnit>) => void;
  formatCurrency: (value: number | null) => string;
}

export function UnitPreiseTab({ unit, onUpdate, formatCurrency }: UnitPreiseTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preise & Provision</CardTitle>
        <CardDescription>Verkaufspreise und Provisionsberechnung</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div><Label>Listenpreis (€)</Label><Input type="number" value={unit.list_price ?? ''} onChange={(e) => onUpdate({ list_price: parseFloat(e.target.value) || null })} className="mt-1.5" /></div>
          <div><Label>Mindestpreis (€)</Label><Input type="number" value={unit.min_price ?? ''} onChange={(e) => onUpdate({ min_price: parseFloat(e.target.value) || null })} className="mt-1.5" /></div>
          <div><Label>Preis pro m²</Label><Input value={unit.area_sqm && unit.list_price ? formatCurrency(unit.list_price / unit.area_sqm) : '–'} disabled className="mt-1.5" /></div>
        </div>
        <Separator />
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Kalkulation</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Listenpreis</span><span className="font-medium">{formatCurrency(unit.list_price)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Mindestpreis</span><span className="font-medium">{formatCurrency(unit.min_price)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Verhandlungsspielraum</span><span className="font-medium">{unit.list_price && unit.min_price ? formatCurrency(unit.list_price - unit.min_price) : '–'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Aktuelle Mietrendite</span><span className="font-medium">{unit.current_rent && unit.list_price ? `${((unit.current_rent * 12) / unit.list_price * 100).toFixed(2)}%` : '–'}</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
