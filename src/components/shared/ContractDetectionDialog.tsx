/**
 * ContractDetectionDialog — Reviews detected recurring contracts
 * and lets users select/deselect + correct categories before saving.
 */

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileCheck2, Shield, Zap, CreditCard } from 'lucide-react';
import type { DetectedContract, ContractTargetTable } from '@/engines/kontoMatch/spec';

interface ContractDetectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contracts: DetectedContract[];
  onConfirm: (contracts: DetectedContract[]) => void;
  isCreating: boolean;
}

const TARGET_OPTIONS: { value: ContractTargetTable; label: string; icon: React.ReactNode }[] = [
  { value: 'user_subscriptions', label: 'Abo', icon: <CreditCard className="h-3 w-3" /> },
  { value: 'insurance_contracts', label: 'Versicherung', icon: <Shield className="h-3 w-3" /> },
  { value: 'miety_contracts', label: 'Energievertrag', icon: <Zap className="h-3 w-3" /> },
];

const TARGET_COLORS: Record<ContractTargetTable, string> = {
  user_subscriptions: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  insurance_contracts: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  miety_contracts: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

function formatAmount(amount: number, frequency: string): string {
  const formatted = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
  const freqLabel = frequency === 'monatlich' ? '/Monat' : frequency === 'quartalsweise' ? '/Quartal' : '/Jahr';
  return `${formatted}${freqLabel}`;
}

export function ContractDetectionDialog({
  open,
  onOpenChange,
  contracts: initialContracts,
  onConfirm,
  isCreating,
}: ContractDetectionDialogProps) {
  const [contracts, setContracts] = useState<DetectedContract[]>(initialContracts);

  // Sync when dialog opens with new data
  useState(() => {
    setContracts(initialContracts);
  });

  const selectedCount = contracts.filter(c => c.selected).length;

  const toggleContract = useCallback((id: string) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  }, []);

  const toggleAll = useCallback((selected: boolean) => {
    setContracts(prev => prev.map(c => ({ ...c, selected })));
  }, []);

  const changeTarget = useCallback((id: string, targetTable: ContractTargetTable) => {
    const option = TARGET_OPTIONS.find(o => o.value === targetTable);
    setContracts(prev => prev.map(c =>
      c.id === id ? { ...c, targetTable, targetLabel: option?.label || c.targetLabel } : c
    ));
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            Erkannte Verträge
          </DialogTitle>
          <DialogDescription>
            {contracts.length} wiederkehrende Zahlungsmuster erkannt.
            Wähle die Verträge aus, die du übernehmen möchtest.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2">
            {contracts.map(contract => (
              <div
                key={contract.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  contract.selected
                    ? 'bg-accent/30 border-border'
                    : 'bg-muted/20 border-transparent opacity-60'
                }`}
              >
                <Checkbox
                  checked={contract.selected}
                  onCheckedChange={() => toggleContract(contract.id)}
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{contract.counterparty}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatAmount(contract.amount, contract.frequency)}
                    {' · '}
                    {contract.pattern.occurrences}× erkannt
                  </p>
                </div>

                <Select
                  value={contract.targetTable}
                  onValueChange={(v) => changeTarget(contract.id, v as ContractTargetTable)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        <span className="flex items-center gap-1.5">
                          {opt.icon} {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 whitespace-nowrap ${TARGET_COLORS[contract.targetTable]}`}
                >
                  {contract.targetLabel}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-2 pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>
              Alle
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>
              Keine
            </Button>
          </div>
          <Button
            onClick={() => onConfirm(contracts)}
            disabled={isCreating || selectedCount === 0}
            size="sm"
          >
            {isCreating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird angelegt…</>
            ) : (
              `${selectedCount} Verträge anlegen`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
