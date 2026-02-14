/**
 * BWAControllingSection — Kachel 3: BWA / Buchwert / Controlling
 * 
 * Full-width, Querformat-Look. Nutzt useMSVData für echte DB-Anbindung.
 * Inline-editierbare Immobilienliste + BWA-Schema mit DB-Persistenz.
 */
import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, Calculator, Sparkles } from 'lucide-react';
import { PremiumLockBanner } from './PremiumLockBanner';
import { BWA_KATEGORIEN } from '@/manifests/bwaKontenplan';
import { DESIGN } from '@/config/designManifest';
import { toast } from 'sonner';
import { useMSVData } from '@/hooks/useMSVData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  isDemo?: boolean;
}

const DEMO_BOOK_VALUES: BookValueRow[] = [
  {
    id: '__bv_1__', objektId: 'OBJ-001', unitId: 'WE-001', adresse: 'Königsallee 42, Düsseldorf',
    nutzungsart: 'Wohnraum', akGrund: 120000, akGebaeude: 280000, akNebenkosten: 15000,
    afaSatz: 2, afaBeginn: '2018-01-01', kumulierteAfa: 44800, buchwert: 370200,
    darlehenId: 'DAR-001', restschuld: 195000, zins: 1.8, estimateStatus: 'confirmed', dirty: false, isDemo: true,
  },
  {
    id: '__bv_2__', objektId: 'OBJ-001', unitId: 'WE-002', adresse: 'Königsallee 42, Düsseldorf',
    nutzungsart: 'Wohnraum', akGrund: 100000, akGebaeude: 220000, akNebenkosten: 12000,
    afaSatz: 2, afaBeginn: '2020-06-01', kumulierteAfa: 24640, buchwert: 307360,
    darlehenId: 'DAR-002', restschuld: 180000, zins: 2.1, estimateStatus: 'estimated', dirty: false, isDemo: true,
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

interface BWAControllingSectionProps {
  propertyId?: string | null;
}

export function BWAControllingSection({ propertyId }: BWAControllingSectionProps) {
  const [stichtag, setStichtag] = useState(`${new Date().getFullYear()}-01-01`);
  const [rows, setRows] = useState<BookValueRow[]>([]);
  const [bwaEntries, setBwaEntries] = useState<Record<string, number>>({});
  const { bookValues, bwaEntries: dbBwaEntries, showDemo } = useMSVData();
  const { activeTenantId } = useAuth();

  // Map DB book values to rows, with demo fallback
  useEffect(() => {
    if (propertyId === '__demo_obj_1__' || (showDemo && !propertyId)) {
      setRows(DEMO_BOOK_VALUES);
      return;
    }

    const filtered = bookValues.filter(bv => !propertyId || bv.property_id === propertyId);
    if (filtered.length === 0 && showDemo) {
      setRows(DEMO_BOOK_VALUES);
      return;
    }

    const mapped: BookValueRow[] = filtered.map(bv => ({
      id: bv.id,
      objektId: bv.property_id || '',
      unitId: bv.unit_id || '',
      adresse: '',
      nutzungsart: (bv as any).usage_type || 'Wohnraum',
      akGrund: (bv as any).ak_grund || 0,
      akGebaeude: (bv as any).ak_gebaeude || 0,
      akNebenkosten: (bv as any).ak_nebenkosten || 0,
      afaSatz: (bv as any).afa_satz || 2,
      afaBeginn: (bv as any).afa_beginn || '2020-01-01',
      kumulierteAfa: (bv as any).kumulierte_afa || 0,
      buchwert: (bv as any).buchwert || 0,
      darlehenId: (bv as any).darlehen_id || '',
      restschuld: (bv as any).restschuld || 0,
      zins: (bv as any).zins || 0,
      estimateStatus: bv.book_value_status === 'estimated' ? 'estimated' : 'confirmed',
      dirty: false,
    }));
    setRows(mapped);
  }, [bookValues, propertyId, showDemo]);

  // Load BWA entries from DB
  useEffect(() => {
    const filtered = dbBwaEntries.filter(e => !propertyId || e.property_id === propertyId);
    const entries: Record<string, number> = {};
    filtered.forEach(e => {
      if (e.bwa_category) {
        entries[e.bwa_category] = (entries[e.bwa_category] || 0) + (e.amount || 0);
      }
    });
    setBwaEntries(entries);
  }, [dbBwaEntries, propertyId]);

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

  const confirmEstimate = async (id: string) => {
    if (id.startsWith('__')) {
      setRows(prev => prev.map(r => r.id === id ? { ...r, estimateStatus: 'confirmed' as const } : r));
      toast.success('Demo: Buchwert bestätigt.');
      return;
    }

    const { error } = await supabase
      .from('msv_book_values')
      .update({ book_value_status: 'confirmed' })
      .eq('id', id);

    if (error) {
      toast.error(`Fehler: ${error.message}`);
      return;
    }

    setRows(prev => prev.map(r => r.id === id ? { ...r, estimateStatus: 'confirmed' as const } : r));
    toast.success('Buchwert bestätigt.');
  };

  const saveBwaEntry = async (categoryId: string, amount: number) => {
    if (!activeTenantId || !propertyId || propertyId.startsWith('__')) return;

    const now = new Date();
    const { error } = await supabase.from('msv_bwa_entries').upsert({
      tenant_id: activeTenantId,
      property_id: propertyId,
      bwa_category: categoryId,
      amount,
      period_month: now.getMonth() + 1,
      period_year: now.getFullYear(),
    }, { onConflict: 'tenant_id,property_id,bwa_category,period_month,period_year' });

    if (error) toast.error(`BWA Fehler: ${error.message}`);
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
                    {propertyId ? 'Keine Buchwerte für dieses Objekt.' : 'Bitte ein Objekt oben auswählen.'}
                  </TableCell>
                </TableRow>
              ) : (
                recalculatedRows.map(r => (
                  <TableRow key={r.id} className={r.dirty ? 'bg-yellow-500/5' : ''}>
                    <TableCell className="font-medium text-xs">{r.objektId}</TableCell>
                    <TableCell className="text-xs">{r.unitId}</TableCell>
                    <TableCell className="text-xs">{r.adresse}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{r.nutzungsart}</Badge></TableCell>
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
                          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-0 text-xs">
                            <Sparkles className="h-2.5 w-2.5 mr-0.5" /> KI-Schätzung
                          </Badge>
                          <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => confirmEstimate(r.id)}>
                            <CheckCircle className="h-3 w-3 mr-0.5" /> Bestätigen
                          </Button>
                        </div>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-0 text-xs">
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
                      <p className="text-xs text-muted-foreground">{kat.beschreibung}</p>
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
                      onChange={e => {
                        const val = Number(e.target.value);
                        setBwaEntries(prev => ({ ...prev, [kat.id]: val }));
                        saveBwaEntry(kat.id, val);
                      }}
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