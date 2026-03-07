/**
 * CalcShared — Shared UI primitives for Bestand & Aufteiler calculations
 * Provides consistent inline-editable card layout across both tabs.
 */
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';

// ── Formatters ──

export const fmtCur = (v: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export const fmtSqm = (v: number) =>
  v > 0 ? `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(v)} €/m²` : '–';

// ── Badge colors for numbered sections ──

const SECTION_COLORS: Record<number, string> = {
  1: 'bg-primary/10 text-primary',
  2: 'bg-amber-500/10 text-amber-600',
  3: 'bg-purple-500/10 text-purple-600',
  4: 'bg-blue-500/10 text-blue-600',
  5: 'bg-emerald-500/10 text-emerald-600',
};

// ── Numbered Section Card ──

interface NumberedSectionCardProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

export const NumberedSectionCard = memo(function NumberedSectionCard({ number, title, children }: NumberedSectionCardProps) {
  const colorClass = SECTION_COLORS[number] || SECTION_COLORS[1];
  return (
    <Card className={DESIGN.CARD.BASE}>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className={cn(DESIGN.TYPOGRAPHY.CARD_TITLE, 'text-sm flex items-center gap-2')}>
          <span className={cn('h-5 w-5 rounded text-xs font-bold flex items-center justify-center', colorClass)}>
            {number}
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-0">
        {children}
      </CardContent>
    </Card>
  );
});

// ── Inline Editable Field ──

interface EditFieldProps {
  label: string;
  value: number;
  onChange?: (v: number) => void;
  suffix?: string;
  hint?: string;
  disabled?: boolean;
}

export const EditField = memo(function EditField({ label, value, onChange, suffix, hint, disabled }: EditFieldProps) {
  return (
    <div className="flex items-center justify-between py-1.5 group">
      <div className="flex-1 min-w-0">
        <span className="text-sm">{label}</span>
        {hint && <span className="text-[10px] text-muted-foreground ml-2">{hint}</span>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {disabled ? (
          <span className="text-sm font-medium text-muted-foreground tabular-nums w-28 text-right">{fmtCur(value)}</span>
        ) : (
          <Input
            type="number"
            value={value || ''}
            onChange={e => onChange?.(parseFloat(e.target.value) || 0)}
            className="w-28 h-7 text-right text-sm font-medium tabular-nums"
          />
        )}
        {suffix && <span className="text-xs text-muted-foreground w-8">{suffix}</span>}
      </div>
    </div>
  );
});

// ── Percent Input Field (inline with % suffix + computed amount) ──

interface PercentFieldProps {
  label: string;
  percent: number;
  onPercentChange: (v: number) => void;
  computedAmount: number;
}

export const PercentField = memo(function PercentField({ label, percent, onPercentChange, computedAmount }: PercentFieldProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex-1"><span className="text-sm">{label}</span></div>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          value={percent ?? 0}
          onChange={e => onPercentChange(parseFloat(e.target.value) || 0)}
          className="w-16 h-7 text-right text-sm font-medium"
          step={0.1}
        />
        <span className="text-xs text-muted-foreground w-8">%</span>
        <span className="text-sm font-medium tabular-nums text-muted-foreground w-24 text-right">{fmtCur(computedAmount)}</span>
      </div>
    </div>
  );
});

// ── Computed (Read-Only) Field ──

interface ComputedFieldProps {
  label: string;
  value: string;
  className?: string;
  hint?: string;
}

export const ComputedField = memo(function ComputedField({ label, value, className, hint }: ComputedFieldProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex-1 min-w-0">
        <span className="text-sm">{label}</span>
        {hint && <span className="text-[10px] text-muted-foreground ml-2">{hint}</span>}
      </div>
      <span className={cn('text-sm font-medium tabular-nums', className)}>{value}</span>
    </div>
  );
});

// ── Subtotal Row ──

interface SubtotalRowProps {
  label: string;
  value: number;
  sqmValue?: string;
}

export const SubtotalRow = memo(function SubtotalRow({ label, value, sqmValue }: SubtotalRowProps) {
  return (
    <>
      <Separator className="my-1" />
      <div className="flex items-center justify-between py-1.5">
        <span className="text-sm font-semibold">{label}</span>
        <div className="flex items-center gap-3">
          {sqmValue && <span className="text-xs text-muted-foreground">{sqmValue}</span>}
          <span className="text-sm font-bold tabular-nums">{fmtCur(value)}</span>
        </div>
      </div>
    </>
  );
});

// ── Total Investment Banner ──

interface TotalBannerProps {
  label?: string;
  value: number;
  sqmValue?: string;
}

export const TotalBanner = memo(function TotalBanner({ label = 'GESAMTINVESTITION', value, sqmValue }: TotalBannerProps) {
  return (
    <Card className={cn(DESIGN.CARD.BASE, 'border-primary/30 bg-primary/5')}>
      <CardContent className="py-4 px-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold">{label}</span>
          <div className="flex items-center gap-4">
            {sqmValue && <span className="text-sm text-muted-foreground">{sqmValue}</span>}
            <span className="text-xl font-bold tabular-nums">{fmtCur(value)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ── Result Banner (colored by profit) ──

interface ResultBannerProps {
  items: Array<{ label: string; value: string; color?: string }>;
  positive: boolean;
}

export const ResultBanner = memo(function ResultBanner({ items, positive }: ResultBannerProps) {
  return (
    <Card className={cn(
      DESIGN.CARD.BASE,
      'border-2',
      positive ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-destructive/50 bg-destructive/5'
    )}>
      <CardContent className="py-5 px-4">
        <div className={cn('grid gap-6 text-center', `grid-cols-${items.length}`)}>
          {items.map((item, i) => (
            <div key={i}>
              <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
              <div className={cn('text-xl font-bold tabular-nums', item.color || (positive ? 'text-emerald-500' : 'text-destructive'))}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
