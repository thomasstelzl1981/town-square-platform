/**
 * FinanzExposeeCard — Kachel 1: Read-only Exposé-Tabelle
 * Extracted from FMEinreichung.tsx (R-1)
 */
import { Loader2, FileText, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { TR, EmptyHint } from './fmEinreichungHelpers';
import { eurFormat } from './fmEinreichungTypes';

interface FinanzExposeeCardProps {
  selectedId: string | null;
  reqLoading: boolean;
  request: any;
  applicant: any;
  property: any;
}

export function FinanzExposeeCard({ selectedId, reqLoading, request, applicant, property }: FinanzExposeeCardProps) {
  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> 1. Finanzierungs-Exposé
          </h3>
          {selectedId && (
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <Download className="h-3 w-3 mr-1" /> PDF Export
            </Button>
          )}
        </div>
        {!selectedId ? (
          <EmptyHint text="Bitte wählen Sie oben eine Akte aus." />
        ) : reqLoading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : request ? (
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={2} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3">Antragsteller</TableCell>
              </TableRow>
              <TR label="Name" value={[applicant?.first_name, applicant?.last_name].filter(Boolean).join(' ') || null} />
              <TR label="E-Mail" value={applicant?.email} />
              <TR label="Telefon" value={applicant?.phone} />
              <TR label="Adresse" value={[applicant?.address_street, applicant?.address_postal_code, applicant?.address_city].filter(Boolean).join(', ') || null} />
              <TR label="Beruf" value={applicant?.position} />
              <TR label="Netto-Einkommen" value={applicant?.net_income_monthly ? eurFormat.format(applicant.net_income_monthly) : null} />
              <TableRow>
                <TableCell colSpan={2} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3">Finanzierung</TableCell>
              </TableRow>
              {request.purpose === 'umschuldung' ? (
                <>
                  <TR label="Restschuld" value={applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : null} />
                  <TR label="Objektwert" value={property?.purchase_price ? eurFormat.format(property.purchase_price) : null} />
                  <TR label="Verwendung" value="Prolongation / Umschuldung" />
                </>
              ) : (
                <>
                  <TR label="Darlehenswunsch" value={applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : null} />
                  <TR label="Eigenkapital" value={applicant?.equity_amount ? eurFormat.format(applicant.equity_amount) : null} />
                  <TR label="Kaufpreis" value={applicant?.purchase_price ? eurFormat.format(applicant.purchase_price) : null} />
                  <TR label="Verwendung" value={applicant?.purpose} />
                </>
              )}
              <TableRow>
                <TableCell colSpan={2} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3">Objekt</TableCell>
              </TableRow>
              {property ? (
                <>
                  <TR label="Adresse" value={property.address} />
                  <TR label="PLZ / Ort" value={[property.postal_code, property.city].filter(Boolean).join(' ') || null} />
                  <TR label="Kaufpreis" value={property.purchase_price ? eurFormat.format(property.purchase_price) : null} />
                </>
              ) : (
                <>
                  <TR label="Adresse" value={applicant?.object_address} />
                  <TR label="Objekttyp" value={applicant?.object_type} />
                </>
              )}
            </TableBody>
          </Table>
        ) : (
          <EmptyHint text="Fall nicht gefunden." />
        )}
      </CardContent>
    </Card>
  );
}
