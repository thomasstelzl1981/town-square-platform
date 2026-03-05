/**
 * R-5: Section B — Objektdaten (Property Information)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { SectionHeader, FormField } from './anfrageFormPrimitives';
import { objectTypeOptions, equipmentLevelOptions, locationQualityOptions, type FinanceRequestData } from './anfrageFormTypes';

interface Props {
  formData: Partial<FinanceRequestData>;
  updateField: <K extends keyof FinanceRequestData>(field: K, value: FinanceRequestData[K]) => void;
  isReadOnly: boolean;
}

export function AnfrageFormSectionB({ formData, updateField, isReadOnly }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader icon={Building2} sectionLetter="B" title="Informationen zur Immobilie" description="Angaben zum zu finanzierenden Objekt" />
        <div className="space-y-6">
          <FormField label="Objektadresse" required>
            <Input value={formData.object_address || ''} onChange={(e) => updateField('object_address', e.target.value)} placeholder="Straße Nr., PLZ Ort" disabled={isReadOnly} />
          </FormField>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Objektart" required>
              <Select value={formData.object_type || ''} onValueChange={(v) => updateField('object_type', v)} disabled={isReadOnly}>
                <SelectTrigger><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
                <SelectContent>{objectTypeOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Baujahr">
              <Input type="number" value={formData.object_construction_year ?? ''} onChange={(e) => updateField('object_construction_year', e.target.value ? Number(e.target.value) : null)} placeholder="z.B. 1985" disabled={isReadOnly} />
            </FormField>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Wohnfläche" hint="in Quadratmetern">
              <div className="relative">
                <Input type="number" value={formData.object_living_area_sqm ?? ''} onChange={(e) => updateField('object_living_area_sqm', e.target.value ? Number(e.target.value) : null)} placeholder="z.B. 120" className="pr-10" disabled={isReadOnly} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">m²</span>
              </div>
            </FormField>
            <FormField label="Grundstücksfläche" hint="in Quadratmetern">
              <div className="relative">
                <Input type="number" value={formData.object_land_area_sqm ?? ''} onChange={(e) => updateField('object_land_area_sqm', e.target.value ? Number(e.target.value) : null)} placeholder="z.B. 500" className="pr-10" disabled={isReadOnly} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">m²</span>
              </div>
            </FormField>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Ausstattungsniveau">
              <Select value={formData.object_equipment_level || ''} onValueChange={(v) => updateField('object_equipment_level', v)} disabled={isReadOnly}>
                <SelectTrigger><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
                <SelectContent>{equipmentLevelOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Wohnlage">
              <Select value={formData.object_location_quality || ''} onValueChange={(v) => updateField('object_location_quality', v)} disabled={isReadOnly}>
                <SelectTrigger><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
                <SelectContent>{locationQualityOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
              </Select>
            </FormField>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
