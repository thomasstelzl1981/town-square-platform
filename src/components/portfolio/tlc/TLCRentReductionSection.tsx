/**
 * TLC Rent Reduction Section — Mietminderung (§536 BGB)
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { TrendingDown, ChevronDown, Plus, XCircle } from 'lucide-react';
import { useRentReductions } from '@/hooks/useRentReduction';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  leaseId: string;
  unitId?: string;
}

export function TLCRentReductionSection({ leaseId, unitId }: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [reason, setReason] = useState('');
  const [percent, setPercent] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [notes, setNotes] = useState('');

  const { reductions, isLoading, createReduction, resolveReduction, guidelines } = useRentReductions(leaseId);

  const handleCreate = () => {
    if (!reason.trim() || !percent || !effectiveFrom) { toast.error('Alle Pflichtfelder ausfüllen'); return; }
    createReduction.mutate({
      leaseId,
      unitId,
      reason: reason.trim(),
      reductionPercent: parseFloat(percent),
      effectiveFrom,
      legalBasis: '§536 BGB',
      notes: notes.trim() || undefined,
    }, {
      onSuccess: () => {
        setCreating(false);
        setReason(''); setPercent(''); setEffectiveFrom(''); setNotes('');
      },
    });
  };

  const activeReductions = reductions.filter((r: any) => r.status === 'active');

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 text-xs">
          <span className="flex items-center gap-2">
            <TrendingDown className="h-3.5 w-3.5" />
            Mietminderungen ({activeReductions.length} aktiv)
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 mt-1">
        {isLoading ? (
          <p className="text-xs text-muted-foreground p-2">Lädt…</p>
        ) : (
          <>
            {reductions.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border bg-card text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{r.reduction_percent}% — {r.reason}</span>
                    <Badge variant={r.status === 'active' ? 'destructive' : 'secondary'} className="text-[9px] px-1 py-0">
                      {r.status === 'active' ? 'Aktiv' : 'Aufgehoben'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-0.5">
                    Ab {format(new Date(r.effective_from), 'dd.MM.yyyy', { locale: de })}
                    {r.effective_until && ` bis ${format(new Date(r.effective_until), 'dd.MM.yyyy', { locale: de })}`}
                    {r.legal_basis && ` • ${r.legal_basis}`}
                  </p>
                </div>
                {r.status === 'active' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] shrink-0"
                    onClick={() => resolveReduction.mutate({ id: r.id, effectiveUntil: new Date().toISOString().split('T')[0] })}
                  >
                    <XCircle className="h-3 w-3 mr-0.5" />Aufheben
                  </Button>
                )}
              </div>
            ))}

            {creating ? (
              <div className="p-3 rounded-lg border border-dashed border-primary/30 space-y-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Grund der Minderung *</Label>
                  <Input className="h-7 text-xs" value={reason} onChange={e => setReason(e.target.value)} placeholder="z.B. Heizungsausfall, Schimmel" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Minderung (%) *</Label>
                    <Input className="h-7 text-xs" type="number" min="1" max="100" value={percent} onChange={e => setPercent(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Wirksam ab *</Label>
                    <Input className="h-7 text-xs" type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} />
                  </div>
                </div>
                {guidelines && (
                  <div className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2 space-y-0.5">
                    <p className="font-medium">§536 BGB Richtwerte:</p>
                    {Object.entries(guidelines).slice(0, 5).map(([key, val]: [string, any]) => (
                      <p key={key}>{val.description}: {val.minPercent}–{val.maxPercent}%</p>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-[11px]">Anmerkungen</Label>
                  <Textarea className="text-xs min-h-[40px]" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={createReduction.isPending}>Eintragen</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCreating(false)}>Abbrechen</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => setCreating(true)}>
                <Plus className="mr-1 h-3 w-3" />Mietminderung eintragen
              </Button>
            )}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
