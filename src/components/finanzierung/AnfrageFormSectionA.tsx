/**
 * R-5: Section A — Vorhaben (Purpose)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target } from 'lucide-react';
import { SectionHeader, FormField } from './anfrageFormPrimitives';
import { purposeOptions, type FinanceRequestData } from './anfrageFormTypes';

interface Props {
  formData: Partial<FinanceRequestData>;
  updateField: <K extends keyof FinanceRequestData>(field: K, value: FinanceRequestData[K]) => void;
  isReadOnly: boolean;
}

export function AnfrageFormSectionA({ formData, updateField, isReadOnly }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader icon={Target} sectionLetter="A" title="Vorhaben" description="Was möchten Sie finanzieren?" />
        <div className="grid gap-6 md:grid-cols-2">
          <FormField label="Finanzierungszweck" required>
            <Select value={formData.purpose || ''} onValueChange={(v) => updateField('purpose', v)} disabled={isReadOnly}>
              <SelectTrigger><SelectValue placeholder="Bitte wählen..." /></SelectTrigger>
              <SelectContent>
                {purposeOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}
