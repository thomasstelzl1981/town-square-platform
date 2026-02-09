/**
 * PartnerSearchForm — Kompakte Eingabemaske für Partner-Beratung
 * ANGEPASST: Layout wie MOD-08 (Collapsible für erweiterte Optionen)
 */
import { useState } from 'react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Calculator, Loader2, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = <K extends keyof PartnerSearchParams>(key: K, val: PartnerSearchParams[K]) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Main Row: zVE, Equity, More Options Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* More Options Toggle */}
          <div className="flex items-end">
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced} className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <Filter className="w-4 h-4" />
                  Mehr Optionen
                  <ChevronDown className={cn("w-4 h-4 transition-transform", showAdvanced && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </div>

        {/* Advanced Options (Collapsible) */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleContent className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </CollapsibleContent>
        </Collapsible>

        {/* Search Button */}
        <Button onClick={onSearch} disabled={isLoading} className="w-full md:w-auto gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4" />
          )}
          Ergebnisse anzeigen
        </Button>
      </CardContent>
    </Card>
  );
}
