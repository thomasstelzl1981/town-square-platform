/**
 * UnitStammdatenTab — Master data tab for a real unit
 */
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DictationButton } from '@/components/shared/DictationButton';
import type { DevProjectUnit } from '@/types/projekte';

interface UnitStammdatenTabProps {
  unit: DevProjectUnit;
  onUpdate: (updates: Partial<DevProjectUnit>) => void;
}

export function UnitStammdatenTab({ unit, onUpdate }: UnitStammdatenTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Einheiten-Stammdaten</CardTitle>
        <CardDescription>Grundlegende Informationen zur Einheit</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div><Label>Einheitennummer</Label><Input value={unit.unit_number} disabled className="mt-1.5" /></div>
          <div><Label>Etage</Label><Input type="number" value={unit.floor ?? ''} onChange={(e) => onUpdate({ floor: parseInt(e.target.value) || null })} className="mt-1.5" /></div>
          <div><Label>Wohnfläche (m²)</Label><Input type="number" step="0.1" value={unit.area_sqm ?? ''} onChange={(e) => onUpdate({ area_sqm: parseFloat(e.target.value) || null })} className="mt-1.5" /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div><Label>Zimmer</Label><Input type="number" step="0.5" value={unit.rooms_count ?? ''} onChange={(e) => onUpdate({ rooms_count: parseFloat(e.target.value) || null })} className="mt-1.5" /></div>
          <div><Label>Grundbuchblatt</Label><Input value={unit.grundbuchblatt ?? ''} onChange={(e) => onUpdate({ grundbuchblatt: e.target.value || null })} className="mt-1.5" /></div>
          <div><Label>TE-Nummer</Label><Input value={unit.te_number ?? ''} onChange={(e) => onUpdate({ te_number: e.target.value || null })} className="mt-1.5" /></div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h4 className="font-medium">Aktuelle Vermietung</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div><Label>Mietername</Label><Input value={unit.tenant_name ?? ''} onChange={(e) => onUpdate({ tenant_name: e.target.value || null })} className="mt-1.5" /></div>
            <div><Label>Aktuelle Miete (€)</Label><Input type="number" value={unit.current_rent ?? ''} onChange={(e) => onUpdate({ current_rent: parseFloat(e.target.value) || null })} className="mt-1.5" /></div>
          </div>
        </div>
        <Separator />
        <div>
          <div className="flex items-center gap-1">
            <Label>Notizen</Label>
            <DictationButton onTranscript={(text) => onUpdate({ notes: (unit.notes ?? '') + ' ' + text })} />
          </div>
          <Textarea value={unit.notes ?? ''} onChange={(e) => onUpdate({ notes: e.target.value || null })} className="mt-1.5 min-h-[100px]" placeholder="Interne Notizen zur Einheit..." />
        </div>
      </CardContent>
    </Card>
  );
}
