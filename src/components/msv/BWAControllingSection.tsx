/**
 * BWAControllingSection — Kachel 3: BWA / Buchwert / Controlling
 * 
 * Full-width, Querformat-Look. Inline-editierbare Immobilienliste + BWA-Schema.
 * IMMER sichtbar — auch ohne Daten (Excel-Template).
 */
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, Calculator, Sparkles } from 'lucide-react';
import { PremiumLockBanner } from './PremiumLockBanner';
import { BWA_KATEGORIEN } from '@/manifests/bwaKontenplan';
import { DESIGN } from '@/config/designManifest';
import { toast } from 'sonner';

interface BookValueRow {
  id: string;
  objektId: string;
  unitId: string;
  adresse: string;
  nutzungsart: string;
  akGrund: number;
  akGebaeude: number;
  akNebenkosten: number;
  afaSatz: number;
  afaBeginn: string;
  kumulierteAfa: number;
  buchwert: number;
  darlehenId: string;
  restschuld: number;
  zins: number;
  estimateStatus: 'estimated' | 'confirmed';
  dirty: boolean;
}

const DEMO_BOOK_VALUES: BookValueRow[] = [
  {
    id: '__bv_1__',
    objektId: 'OBJ-001',
    unitId: 'WE-001',
    adresse: 'Königsallee 42, Düsseldorf',
    nutzungsart: 'Wohnraum',
    akGrund: 120000,
    akGebaeude: 280000,
    akNebenkosten: 15000,
    afaSatz: 2,
    afaBeginn: '2018-01-01',
    kumulierteAfa: 44800,
    buchwert: 370200,
    darlehenId: 'DAR-001',
    restschuld: 195000,
    zins: 1.8,
    estimateStatus: 'confirmed',
    dirty: false,
  },
  {
    id: '__bv_2__',
    objektId: 'OBJ-001',
    unitId: 'WE-002',
    adresse: 'Königsallee 42, Düsseldorf',
    nutzungsart: 'Wohnraum',
    akGrund: 100000,
    akGebaeude: 220000,
    akNebenkosten: 12000,
    afaSatz: 2,
    afaBeginn: '2020-06-01',
    kumulierteAfa: 24640,
    buchwert: 307360,
    darlehenId: 'DAR-002',
    restschuld: 180000,
    zins: 2.1,
    estimateStatus: 'estimated',
    dirty: false,
  },
];

function calcBookValue(row: BookValueRow, stichtag: Date): { kumulierteAfa: number; buchwert: number } {
  const afaBegin = new Date(row.afaBeginn);
  const years = Math.max(0, stichtag.getFullYear() - afaBegin.getFullYear());
  const annualAfa = row.akGebaeude * (row.afaSatz / 100);
  const kumulierteAfa = years * annualAfa;
  const buchwert = row.akGrund + row.akGebaeude + row.akNebenkosten - kumulierteAfa;
  return { kumulierteAfa: Math.round(kumulierteAfa), buchwert: Math.round(buchwert) };
}

const formatCurr = (v: number) => v > 0 ? `${v.toLocaleString('de-DE')} €` : '–';

export function BWAControllingSection() {
  const [stichtag, setStichtag] = useState(`${new Date().getFullYear()}-01-01`);
  const [rows, setRows] = useState<BookValueRow[]>(DEMO_BOOK_VALUES);
  const [bwaEntries, setBwaEntries] = useState<Record<string, number>>({});

  const stichtagDate = useMemo(() => new Date(stichtag), [stichtag]);

  const recalculatedRows = useMemo(() => {
    return rows.map(r => {
      const { kumulierteAfa, buchwert } = calcBookValue(r, stichtagDate);
      return { ...r, kumulierteAfa, buchwert };
    });
  }, [rows, stichtagDate]);

  const hasUnconfirmed = recalculatedRows.some(r => r.estimateStatus === 'estimated');

  const handleConfirmStichtag = () => {
    if (hasUnconfirmed) {
      toast.warning('Es gibt unbestätigte KI-Schätzungen. Bitte zuerst alle bestätigen.');
      return;
    }
    toast.success(`Stichtag ${stichtag} bestätigt.`);
  };

  const confirmEstimate = (id: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, estimateStatus: 'confirmed' as const } : r));
    toast.success('Buchwert bestätigt.');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Kachel 3: BWA / Buchwert / Controlling</h2>
      </div>

      {/* A: Immobilienliste (full-width) */}
      <Card className={`${DESIGN.CARD.SECTION} overflow-hidden`}>
        <div className="px-4 py-2.5 border-b border-border/30 bg-muted/20 flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Immobilienliste (Buchwert/AfA)
          </h3>
          <div className="flex items-center gap-2">
            <Input type="date" value={stichtag} onChange={e => setStichtag(e.target.value)} className="h-8 w-40 text-xs" />
            <Button size="sm" variant="outline" onClick={handleConfirmStichtag}>
              Stichtag bestätigen
            </Button>
          </div>
        </div>

        {hasUnconfirmed && (
          <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {recalculatedRows.filter(r => r.estimateStatus === 'estimated').length} unbestätigte KI-Schätzung(en) vorhanden
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objekt-ID</TableHead>
                <TableHead>Unit-ID</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Nutzungsart</TableHead>
                <TableHead className="text-right">AK Grund</TableHead>
                <TableHead className="text-right">AK Gebäude</TableHead>
                <TableHead className="text-right">AK NK</TableHead>
                <TableHead className="text-right">AfA %</TableHead>
                <TableHead>AfA-Beginn</TableHead>
                <TableHead className="text-right">Kum. AfA</TableHead>
                <TableHead className="text-right">Buchwert</TableHead>
                <TableHead>Darlehen</TableHead>
                <TableHead className="text-right">Restschuld</TableHead>
                <TableHead className="text-right">Zins %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recalculatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                    Buchwerte können manuell gepflegt oder geschätzt werden.
                  </TableCell>
                </TableRow>
              ) : (
                recalculatedRows.map(r => (
                  <TableRow key={r.id} className={r.dirty ? 'bg-yellow-500/5' : ''}>
                    <TableCell className="font-medium text-xs">{r.objektId}</TableCell>
                    <TableCell className="text-xs">{r.unitId}</TableCell>
                    <TableCell className="text-xs">{r.adresse}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{r.nutzungsart}</Badge></TableCell>
                    <TableCell className="text-right text-xs">{formatCurr(r.akGrund)}</TableCell>
                    <TableCell className="text-right text-xs">{formatCurr(r.akGebaeude)}</TableCell>
                    <TableCell className="text-right text-xs">{formatCurr(r.akNebenkosten)}</TableCell>
                    <TableCell className="text-right text-xs">{r.afaSatz}%</TableCell>
                    <TableCell className="text-xs">{r.afaBeginn}</TableCell>
                    <TableCell className="text-right text-xs">{formatCurr(r.kumulierteAfa)}</TableCell>
                    <TableCell className={`text-right text-xs font-semibold ${r.estimateStatus === 'estimated' ? 'text-yellow-600' : ''}`}>
                      {formatCurr(r.buchwert)}
                    </TableCell>
                    <TableCell className="text-xs">{r.darlehenId || '–'}</TableCell>
                    <TableCell className="text-right text-xs">{formatCurr(r.restschuld)}</TableCell>
                    <TableCell className="text-right text-xs">{r.zins > 0 ? `${r.zins}%` : '–'}</TableCell>
                    <TableCell>
                      {r.estimateStatus === 'estimated' ? (
                        <div className="flex items-center gap-1">
                          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-0 text-[10px]">
                            <Sparkles className="h-2.5 w-2.5 mr-0.5" /> KI-Schätzung
                          </Badge>
                          <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => confirmEstimate(r.id)}>
                            <CheckCircle className="h-3 w-3 mr-0.5" /> Bestätigen
                          </Button>
                        </div>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-0 text-[10px]">
                          <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Bestätigt
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* B: BWA-Schema */}
      <Card className={`${DESIGN.CARD.SECTION} overflow-hidden`}>
        <div className="px-4 py-2.5 border-b border-border/30 bg-muted/20">
          <h3 className="text-sm font-semibold">BWA-Schema (SKR04 Basis)</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Code</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Konten</TableHead>
                <TableHead className="text-right w-32">Betrag (EUR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {BWA_KATEGORIEN.map(kat => (
                <TableRow key={kat.id}>
                  <TableCell className="font-medium text-xs">{kat.code}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{kat.name}</p>
                      <p className="text-[10px] text-muted-foreground">{kat.beschreibung}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {kat.konten.map(k => k.nummer).join(', ')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      className="h-7 w-28 text-xs text-right ml-auto"
                      placeholder="0,00"
                      value={bwaEntries[kat.id] || ''}
                      onChange={e => setBwaEntries(prev => ({ ...prev, [kat.id]: Number(e.target.value) }))}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {/* Ergebnis */}
              <TableRow className="font-bold border-t-2 border-border">
                <TableCell></TableCell>
                <TableCell>Ergebnis</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right text-sm">
                  {formatCurr(Object.values(bwaEntries).reduce((a, b) => a + b, 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      <PremiumLockBanner
        title="Auto-BWA-Aggregation"
        description="Premium: Automatische Zuordnung von Buchungen und Transaktionen zu BWA-Positionen."
      />
    </div>
  );
}
