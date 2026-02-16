/**
 * FinanzberichtSection — Strukturierte Vermögensauskunft
 * Sektionen: Personen, Einnahmen/Ausgaben, Vermögen/Verbindlichkeiten, KPIs, Abonnements, Energieverträge, Chart, Verträge, PDF
 */
import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PdfExportFooter } from '@/components/pdf';
import { useFinanzberichtData, type ContractSummary, type SubscriptionsByCategory, type EnergyContract, type PropertyListItem, type LoanListItem } from '@/hooks/useFinanzberichtData';
import { useFinanzanalyseData } from '@/hooks/useFinanzanalyseData';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, TrendingUp, TrendingDown, Wallet, Building2, Shield,
  FileText, ScrollText, CheckCircle2, XCircle, PiggyBank, Landmark,
  CreditCard, HeartPulse, Zap, Repeat, Sun
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { cn } from '@/lib/utils';

function fmt(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

function fmtPct(v: number) {
  return new Intl.NumberFormat('de-DE', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v / 100);
}

const ROLE_LABELS: Record<string, string> = {
  hauptperson: 'Hauptperson', partner: 'Partner/in', kind: 'Kind', weitere: 'Weitere',
};

const ENERGY_LABELS: Record<string, string> = {
  strom: 'Strom', gas: 'Gas', wasser: 'Wasser', fernwaerme: 'Fernwärme',
};

// ─── Sub-Components ──────────────────────────────────────────

function SectionTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
  );
}

function FinanzRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={cn('flex justify-between py-1.5 text-sm', bold && 'font-semibold border-t pt-2 mt-1')}>
      <span className={cn(!bold && 'text-muted-foreground')}>{label}</span>
      <span className={value < 0 ? 'text-destructive' : ''}>{fmt(value)}</span>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function ContractTable({ contracts, emptyLabel }: { contracts: ContractSummary[]; emptyLabel: string }) {
  if (contracts.length === 0) {
    return <p className="text-sm text-muted-foreground italic">{emptyLabel}</p>;
  }
  return (
    <div className="space-y-1">
      {contracts.map(c => (
        <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
          <div>
            <span className="font-medium">{c.type}</span>
            <span className="text-muted-foreground ml-2">· {c.provider}</span>
            {c.contractNo && <span className="text-muted-foreground text-xs ml-2">({c.contractNo})</span>}
          </div>
          <span className="font-medium tabular-nums">{fmt(c.monthlyAmount)}/mtl.</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function FinanzberichtSection() {
  const contentRef = useRef<HTMLDivElement>(null);
  const data = useFinanzberichtData();
  const { persons } = useFinanzanalyseData();

  if (data.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const { income, expenses, assets, liabilities, projection } = data;

  return (
    <div className="space-y-6 mt-10">
      <Separator />
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Finanzbericht</h2>
          <p className="text-sm text-muted-foreground">Strukturierte Vermögensauskunft</p>
        </div>
      </div>

      <div ref={contentRef} className="space-y-8">
        {/* ═══ SEKTION 1: Personen ═══ */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <SectionTitle icon={Users} title="Personen im Haushalt" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {persons.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-sm font-bold">
                    {(p.first_name?.[0] || '') + (p.last_name?.[0] || '')}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABELS[p.role] || p.role}
                      {p.birth_date && ` · ${new Date(p.birth_date).toLocaleDateString('de-DE')}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ═══ SEKTION 2: Einnahmen / Ausgaben (Privat) ═══ */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <SectionTitle icon={Wallet} title="Einnahmen- und Ausgabenaufstellung (Privat)" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Einnahmen */}
              <div>
                <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Einnahmen
                </h4>
                <FinanzRow label="Nettoeinkommen" value={income.netIncomeTotal} />
                {income.selfEmployedIncome > 0 && <FinanzRow label="Selbstständige Tätigkeit" value={income.selfEmployedIncome} />}
                {income.rentalIncomePortfolio > 0 && <FinanzRow label="Vermietung & Verpachtung" value={income.rentalIncomePortfolio} />}
                {income.pvIncome > 0 && <FinanzRow label="Einkünfte aus Photovoltaik" value={income.pvIncome} />}
                {income.sideJobIncome > 0 && <FinanzRow label="Nebentätigkeit" value={income.sideJobIncome} />}
                {income.childBenefit > 0 && <FinanzRow label="Kindergeld" value={income.childBenefit} />}
                {income.otherIncome > 0 && <FinanzRow label="Sonstige Einkünfte" value={income.otherIncome} />}
                <FinanzRow label="Summe Einnahmen" value={income.totalIncome} bold />
              </div>
              {/* Ausgaben */}
              <div>
                <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" /> Ausgaben
                </h4>
                {expenses.warmRent > 0 && <FinanzRow label="Warmmiete" value={expenses.warmRent} />}
                {expenses.portfolioLoans > 0 && <FinanzRow label="Immobiliendarlehen" value={expenses.portfolioLoans} />}
                {expenses.privateLoans > 0 && <FinanzRow label="Private Darlehen" value={expenses.privateLoans} />}
                {expenses.pvLoans > 0 && <FinanzRow label="PV-Darlehen" value={expenses.pvLoans} />}
                {expenses.insurancePremiums > 0 && <FinanzRow label="Versicherungsprämien" value={expenses.insurancePremiums} />}
                {expenses.savingsContracts > 0 && <FinanzRow label="Sparverträge" value={expenses.savingsContracts} />}
                {expenses.subscriptions > 0 && <FinanzRow label="Abonnements" value={expenses.subscriptions} />}
                {expenses.livingExpenses > 0 && <FinanzRow label="Lebenshaltungskosten" value={expenses.livingExpenses} />}
                <FinanzRow label="Summe Ausgaben" value={expenses.totalExpenses} bold />
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Verfügbares Einkommen (Liquidität)</p>
                <p className="text-xs text-muted-foreground">Anteil am Gesamteinkommen: {fmtPct(data.liquidityPercent)}</p>
              </div>
              <p className={cn('text-xl font-bold', (income.totalIncome - expenses.totalExpenses) >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                {fmt(income.totalIncome - expenses.totalExpenses)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ═══ SEKTION 3: Vermögen / Verbindlichkeiten ═══ */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <SectionTitle icon={Building2} title="Vermögenshintergrund & Verbindlichkeiten" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Vermögen</h4>
                {assets.propertyValue > 0 && <FinanzRow label="Immobilienportfolio" value={assets.propertyValue} />}
                {assets.homeValue > 0 && <FinanzRow label="Eigengenutzte Immobilie" value={assets.homeValue} />}
                {assets.bankSavings > 0 && <FinanzRow label="Bank- & Sparguthaben" value={assets.bankSavings} />}
                {assets.securities > 0 && <FinanzRow label="Wertpapiere" value={assets.securities} />}
                {assets.surrenderValues > 0 && <FinanzRow label="Rückkaufswerte (LV)" value={assets.surrenderValues} />}
                <FinanzRow label="Gesamtvermögen" value={assets.totalAssets} bold />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-destructive mb-2">Verbindlichkeiten</h4>
                {liabilities.portfolioDebt > 0 && <FinanzRow label="Portfolio-Darlehen" value={liabilities.portfolioDebt} />}
                {liabilities.homeDebt > 0 && <FinanzRow label="Zuhause-Darlehen" value={liabilities.homeDebt} />}
                {liabilities.pvDebt > 0 && <FinanzRow label="PV-Darlehen" value={liabilities.pvDebt} />}
                {liabilities.otherDebt > 0 && <FinanzRow label="Sonstige Verbindlichkeiten" value={liabilities.otherDebt} />}
                <FinanzRow label="Gesamtverbindlichkeiten" value={liabilities.totalLiabilities} bold />
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <p className="font-semibold">Nettovermögen</p>
              <p className={cn('text-xl font-bold', data.netWealth >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                {fmt(data.netWealth)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ═══ SEKTION 3b: Immobilienaufstellung ═══ */}
        {data.propertyList.length > 0 && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <SectionTitle icon={Building2} title="Immobilienaufstellung" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 font-medium">Bezeichnung</th>
                      <th className="text-left py-2 font-medium">Stadt</th>
                      <th className="text-left py-2 font-medium">Typ</th>
                      <th className="text-right py-2 font-medium">Marktwert</th>
                      <th className="text-right py-2 font-medium">Kaufpreis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.propertyList.map(p => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="py-2 font-medium">{p.label}</td>
                        <td className="py-2 text-muted-foreground">{p.city}</td>
                        <td className="py-2">
                          <Badge variant={p.type === 'Eigengenutzt' ? 'secondary' : 'outline'} className="text-[10px]">{p.type}</Badge>
                        </td>
                        <td className="py-2 text-right tabular-nums">{fmt(p.marketValue)}</td>
                        <td className="py-2 text-right tabular-nums">{p.purchasePrice > 0 ? fmt(p.purchasePrice) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold border-t">
                      <td className="py-2" colSpan={3}>Gesamt</td>
                      <td className="py-2 text-right tabular-nums">{fmt(data.propertyList.reduce((s, p) => s + p.marketValue, 0))}</td>
                      <td className="py-2 text-right tabular-nums">{fmt(data.propertyList.reduce((s, p) => s + p.purchasePrice, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ SEKTION 3c: Darlehensaufstellung ═══ */}
        {data.loanList.length > 0 && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <SectionTitle icon={Landmark} title="Darlehensaufstellung" />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-2 font-medium">Bank</th>
                      <th className="text-left py-2 font-medium">Zuordnung</th>
                      <th className="text-right py-2 font-medium">Darlehenssumme</th>
                      <th className="text-right py-2 font-medium">Restschuld</th>
                      <th className="text-right py-2 font-medium">Zins %</th>
                      <th className="text-right py-2 font-medium">Rate/mtl.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.loanList.map(l => (
                      <tr key={l.id} className="border-b border-border/50">
                        <td className="py-2 font-medium">{l.bank}</td>
                        <td className="py-2 text-muted-foreground">{l.assignment}</td>
                        <td className="py-2 text-right tabular-nums">{l.loanAmount > 0 ? fmt(l.loanAmount) : '—'}</td>
                        <td className="py-2 text-right tabular-nums">{fmt(l.remainingBalance)}</td>
                        <td className="py-2 text-right tabular-nums">{l.interestRate > 0 ? `${l.interestRate.toFixed(2)} %` : '—'}</td>
                        <td className="py-2 text-right tabular-nums">{fmt(l.monthlyRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold border-t">
                      <td className="py-2" colSpan={2}>Gesamt</td>
                      <td className="py-2 text-right tabular-nums">{fmt(data.loanList.reduce((s, l) => s + l.loanAmount, 0))}</td>
                      <td className="py-2 text-right tabular-nums">{fmt(data.loanList.reduce((s, l) => s + l.remainingBalance, 0))}</td>
                      <td className="py-2"></td>
                      <td className="py-2 text-right tabular-nums">{fmt(data.loanList.reduce((s, l) => s + l.monthlyRate, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}


        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard icon={CreditCard} label="Mtl. Tilgung" value={fmt(data.monthlyAmortization)} />
          <KpiCard icon={PiggyBank} label="Mtl. Sparleistung" value={fmt(data.monthlySavings)} />
          <KpiCard icon={Building2} label="Gesamtvermögen" value={fmt(assets.totalAssets)} />
          <KpiCard icon={Landmark} label="Verbindlichkeiten" value={fmt(liabilities.totalLiabilities)} />
          <KpiCard icon={TrendingUp} label="Nettovermögen" value={fmt(data.netWealth)} sub={`Liquiditätsquote: ${fmtPct(data.liquidityPercent)}`} />
        </div>

        {/* ═══ SEKTION 5: Abonnements (kategorisiert) ═══ */}
        {data.subscriptionsByCategory.length > 0 && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <SectionTitle icon={Repeat} title="Abonnements" />
              <div className="space-y-4">
                {data.subscriptionsByCategory.map(cat => (
                  <div key={cat.category}>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">{cat.label}</h4>
                    <div className="space-y-1">
                      {cat.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.merchant}</span>
                            <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                              {item.status === 'active' ? 'Aktiv' : item.status}
                            </Badge>
                          </div>
                          <span className="font-medium tabular-nums">{fmt(item.amount)}/mtl.</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-1 mt-1 border-t">
                      <span>Zwischensumme</span>
                      <span>{fmt(cat.subtotal)}/mtl.</span>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Gesamt Abonnements</span>
                  <span>{fmt(expenses.subscriptions)}/mtl.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ SEKTION 6: Energieverträge ═══ */}
        {data.energyContracts.length > 0 && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <SectionTitle icon={Zap} title="Energieverträge" />
              <div className="space-y-1">
                {data.energyContracts.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-[10px] min-w-[60px] justify-center">
                        {ENERGY_LABELS[c.category] || c.category}
                      </Badge>
                      <div>
                        <span className="font-medium">{c.providerName}</span>
                        {c.contractNumber && <span className="text-muted-foreground text-xs ml-2">({c.contractNumber})</span>}
                      </div>
                    </div>
                    <span className="font-medium tabular-nums">{fmt(c.monthlyCost)}/mtl.</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 mt-2 border-t">
                <span>Gesamt Energie</span>
                <span>{fmt(data.energyContracts.reduce((s, c) => s + c.monthlyCost, 0))}/mtl.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ SEKTION 7: Vermögensentwicklung (Chart) ═══ */}
        {projection.length > 0 && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <SectionTitle icon={TrendingUp} title="Vermögensentwicklung (40 Jahre)" />
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projection} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} interval={4} />
                    <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} width={55} />
                    <Tooltip
                      formatter={(v: number) => fmt(v)}
                      labelFormatter={(l) => `Jahr ${l}`}
                      contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="propertyValue" name="Immobilienwert" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="cumulativeSavings" name="Kum. Sparleistung" stackId="1" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%)" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="remainingDebt" name="Restschuld" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="netWealth" name="Nettovermögen" stroke="hsl(45, 93%, 47%)" fill="hsl(45, 93%, 47%)" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ SEKTION 8: Vertragsübersicht ═══ */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-6">
            <SectionTitle icon={Shield} title="Vertragsübersicht" />

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><PiggyBank className="h-4 w-4 text-primary" /> Sparverträge</h4>
              <ContractTable contracts={data.savingsContracts} emptyLabel="Keine Sparverträge erfasst" />
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Versicherungsverträge</h4>
              <ContractTable contracts={data.insuranceContracts} emptyLabel="Keine Versicherungsverträge erfasst" />
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Landmark className="h-4 w-4 text-primary" /> Darlehensverträge</h4>
              <ContractTable contracts={data.loanContracts} emptyLabel="Keine Darlehensverträge erfasst" />
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><HeartPulse className="h-4 w-4 text-primary" /> Vorsorgeverträge</h4>
              <ContractTable contracts={data.vorsorgeContracts} emptyLabel="Keine Vorsorgeverträge erfasst" />
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><ScrollText className="h-4 w-4 text-primary" /> Vorsorgedokumente</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50">
                  {data.testamentCompleted
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    : <XCircle className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium">Testament</p>
                    <p className="text-xs text-muted-foreground">{data.testamentCompleted ? 'Vorhanden' : 'Nicht erstellt'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border/50">
                  {data.patientenverfuegungCompleted
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    : <XCircle className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium">Patientenverfügung</p>
                    <p className="text-xs text-muted-foreground">{data.patientenverfuegungCompleted ? 'Vorhanden' : 'Nicht erstellt'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══ SEKTION 9: PDF-Export ═══ */}
        <PdfExportFooter
          contentRef={contentRef}
          documentTitle={`Vermögensauskunft ${new Date().toLocaleDateString('de-DE')}`}
          moduleName="Finanzanalyse"
          subtitle="Strukturierter Gesamtbericht"
        />
      </div>
    </div>
  );
}
