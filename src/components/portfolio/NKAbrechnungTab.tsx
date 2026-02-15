/**
 * NKAbrechnungTab — Neuer Tab in der Immobilienakte
 * 
 * Inline-Flow: Datenkontrolle → Kostenmatrix → Export
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertTriangle, Circle, FileDown, FolderOpen, Calculator } from 'lucide-react';
import { useNKAbrechnung } from '@/hooks/useNKAbrechnung';
import { NKReadinessStatus } from '@/engines/nkAbrechnung/spec';

interface NKAbrechnungTabProps {
  propertyId: string;
  tenantId: string;
  unitId: string;
}

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - 1 - i);

export function NKAbrechnungTab({ propertyId, tenantId, unitId }: NKAbrechnungTabProps) {
  const [selectedYear, setSelectedYear] = useState(String(currentYear - 1));
  const {
    readiness,
    settlement,
    isLoadingReadiness,
    isCalculating,
    calculate,
    exportPdf,
  } = useNKAbrechnung(propertyId, tenantId, unitId, Number(selectedYear));

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'needs_review':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground/40" />;
    }
  };

  const StatusBadge = ({ status, required }: { status: string; required: boolean }) => {
    if (status === 'accepted') return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-xs">akzeptiert</Badge>;
    if (status === 'needs_review') return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 text-xs">prüfen</Badge>;
    if (status === 'missing' && !required) return <Badge variant="outline" className="text-xs text-muted-foreground">optional</Badge>;
    if (status === 'missing') return <Badge variant="destructive" className="text-xs">fehlt</Badge>;
    return <Badge variant="outline" className="text-xs">ausstehend</Badge>;
  };

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

  return (
    <div className="space-y-6">
      {/* Header + Jahr-Auswahl */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Nebenkostenabrechnung</h2>
          <p className="text-sm text-muted-foreground">Dokumentenbasierte NK-Abrechnung für Mieter</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* STEP 1: Datenkontrolle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Step 1 — Datenkontrolle
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingReadiness ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Dokumente werden geprüft...</span>
            </div>
          ) : readiness ? (
            <div className="space-y-2">
              {readiness.documents.map((doc) => (
                <div key={doc.docType} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={doc.status} />
                    <span className="text-sm">{doc.label}</span>
                  </div>
                  <StatusBadge status={doc.status} required={doc.required} />
                </div>
              ))}

              {readiness.blockers.length > 0 && (
                <Alert className="mt-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {readiness.blockers.join(' · ')}
                  </AlertDescription>
                </Alert>
              )}

              {readiness.canCalculate && (
                <div className="pt-2">
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                    ✓ Bereit zur Berechnung ({readiness.leaseCount} Mietvertrag/verträge)
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">Keine Daten verfügbar.</p>
          )}
        </CardContent>
      </Card>

      {/* STEP 2: Kostenmatrix */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Step 2 — Kostenmatrix
            </CardTitle>
            <Button
              size="sm"
              onClick={calculate}
              disabled={!readiness?.canCalculate || isCalculating}
            >
              {isCalculating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Calculator className="h-4 w-4 mr-1" />
              )}
              Berechnung starten
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {settlement ? (
            <div className="space-y-4">
              {/* Header-Info */}
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>Mieter: <span className="font-medium text-foreground">{settlement.header.tenantName}</span></p>
                <p>Zeitraum: {settlement.header.daysRatio} Tage ({settlement.header.periodStart} – {settlement.header.periodEnd})</p>
              </div>

              {/* Matrix-Tabelle */}
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-2 px-3 font-medium text-xs">Kostenart</th>
                      <th className="text-left py-2 px-3 font-medium text-xs">Schlüssel</th>
                      <th className="text-right py-2 px-3 font-medium text-xs">Haus gesamt</th>
                      <th className="text-right py-2 px-3 font-medium text-xs">Ihr Anteil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlement.rows
                      .filter((r) => r.isApportionable)
                      .map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1.5 px-3">{row.label}</td>
                          <td className="py-1.5 px-3 text-muted-foreground">{KEY_LABELS[row.keyType] || row.keyType}</td>
                          <td className="py-1.5 px-3 text-right font-mono">{EUR(row.totalHouse)}</td>
                          <td className="py-1.5 px-3 text-right font-mono">{EUR(row.shareUnit)}</td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30">
                      <td colSpan={3} className="py-1.5 px-3 font-medium">Summe umlagefähig</td>
                      <td className="py-1.5 px-3 text-right font-mono font-medium">{EUR(settlement.summary.totalApportionable)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-1.5 px-3 text-muted-foreground">Vorauszahlungen NK</td>
                      <td className="py-1.5 px-3 text-right font-mono">{EUR(settlement.summary.prepaidNK)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-1.5 px-3 text-muted-foreground">Vorauszahlungen Heizung</td>
                      <td className="py-1.5 px-3 text-right font-mono">{EUR(settlement.summary.prepaidHeating)}</td>
                    </tr>
                    <tr className="border-t-2 bg-muted/50">
                      <td colSpan={3} className="py-2 px-3 font-semibold">
                        {settlement.summary.balance >= 0 ? 'Nachzahlung' : 'Guthaben'}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono font-semibold ${
                        settlement.summary.balance < 0 ? 'text-emerald-600' : 'text-destructive'
                      }`}>
                        {EUR(Math.abs(settlement.summary.balance))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Warnungen */}
              {settlement.validation.warnings.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {settlement.validation.warnings.join(' · ')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Starten Sie die Berechnung, um die Kostenmatrix zu sehen.
            </p>
          )}
        </CardContent>
      </Card>

      {/* STEP 3: Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Step 3 — Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportPdf}
              disabled={!settlement}
            >
              <FileDown className="h-4 w-4 mr-1" />
              PDF erzeugen
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!settlement}
            >
              <FolderOpen className="h-4 w-4 mr-1" />
              Im DMS ablegen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
