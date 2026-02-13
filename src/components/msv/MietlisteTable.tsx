/**
 * MietlisteTable — Kachel 1: Tabellarische Wohnungsübersicht
 * 
 * 14 Spalten, sticky links, Expand-Panel pro Zeile.
 * IMMER sichtbar — auch ohne Daten (Empty State mit Skeleton).
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { PremiumLockBanner } from './PremiumLockBanner';
import { DESIGN } from '@/config/designManifest';

// Demo-Daten für leere Zustände
const DEMO_UNITS = [
  {
    id: '__demo_1__',
    unitId: 'WE-001',
    ort: 'Düsseldorf',
    strasse: 'Königsallee',
    hausnummer: '42',
    teNr: 'TE-1.OG-L',
    anrede: 'Herr',
    vorname: 'Thomas',
    name: 'Müller',
    email: 't.mueller@email.de',
    mobil: '0171 1234567',
    warmmiete: 1250,
    letzterEingangDatum: '2026-02-03',
    letzterEingangBetrag: 1250,
    status: 'paid' as const,
  },
  {
    id: '__demo_2__',
    unitId: 'WE-002',
    ort: 'Düsseldorf',
    strasse: 'Königsallee',
    hausnummer: '42',
    teNr: 'TE-2.OG-R',
    anrede: 'Frau',
    vorname: 'Anna',
    name: 'Schmidt',
    email: 'a.schmidt@email.de',
    mobil: '0172 9876543',
    warmmiete: 980,
    letzterEingangDatum: '2026-02-05',
    letzterEingangBetrag: 500,
    status: 'partial' as const,
  },
  {
    id: '__demo_3__',
    unitId: 'WE-003',
    ort: 'Düsseldorf',
    strasse: 'Königsallee',
    hausnummer: '42',
    teNr: 'TE-EG-L',
    anrede: '',
    vorname: '',
    name: '',
    email: '',
    mobil: '',
    warmmiete: 0,
    letzterEingangDatum: '',
    letzterEingangBetrag: 0,
    status: 'vacant' as const,
  },
];

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-500/10 text-green-700 dark:text-green-400',
  partial: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  overdue: 'bg-destructive/10 text-destructive',
  vacant: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Bezahlt',
  partial: 'Teilweise',
  overdue: 'Überfällig',
  vacant: 'Leerstehend',
};

function generateMonthHistory(warmmiete: number, status: string) {
  const months = [];
  const now = new Date();
  const startYear = now.getFullYear() - 1;
  
  for (let y = startYear; y <= now.getFullYear(); y++) {
    const maxMonth = y === now.getFullYear() ? now.getMonth() + 1 : 12;
    const startMonth = y === startYear ? 1 : 1;
    for (let m = startMonth; m <= maxMonth; m++) {
      const isCurrentMonth = y === now.getFullYear() && m === now.getMonth() + 1;
      const soll = warmmiete;
      let ist = soll;
      let mStatus = 'paid';
      
      if (isCurrentMonth && status === 'partial') {
        ist = Math.round(soll * 0.5);
        mStatus = 'partial';
      } else if (isCurrentMonth && status === 'overdue') {
        ist = 0;
        mStatus = 'overdue';
      } else if (status === 'vacant') {
        ist = 0;
        mStatus = 'vacant';
      }
      
      months.push({
        label: `${y}-${String(m).padStart(2, '0')}`,
        soll,
        ist,
        datum: ist > 0 ? `${y}-${String(m).padStart(2, '0')}-03` : '',
        differenz: soll - ist,
        status: mStatus,
        notiz: '',
      });
    }
  }
  return months;
}

export function MietlisteTable() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const units = DEMO_UNITS; // TODO: Replace with real data from MOD-04

  const formatCurrency = (v: number) => v > 0 ? `${v.toLocaleString('de-DE')} €` : '–';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Kachel 1: Mietliste</h2>
      </div>

      <Card className={DESIGN.CARD.SECTION}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="sticky left-0 bg-background z-10">Unit-ID</TableHead>
                <TableHead>Ort</TableHead>
                <TableHead>Straße</TableHead>
                <TableHead>HNr</TableHead>
                <TableHead>TE/Einheit</TableHead>
                <TableHead>Anrede</TableHead>
                <TableHead>Vorname</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Mobil</TableHead>
                <TableHead className="text-right">Warmmiete (Soll)</TableHead>
                <TableHead>Letzter Eingang</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8">
                    <p className="text-muted-foreground">Noch keine Mietverhältnisse.</p>
                    <Button variant="link" className="mt-2" onClick={() => window.location.href = '/portal/immobilien/portfolio'}>
                      <Plus className="h-4 w-4 mr-1" /> Lease anlegen in MOD-04
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                units.map(u => (
                  <>
                    <TableRow key={u.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setExpandedRow(expandedRow === u.id ? null : u.id)}>
                      <TableCell>
                        {expandedRow === u.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">{u.unitId}</TableCell>
                      <TableCell>{u.ort}</TableCell>
                      <TableCell>{u.strasse}</TableCell>
                      <TableCell>{u.hausnummer}</TableCell>
                      <TableCell>{u.teNr}</TableCell>
                      <TableCell>{u.anrede || '–'}</TableCell>
                      <TableCell>{u.vorname || '–'}</TableCell>
                      <TableCell>{u.name || '–'}</TableCell>
                      <TableCell className="text-xs">{u.email || '–'}</TableCell>
                      <TableCell className="text-xs">{u.mobil || '–'}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(u.warmmiete)}</TableCell>
                      <TableCell className="text-xs">{u.letzterEingangDatum || '–'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(u.letzterEingangBetrag)}</TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_COLORS[u.status]} border-0 text-xs`}>
                          {STATUS_LABELS[u.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {expandedRow === u.id && (
                      <TableRow key={`${u.id}-expand`}>
                        <TableCell colSpan={15} className="bg-muted/20 p-4">
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Miete & Mieteingänge rückwirkend
                            </h4>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Monat</TableHead>
                                    <TableHead className="text-right">Soll</TableHead>
                                    <TableHead className="text-right">Ist</TableHead>
                                    <TableHead>Datum</TableHead>
                                    <TableHead className="text-right">Differenz</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Notiz</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {generateMonthHistory(u.warmmiete, u.status).map(m => (
                                    <TableRow key={m.label}>
                                      <TableCell className="text-xs font-medium">{m.label}</TableCell>
                                      <TableCell className="text-right text-xs">{formatCurrency(m.soll)}</TableCell>
                                      <TableCell className="text-right text-xs">{formatCurrency(m.ist)}</TableCell>
                                      <TableCell className="text-xs">{m.datum || '–'}</TableCell>
                                      <TableCell className={`text-right text-xs ${m.differenz > 0 ? 'text-destructive' : ''}`}>
                                        {m.differenz > 0 ? formatCurrency(m.differenz) : '–'}
                                      </TableCell>
                                      <TableCell>
                                        <Badge className={`${STATUS_COLORS[m.status] || ''} border-0 text-[10px]`}>
                                          {STATUS_LABELS[m.status] || m.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Input className="h-6 text-xs w-24" placeholder="Notiz…" defaultValue={m.notiz} />
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Premium Lock Banners */}
      <div className="space-y-2">
        <PremiumLockBanner
          title="Automatisches Matching aktivieren"
          description="Premium: automatische Erkennung/Zuordnung von Zahlungen aus Bank/DMS. Ohne Premium können Zahlungen manuell erfasst werden."
        />
        <PremiumLockBanner
          title="PDF-Postauslesung aktivieren"
          description="Premium: automatische Extraktion von Zahlungsdaten aus PDF-Kontoauszügen und Post."
        />
      </div>
    </div>
  );
}
