/**
 * KontoAkteInline — Inline-Detail für Bankkonten (Demo + echte)
 * Sektion 1: Kontodaten + Zuordnung (gruppierter Select)
 * Sektion 2: Kontoanbindung (FinAPI Platzhalter)
 * Sektion 3: Kontobewegungen (mit CSV-Import)
 */
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEMO_WIDGET, RECORD_CARD } from '@/config/designManifest';
import { DEMO_KONTO, DEMO_TRANSACTIONS, type DemoTransaction } from '@/constants/demoKontoData';
import { DEMO_FAMILY, DEMO_PORTFOLIO } from '@/engines/demoData/data';
import { CreditCard, Link2, Link2Off, X, Info, Upload, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TransactionCsvImportDialog } from './TransactionCsvImportDialog';

interface KontoAkteInlineProps {
  isDemo: boolean;
  account?: {
    id: string;
    bank_name?: string;
    account_name?: string;
    iban?: string;
    bic?: string;
    account_holder?: string;
    status?: string;
    category?: string;
    owner_type?: string;
    owner_id?: string;
  };
  onClose: () => void;
}

interface OwnerOption {
  id: string;
  label: string;
  type: 'person' | 'property' | 'pv_plant';
}

const OWNER_TYPE_BADGES: Record<string, string> = {
  person: 'Person',
  property: 'Vermietereinheit',
  pv_plant: 'PV-Anlage',
};

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Encode owner_type + owner_id into a single select value */
function encodeOwnerValue(type: string, id: string) {
  return `${type}::${id}`;
}

function decodeOwnerValue(val: string): { type: string; id: string } {
  const [type, id] = val.split('::');
  return { type: type || '', id: id || '' };
}

export function KontoAkteInline({ isDemo, account, onClose }: KontoAkteInlineProps) {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [ownerType, setOwnerType] = useState(isDemo ? DEMO_KONTO.owner_type : (account?.owner_type || ''));
  const [ownerId, setOwnerId] = useState(isDemo ? DEMO_KONTO.owner_id : (account?.owner_id || ''));
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const kontoData = isDemo
    ? { name: DEMO_KONTO.accountName, iban: DEMO_KONTO.iban, bic: DEMO_KONTO.bic, bank: DEMO_KONTO.bank, holder: DEMO_KONTO.holder, status: 'active' }
    : { name: account?.account_name || '', iban: account?.iban || '', bic: account?.bic || '', bank: account?.bank_name || '', holder: account?.account_holder || '', status: account?.status || 'inactive' };

  // For real accounts: load transactions from DB
  const accountRef = isDemo ? '' : (account?.id || account?.iban || '');

  const { data: dbTransactions = [], refetch: refetchTransactions } = useQuery({
    queryKey: ['bank-transactions', accountRef],
    queryFn: async () => {
      if (!accountRef) return [];
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('account_ref', accountRef)
        .order('booking_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !isDemo && !!accountRef,
  });

  // Map DB transactions to display format
  const displayTransactions: DemoTransaction[] = isDemo
    ? DEMO_TRANSACTIONS
    : dbTransactions.map(t => ({
        date: t.booking_date,
        valuta_date: t.value_date || t.booking_date,
        booking_type: '',
        counterpart_name: t.counterparty || '',
        counterpart_iban: '',
        purpose: t.purpose_text || '',
        amount: Number(t.amount_eur),
        saldo: 0,
      }));

  // Build demo owner options from static data
  const demoOwnerOptions = useMemo<OwnerOption[]>(() => {
    if (!isDemo) return [];
    const persons = DEMO_FAMILY.map(p => ({
      id: p.id,
      label: `${p.firstName} ${p.lastName}`,
      type: 'person' as const,
    }));
    const properties: OwnerOption[] = [{
      id: DEMO_PORTFOLIO.landlordContextId,
      label: 'Mustermann Immobilien',
      type: 'property',
    }];
    const pvPlants: OwnerOption[] = DEMO_PORTFOLIO.pvPlantIds.map((id, i) => ({
      id,
      label: `PV-Anlage ${i + 1}`,
      type: 'pv_plant',
    }));
    return [...persons, ...properties, ...pvPlants];
  }, [isDemo]);

  // Load all owner options for real accounts
  const { data: realOwnerOptions = [] } = useQuery({
    queryKey: ['all-owner-options', activeTenantId],
    queryFn: async (): Promise<OwnerOption[]> => {
      if (!activeTenantId) return [];
      const [personsRes, propsRes, pvRes] = await Promise.all([
        supabase.from('household_persons').select('id, first_name, last_name').eq('tenant_id', activeTenantId),
        supabase.from('properties').select('id, name').eq('tenant_id', activeTenantId),
        supabase.from('pv_plants').select('id, name').eq('tenant_id', activeTenantId),
      ]);
      const persons: OwnerOption[] = (personsRes.data || []).map((p: any) => ({
        id: p.id, label: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Person', type: 'person',
      }));
      const properties: OwnerOption[] = (propsRes.data || []).map((p: any) => ({
        id: p.id, label: p.name || 'Immobilie', type: 'property',
      }));
      const pvPlants: OwnerOption[] = (pvRes.data || []).map((p: any) => ({
        id: p.id, label: p.name || 'PV-Anlage', type: 'pv_plant',
      }));
      return [...persons, ...properties, ...pvPlants];
    },
    enabled: !isDemo && !!activeTenantId,
  });

  const allOptions = isDemo ? demoOwnerOptions : realOwnerOptions;
  const personOptions = allOptions.filter(o => o.type === 'person');
  const propertyOptions = allOptions.filter(o => o.type === 'property');
  const pvOptions = allOptions.filter(o => o.type === 'pv_plant');

  const currentValue = ownerType && ownerId ? encodeOwnerValue(ownerType, ownerId) : '';
  const currentOwnerLabel = allOptions.find(o => o.id === ownerId)?.label;

  const updateOwner = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      if (!account?.id) throw new Error('Kein Konto');
      const { error } = await supabase.from('msv_bank_accounts').update({
        owner_type: type || null,
        owner_id: id || null,
      }).eq('id', account.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Zuordnung gespeichert');
      queryClient.invalidateQueries({ queryKey: ['msv_bank_accounts'] });
    },
    onError: (err) => toast.error('Fehler: ' + err.message),
  });

  const handleOwnerChange = (encoded: string) => {
    const { type, id } = decodeOwnerValue(encoded);
    setOwnerType(type);
    setOwnerId(id);
    if (!isDemo) {
      updateOwner.mutate({ type, id });
    }
  };

  return (
    <Card className={cn('md:col-span-2', isDemo && DEMO_WIDGET.CARD)}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{kontoData.name || 'Konto'}</h3>
              <p className="text-sm text-muted-foreground">{kontoData.bank}</p>
            </div>
            {isDemo && <Badge className={DEMO_WIDGET.BADGE}>Demo</Badge>}
            {ownerType && (
              <Badge variant="secondary" className="text-xs">
                {OWNER_TYPE_BADGES[ownerType] || ownerType}
                {currentOwnerLabel ? `: ${currentOwnerLabel}` : ''}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Phase A: Zuordnungs-Warnung */}
        {!isDemo && !ownerType && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-400 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300">
              Bitte weisen Sie dieses Konto einer Person oder Vermietereinheit zu, damit Umsätze korrekt zugeordnet werden können.
            </p>
          </div>
        )}

        {/* Sektion 1: Kontodaten & Zuordnung */}
        <div>
          <p className={RECORD_CARD.SECTION_TITLE}>Kontodaten & Zuordnung</p>
          <div className={RECORD_CARD.FIELD_GRID}>
            <div>
              <Label className="text-xs">Kontobezeichnung</Label>
              <Input value={kontoData.name} readOnly={isDemo} />
            </div>
            <div>
              <Label className="text-xs">IBAN</Label>
              <Input value={kontoData.iban} readOnly={isDemo} />
            </div>
            <div>
              <Label className="text-xs">BIC</Label>
              <Input value={kontoData.bic} readOnly={isDemo} />
            </div>
            <div>
              <Label className="text-xs">Bank</Label>
              <Input value={kontoData.bank} readOnly={isDemo} />
            </div>
            <div>
              <Label className="text-xs">Kontoinhaber</Label>
              <Input value={kontoData.holder} readOnly={isDemo} />
            </div>
            <div>
              <Label className="text-xs">Zuordnung</Label>
              <Select value={currentValue} onValueChange={handleOwnerChange} disabled={isDemo}>
                <SelectTrigger className={cn(!ownerType && !isDemo && 'border-amber-400 ring-1 ring-amber-400')}><SelectValue placeholder="Zuordnung wählen…" /></SelectTrigger>
                <SelectContent>
                  {personOptions.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Personen</SelectLabel>
                      {personOptions.map(o => (
                        <SelectItem key={o.id} value={encodeOwnerValue('person', o.id)}>{o.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {propertyOptions.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Vermietereinheiten</SelectLabel>
                      {propertyOptions.map(o => (
                        <SelectItem key={o.id} value={encodeOwnerValue('property', o.id)}>{o.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {pvOptions.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>PV-Anlagen</SelectLabel>
                      {pvOptions.map(o => (
                        <SelectItem key={o.id} value={encodeOwnerValue('pv_plant', o.id)}>{o.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {allOptions.length === 0 && (
                    <SelectItem value="__empty__" disabled>Keine Einträge vorhanden</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Sektion 2: Kontoanbindung */}
        <div>
          <p className={RECORD_CARD.SECTION_TITLE}>Kontoanbindung</p>
          <div className="flex items-center gap-4">
            {kontoData.status === 'active' ? (
              <Badge variant="default" className="bg-emerald-600">
                <Link2 className="h-3 w-3 mr-1" /> Verbunden
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Link2Off className="h-3 w-3 mr-1" /> Nicht verbunden
              </Badge>
            )}
            {isDemo ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" /> Dies ist ein Demo-Konto. Kontoanbindung nicht verfügbar.
              </p>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Konto anbinden (FinAPI)
              </Button>
            )}
          </div>
        </div>

        {/* Sektion 3: Kontobewegungen */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className={RECORD_CARD.SECTION_TITLE}>Kontobewegungen</p>
            {!isDemo && (
              <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-1.5" />
                Umsätze importieren
              </Button>
            )}
          </div>
          {displayTransactions.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Datum</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Valuta</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Art</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Auftraggeber / Empfänger</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">IBAN</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Verwendungszweck</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Betrag</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayTransactions.map((t, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{fmtDate(t.date)}</td>
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{fmtDate(t.valuta_date)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{t.booking_type}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{t.counterpart_name}</td>
                        <td className="px-3 py-2 text-muted-foreground font-mono text-xs whitespace-nowrap">{t.counterpart_iban}</td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{t.purpose}</td>
                        <td className={cn('px-3 py-2 text-right font-medium whitespace-nowrap', t.amount >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                          {t.amount >= 0 ? '+' : ''}{fmt(t.amount)}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">{fmt(t.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
              {isDemo
                ? 'Demo-Transaktionen werden angezeigt.'
                : 'Noch keine Umsätze vorhanden. Importieren Sie Umsätze per CSV oder binden Sie das Konto an.'}
            </div>
          )}
        </div>

        {/* Import Dialog */}
        {!isDemo && (
          <TransactionCsvImportDialog
            open={importDialogOpen}
            onOpenChange={setImportDialogOpen}
            accountRef={account?.id || account?.iban || ''}
            onImportComplete={() => refetchTransactions()}
          />
        )}
      </CardContent>
    </Card>
  );
}
