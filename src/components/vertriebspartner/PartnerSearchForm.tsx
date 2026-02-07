/**
 * PartnerSearchForm — Kompakte Eingabemaske für Partner-Beratung
 * Felder: zVE, Eigenkapital, Güterstand, Kirchensteuer
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calculator, Loader2 } from 'lucide-react';

export interface PartnerSearchParams {
  zve: number;
  equity: number;
  maritalStatus: 'single' | 'married';
  hasChurchTax: boolean;
}

interface PartnerSearchFormProps {
  value: PartnerSearchParams;
  onChange: (value: PartnerSearchParams) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export function PartnerSearchForm({
  value,
  onChange,
  onSearch,
  isLoading = false,
}: PartnerSearchFormProps) {
  const update = <K extends keyof PartnerSearchParams>(key: K, val: PartnerSearchParams[K]) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* zVE */}
          <div className="flex-1 min-w-[160px] space-y-1.5">
            <Label className="text-xs text-muted-foreground">zVE (zu versteuerndes Einkommen)</Label>
            <div className="relative">
              <Input
                type="number"
                value={value.zve}
                onChange={(e) => update('zve', Number(e.target.value))}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
            </div>
          </div>

          {/* Eigenkapital */}
          <div className="flex-1 min-w-[160px] space-y-1.5">
            <Label className="text-xs text-muted-foreground">Eigenkapital</Label>
            <div className="relative">
              <Input
                type="number"
                value={value.equity}
                onChange={(e) => update('equity', Number(e.target.value))}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
            </div>
          </div>

          {/* Güterstand */}
          <div className="w-[140px] space-y-1.5">
            <Label className="text-xs text-muted-foreground">Güterstand</Label>
            <Select 
              value={value.maritalStatus} 
              onValueChange={(v) => update('maritalStatus', v as 'single' | 'married')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Einzeln</SelectItem>
                <SelectItem value="married">Splitting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kirchensteuer */}
          <div className="w-[100px] space-y-1.5">
            <Label className="text-xs text-muted-foreground">Kirche</Label>
            <div className="flex items-center h-10 px-3 border rounded-md bg-background">
              <Switch
                checked={value.hasChurchTax}
                onCheckedChange={(v) => update('hasChurchTax', v)}
              />
              <span className="ml-2 text-sm">{value.hasChurchTax ? 'Ja' : 'Nein'}</span>
            </div>
          </div>

          {/* Search Button */}
          <Button onClick={onSearch} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4" />
            )}
            Berechnen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
