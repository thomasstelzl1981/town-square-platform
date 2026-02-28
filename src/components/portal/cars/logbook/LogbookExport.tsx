/**
 * LogbookExport — PDF & CSV export (Tab E)
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import { getJsPDF } from '@/lib/lazyJspdf';
import { toast } from 'sonner';

interface Props { logbookId: string; }

const classLabels: Record<string, string> = {
  business: 'Geschäftlich', private: 'Privat', commute: 'Arbeitsweg', unclassified: 'Offen',
};

export function LogbookExport({ logbookId }: Props) {
  const months = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(new Date(), i);
      return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy', { locale: de }) };
    }),
  []);

  const [selectedMonth, setSelectedMonth] = useState(months[0].value);
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);

  const monthStart = startOfMonth(new Date(selectedMonth + '-01')).toISOString();
  const monthEnd = endOfMonth(new Date(selectedMonth + '-01')).toISOString();

  const { data: trips = [] } = useQuery({
    queryKey: ['cars-export-trips', logbookId, selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars_trips')
        .select('id, start_at, end_at, start_address, end_address, distance_km, classification, purpose, business_partner')
        .eq('logbook_id', logbookId)
        .gte('start_at', monthStart)
        .lte('start_at', monthEnd)
        .order('start_at');
      if (error) throw error;
      return data || [];
    },
  });

  const totalKm = trips.reduce((s: number, t: any) => s + (t.distance_km || 0), 0);
  const businessKm = trips.filter((t: any) => t.classification === 'business').reduce((s: number, t: any) => s + (t.distance_km || 0), 0);
  const privateKm = trips.filter((t: any) => t.classification === 'private').reduce((s: number, t: any) => s + (t.distance_km || 0), 0);

  async function exportPdf() {
    setExporting('pdf');
    try {
      const jsPDF = await getJsPDF();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      doc.setFontSize(16);
      doc.text(`Fahrtenbuch — ${months.find(m => m.value === selectedMonth)?.label}`, 14, 20);

      doc.setFontSize(9);
      doc.text(`Gesamt: ${totalKm.toFixed(1)} km | Geschäftlich: ${businessKm.toFixed(1)} km | Privat: ${privateKm.toFixed(1)} km`, 14, 28);

      let y = 36;
      // Header
      doc.setFontSize(7);
      doc.setFont(undefined!, 'bold');
      ['Datum', 'Start', 'Ziel', 'km', 'Typ', 'Zweck', 'Partner'].forEach((h, i) => {
        doc.text(h, 14 + [0, 25, 75, 125, 140, 165, 220][i], y);
      });
      doc.setFont(undefined!, 'normal');
      y += 5;

      for (const trip of trips) {
        if (y > 190) { doc.addPage(); y = 20; }
        const row = [
          format(new Date(trip.start_at), 'dd.MM.yy HH:mm'),
          (trip.start_address || '—').substring(0, 30),
          (trip.end_address || '—').substring(0, 30),
          (trip.distance_km || 0).toFixed(1),
          classLabels[trip.classification] || trip.classification,
          (trip.purpose || '').substring(0, 30),
          (trip.business_partner || '').substring(0, 25),
        ];
        row.forEach((v, i) => doc.text(v, 14 + [0, 25, 75, 125, 140, 165, 220][i], y));
        y += 4;
      }

      doc.save(`Fahrtenbuch_${selectedMonth}.pdf`);
      toast.success('PDF exportiert');
    } catch (e) {
      toast.error('PDF-Export fehlgeschlagen');
    } finally {
      setExporting(null);
    }
  }

  function exportCsv() {
    setExporting('csv');
    try {
      const header = 'Datum;Start;Ziel;Distanz (km);Klassifizierung;Zweck;Geschäftspartner\n';
      const rows = trips.map((t: any) =>
        [
          format(new Date(t.start_at), 'dd.MM.yyyy HH:mm'),
          t.start_address || '',
          t.end_address || '',
          (t.distance_km || 0).toFixed(1).replace('.', ','),
          classLabels[t.classification] || t.classification,
          t.purpose || '',
          t.business_partner || '',
        ].join(';')
      ).join('\n');

      const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fahrtenbuch_${selectedMonth}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exportiert');
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Month picker + summary */}
      <div className="flex items-center justify-between">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground">
          {trips.length} Fahrten · {totalKm.toFixed(1)} km gesamt
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Gesamt" value={`${totalKm.toFixed(1)} km`} />
        <SummaryCard label="Geschäftlich" value={`${businessKm.toFixed(1)} km`} accent />
        <SummaryCard label="Privat" value={`${privateKm.toFixed(1)} km`} />
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-2 h-9" onClick={exportPdf} disabled={exporting !== null || trips.length === 0}>
          {exporting === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
          PDF exportieren
        </Button>
        <Button variant="outline" className="flex-1 gap-2 h-9" onClick={exportCsv} disabled={exporting !== null || trips.length === 0}>
          {exporting === 'csv' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
          CSV exportieren
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border text-center ${accent ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/50'}`}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold mt-0.5 ${accent ? 'text-primary' : ''}`}>{value}</div>
    </div>
  );
}
