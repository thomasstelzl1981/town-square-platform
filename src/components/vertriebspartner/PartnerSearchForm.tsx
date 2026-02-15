/**
 * PartnerSearchForm — Kompakte Eingabemaske für Partner-Beratung
 * 4-Spalten-Grid: zVE, EK, Familienstand, Kirchensteuer (kein Collapsible)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      <CardContent className="p-4 space-y-4">
        {/* Main Row: zVE, Equity, Familienstand, Kirchensteuer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* zVE */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">zu versteuerndes Einkommen (zVE)</Label>
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
          <div className="space-y-2">
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

          {/* Familienstand */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Familienstand</Label>
            <Select 
              value={value.maritalStatus} 
              onValueChange={(v) => update('maritalStatus', v as 'single' | 'married')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Ledig</SelectItem>
                <SelectItem value="married">Verheiratet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kirchensteuer */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Kirchensteuer</Label>
            <Select 
              value={value.hasChurchTax ? 'yes' : 'no'} 
              onValueChange={(v) => update('hasChurchTax', v === 'yes')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">Nein</SelectItem>
                <SelectItem value="yes">Ja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Button - centered */}
        <div className="flex justify-center">
          <Button onClick={onSearch} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4" />
            )}
            Ergebnisse anzeigen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
