/**
 * MietlisteTable — Kachel 1: Tabellarische Wohnungsübersicht
 * 
 * 14 Spalten, sticky links, Expand-Panel pro Zeile.
 * Nutzt useMSVData für echte DB-Anbindung + Demo-Fallback.
 */
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight, Plus, Euro } from 'lucide-react';
import { PremiumLockBanner } from './PremiumLockBanner';
import { PaymentBookingDialog } from './PaymentBookingDialog';
import { DESIGN } from '@/config/designManifest';
import { useMSVData } from '@/hooks/useMSVData';

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-500/10 text-green-700 dark:text-green-400',
  partial: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  overdue: 'bg-destructive/10 text-destructive',
  open: 'bg-destructive/10 text-destructive',
  vacant: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Bezahlt',
  partial: 'Teilweise',
  overdue: 'Überfällig',
  open: 'Offen',
  vacant: 'Leerstehend',
};

interface MietlisteTableProps {
  propertyId?: string | null;
}

export function MietlisteTable({ propertyId }: MietlisteTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [bookingUnit, setBookingUnit] = useState<{ id: string; leaseId: string; warmmiete: number; name: string } | null>(null);
  const { getUnitsForProperty, getMonthHistory, refetch } = useMSVData();

  const units = getUnitsForProperty(propertyId ?? null);
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
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {propertyId ? 'Keine Mietverhältnisse für dieses Objekt.' : 'Bitte ein Objekt oben auswählen.'}
                    </p>
                    {propertyId && (
                      <Button variant="link" className="mt-2" onClick={() => window.location.href = '/portal/immobilien/portfolio'}>
                        <Plus className="h-4 w-4 mr-1" /> Lease anlegen
                      </Button>
                    )}
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
                        <Badge className={`${STATUS_COLORS[u.status] || ''} border-0 text-xs`}>
                          {STATUS_LABELS[u.status] || u.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.leaseId && u.status !== 'vacant' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Zahlung erfassen"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBookingUnit({
                                id: u.id,
                                leaseId: u.leaseId!,
                                warmmiete: u.warmmiete,
                                name: `${u.vorname} ${u.name}`.trim(),
                              });
                            }}
                          >
                            <Euro className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedRow === u.id && (
                      <TableRow key={`${u.id}-expand`}>
                        <TableCell colSpan={16} className="bg-muted/20 p-4">
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
                                  {getMonthHistory(u.id, u.warmmiete).map(m => (
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

      {/* Payment Booking Dialog */}
      {bookingUnit && (
        <PaymentBookingDialog
          open={!!bookingUnit}
          onOpenChange={(open) => { if (!open) setBookingUnit(null); }}
          leaseId={bookingUnit.leaseId}
          unitId={bookingUnit.id}
          propertyId={propertyId ?? ''}
          sollmiete={bookingUnit.warmmiete}
          mieterName={bookingUnit.name}
          onSuccess={() => { setBookingUnit(null); refetch(); }}
        />
      )}
    </div>
  );
}