/**
 * Kaufy2026SearchBar — Floating Search Component
 * 
 * Design: Compact cue-bar with expandable options
 * ┌─────────────────────────────────────────────────────────────┐
 * │  [Einkommen (zvE)]  [Eigenkapital]  [Ergebnisse →] [⌄]      │
 * ├─────────────────────────────────────────────────────────────┤
 * │  Familienstand: Ledig · Verheiratet                         │
 * │  KiSt: Nein · Ja                                            │
 * └─────────────────────────────────────────────────────────────┘
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Loader2, Search, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchParams {
  zvE: number;
  equity: number;
  maritalStatus: 'single' | 'married';
  hasChurchTax: boolean;
  churchTaxState?: string;
}

export interface ClassicSearchParams {
  city: string;
  maxPrice: number | null;
  minArea: number | null;
}

interface Kaufy2026SearchBarProps {
  onInvestmentSearch: (params: SearchParams) => void;
  onClassicSearch: (params: ClassicSearchParams) => void;
  isLoading?: boolean;
  defaultExpanded?: boolean;
}

export function Kaufy2026SearchBar({
  onInvestmentSearch,
  onClassicSearch,
  isLoading = false,
  defaultExpanded = false,
}: Kaufy2026SearchBarProps) {
  const [mode, setMode] = useState<'investment' | 'classic'>('investment');
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Investment params
  const [zvE, setZvE] = useState(60000);
  const [equity, setEquity] = useState(50000);
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married'>('single');
  const [hasChurchTax, setHasChurchTax] = useState(false);

  // Classic params
  const [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minArea, setMinArea] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'investment') {
      onInvestmentSearch({ zvE, equity, maritalStatus, hasChurchTax });
    } else {
      onClassicSearch({ city, maxPrice, minArea });
    }
  };

  return (
    <div className="kaufy2026-search-card">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <form onSubmit={handleSubmit}>
          {/* Mode Toggle */}
          <div className="flex items-center justify-center mb-4">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'investment' | 'classic')}>
              <TabsList className="bg-white/50">
                <TabsTrigger value="investment" className="gap-2 text-xs">
                  <Calculator className="w-3 h-3" />
                  Investment
                </TabsTrigger>
                <TabsTrigger value="classic" className="gap-2 text-xs">
                  <Search className="w-3 h-3" />
                  Klassisch
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Main Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {mode === 'investment' ? (
              <>
                {/* zvE Input */}
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-[hsl(215,16%,47%)] mb-1 block">
                    Einkommen (zvE)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={zvE}
                      onChange={(e) => setZvE(Number(e.target.value))}
                      className="h-11 bg-white border-0 pr-8 text-base font-medium"
                      placeholder="60.000"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,16%,47%)] text-sm">€</span>
                  </div>
                </div>

                {/* Equity Input */}
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-[hsl(215,16%,47%)] mb-1 block">
                    Eigenkapital
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={equity}
                      onChange={(e) => setEquity(Number(e.target.value))}
                      className="h-11 bg-white border-0 pr-8 text-base font-medium"
                      placeholder="50.000"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,16%,47%)] text-sm">€</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* City Input */}
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-[hsl(215,16%,47%)] mb-1 block">
                    Stadt / PLZ
                  </Label>
                  <Input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-11 bg-white border-0 text-base font-medium"
                    placeholder="Berlin, München..."
                  />
                </div>

                {/* Max Price */}
                <div className="flex-1 min-w-0">
                  <Label className="text-xs text-[hsl(215,16%,47%)] mb-1 block">
                    Max. Preis
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={maxPrice || ''}
                      onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                      className="h-11 bg-white border-0 pr-8 text-base font-medium"
                      placeholder="Unbegrenzt"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,16%,47%)] text-sm">€</span>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 px-6 rounded-full bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)] text-white font-medium md:self-end"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Ergebnisse<span className="ml-1">→</span></>
              )}
            </Button>

            {/* Expand Toggle (only for investment) */}
            {mode === 'investment' && (
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full bg-white md:self-end shrink-0"
                >
                  <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
            )}
          </div>

          {/* Expanded Options */}
          {mode === 'investment' && (
            <CollapsibleContent className="pt-4 mt-4 border-t border-[hsl(210,20%,90%)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Marital Status */}
                <div className="space-y-2">
                  <Label className="text-xs text-[hsl(215,16%,47%)]">Familienstand</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={maritalStatus === 'single' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMaritalStatus('single')}
                      className={cn(
                        "flex-1 rounded-full",
                        maritalStatus === 'single' 
                          ? "bg-[hsl(220,20%,10%)] text-white" 
                          : "bg-white text-[hsl(220,20%,10%)]"
                      )}
                    >
                      Ledig
                    </Button>
                    <Button
                      type="button"
                      variant={maritalStatus === 'married' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMaritalStatus('married')}
                      className={cn(
                        "flex-1 rounded-full",
                        maritalStatus === 'married' 
                          ? "bg-[hsl(220,20%,10%)] text-white" 
                          : "bg-white text-[hsl(220,20%,10%)]"
                      )}
                    >
                      Verheiratet
                    </Button>
                  </div>
                </div>

                {/* Church Tax */}
                <div className="space-y-2">
                  <Label className="text-xs text-[hsl(215,16%,47%)]">Kirchensteuer</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={!hasChurchTax ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHasChurchTax(false)}
                      className={cn(
                        "flex-1 rounded-full",
                        !hasChurchTax 
                          ? "bg-[hsl(220,20%,10%)] text-white" 
                          : "bg-white text-[hsl(220,20%,10%)]"
                      )}
                    >
                      Nein
                    </Button>
                    <Button
                      type="button"
                      variant={hasChurchTax ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setHasChurchTax(true)}
                      className={cn(
                        "flex-1 rounded-full",
                        hasChurchTax 
                          ? "bg-[hsl(220,20%,10%)] text-white" 
                          : "bg-white text-[hsl(220,20%,10%)]"
                      )}
                    >
                      Ja
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          )}
        </form>
      </Collapsible>
    </div>
  );
}
