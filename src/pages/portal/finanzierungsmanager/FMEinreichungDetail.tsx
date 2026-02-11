/**
 * FM Einreichung Detail — Vertical submission flow
 * Summary → Bank Selection → Email Draft & Send
 */
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import {
  ArrowLeft, Loader2, FileText, Send, Globe, Building2, Sparkles,
  Download, Mail
} from 'lucide-react';
import { useFinanceRequest } from '@/hooks/useFinanceRequest';
import { useFinanceBankContacts } from '@/hooks/useFinanceMandate';
import { PageShell } from '@/components/shared/PageShell';
import { getStatusLabel, getStatusBadgeVariant } from '@/types/finance';
import { toast } from 'sonner';

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function TR({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground py-1.5 px-3 w-[180px] border-r">{label}</TableCell>
      <TableCell className="text-sm py-1.5 px-3">{value || '—'}</TableCell>
    </TableRow>
  );
}

export default function FMEinreichungDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading } = useFinanceRequest(requestId);
  const { data: bankContacts } = useFinanceBankContacts();
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  if (!request) {
    return (
      <PageShell>
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Fall nicht gefunden</p>
            <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">Zurück</Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const applicant = request.applicant_profiles?.[0];
  const property = request.properties;
  const currentStatus = request.status;

  const toggleBank = (bankId: string) => {
    setSelectedBanks(prev => {
      if (prev.includes(bankId)) return prev.filter(id => id !== bankId);
      if (prev.length >= 3) { toast.info('Maximal 3 Banken auswählbar'); return prev; }
      return [...prev, bankId];
    });
  };

  const selectedBankDetails = bankContacts?.filter(b => selectedBanks.includes(b.id)) || [];

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold tracking-tight uppercase truncate">
            Einreichung · {request.public_id || request.id.slice(0, 8)}
          </h2>
          <p className="text-xs text-muted-foreground">
            {applicant?.first_name} {applicant?.last_name}
          </p>
        </div>
        <Badge variant={getStatusBadgeVariant(currentStatus)} className="text-xs shrink-0">
          {getStatusLabel(currentStatus)}
        </Badge>
      </div>

      {/* Block 1: Finanzierungs-Exposé Summary */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Finanzierungs-Exposé
            </h3>
            <Button size="sm" variant="outline" className="h-7 text-xs">
              <Download className="h-3 w-3 mr-1" /> PDF Export
            </Button>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell colSpan={2} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3">
                  Antragsteller
                </TableCell>
              </TableRow>
              <TR label="Name" value={`${applicant?.first_name || ''} ${applicant?.last_name || ''}`} />
              <TR label="E-Mail" value={applicant?.email} />
              <TR label="Telefon" value={applicant?.phone} />
              <TR label="Adresse" value={`${applicant?.address_street || ''}, ${applicant?.address_postal_code || ''} ${applicant?.address_city || ''}`} />
              <TR label="Beruf" value={applicant?.position} />
              <TR label="Netto-Einkommen" value={applicant?.net_income_monthly ? eurFormat.format(applicant.net_income_monthly) : null} />

              <TableRow>
                <TableCell colSpan={2} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3">
                  Finanzierung
                </TableCell>
              </TableRow>
              <TR label="Darlehenswunsch" value={applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : null} />
              <TR label="Eigenkapital" value={applicant?.equity_amount ? eurFormat.format(applicant.equity_amount) : null} />
              <TR label="Kaufpreis" value={applicant?.purchase_price ? eurFormat.format(applicant.purchase_price) : null} />
              <TR label="Verwendung" value={applicant?.purpose} />

              <TableRow>
                <TableCell colSpan={2} className="bg-muted/40 text-xs font-semibold uppercase tracking-wide py-1.5 px-3">
                  Objekt
                </TableCell>
              </TableRow>
              {property ? (
                <>
                  <TR label="Adresse" value={property.address} />
                  <TR label="PLZ / Ort" value={`${property.postal_code || ''} ${property.city || ''}`} />
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
        </CardContent>
      </Card>

      {/* Block 2: Bank Selection */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" /> Bankauswahl (max. 3)
            </h3>
            <Button size="sm" variant="ghost" className="h-7 text-xs" disabled>
              <Sparkles className="h-3 w-3 mr-1" /> KI-Empfehlung
            </Button>
          </div>
          <div className="p-4 space-y-2">
            {(!bankContacts || bankContacts.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Keine Bankkontakte vorhanden. Bitte in Zone 1 anlegen.
              </p>
            ) : (
              bankContacts.map(bank => (
                <label
                  key={bank.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-md border hover:border-primary/40 transition-colors cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={selectedBanks.includes(bank.id)}
                    onCheckedChange={() => toggleBank(bank.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{bank.bank_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {bank.contact_name || bank.contact_email}
                    </span>
                  </div>
                </label>
              ))
            )}
          </div>

          {/* Europace placeholder */}
          <div className="px-4 py-3 border-t bg-muted/10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              <span>Europace / Hypoport — Integration ausstehend</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Block 3: Email Drafts */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-2 border-b bg-muted/20">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> E-Mail-Entwürfe ({selectedBankDetails.length})
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {selectedBankDetails.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Wählen Sie oben mindestens eine Bank aus, um E-Mail-Entwürfe zu generieren.
              </p>
            ) : (
              selectedBankDetails.map(bank => (
                <div key={bank.id} className="border rounded-md p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{bank.bank_name}</span>
                    <Badge variant="outline" className="text-[10px]">Entwurf</Badge>
                  </div>
                  <div className="bg-muted/30 rounded p-2 space-y-0.5">
                    <div><span className="text-muted-foreground">An:</span> {bank.contact_email}</div>
                    <div><span className="text-muted-foreground">Betreff:</span> Finanzierungsanfrage {request.public_id} — {applicant?.first_name} {applicant?.last_name}</div>
                    <div className="mt-2 text-muted-foreground">
                      Sehr geehrte Damen und Herren,<br />
                      anbei übermittle ich Ihnen die Finanzierungsanfrage für {applicant?.first_name} {applicant?.last_name} 
                      über {applicant?.loan_amount_requested ? eurFormat.format(applicant.loan_amount_requested) : '—'}.<br />
                      Die vollständige Finanzierungsakte inkl. Selbstauskunft finden Sie im beigefügten PDF sowie im Datenraum.
                    </div>
                    <div className="text-muted-foreground mt-1">📎 Finanzierungsakte.pdf · 📎 Datenraum-Link</div>
                  </div>
                </div>
              ))
            )}
          </div>
          {selectedBankDetails.length > 0 && (
            <div className="px-4 py-3 border-t flex justify-end">
              <Button
                className="text-xs"
                onClick={() => toast.success(`${selectedBankDetails.length} E-Mail(s) werden versendet...`)}
              >
                <Send className="h-3.5 w-3.5 mr-1" /> Alle senden ({selectedBankDetails.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
