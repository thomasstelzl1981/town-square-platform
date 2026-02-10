/**
 * UnitPreislisteTable — 13-column unit price list for MOD-13 Projekte
 * Inline-editable Verkaufspreis + EUR/m² columns
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';
import type { DemoUnit } from './demoProjectData';

interface CalculatedUnit extends DemoUnit {
  effective_price: number;
  effective_yield: number;
  effective_price_per_sqm: number;
  effective_provision: number;
}

interface UnitPreislisteTableProps {
  units: CalculatedUnit[];
  projectId: string;
  isDemo?: boolean;
  onUnitPriceChange?: (unitId: string, field: 'list_price' | 'price_per_sqm', value: number) => void;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  available: { label: 'Frei', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  reserved: { label: 'Reserviert', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  sold: { label: 'Verkauft', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' },
};

function eur(v: number) {
  return v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

/** Inline editable cell */
function EditableCell({
  value,
  suffix,
  onCommit,
  disabled,
}: {
  value: number;
  suffix?: string;
  onCommit: (v: number) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    const parsed = Number(draft.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      onCommit(parsed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="w-full bg-transparent border-b border-primary/40 text-right text-xs font-medium tabular-nums outline-none px-1 py-0.5"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }

  return (
    <span
      className={cn(
        'group/cell inline-flex items-center gap-1 tabular-nums',
        !disabled && 'cursor-pointer hover:text-primary transition-colors'
      )}
      onClick={(e) => {
        if (disabled) return;
        e.stopPropagation();
        setDraft(Math.round(value).toLocaleString('de-DE'));
        setEditing(true);
      }}
    >
      {suffix === '€'
        ? `${Math.round(value).toLocaleString('de-DE')} €`
        : eur(value)
      }
      {!disabled && (
        <Pencil className="h-2.5 w-2.5 text-muted-foreground/0 group-hover/cell:text-muted-foreground/60 transition-colors" />
      )}
    </span>
  );
}

export function UnitPreislisteTable({ units, projectId, isDemo, onUnitPriceChange }: UnitPreislisteTableProps) {
  const navigate = useNavigate();

  // Summary row
  const totalArea = units.reduce((s, u) => s + u.area_sqm, 0);
  const totalAnnualRent = units.reduce((s, u) => s + u.annual_net_rent, 0);
  const totalNK = units.reduce((s, u) => s + u.non_recoverable_costs, 0);
  const totalProvision = units.reduce((s, u) => s + u.effective_provision, 0);
  const totalSalePrice = units.reduce((s, u) => s + u.effective_price, 0);
  const totalParking = units.reduce((s, u) => s + u.parking_price, 0);
  const avgYield = units.length ? (units.reduce((s, u) => s + u.effective_yield, 0) / units.length) : 0;
  const avgPriceSqm = units.length && totalArea > 0 ? Math.round(totalSalePrice / totalArea) : 0;

  const handleRowClick = (unitId: string, index: number) => {
    if (isDemo && index !== 0) return;
    navigate(`/portal/projekte/${projectId}/einheit/${unitId}`);
  };

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Objekt-ID</th>
              <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">WE-Nr</th>
              <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground">Typ</th>
              <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground">Etage</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Fläche m²</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Jahresnetto</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">NK n.u.</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Rendite</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Verkaufspreis ✎</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Provision</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Stellplatz</th>
              <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">EUR/m² ✎</th>
              <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u, idx) => {
              const badge = STATUS_BADGE[u.status] || STATUS_BADGE.available;
              const isFirstDemo = isDemo && idx === 0;
              const canEdit = true;
              return (
                <tr
                  key={u.id}
                  className={cn(
                    'border-b border-border/50 transition-colors hover:bg-muted/20 cursor-pointer',
                    isFirstDemo && 'bg-primary/5 hover:bg-primary/10'
                  )}
                  onClick={() => handleRowClick(u.id, idx)}
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-primary">{u.public_id}</td>
                  <td className="px-3 py-2 font-medium">{u.unit_number}</td>
                  <td className="px-3 py-2 text-center">{u.rooms}-Zi</td>
                  <td className="px-3 py-2 text-center">{u.floor}. OG</td>
                  <td className="px-3 py-2 text-right">{u.area_sqm} m²</td>
                  <td className="px-3 py-2 text-right">{eur(u.annual_net_rent)}</td>
                  <td className="px-3 py-2 text-right">{eur(u.non_recoverable_costs)}/M</td>
                  <td className="px-3 py-2 text-right font-medium">{u.effective_yield.toFixed(2)} %</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    <EditableCell
                      value={u.effective_price}
                      onCommit={(v) => onUnitPriceChange?.(u.id, 'list_price', v)}
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">{eur(u.effective_provision)}</td>
                  <td className="px-3 py-2 text-right">{eur(u.parking_price)}</td>
                  <td className="px-3 py-2 text-right">
                    <EditableCell
                      value={u.effective_price_per_sqm}
                      suffix="€"
                      onCommit={(v) => onUnitPriceChange?.(u.id, 'price_per_sqm', v)}
                      disabled={!canEdit}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge className={cn('text-[10px] border-0', badge.className)}>{badge.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/40 font-semibold text-xs">
              <td className="px-3 py-2.5" colSpan={2}>
                {isDemo && <span className="text-muted-foreground italic font-normal">Musterdaten</span>}
                {!isDemo && <span>Summe / Ø</span>}
              </td>
              <td className="px-3 py-2.5 text-center">{units.length} WE</td>
              <td className="px-3 py-2.5" />
              <td className="px-3 py-2.5 text-right">{totalArea} m²</td>
              <td className="px-3 py-2.5 text-right">{eur(totalAnnualRent)}</td>
              <td className="px-3 py-2.5 text-right">{eur(totalNK)}/M</td>
              <td className="px-3 py-2.5 text-right">Ø {avgYield.toFixed(2)} %</td>
              <td className="px-3 py-2.5 text-right">{eur(totalSalePrice)}</td>
              <td className="px-3 py-2.5 text-right">{eur(totalProvision)}</td>
              <td className="px-3 py-2.5 text-right">{eur(totalParking)}</td>
              <td className="px-3 py-2.5 text-right">Ø {avgPriceSqm.toLocaleString('de-DE')} €</td>
              <td className="px-3 py-2.5" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
