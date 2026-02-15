/**
 * NKAbrechnungTab — 5-Sektionen Inline-Flow (immer sichtbar)
 * 
 * Sektion 1: Eingehende WEG-Abrechnung (editierbar, Template-basiert)
 * Sektion 2: Grundsteuerbescheid (editierbar)
 * Sektion 3: Mieteinnahmen & Vorauszahlungen (read-only)
 * Sektion 4: Berechnung & Saldo
 * Sektion 5: Export & Versand
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Loader2, CheckCircle2, AlertTriangle, FileDown, FolderOpen,
  Calculator, Send, Save, FileText, Home, User, Calendar, Info, Banknote, Lock
} from 'lucide-react';
import { useNKAbrechnung } from '@/hooks/useNKAbrechnung';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface NKAbrechnungTabProps {
  propertyId: string;
  tenantId: string;
  unitId: string;
}

const currentYear = new Date().getFullYear();
const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

const EUR = (v: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v);

const KEY_LABELS: Record<string, string> = {
  area_sqm: 'Fläche (m²)',
  mea: 'MEA',
  persons: 'Personen',
  consumption: 'Verbrauch',
  unit_count: 'Einheiten',
  custom: 'Individuell',
};

export function NKAbrechnungTab({ propertyId, tenantId, unitId }: NKAbrechnungTabProps) {
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const {
    readiness,
    settlement,
    leaseInfo,
    costItems,
    grundsteuerTotal,
    grundsteuerAnteil,
    isLoadingReadiness,
    isLoadingData,
    isCalculating,
    isSaving,
    isSavingPayments,
    rentPayments,
    isLoadingPayments,
    paymentsLocked,
    fetchRentPayments,
    updateRentPayment,
    saveRentPayments,
    lockPayments,
    calculate,
    exportPdf,
    updateCostItem,
    saveCostItems,
    saveGrundsteuer,
    setGrundsteuerTotal,
    setGrundsteuerAnteil,
  } = useNKAbrechnung(propertyId, tenantId, unitId, Number(selectedYear));

  const wegItems = costItems.filter(i => i.categoryCode !== 'grundsteuer');
  const apportionableItems = wegItems.filter(i => i.isApportionable);
  const nonApportionableItems = wegItems.filter(i => !i.isApportionable);

  const sumApportionable = apportionableItems.reduce((s, i) => s + i.amountUnit, 0);
  const sumNonApportionable = nonApportionableItems.reduce((s, i) => s + i.amountUnit, 0);

  // Vorauszahlungen berechnen (12 Monate oder anteilig)
  const months = 12; // TODO: anteilig bei unterjaehrig
  const totalNKVZ = (leaseInfo?.nkAdvanceEur || 0) * months;
  const totalVZ = totalNKVZ;

  const totalCostsTenant = sumApportionable + grundsteuerAnteil;
  const saldo = totalCostsTenant - totalVZ;

  const wegDocStatus = readiness?.documents.find(d => d.docType === 'WEG_JAHRESABRECHNUNG');
  const gsDocStatus = readiness?.documents.find(d => d.docType === 'GRUNDSTEUER_BESCHEID');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Nebenkostenabrechnung</h2>
          <p className="text-sm text-muted-foreground">
            Inline-Prozess: WEG-Abrechnung → Grundsteuer → Mieteinnahmen → Berechnung → Export
          </p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Info-Banner statt Blocker (nicht blockierend) */}
      {readiness && readiness.blockers.length > 0 && !isLoadingReadiness && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <span className="text-sm">
              <strong>Hinweis:</strong> {readiness.blockers.join(' · ')} — Das Formular ist trotzdem editierbar.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {(isLoadingReadiness || isLoadingData) && (
        <div className="flex items-center gap-2 py-4 justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Daten werden geladen...</span>
        </div>
      )}

      {/* ═══ SEKTION 1: EINGEHENDE WEG-ABRECHNUNG ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold">1</div>
            <div>
              <CardTitle className="text-base">Eingehende WEG-Abrechnung</CardTitle>
              <CardDescription>Hausgeldeinzelabrechnung — alle Positionen gemäß BetrKV §2</CardDescription>
            </div>
          </div>
          {wegDocStatus && (
            <div className="flex items-center gap-2 mt-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">WEG-Jahresabrechnung {selectedYear}</span>
              {wegDocStatus.status === 'accepted' ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <Badge variant="secondary" className="text-xs">
                {wegDocStatus.status === 'accepted' ? 'akzeptiert' : wegDocStatus.status === 'missing' ? 'ausstehend' : 'prüfen'}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Umlagefähige Kosten */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Umlagefähige Kosten
              </h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-2 px-3 font-medium text-xs w-[35%]">Kostenart</th>
                      <th className="text-left py-2 px-3 font-medium text-xs w-[20%]">Schlüssel</th>
                      <th className="text-right py-2 px-3 font-medium text-xs w-[22%]">Haus gesamt</th>
                      <th className="text-right py-2 px-3 font-medium text-xs w-[23%]">Ihr Anteil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apportionableItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-1.5 px-3">{item.labelDisplay}</td>
                        <td className="py-1.5 px-3 text-muted-foreground text-xs">
                          {KEY_LABELS[item.keyType] || item.keyType}
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amountTotalHouse}
                            onChange={(e) => updateCostItem(item.id, 'amountTotalHouse', Number(e.target.value))}
                            className="h-7 w-28 text-right font-mono text-xs ml-auto"
                          />
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amountUnit}
                            onChange={(e) => updateCostItem(item.id, 'amountUnit', Number(e.target.value))}
                            className="h-7 w-28 text-right font-mono text-xs ml-auto"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 border-t">
                      <td colSpan={3} className="py-2 px-3 font-medium text-sm">Summe umlagefähig</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">{EUR(sumApportionable)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Nicht umlagefähige Kosten */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Nicht umlagefähige Kosten (zur Information)
              </h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {nonApportionableItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-0 bg-muted/20">
                        <td className="py-1.5 px-3 w-[35%] text-muted-foreground">{item.labelDisplay}</td>
                        <td className="py-1.5 px-3 w-[20%] text-muted-foreground text-xs">
                          {KEY_LABELS[item.keyType] || item.keyType}
                        </td>
                        <td className="py-1.5 px-3 text-right w-[22%]">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amountTotalHouse}
                            onChange={(e) => updateCostItem(item.id, 'amountTotalHouse', Number(e.target.value))}
                            className="h-7 w-28 text-right font-mono text-xs ml-auto"
                          />
                        </td>
                        <td className="py-1.5 px-3 text-right w-[23%]">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.amountUnit}
                            onChange={(e) => updateCostItem(item.id, 'amountUnit', Number(e.target.value))}
                            className="h-7 w-28 text-right font-mono text-xs ml-auto"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 border-t">
                      <td colSpan={3} className="py-2 px-3 font-medium text-sm text-muted-foreground">
                        Summe nicht umlagefähig
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                        {EUR(sumNonApportionable)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={saveCostItems} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Speichern
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ SEKTION 2: GRUNDSTEUERBESCHEID ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold">2</div>
            <div>
              <CardTitle className="text-base">Grundsteuerbescheid</CardTitle>
              <CardDescription>Direktzahlung des Eigentümers — vollständig umlagefähig</CardDescription>
            </div>
          </div>
          {gsDocStatus && (
            <div className="flex items-center gap-2 mt-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Grundsteuerbescheid</span>
              {gsDocStatus.status === 'accepted' ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <Badge variant="secondary" className="text-xs">
                {gsDocStatus.status === 'accepted' ? 'akzeptiert' : gsDocStatus.status === 'missing' ? 'ausstehend' : 'prüfen'}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Jährlicher Betrag (Haus gesamt)</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  step="0.01"
                  value={grundsteuerTotal}
                  onChange={(e) => setGrundsteuerTotal(Number(e.target.value))}
                  className="h-9 font-mono"
                />
                <span className="text-sm text-muted-foreground">EUR</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Verteilerschlüssel</label>
              <div className="flex items-center h-9 mt-1 px-3 rounded-md border bg-muted/40 text-sm">
                MEA
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Ihr Anteil (berechnet)</label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  step="0.01"
                  value={grundsteuerAnteil}
                  onChange={(e) => setGrundsteuerAnteil(Number(e.target.value))}
                  className="h-9 font-mono"
                />
                <span className="text-sm text-muted-foreground">EUR</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button size="sm" onClick={saveGrundsteuer} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Speichern
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══ SEKTION 3: MIETEINNAHMEN & VORAUSZAHLUNGEN ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold">3</div>
            <div>
              <CardTitle className="text-base">Mieteinnahmen & Vorauszahlungen</CardTitle>
              <CardDescription>Kumuliert aus Mietvertrag / Geldeingang</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leaseInfo ? (
            <div className="space-y-4">
              {/* Mietvertragsdaten */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mieter</p>
                    <p className="text-sm font-medium">{leaseInfo.tenantName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mietvertrag seit</p>
                    <p className="text-sm font-medium">
                      {new Date(leaseInfo.startDate).toLocaleDateString('de-DE')}
                      {!leaseInfo.endDate && ' (laufend)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Kaltmiete</p>
                    <p className="text-sm font-medium">{EUR(leaseInfo.rentColdEur)} / Monat</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Warmmiete</p>
                  <p className="text-sm font-medium">
                    {EUR(leaseInfo.rentColdEur + leaseInfo.nkAdvanceEur)} / Monat
                  </p>
                </div>
              </div>

              <Separator />

              {/* Vorauszahlungen-Tabelle */}
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-2 px-3 font-medium text-xs">Position</th>
                      <th className="text-right py-2 px-3 font-medium text-xs">Monatlich</th>
                      <th className="text-center py-2 px-3 font-medium text-xs">Monate</th>
                      <th className="text-right py-2 px-3 font-medium text-xs">Jahressumme</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-1.5 px-3">NK-Vorauszahlung</td>
                      <td className="py-1.5 px-3 text-right font-mono">{EUR(leaseInfo.nkAdvanceEur)}</td>
                      <td className="py-1.5 px-3 text-center text-muted-foreground">× {months}</td>
                      <td className="py-1.5 px-3 text-right font-mono font-medium">{EUR(totalNKVZ)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 border-t">
                      <td colSpan={3} className="py-2 px-3 font-semibold">Gesamt Vorauszahlungen {selectedYear}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{EUR(totalVZ)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <Separator />

               {/* Kontenauslesung Button */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRentPayments}
                  disabled={isLoadingPayments}
                >
                  {isLoadingPayments ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Banknote className="h-4 w-4 mr-2" />
                  )}
                  Kontenauslesung beauftragen
                </Button>
                {rentPayments.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {rentPayments.length} Zahlungseingänge geladen
                  </span>
                )}
                {paymentsLocked && (
                  <Badge className="bg-emerald-600 text-white border-0">
                    <Lock className="h-3 w-3 mr-1" />
                    Festgeschrieben
                  </Badge>
                )}
              </div>

              {/* Einzelzahlungstabelle — editierbar */}
              {rentPayments.length > 0 && (
                <div className="space-y-3">
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-2 px-3 font-medium text-xs">Monat</th>
                          <th className="text-right py-2 px-3 font-medium text-xs">Soll</th>
                          <th className="text-right py-2 px-3 font-medium text-xs">Ist</th>
                          <th className="text-left py-2 px-3 font-medium text-xs">Eingangsdatum</th>
                          <th className="text-left py-2 px-3 font-medium text-xs">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rentPayments.map((p, idx) => (
                          <tr key={p.id} className="border-b last:border-0">
                            <td className="py-1.5 px-3">
                              {new Date(p.dueDate).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono">{EUR(p.expectedAmount)}</td>
                            <td className="py-1.5 px-3 text-right">
                              {paymentsLocked ? (
                                <span className="font-mono">{EUR(p.amount)}</span>
                              ) : (
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={p.amount}
                                  onChange={(e) => updateRentPayment(idx, 'amount', Number(e.target.value))}
                                  className="h-7 w-28 text-right font-mono text-xs ml-auto"
                                />
                              )}
                            </td>
                            <td className="py-1.5 px-3">
                              {paymentsLocked ? (
                                <span className="text-muted-foreground">
                                  {p.paidDate ? new Date(p.paidDate).toLocaleDateString('de-DE') : '—'}
                                </span>
                              ) : (
                                <Input
                                  type="date"
                                  value={p.paidDate || ''}
                                  onChange={(e) => updateRentPayment(idx, 'paidDate', e.target.value || null)}
                                  className="h-7 w-36 text-xs"
                                />
                              )}
                            </td>
                            <td className="py-1.5 px-3">
                              <StatusBadge status={
                                p.status === 'paid' ? 'Bezahlt' :
                                p.status === 'partial' ? 'Teilweise' :
                                p.status === 'overdue' ? 'Überfällig' : 'Offen'
                              } variant={
                                p.status === 'paid' ? 'success' :
                                p.status === 'partial' ? 'warning' :
                                p.status === 'overdue' ? 'error' : 'muted'
                              } />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/30 border-t">
                          <td className="py-2 px-3 font-semibold">Summe</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">
                            {EUR(rentPayments.reduce((s, p) => s + p.expectedAmount, 0))}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold">
                            {EUR(rentPayments.reduce((s, p) => s + p.amount, 0))}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Speichern + Festschreiben Buttons */}
                  {!paymentsLocked && (
                    <div className="flex items-center gap-2 justify-end">
                      <Button size="sm" onClick={saveRentPayments} disabled={isSavingPayments}>
                        {isSavingPayments ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                        Zahlungen speichern
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Lock className="h-4 w-4 mr-1" />
                            Festschreiben
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Zahlungen festschreiben?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Nach der Festschreibung können die Zahlungseingänge für {selectedYear} nicht mehr bearbeitet werden. 
                              Bitte stellen Sie sicher, dass alle Beträge und Eingangsdaten korrekt sind.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction onClick={lockPayments}>
                              Endgültig festschreiben
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Kein Mietvertrag für diese Einheit gefunden.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ═══ SEKTION 4: BERECHNUNG & SALDO ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold">4</div>
            <div>
              <CardTitle className="text-base">Berechnung & Saldo</CardTitle>
              <CardDescription>Zusammenführung aller Positionen</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3">Umlagefähige Kosten (WEG)</td>
                  <td className="py-2 px-3 text-right font-mono">{EUR(sumApportionable)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3">+ Grundsteuer (Direktzahlung)</td>
                  <td className="py-2 px-3 text-right font-mono">{EUR(grundsteuerAnteil)}</td>
                </tr>
                <tr className="border-b bg-muted/30">
                  <td className="py-2 px-3 font-semibold">Gesamtkosten Mieter</td>
                  <td className="py-2 px-3 text-right font-mono font-semibold">{EUR(totalCostsTenant)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 text-muted-foreground">./. NK-Vorauszahlungen</td>
                  <td className="py-2 px-3 text-right font-mono text-muted-foreground">- {EUR(totalNKVZ)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50">
                  <td className="py-3 px-3 font-bold text-base">
                    {saldo >= 0 ? '⚠ Nachzahlung Mieter' : '✓ Guthaben Mieter'}
                  </td>
                  <td className={`py-3 px-3 text-right font-mono font-bold text-base ${
                    saldo < 0 ? 'text-emerald-600' : 'text-destructive'
                  }`}>
                    {saldo < 0 ? '- ' : ''}{EUR(Math.abs(saldo))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-center mt-4">
            <Button onClick={calculate} disabled={isCalculating} size="lg">
              {isCalculating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              Berechnung starten (Engine)
            </Button>
          </div>

          {/* Engine-Result anzeigen falls vorhanden */}
          {settlement && (
            <div className="mt-4 p-3 rounded-md bg-muted/30 border">
              <p className="text-xs text-muted-foreground mb-1">Engine-Ergebnis (validiert)</p>
              <div className="flex items-center gap-4 text-sm">
                <span>Umlagefähig: <strong>{EUR(settlement.summary.totalApportionable)}</strong></span>
                <span>Vorauszahlungen: <strong>{EUR(settlement.summary.totalPrepaid)}</strong></span>
                <span className={settlement.summary.balance < 0 ? 'text-emerald-600 font-bold' : 'text-destructive font-bold'}>
                  {settlement.summary.balance >= 0 ? 'Nachzahlung' : 'Guthaben'}: {EUR(Math.abs(settlement.summary.balance))}
                </span>
              </div>
              {settlement.validation.warnings.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠ {settlement.validation.warnings.join(' · ')}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ SEKTION 5: EXPORT & VERSAND ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold">5</div>
            <div>
              <CardTitle className="text-base">Export & Versand</CardTitle>
              <CardDescription>PDF erzeugen, ablegen und versenden</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportPdf} disabled={!settlement}>
              <FileDown className="h-4 w-4 mr-2" />
              PDF erzeugen
            </Button>
            <Button variant="outline" disabled={!settlement}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Im DMS ablegen
            </Button>
            <Button variant="outline" disabled={!settlement}>
              <Send className="h-4 w-4 mr-2" />
              An Briefgenerator
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
