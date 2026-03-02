/**
 * TLC Section: Portfolio-Report + CSV-Export
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { useTenancyReport } from '@/hooks/useTenancyReport';

interface Props {
  propertyId: string;
}

export function TLCReportSection({ propertyId }: Props) {
  const { report, isLoading, exportCSV } = useTenancyReport(propertyId);

  const handleExport = () => {
    if (!report) return;
    exportCSV([
      { Kennzahl: 'Aktive Mietverträge', Wert: report.activeLeases },
      { Kennzahl: 'Leerstehende Einheiten', Wert: report.vacantUnits },
      { Kennzahl: 'Gesamtmiete (kalt, €/Monat)', Wert: report.totalMonthlyRent.toFixed(2) },
      { Kennzahl: 'Belegungsquote (%)', Wert: report.occupancyRate.toFixed(1) },
      { Kennzahl: 'Offene Tasks', Wert: report.openTasks },
      { Kennzahl: 'Kritische Events (30T)', Wert: report.criticalEvents },
    ], `portfolio-report-${propertyId.slice(0, 8)}`);
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : report ? (
        <>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-muted/40 rounded p-2 text-center"><p className="text-muted-foreground">Aktive Verträge</p><p className="font-semibold text-lg">{report.activeLeases}</p></div>
            <div className="bg-muted/40 rounded p-2 text-center"><p className="text-muted-foreground">Leerstand</p><p className="font-semibold text-lg">{report.vacantUnits}</p></div>
            <div className="bg-muted/40 rounded p-2 text-center"><p className="text-muted-foreground">Belegung</p><p className="font-semibold text-lg">{report.occupancyRate.toFixed(1)}%</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/40 rounded p-2"><p className="text-muted-foreground">Kaltmiete gesamt</p><p className="font-semibold">{report.totalMonthlyRent.toFixed(0)} €/Monat</p></div>
            <div className="bg-muted/40 rounded p-2"><p className="text-muted-foreground">Ø Miete / Vertrag</p><p className="font-semibold">{report.activeLeases > 0 ? (report.totalMonthlyRent / report.activeLeases).toFixed(0) : 0} €</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/40 rounded p-2 flex items-center gap-2">
              <span className="text-muted-foreground">Offene Tasks</span>
              <Badge variant={report.openTasks > 0 ? 'destructive' : 'secondary'} className="text-[10px]">{report.openTasks}</Badge>
            </div>
            <div className="bg-muted/40 rounded p-2 flex items-center gap-2">
              <span className="text-muted-foreground">Krit. Events</span>
              <Badge variant={report.criticalEvents > 0 ? 'destructive' : 'secondary'} className="text-[10px]">{report.criticalEvents}</Badge>
            </div>
          </div>
          <Button size="sm" className="h-7 text-xs w-full" variant="outline" onClick={handleExport}>
            <Download className="mr-1 h-3 w-3" />CSV-Export
          </Button>
        </>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">Keine Daten verfügbar</p>
      )}
    </div>
  );
}
