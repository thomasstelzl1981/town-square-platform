/**
 * Settlements Tab — Sales Desk: Commission + Platform Share overview
 * Now includes CREATE settlement dialog and links to SLC cases.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, CheckCircle2, Plus } from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { useAllSettlements, useApproveSettlement, useCreateSettlement } from '@/hooks/useSalesSettlement';
import { useSalesCases } from '@/hooks/useSalesCases';
import { SLC_PHASE_LABELS } from '@/engines/slc/spec';
import type { SLCPhase } from '@/engines/slc/spec';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  calculated: 'Berechnet',
  approved: 'Freigegeben',
  invoiced: 'Fakturiert',
  paid: 'Bezahlt',
  cancelled: 'Storniert',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  calculated: 'secondary',
  approved: 'default',
  invoiced: 'default',
  paid: 'default',
  cancelled: 'destructive',
};

/** Phases eligible for settlement creation */
const SETTLEMENT_ELIGIBLE_PHASES: SLCPhase[] = ['notary_completed', 'handover', 'settlement'];

export default function SettlementsTab() {
  const { data: settlements, isLoading } = useAllSettlements();
  const approveSettlement = useApproveSettlement();
  const createSettlement = useCreateSettlement();
  const { data: cases } = useSalesCases();
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ caseId: '', dealValue: '' });

  // Cases eligible for new settlement (in notary_completed+ phases, no existing settlement)
  const eligibleCases = (cases || []).filter(c => 
    SETTLEMENT_ELIGIBLE_PHASES.includes(c.current_phase) &&
    !settlements?.some((s: any) => s.case_id === c.id && s.status !== 'cancelled')
  );

  const formatCurrency = (v: number | null | undefined) =>
    v != null ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '–';

  const handleCreate = async () => {
    if (!createForm.caseId || !createForm.dealValue) {
      toast.error('Bitte Fall und Deal-Wert angeben');
      return;
    }
    const selectedCase = cases?.find(c => c.id === createForm.caseId);
    if (!selectedCase) return;

    await createSettlement.mutateAsync({
      caseId: createForm.caseId,
      dealValue: parseFloat(createForm.dealValue),
      tenantId: selectedCase.tenant_id,
    });
    setShowCreate(false);
    setCreateForm({ caseId: '', dealValue: '' });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!settlements?.length && !eligibleCases.length) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold uppercase">Abrechnungen</h2>
        <EmptyState
          icon={Banknote}
          title="Keine Abrechnungen"
          description="Provisionsabrechnungen werden erstellt, wenn ein Verkaufsfall die Settlement-Phase erreicht"
        />
      </div>
    );
  }

  // KPIs
  const totalPlatformShare = (settlements || [])
    .filter((s: any) => !['cancelled'].includes(s.status))
    .reduce((sum: number, s: any) => sum + (s.platform_share_amount || 0), 0);
  const approvedCount = (settlements || []).filter((s: any) => s.status === 'approved').length;
  const pendingCount = (settlements || []).filter((s: any) => s.status === 'calculated').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold uppercase">Abrechnungen</h2>
        <div className="flex gap-2">
          <Badge variant="secondary">{(settlements || []).length} Abrechnungen</Badge>
          {eligibleCases.length > 0 && (
            <Button variant="default" size="sm" className="gap-1" onClick={() => setShowCreate(true)}>
              <Plus className="h-3.5 w-3.5" /> Neue Abrechnung
            </Button>
          )}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plattformanteil (gesamt)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPlatformShare)}</div>
            <p className="text-xs text-muted-foreground">25% aller Provisionen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Freigegeben</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ausstehend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Banknote className="h-4 w-4" /> Provisionsabrechnungen
          </CardTitle>
          <CardDescription>ENG-PROVISION Berechnungen mit Plattformanteil (25%)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objekt</TableHead>
                <TableHead>Eigentümer</TableHead>
                <TableHead className="text-right">Deal-Wert</TableHead>
                <TableHead className="text-right">Provision (brutto)</TableHead>
                <TableHead className="text-right">Plattformanteil</TableHead>
                <TableHead className="text-right">Manager (netto)</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(settlements || []).map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.case?.property?.address || '–'}</div>
                    <div className="text-xs text-muted-foreground">{s.case?.property?.city || '–'}</div>
                  </TableCell>
                  <TableCell className="text-sm">{s.case?.tenant?.name || '–'}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(s.deal_value)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.total_commission_brutto)}</TableCell>
                  <TableCell className="text-right font-medium text-primary">{formatCurrency(s.platform_share_amount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(s.manager_netto_amount)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={STATUS_VARIANT[s.status] || 'outline'} className="text-xs">
                      {STATUS_LABELS[s.status] || s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {s.status === 'calculated' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-1"
                        disabled={approveSettlement.isPending}
                        onClick={() => approveSettlement.mutate({
                          settlementId: s.id,
                          caseId: s.case_id,
                          tenantId: s.tenant_id,
                        })}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Freigeben
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Settlement Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Provisionsabrechnung</DialogTitle>
            <DialogDescription>
              Wählen Sie einen Verkaufsfall und geben Sie den Deal-Wert ein. Die Provision wird automatisch via ENG-PROVISION berechnet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Verkaufsfall</Label>
              <Select value={createForm.caseId} onValueChange={(v) => setCreateForm(f => ({ ...f, caseId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Fall auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {eligibleCases.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.property?.address || c.asset_id.slice(0, 8)} — {SLC_PHASE_LABELS[c.current_phase]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Deal-Wert (€)</Label>
              <Input
                type="number"
                placeholder="z.B. 350000"
                value={createForm.dealValue}
                onChange={(e) => setCreateForm(f => ({ ...f, dealValue: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Abbrechen</Button>
            <Button onClick={handleCreate} disabled={createSettlement.isPending} className="gap-1">
              <Banknote className="h-4 w-4" /> Berechnen & Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
