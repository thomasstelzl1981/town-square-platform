/**
 * ResearchDemoResultsTable — Static demo results table (extracted from ResearchTab)
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { TABLE } from '@/config/designManifest';
import { cn } from '@/lib/utils';

const DEMO_RESULTS = [
  { firma: 'Hausverwaltung Meier GmbH', kategorie: 'Hausverwaltung', kontakt: 'Thomas Meier', rolle: 'Geschäftsführer', email: 't.meier@hv-meier.de', telefon: '0211-4478900', stadt: 'Düsseldorf', plz: '40210', web: 'hv-meier.de', score: 92, status: 'Validiert', duplikat: false },
  { firma: 'Rheinische Immobilien Service AG', kategorie: 'Hausverwaltung', kontakt: 'Sabine Krause', rolle: 'Vorstand', email: 's.krause@ris-ag.de', telefon: '0221-5567800', stadt: 'Köln', plz: '50667', web: 'ris-ag.de', score: 88, status: 'Validiert', duplikat: false },
  { firma: 'WEG-Profis Verwaltung GmbH', kategorie: 'WEG-Verwaltung', kontakt: 'Michael Braun', rolle: 'Geschäftsführer', email: 'm.braun@weg-profis.de', telefon: '0201-8834500', stadt: 'Essen', plz: '45127', web: 'weg-profis.de', score: 85, status: 'Validiert', duplikat: true },
  { firma: 'Westfalen Hausverwaltung', kategorie: 'Hausverwaltung', kontakt: 'Petra Schmidt', rolle: 'Prokuristin', email: 'p.schmidt@whv-ms.de', telefon: '0251-7790123', stadt: 'Münster', plz: '48143', web: 'whv-ms.de', score: 82, status: 'Validiert', duplikat: false },
  { firma: 'ProHaus Management GmbH', kategorie: 'Facility Management', kontakt: 'Jörg Hansen', rolle: 'Geschäftsführer', email: 'j.hansen@prohaus.de', telefon: '0231-4456700', stadt: 'Dortmund', plz: '44135', web: 'prohaus.de', score: 79, status: 'Prüfung', duplikat: false },
  { firma: 'Niederrhein Verwaltung GmbH', kategorie: 'Hausverwaltung', kontakt: 'Anna Weber', rolle: 'Geschäftsführerin', email: 'a.weber@nrv-gmbh.de', telefon: '0203-5589012', stadt: 'Duisburg', plz: '47051', web: 'nrv-gmbh.de', score: 76, status: 'Validiert', duplikat: false },
  { firma: 'Bergisch Immo GmbH & Co. KG', kategorie: 'Hausverwaltung', kontakt: 'Klaus Richter', rolle: 'Geschäftsführer', email: 'k.richter@bergisch-immo.de', telefon: '0202-3345600', stadt: 'Wuppertal', plz: '42103', web: 'bergisch-immo.de', score: 73, status: 'Prüfung', duplikat: true },
  { firma: 'Capital Wohnen Verwaltung AG', kategorie: 'Hausverwaltung', kontakt: 'Sandra Lange', rolle: 'Vorstand', email: 's.lange@capital-wohnen.de', telefon: '0228-6679800', stadt: 'Bonn', plz: '53111', web: 'capital-wohnen.de', score: 70, status: 'Validiert', duplikat: false },
];

export function ResearchDemoResultsTable() {
  return (
    <div className={TABLE.WRAPPER}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <h3 className="text-sm font-semibold">Ergebnisse (8 von 37 angezeigt)</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled className="text-xs">
            <Download className="h-3 w-3 mr-1" />
            Excel-Export
          </Button>
          <Button size="sm" variant="outline" disabled className="text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Ins Kontaktbuch
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className={TABLE.HEADER_BG}>
              <th className={TABLE.HEADER_CELL}>Firma</th>
              <th className={TABLE.HEADER_CELL}>Kategorie</th>
              <th className={TABLE.HEADER_CELL}>Kontakt</th>
              <th className={TABLE.HEADER_CELL}>Rolle</th>
              <th className={TABLE.HEADER_CELL}>E-Mail</th>
              <th className={TABLE.HEADER_CELL}>Telefon</th>
              <th className={TABLE.HEADER_CELL}>Stadt</th>
              <th className={TABLE.HEADER_CELL}>PLZ</th>
              <th className={TABLE.HEADER_CELL}>Web</th>
              <th className={TABLE.HEADER_CELL}>Score</th>
              <th className={TABLE.HEADER_CELL}>Status</th>
              <th className={TABLE.HEADER_CELL}>Import</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_RESULTS.map((r, i) => (
              <tr key={i} className={cn(TABLE.ROW_HOVER, TABLE.ROW_BORDER)}>
                <td className={cn(TABLE.BODY_CELL, 'font-medium whitespace-nowrap')}>{r.firma}</td>
                <td className={TABLE.BODY_CELL}>{r.kategorie}</td>
                <td className={TABLE.BODY_CELL}>{r.kontakt}</td>
                <td className={TABLE.BODY_CELL}>{r.rolle}</td>
                <td className={cn(TABLE.BODY_CELL, 'text-primary')}>{r.email}</td>
                <td className={cn(TABLE.BODY_CELL, 'whitespace-nowrap')}>{r.telefon}</td>
                <td className={TABLE.BODY_CELL}>{r.stadt}</td>
                <td className={TABLE.BODY_CELL}>{r.plz}</td>
                <td className={cn(TABLE.BODY_CELL, 'text-primary')}>{r.web}</td>
                <td className={TABLE.BODY_CELL}>
                  <Badge variant={r.score >= 80 ? 'default' : 'secondary'} className="text-[10px]">{r.score}</Badge>
                </td>
                <td className={TABLE.BODY_CELL}>
                  <Badge variant={r.status === 'Validiert' ? 'outline' : 'secondary'} className="text-[10px]">{r.status}</Badge>
                </td>
                <td className={TABLE.BODY_CELL}>
                  <Badge variant={r.duplikat ? 'destructive' : 'default'} className="text-[10px]">{r.duplikat ? 'DUPLIKAT' : 'NEU'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
