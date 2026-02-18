/**
 * MOD-18 Finanzen — Tab: KONTEN
 * Bankkonten mit polymorphischer Zuordnung (Person, Vermietereinheit, PV-Anlage)
 */
import { useState } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { DEMO_WIDGET } from '@/config/designManifest';
import { getActiveWidgetGlow, getSelectionRing } from '@/config/designManifest';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { KontoAkteInline } from '@/components/finanzanalyse/KontoAkteInline';
import { AddBankAccountDialog } from '@/components/shared/AddBankAccountDialog';
import { DEMO_KONTO, DEMO_KONTO_IBAN_MASKED } from '@/constants/demoKontoData';
import { Landmark, ScanSearch, Plus, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const OWNER_TYPE_LABELS: Record<string, string> = {
  person: 'Person',
  property: 'Immobilie',
  pv_plant: 'PV-Anlage',
};

export default function KontenTab() {
  const { activeTenantId } = useAuth();
  const { isEnabled } = useDemoToggles();
  const [openKontoId, setOpenKontoId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: bankAccounts = [], isLoading } = useQuery({
    queryKey: ['msv_bank_accounts', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('msv_bank_accounts')
        .select('*')
        .eq('tenant_id', activeTenantId);
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  // Load owner names for display
  const { data: ownerNames = {} } = useQuery({
    queryKey: ['konten-owner-names', activeTenantId, bankAccounts],
    queryFn: async () => {
      if (!activeTenantId) return {};
      const names: Record<string, string> = {};
      const personIds = bankAccounts.filter((a: any) => a.owner_type === 'person' && a.owner_id).map((a: any) => a.owner_id);
      const propIds = bankAccounts.filter((a: any) => a.owner_type === 'property' && a.owner_id).map((a: any) => a.owner_id);
      const pvIds = bankAccounts.filter((a: any) => a.owner_type === 'pv_plant' && a.owner_id).map((a: any) => a.owner_id);

      if (personIds.length) {
        const { data } = await supabase.from('household_persons').select('id, first_name, last_name').in('id', personIds);
        data?.forEach(p => { names[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim(); });
      }
      if (propIds.length) {
        const { data } = await supabase.from('properties').select('id, name').in('id', propIds);
        data?.forEach((p: any) => { names[p.id] = p.name || 'Immobilie'; });
      }
      if (pvIds.length) {
        const { data } = await supabase.from('pv_plants').select('id, name').in('id', pvIds);
        data?.forEach(p => { names[p.id] = p.name || 'PV-Anlage'; });
      }
      return names;
    },
    enabled: !!activeTenantId && bankAccounts.length > 0,
  });

  const showDemo = isEnabled('GP-KONTEN');
  const maskIban = (iban: string) => iban ? `${iban.slice(0, 9)} ••••` : '—';

  return (
    <PageShell>
      <ModulePageHeader
        title="Konten"
        description="Bankkonten verwalten und zuordnen — Personen, Vermietung oder Photovoltaik"
        actions={
          <Button variant="glass" size="icon-round" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        }
      />

      <WidgetGrid>
        {showDemo && (
          <WidgetCell>
            <div
              className={cn(
                'h-full w-full rounded-xl cursor-pointer transition-all',
                DEMO_WIDGET.CARD, DEMO_WIDGET.HOVER,
                openKontoId === DEMO_KONTO.id && 'ring-2 ring-primary/50',
              )}
              onClick={(e) => { e.stopPropagation(); setOpenKontoId(openKontoId === DEMO_KONTO.id ? null : DEMO_KONTO.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpenKontoId(openKontoId === DEMO_KONTO.id ? null : DEMO_KONTO.id); }}}
              role="button"
              tabIndex={0}
            >
              <div className="p-5 flex flex-col justify-between h-full">
                <div>
                  <Badge className={DEMO_WIDGET.BADGE + ' mb-2'}>Demo</Badge>
                  <h4 className="font-semibold text-sm">Demo: Girokonto Sparkasse</h4>
                  <p className="text-xs text-muted-foreground mt-1">{DEMO_KONTO_IBAN_MASKED}</p>
                  <Badge variant="outline" className="mt-2 text-[10px]">Vermietung</Badge>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(DEMO_KONTO.balance)}</p>
                </div>
              </div>
            </div>
          </WidgetCell>
        )}

        {bankAccounts.map((acc: any) => (
          <WidgetCell key={acc.id}>
            <div
              className={cn(
                'h-full w-full rounded-xl cursor-pointer transition-all hover:shadow-lg',
                getActiveWidgetGlow('rose'),
                openKontoId === acc.id && getSelectionRing('rose'),
              )}
              onClick={(e) => { e.stopPropagation(); setOpenKontoId(openKontoId === acc.id ? null : acc.id); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setOpenKontoId(openKontoId === acc.id ? null : acc.id); }}}
              role="button"
              tabIndex={0}
            >
              <div className="p-5 flex flex-col justify-between h-full">
                <div>
                  <h4 className="font-semibold text-sm">{acc.account_name || acc.bank_name || 'Konto'}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{maskIban(acc.iban || '')}</p>
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{acc.account_type || 'Giro'}</Badge>
                    {acc.owner_type && (
                      <Badge variant="secondary" className="text-[10px]">
                        {OWNER_TYPE_LABELS[acc.owner_type] || acc.owner_type}
                        {acc.owner_id && ownerNames[acc.owner_id] ? `: ${ownerNames[acc.owner_id]}` : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={acc.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                    {acc.status === 'active' ? 'Verbunden' : 'Inaktiv'}
                  </Badge>
                </div>
              </div>
            </div>
          </WidgetCell>
        ))}

        <WidgetCell>
          <div
            className="h-full w-full rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            role="button"
            tabIndex={0}
            onClick={() => setShowAddDialog(true)}
          >
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Konto hinzufügen</p>
            </div>
          </div>
        </WidgetCell>
      </WidgetGrid>

      {openKontoId === DEMO_KONTO.id && (
        <KontoAkteInline isDemo onClose={() => setOpenKontoId(null)} />
      )}
      {openKontoId && openKontoId !== DEMO_KONTO.id && (
        <KontoAkteInline
          isDemo={false}
          account={bankAccounts.find((a: any) => a.id === openKontoId)}
          onClose={() => setOpenKontoId(null)}
        />
      )}

      <Card className="glass-card mt-4">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ScanSearch className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Umsätze auslesen & Verträge erkennen</p>
              <p className="text-sm text-muted-foreground">
                Scannt die letzten 12 Monate Ihrer Kontoumsätze und identifiziert wiederkehrende Zahlungen als potenzielle Abonnements, Versicherungen oder Vorsorgeverträge.
              </p>
            </div>
            <Button variant="outline" disabled>
              <ScanSearch className="h-4 w-4 mr-2" />
              Scan starten
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddBankAccountDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </PageShell>
  );
}
