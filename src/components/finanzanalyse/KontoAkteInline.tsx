/**
 * KontoAkteInline — Inline-Detail für Bankkonten (Demo + echte)
 * Sektion 1: Kontodaten + Kategorisierung + Zuordnung
 * Sektion 2: Kontoanbindung (FinAPI Platzhalter)
 * Sektion 3: Kontobewegungen
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEMO_WIDGET, RECORD_CARD } from '@/config/designManifest';
import { DEMO_KONTO, DEMO_TRANSACTIONS, KONTO_CATEGORIES, type DemoTransaction } from '@/constants/demoKontoData';
import { CreditCard, Link2, Link2Off, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const OWNER_TYPES = [
  { value: 'person', label: 'Person im Haushalt' },
  { value: 'property', label: 'Immobilie (Vermietung)' },
  { value: 'pv_plant', label: 'Photovoltaik-Anlage' },
];

const OWNER_TYPE_BADGES: Record<string, string> = {
  person: 'Person',
  property: 'Immobilie',
  pv_plant: 'PV-Anlage',
};

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function KontoAkteInline({ isDemo, account, onClose }: KontoAkteInlineProps) {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(isDemo ? DEMO_KONTO.category : (account?.category || 'privat'));
  const [ownerType, setOwnerType] = useState(account?.owner_type || '');
  const [ownerId, setOwnerId] = useState(account?.owner_id || '');

  const kontoData = isDemo
    ? { name: DEMO_KONTO.accountName, iban: DEMO_KONTO.iban, bic: DEMO_KONTO.bic, bank: DEMO_KONTO.bank, holder: DEMO_KONTO.holder, status: 'active' }
    : { name: account?.account_name || '', iban: account?.iban || '', bic: account?.bic || '', bank: account?.bank_name || '', holder: account?.account_holder || '', status: account?.status || 'inactive' };

  const transactions: DemoTransaction[] = isDemo ? DEMO_TRANSACTIONS : [];

  // Load owner options
  const { data: ownerOptions = [] } = useQuery({
    queryKey: ['owner-options', activeTenantId, ownerType],
    queryFn: async () => {
      if (!activeTenantId || !ownerType) return [];
      if (ownerType === 'person') {
        const { data } = await supabase.from('household_persons').select('id, first_name, last_name').eq('tenant_id', activeTenantId);
        return (data || []).map((p: any) => ({ id: p.id, label: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Person' }));
      }
      if (ownerType === 'property') {
        const { data } = await supabase.from('properties').select('id, name').eq('tenant_id', activeTenantId);
        return (data || []).map((p: any) => ({ id: p.id, label: p.name || 'Immobilie' }));
      }
      if (ownerType === 'pv_plant') {
        const { data } = await supabase.from('pv_plants').select('id, name').eq('tenant_id', activeTenantId);
        return (data || []).map((p: any) => ({ id: p.id, label: p.name || 'PV-Anlage' }));
      }
      return [];
    },
    enabled: !isDemo && !!activeTenantId && !!ownerType,
  });

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

  const handleOwnerTypeChange = (type: string) => {
    setOwnerType(type);
    setOwnerId('');
  };

  const handleOwnerIdChange = (id: string) => {
    setOwnerId(id);
    updateOwner.mutate({ type: ownerType, id });
  };

  // Get current owner name
  const currentOwnerName = ownerOptions.find((o: any) => o.id === ownerId)?.label;

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
            {!isDemo && ownerType && (
              <Badge variant="secondary" className="text-xs">
                {OWNER_TYPE_BADGES[ownerType] || ownerType}
                {currentOwnerName ? `: ${currentOwnerName}` : ''}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sektion 1: Kontodaten & Kategorisierung */}
        <div>
          <p className={RECORD_CARD.SECTION_TITLE}>Kontodaten & Kategorisierung</p>
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
              <Label className="text-xs">Kategorie</Label>
              <Select value={category} onValueChange={setCategory} disabled={isDemo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KONTO_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Sektion 1b: Zuordnung */}
        {!isDemo && (
          <div>
            <p className={RECORD_CARD.SECTION_TITLE}>Zuordnung</p>
            <div className={RECORD_CARD.FIELD_GRID}>
              <div>
                <Label className="text-xs">Zuordnungstyp</Label>
                <Select value={ownerType} onValueChange={handleOwnerTypeChange}>
                  <SelectTrigger><SelectValue placeholder="Zuordnung wählen…" /></SelectTrigger>
                  <SelectContent>
                    {OWNER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {ownerType && ownerOptions.length > 0 && (
                <div>
                  <Label className="text-xs">Inhaber</Label>
                  <Select value={ownerId} onValueChange={handleOwnerIdChange}>
                    <SelectTrigger><SelectValue placeholder="Bitte wählen…" /></SelectTrigger>
                    <SelectContent>
                      {ownerOptions.map((o: any) => (
                        <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {ownerType && ownerOptions.length === 0 && (
                <p className="text-xs text-muted-foreground col-span-2">
                  Keine Einträge vorhanden. Bitte zuerst anlegen.
                </p>
              )}
            </div>
          </div>
        )}

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
          <p className={RECORD_CARD.SECTION_TITLE}>Kontobewegungen</p>
          {transactions.length > 0 ? (
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
                    {transactions.map((t, i) => (
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
              Transaktionen werden nach Kontoanbindung geladen.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
