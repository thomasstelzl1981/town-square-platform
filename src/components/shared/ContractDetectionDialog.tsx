/**
 * ContractDetectionDialog — Reviews detected recurring contracts
 * and lets users select/deselect + correct categories before saving.
 * Includes Home-Picker for energy contracts (miety_contracts require home_id).
 */

import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileCheck2, Shield, Zap, CreditCard, Home, AlertCircle } from 'lucide-react';
import type { DetectedContract, ContractTargetTable } from '@/engines/kontoMatch/spec';
import { useHomesQuery } from '@/pages/portal/miety/shared/useHomesQuery';

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
  const { data: homes = [] } = useHomesQuery();

  // Sync when dialog opens with new data
  useEffect(() => {
    setContracts(initialContracts);
  }, [initialContracts]);

  const selectedCount = contracts.filter(c => c.selected).length;
  const hasEnergyWithoutHome = contracts.some(
    c => c.selected && c.targetTable === 'miety_contracts' && !c.homeId
  );

  const toggleContract = useCallback((id: string) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  }, []);

  const toggleAll = useCallback((selected: boolean) => {
    setContracts(prev => prev.map(c => ({ ...c, selected })));
  }, []);

  const changeTarget = useCallback((id: string, targetTable: ContractTargetTable) => {
    const option = TARGET_OPTIONS.find(o => o.value === targetTable);
    setContracts(prev => prev.map(c =>
      c.id === id ? {
        ...c,
        targetTable,
        targetLabel: option?.label || c.targetLabel,
        // Clear homeId if switching away from miety_contracts
        homeId: targetTable === 'miety_contracts' ? c.homeId : undefined,
      } : c
    ));
  }, []);

  const changeHome = useCallback((id: string, homeId: string) => {
    setContracts(prev => prev.map(c =>
      c.id === id ? { ...c, homeId } : c
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
                className={`flex flex-col gap-2 p-3 rounded-lg border transition-colors ${
                  contract.selected
                    ? 'bg-accent/30 border-border'
                    : 'bg-muted/20 border-transparent opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
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
                    <SelectContent className="bg-popover z-50">
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

                {/* Home-Picker for energy contracts */}
                {contract.selected && contract.targetTable === 'miety_contracts' && (
                  <div className="flex items-center gap-2 ml-8">
                    <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {homes.length > 0 ? (
                      <Select
                        value={contract.homeId || ''}
                        onValueChange={(v) => changeHome(contract.id, v)}
                      >
                        <SelectTrigger className={`h-7 text-xs flex-1 ${
                          !contract.homeId ? 'border-destructive/50' : ''
                        }`}>
                          <SelectValue placeholder="Zuhause zuordnen…" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {homes.map((home: any) => (
                            <SelectItem key={home.id} value={home.id} className="text-xs">
                              {home.name || `${home.address} ${home.address_house_no}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Kein Zuhause angelegt — bitte zuerst unter Zuhause anlegen
                      </p>
                    )}
                  </div>
                )}
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
            disabled={isCreating || selectedCount === 0 || hasEnergyWithoutHome}
            size="sm"
            title={hasEnergyWithoutHome ? 'Bitte allen Energieverträgen ein Zuhause zuordnen' : undefined}
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
