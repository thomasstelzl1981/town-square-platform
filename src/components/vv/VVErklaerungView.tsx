/**
 * VVErklaerungView — Read-only declaration summary + export (Stage 3)
 */
import { TabularFormWrapper, TabularFormRow, TabularFormSection } from '@/components/shared/TabularFormRow';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { usePdfContentRef } from '@/components/pdf';
import type { VVContextSummary } from '@/engines/vvSteuer/spec';
import { cn } from '@/lib/utils';

function fmt(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface VVErklaerungViewProps {
  summary: VVContextSummary;
}

function exportCSV(summary: VVContextSummary) {
  const rows: string[] = [
    'Objekt;Einnahmen;Werbungskosten;Überschuss/Verlust',
  ];
  for (const p of summary.properties) {
    rows.push(`${p.propertyName};${p.result.totalIncome};${p.result.totalCosts};${p.result.surplus}`);
  }
  rows.push(`GESAMT;${summary.totalIncome};${summary.totalCosts};${summary.totalSurplus}`);

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AnlageV_${summary.contextName}_${summary.taxYear}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function VVErklaerungView({ summary }: VVErklaerungViewProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Anlage V — Entwurf {summary.taxYear}</h3>
          <p className="text-sm text-muted-foreground">{summary.contextName} · StNr: {summary.taxNumber || '—'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(summary)}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* Per-property summary */}
      {summary.properties.map(p => (
        <TabularFormWrapper key={p.propertyId}>
          <TabularFormSection title={p.propertyName} />
          <TabularFormRow label="Einnahmen">
            <span className="text-sm font-medium text-right w-32 inline-block">{fmt(p.result.totalIncome)} €</span>
          </TabularFormRow>
          <TabularFormRow label="  Kaltmiete">
            <span className="text-sm text-right w-32 inline-block">{fmt(p.result.incomeBreakdown.coldRent)} €</span>
          </TabularFormRow>
          <TabularFormRow label="  NK-Umlagen">
            <span className="text-sm text-right w-32 inline-block">{fmt(p.result.incomeBreakdown.nkAdvance)} €</span>
          </TabularFormRow>
          <TabularFormRow label="Werbungskosten">
            <span className="text-sm font-medium text-right w-32 inline-block">{fmt(p.result.totalCosts)} €</span>
          </TabularFormRow>
          <TabularFormRow label="  Finanzierung">
            <span className="text-sm text-right w-32 inline-block">{fmt(p.result.costsBreakdown.financing.subtotal)} €</span>
          </TabularFormRow>
          <TabularFormRow label="  Bewirtschaftung">
            <span className="text-sm text-right w-32 inline-block">{fmt(p.result.costsBreakdown.operating.subtotal)} €</span>
          </TabularFormRow>
          <TabularFormRow label="  AfA">
            <span className="text-sm text-right w-32 inline-block">{fmt(p.result.costsBreakdown.afa.subtotal)} €</span>
          </TabularFormRow>
          <TabularFormRow label="Ergebnis">
            <span className={cn(
              "text-sm font-bold text-right w-32 inline-block",
              p.result.surplus >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
            )}>
              {fmt(p.result.surplus)} €
            </span>
          </TabularFormRow>
        </TabularFormWrapper>
      ))}

      {/* Total */}
      <TabularFormWrapper>
        <TabularFormSection title="Gesamtergebnis" />
        <TabularFormRow label="Einnahmen gesamt">
          <span className="text-sm font-semibold text-right w-32 inline-block">{fmt(summary.totalIncome)} €</span>
        </TabularFormRow>
        <TabularFormRow label="Werbungskosten ges.">
          <span className="text-sm font-semibold text-right w-32 inline-block">{fmt(summary.totalCosts)} €</span>
        </TabularFormRow>
        <TabularFormRow label="Gesamtüberschuss">
          <span className={cn(
            "text-lg font-bold text-right w-32 inline-block",
            summary.totalSurplus >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
          )}>
            {fmt(summary.totalSurplus)} €
          </span>
        </TabularFormRow>
      </TabularFormWrapper>
    </div>
  );
}
