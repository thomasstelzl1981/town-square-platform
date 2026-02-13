/**
 * FinanceCaseCard — Square widget card for finance cases (analog to ProjectCard)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Landmark, ArrowRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetDeleteOverlay } from '@/components/shared/WidgetDeleteOverlay';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';
import type { FutureRoomCase } from '@/types/finance';

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function getApplicantName(c: FutureRoomCase): string {
  const ap = c.finance_mandates?.finance_requests?.applicant_profiles?.[0];
  if (ap?.first_name && ap?.last_name) return `${ap.first_name} ${ap.last_name}`;
  return c.finance_mandates?.public_id || 'Unbekannt';
}

function getLoanAmount(c: FutureRoomCase): number | null {
  return c.finance_mandates?.finance_requests?.applicant_profiles?.[0]?.loan_amount_requested || null;
}

function getRequestStatus(c: FutureRoomCase): string {
  return c.finance_mandates?.finance_requests?.status || c.status;
}

interface FinanceCaseCardProps {
  caseData: FutureRoomCase;
  isSelected?: boolean;
  onClick?: (requestId: string) => void;
  onDelete?: (requestId: string) => void;
  isDeleting?: boolean;
}

export function FinanceCaseCard({ caseData, isSelected, onClick, onDelete, isDeleting }: FinanceCaseCardProps) {
  const status = getRequestStatus(caseData);
  const name = getApplicantName(caseData);
  const amount = getLoanAmount(caseData);
  const publicId = caseData.finance_mandates?.public_id || caseData.id.slice(0, 8);
  const requestId = caseData.finance_mandates?.finance_request_id || caseData.id;

  const canDelete = status === 'draft';

  return (
    <Card
      className={cn(
        'glass-card shadow-card cursor-pointer transition-all hover:shadow-elevated hover:scale-[1.02] group relative',
        'flex flex-row items-center gap-3 p-3 md:flex-col md:aspect-square md:p-0',
        isSelected && 'ring-2 ring-primary shadow-glow'
      )}
      onClick={() => onClick?.(requestId)}
    >
      {onDelete && (
        <WidgetDeleteOverlay
          title={name}
          onConfirmDelete={() => onDelete(requestId)}
          isDeleting={isDeleting}
          disabled={!canDelete}
        />
      )}
      {/* Mobile: horizontal row layout */}
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 md:hidden">
        <Landmark className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0 md:hidden">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-sm leading-tight truncate">{name}</p>
          <Badge variant={getStatusBadgeVariant(status)} className="text-[10px] font-medium flex-shrink-0">
            {getStatusLabel(status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-mono">{publicId}</span>
          {amount && <span>· {eurFormat.format(amount)}</span>}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 md:hidden" />

      {/* Desktop: original square layout */}
      <CardContent className="hidden md:flex p-4 flex-col h-full justify-between">
        <div className="flex items-start justify-between">
          <Badge variant={getStatusBadgeVariant(status)} className="text-[10px] font-medium">
            {getStatusLabel(status)}
          </Badge>
          <span className="text-[10px] font-mono text-muted-foreground">{publicId}</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <p className="font-semibold text-sm leading-tight line-clamp-2">{name}</p>
          {amount && (
            <p className="text-[11px] text-muted-foreground">{eurFormat.format(amount)}</p>
          )}
        </div>
        <div className="flex items-center justify-end text-[10px] text-muted-foreground">
          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  );
}

/** Empty placeholder card */
export function FinanceCaseCardPlaceholder({ label }: { label?: string }) {
  return (
    <Card className="glass-card border-dashed border-2 md:aspect-square flex flex-col items-center justify-center opacity-50">
      <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
          <Landmark className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label || 'Keine Fälle'}</p>
        <p className="text-[10px] text-muted-foreground">Fälle werden über das Dashboard zugewiesen</p>
      </CardContent>
    </Card>
  );
}
