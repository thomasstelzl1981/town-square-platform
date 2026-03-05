/**
 * KaufyShowcaseDialog – Select up to 5 showcase units for Kaufy marketplace
 * MOD-13 PROJEKTE
 */
import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Globe } from 'lucide-react';

const MAX_SHOWCASE = 5;

interface UnitRow {
  id: string;
  unit_number: string;
  area_sqm: number | null;
  list_price: number | null;
  status?: string | null;
  kaufy_showcase?: boolean;
}

interface KaufyShowcaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: UnitRow[];
  isLoading?: boolean;
  onConfirm: (selectedUnitIds: string[]) => void;
}

/** Pick up to 5 units with maximum price spread (quintile algorithm) */
function suggestShowcaseUnits(units: UnitRow[]): string[] {
  const eligible = units
    .filter(u => u.status !== 'verkauft' && u.list_price != null)
    .sort((a, b) => (a.list_price ?? 0) - (b.list_price ?? 0));

  if (eligible.length <= MAX_SHOWCASE) return eligible.map(u => u.id);

  const n = eligible.length;
  const indices = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1];
  // Deduplicate indices
  const unique = [...new Set(indices)];
  return unique.slice(0, MAX_SHOWCASE).map(i => eligible[i].id);
}

const fmt = (v: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export function KaufyShowcaseDialog({
  open,
  onOpenChange,
  units,
  isLoading,
  onConfirm,
}: KaufyShowcaseDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // On open: pre-select already-showcased units, or auto-suggest
  useEffect(() => {
    if (!open) return;
    const alreadyShowcased = units.filter(u => u.kaufy_showcase).map(u => u.id);
    if (alreadyShowcased.length > 0) {
      setSelected(new Set(alreadyShowcased));
    } else {
      setSelected(new Set(suggestShowcaseUnits(units)));
    }
  }, [open, units]);

  const eligibleUnits = useMemo(
    () => units.filter(u => u.status !== 'verkauft').sort((a, b) => (a.list_price ?? 0) - (b.list_price ?? 0)),
    [units],
  );

  function toggleUnit(unitId: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else if (next.size < MAX_SHOWCASE) {
        next.add(unitId);
      }
      return next;
    });
  }

  const canConfirm = selected.size >= 1 && selected.size <= MAX_SHOWCASE;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Kaufy Showcase-Einheiten
          </DialogTitle>
          <DialogDescription>
            Wählen Sie bis zu {MAX_SHOWCASE} Einheiten aus, die auf dem Kaufy-Marktplatz präsentiert werden.
            Die Vorauswahl zeigt eine optimale Preisverteilung.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <span>{selected.size} / {MAX_SHOWCASE} ausgewählt</span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-7 text-xs"
            onClick={() => setSelected(new Set(suggestShowcaseUnits(units)))}
          >
            <Sparkles className="h-3 w-3" />
            Auto-Vorschlag
          </Button>
        </div>

        <ScrollArea className="max-h-[400px] pr-2">
          <div className="space-y-1">
            {eligibleUnits.map(unit => {
              const isChecked = selected.has(unit.id);
              const isDisabled = !isChecked && selected.size >= MAX_SHOWCASE;

              return (
                <label
                  key={unit.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${isChecked ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => !isDisabled && toggleUnit(unit.id)}
                    disabled={isDisabled}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{unit.unit_number}</span>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                      {unit.area_sqm && <span>{unit.area_sqm} m²</span>}
                    </div>
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {unit.list_price ? fmt(unit.list_price) : '–'}
                  </span>
                </label>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button
            disabled={!canConfirm || isLoading}
            onClick={() => onConfirm(Array.from(selected))}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            {isLoading ? 'Veröffentliche...' : `${selected.size} Einheit${selected.size !== 1 ? 'en' : ''} veröffentlichen`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
