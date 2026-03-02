/**
 * AdminBillingTab — Zone 1 Tenant Billing Overview
 * Shows: Credit Balance, Ledger, Invoices, Subscription, Admin TopUp
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, TrendingDown, TrendingUp, Plus, Receipt, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { getServiceLabel, formatEurCents } from '@/config/billingConstants';

interface AdminBillingTabProps {
  tenantId: string;
}

export function AdminBillingTab({ tenantId }: AdminBillingTabProps) {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('100');
  const [topUpReason, setTopUpReason] = useState('');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);

  // --- Queries ---
  const { data: balance, isLoading: balLoading, refetch: refetchBalance } = useQuery({
    queryKey: ['admin-credit-balance', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_credit_balance')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: ledger, isLoading: ledgerLoading } = useQuery({
    queryKey: ['admin-credit-ledger', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_ledger')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: invoices, isLoading: invLoading } = useQuery({
    queryKey: ['admin-invoices', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('issued_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ['admin-subscription', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('tenant_id', tenantId)
        .eq('status', 'active' as any)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // --- Admin TopUp ---
  const handleTopUp = async () => {
    const credits = parseInt(topUpAmount, 10);
    if (!credits || credits < 1) {
      toast.error('Bitte einen gültigen Betrag eingeben');
      return;
    }

    setIsTopUpLoading(true);
    try {
      const { data, error } = await supabase.rpc('rpc_credit_topup', {
        p_tenant_id: tenantId,
        p_credits: credits,
        p_ref_type: 'admin_topup',
        p_ref_id: tenantId,
      });

      if (error) throw error;

      toast.success(`${credits} Credits erfolgreich gutgeschrieben`);
      setTopUpOpen(false);
      setTopUpAmount('100');
      setTopUpReason('');
      refetchBalance();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || 'TopUp fehlgeschlagen');
    }
    setIsTopUpLoading(false);
  };

  const isLoading = balLoading || ledgerLoading || invLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      sent: 'secondary',
      draft: 'outline',
      overdue: 'destructive',
    };
    return <Badge variant={map[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Row 1: Balance + Subscription */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aktueller Saldo</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{balance?.balance_credits ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Credits verfügbar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lifetime</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm">{balance?.lifetime_purchased ?? 0} gekauft</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm">{balance?.lifetime_consumed ?? 0} verbraucht</span>
            </div>
            {(balance?.reserved_credits ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">{balance?.reserved_credits} reserviert</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Abo / Plan</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold">{(subscription as any).plans?.name || '—'}</p>
                <p className="text-xs text-muted-foreground">
                  bis {format(new Date((subscription as any).current_period_end), 'dd.MM.yyyy', { locale: de })}
                </p>
                {(subscription as any).cancel_at_period_end && (
                  <Badge variant="destructive" className="text-xs">Kündigung zum Periodenende</Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Kein aktives Abo</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin TopUp Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setTopUpOpen(true)}>
          <Plus className="h-4 w-4" />
          Credits manuell gutschreiben
        </Button>
      </div>

      {/* Row 2: Ledger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaktionen (letzte 50)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!ledger || ledger.length === 0) ? (
            <p className="text-sm text-muted-foreground py-4">Keine Transaktionen vorhanden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(entry.created_at), 'dd.MM.yy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.kind === 'credit' ? 'default' : 'secondary'}>
                        {entry.kind === 'credit' ? 'Gutschrift' : 'Verbrauch'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {getServiceLabel(entry.ref_type)}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm ${entry.kind === 'credit' ? 'text-primary' : 'text-destructive'}`}>
                      {entry.kind === 'credit' ? '+' : '−'}{entry.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Row 3: Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Rechnungen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!invoices || invoices.length === 0) ? (
            <p className="text-sm text-muted-foreground py-4">Keine Rechnungen vorhanden</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nr.</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bezahlt am</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm">{inv.invoice_number || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.issued_at ? format(new Date(inv.issued_at), 'dd.MM.yyyy', { locale: de }) : '—'}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatEurCents(inv.amount_cents)} {inv.currency?.toUpperCase()}
                    </TableCell>
                    <TableCell>{statusBadge(inv.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.paid_at ? format(new Date(inv.paid_at), 'dd.MM.yyyy', { locale: de }) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* TopUp Dialog */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credits manuell gutschreiben</DialogTitle>
            <DialogDescription>
              Gutschrift wird sofort dem Tenant-Guthaben hinzugefügt und im Ledger protokolliert.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="topup-amount">Anzahl Credits</Label>
              <Input
                id="topup-amount"
                type="number"
                min={1}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Entspricht {formatEurCents(parseInt(topUpAmount || '0', 10) * 25)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topup-reason">Begründung (optional)</Label>
              <Input
                id="topup-reason"
                placeholder="z.B. Kulanz, Test, Onboarding..."
                value={topUpReason}
                onChange={(e) => setTopUpReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopUpOpen(false)} disabled={isTopUpLoading}>
              Abbrechen
            </Button>
            <Button onClick={handleTopUp} disabled={isTopUpLoading}>
              {isTopUpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gutschreiben
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
