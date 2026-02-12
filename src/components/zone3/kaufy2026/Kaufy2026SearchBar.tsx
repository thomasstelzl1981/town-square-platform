/**
 * Kaufy2026SearchBar — Compact Inline Cue-Bar
 * 
 * Design (nach Vorlage):
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │  Einkommen (zvE) [60.000] €  │  Eigenkapital [50.000] €  │ [→] [↓]  [Tabs] │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │  Familienstand: Ledig · Verheiratet    Kirchensteuer: Nein · Ja            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Loader2, ArrowRight, Calculator, Search } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'investment') {
      onInvestmentSearch({ zvE, equity, maritalStatus, hasChurchTax });
    } else {
      onClassicSearch({ city, maxPrice, minArea: null });
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('de-DE');
  };

  return (
    <div className="kaufy2026-search-card" style={{ position: 'relative', bottom: 'auto', left: 'auto', transform: 'none', width: '100%' }}>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
         <form onSubmit={handleSubmit}>
          {/* Mode Toggle Tabs */}
          <div className="flex items-center gap-1 mb-3 text-sm">
            <button
              type="button"
              onClick={() => setMode('investment')}
              className={cn(
                "px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors",
                mode === 'investment'
                  ? "bg-[hsl(220,20%,10%)] text-white"
                  : "text-[hsl(215,16%,55%)] hover:bg-white/60"
              )}
            >
              <Calculator className="w-3.5 h-3.5" /> Investment-Suche
            </button>
            <button
              type="button"
              onClick={() => setMode('classic')}
              className={cn(
                "px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors",
                mode === 'classic'
                  ? "bg-[hsl(220,20%,10%)] text-white"
                  : "text-[hsl(215,16%,55%)] hover:bg-white/60"
              )}
            >
              <Search className="w-3.5 h-3.5" /> Klassische Suche
            </button>
          </div>

          {/* Main Search Row */}
          <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
            {mode === 'investment' ? (
              <>
                {/* zvE Inline Input */}
                <div className="kaufy2026-inline-input">
                  <label>Einkommen (zvE)</label>
                  <input
                    type="number"
                    value={zvE}
                    onChange={(e) => setZvE(Number(e.target.value))}
                    placeholder="60.000"
                  />
                  <span>€</span>
                </div>

                {/* Equity Inline Input */}
                <div className="kaufy2026-inline-input">
                  <label>Eigenkapital</label>
                  <input
                    type="number"
                    value={equity}
                    onChange={(e) => setEquity(Number(e.target.value))}
                    placeholder="50.000"
                  />
                  <span>€</span>
                </div>
              </>
            ) : (
              <>
                {/* City Input */}
                <div className="kaufy2026-inline-input">
                  <label>Stadt / PLZ</label>
                  <Input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="border-0 bg-transparent p-0 h-auto font-semibold text-[15px] w-24"
                    placeholder="Berlin..."
                  />
                </div>

                {/* Max Price */}
                <div className="kaufy2026-inline-input">
                  <label>Max. Preis</label>
                  <input
                    type="number"
                    value={maxPrice || ''}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
                    placeholder="∞"
                  />
                  <span>€</span>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                size="sm"
                className="h-9 px-4 rounded-full bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)] text-white font-medium"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>

              {/* Expand Toggle */}
              {mode === 'investment' && (
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-full bg-white hover:bg-gray-50 p-0"
                  >
                    <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
              )}

              {/* Mode toggle moved to top as pill tabs */}
            </div>
          </div>

          {/* Expanded Options — Text Toggles */}
          {mode === 'investment' && (
            <CollapsibleContent className="pt-3 mt-3 border-t border-[hsl(210,20%,90%)]">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {/* Marital Status */}
                <div className="flex items-center gap-2">
                  <span className="text-[hsl(215,16%,55%)]">Familienstand:</span>
                  <div className="kaufy2026-text-toggle">
                    <button
                      type="button"
                      onClick={() => setMaritalStatus('single')}
                      className={cn(maritalStatus === 'single' && 'active')}
                    >
                      Ledig
                    </button>
                    <span className="separator">·</span>
                    <button
                      type="button"
                      onClick={() => setMaritalStatus('married')}
                      className={cn(maritalStatus === 'married' && 'active')}
                    >
                      Verheiratet
                    </button>
                  </div>
                </div>

                {/* Church Tax */}
                <div className="flex items-center gap-2">
                  <span className="text-[hsl(215,16%,55%)]">KiSt:</span>
                  <div className="kaufy2026-text-toggle">
                    <button
                      type="button"
                      onClick={() => setHasChurchTax(false)}
                      className={cn(!hasChurchTax && 'active')}
                    >
                      Nein
                    </button>
                    <span className="separator">·</span>
                    <button
                      type="button"
                      onClick={() => setHasChurchTax(true)}
                      className={cn(hasChurchTax && 'active')}
                    >
                      Ja
                    </button>
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
