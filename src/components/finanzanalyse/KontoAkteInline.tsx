/**
 * KontoAkteInline — Inline-Detail für Bankkonten (Demo + echte)
 * Sektion 1: Kontodaten + Kategorisierung
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
  };
  onClose: () => void;
}

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function KontoAkteInline({ isDemo, account, onClose }: KontoAkteInlineProps) {
  const [category, setCategory] = useState(isDemo ? DEMO_KONTO.category : (account?.category || 'privat'));

  const kontoData = isDemo
    ? { name: DEMO_KONTO.accountName, iban: DEMO_KONTO.iban, bic: DEMO_KONTO.bic, bank: DEMO_KONTO.bank, holder: DEMO_KONTO.holder, status: 'active' }
    : { name: account?.account_name || '', iban: account?.iban || '', bic: account?.bic || '', bank: account?.bank_name || '', holder: account?.account_holder || '', status: account?.status || 'inactive' };

  const transactions: DemoTransaction[] = isDemo ? DEMO_TRANSACTIONS : [];

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
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Datum</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Buchungstext</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Betrag</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2 text-muted-foreground">{fmtDate(t.date)}</td>
                      <td className="px-4 py-2">{t.text}</td>
                      <td className={cn('px-4 py-2 text-right font-medium', t.amount >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                        {t.amount >= 0 ? '+' : ''}{fmt(t.amount)}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">{fmt(t.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
