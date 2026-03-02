/**
 * TLC Payment Plan Section — Ratenplan-Verwaltung
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Banknote, Plus, CheckCircle } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { usePaymentPlans } from '@/hooks/usePaymentPlan';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  leaseId: string;
  unitId?: string;
}

export function TLCPaymentPlanSection({ leaseId, unitId }: Props) {
  const [creating, setCreating] = useState(false);
  const [totalArrears, setTotalArrears] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('');
  const [startDate, setStartDate] = useState('');
  const { plans, isLoading, createPlan, updatePlanStatus } = usePaymentPlans(leaseId);

  const handleCreate = () => {
    const total = parseFloat(totalArrears); const monthly = parseFloat(monthlyInstallment); const count = parseInt(installmentsCount);
    if (!total || !monthly || !count || !startDate) { toast.error('Alle Felder ausfüllen'); return; }
    createPlan.mutate({ leaseId, unitId, totalArrears: total, monthlyInstallment: monthly, installmentsCount: count, startDate }, {
      onSuccess: () => { setCreating(false); setTotalArrears(''); setMonthlyInstallment(''); setInstallmentsCount(''); setStartDate(''); },
    });
  };

  const activePlans = plans.filter((p: any) => p.status === 'active');

  return (
    <div className="space-y-2">
      <h4 className={DESIGN.TYPOGRAPHY.LABEL}>
        <Banknote className="h-3.5 w-3.5 inline mr-1.5" />
        Ratenpläne ({activePlans.length} aktiv)
      </h4>
      {isLoading ? (
        <p className="text-xs text-muted-foreground p-2">Lädt…</p>
      ) : (
        <>
          {plans.map((plan: any) => (
            <div key={plan.id} className="flex items-center justify-between p-2 rounded-lg border bg-card text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{plan.total_arrears_eur?.toLocaleString('de-DE')} € in {plan.installments_count} Raten</span>
                  <Badge variant={plan.status === 'active' ? 'default' : 'secondary'} className="text-[9px] px-1 py-0">
                    {plan.status === 'active' ? 'Aktiv' : plan.status === 'completed' ? 'Abgeschlossen' : plan.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-0.5">
                  {plan.monthly_installment_eur?.toLocaleString('de-DE')} €/Monat ab {format(new Date(plan.start_date), 'dd.MM.yyyy', { locale: de })}
                  {plan.installments_paid > 0 && ` • ${plan.installments_paid}/${plan.installments_count} gezahlt`}
                </p>
              </div>
              {plan.status === 'active' && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => updatePlanStatus.mutate({ planId: plan.id, installmentsPaid: (plan.installments_paid || 0) + 1 })} title="Rate als gezahlt markieren">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                </Button>
              )}
            </div>
          ))}
          {creating ? (
            <div className="p-3 rounded-lg border border-dashed border-primary/30 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-[11px]">Rückstand (€) *</Label><Input className="h-7 text-xs" type="number" value={totalArrears} onChange={e => setTotalArrears(e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-[11px]">Monatsrate (€) *</Label><Input className="h-7 text-xs" type="number" value={monthlyInstallment} onChange={e => setMonthlyInstallment(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-[11px]">Anzahl Raten *</Label><Input className="h-7 text-xs" type="number" value={installmentsCount} onChange={e => setInstallmentsCount(e.target.value)} /></div>
                <div className="space-y-1"><Label className="text-[11px]">Startdatum *</Label><Input className="h-7 text-xs" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={createPlan.isPending}>Anlegen</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCreating(false)}>Abbrechen</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="h-7 text-xs w-full" onClick={() => setCreating(true)}>
              <Plus className="mr-1 h-3 w-3" />Ratenplan erstellen
            </Button>
          )}
        </>
      )}
    </div>
  );
}
