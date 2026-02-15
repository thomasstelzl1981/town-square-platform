/**
 * DepotSteuerReport — Tax summary card for depot (demo)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DEMO_TAX_REPORT } from '@/hooks/useDemoDepot';
import { FileText, Download } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const fmt = (v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

export function DepotSteuerReport() {
  const t = DEMO_TAX_REPORT;
  const rows = [
    { label: 'Kapitalerträge', value: t.capitalGains },
    { label: 'Freistellungsauftrag (genutzt)', value: t.genutzt },
    { label: 'Abgeltungsteuer (25%)', value: -t.abgeltungsteuer },
    { label: 'Solidaritätszuschlag', value: -t.soli },
    { label: 'Kirchensteuer', value: -t.kirchensteuer },
  ];

  return (
    <Card className="glass-card">
      <div className="px-4 py-3 border-b border-border/30 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <p className="text-base font-semibold">Steuer-Report {t.year}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 h-7" onClick={() => toast({ title: 'Demo-Modus', description: 'Der Report-Download ist in der Demo nicht verfügbar.' })}>
          <Download className="h-3.5 w-3.5" /> PDF
        </Button>
      </div>
      <CardContent className="py-4">
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
              <span className="text-sm text-muted-foreground">{r.label}</span>
              <span className={`text-sm font-medium ${r.value < 0 ? 'text-red-400' : ''}`}>{fmt(r.value)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
          <span className="text-sm font-semibold">Netto-Ertrag nach Steuern</span>
          <span className="text-sm font-bold text-emerald-500">
            {fmt(t.capitalGains - t.abgeltungsteuer - t.soli - t.kirchensteuer)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
