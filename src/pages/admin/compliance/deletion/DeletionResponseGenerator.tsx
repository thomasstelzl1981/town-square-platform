/**
 * Deletion Response Generator — 3 Antwortvorlagen (Completed, Partial, Rejected)
 */
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Copy, Check } from 'lucide-react';
import { renderDeletionResponse, type DeletionResponseType } from './deletionResponseTemplates';
import { toast } from 'sonner';

interface CompanyProfile {
  company_name?: string;
  legal_form?: string | null;
  address_line1?: string | null;
  postal_code?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface DeletionResponseGeneratorProps {
  requesterName: string | null;
  requestDate: string;
  companyProfile: CompanyProfile | null;
  erasureSummary?: string | null;
  retentionNotes?: string | null;
  legalHoldReason?: string | null;
  onMarkSent: (channel: string, responseType: string) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function DeletionResponseGenerator({
  requesterName, requestDate, companyProfile,
  erasureSummary, retentionNotes, legalHoldReason,
  onMarkSent, disabled, disabledReason,
}: DeletionResponseGeneratorProps) {
  const [showResponse, setShowResponse] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responseChannel, setResponseChannel] = useState('EMAIL');
  const [responseType, setResponseType] = useState<DeletionResponseType>('COMPLETED');

  const companyLegalName = companyProfile
    ? `${companyProfile.company_name || ''}${companyProfile.legal_form ? ` ${companyProfile.legal_form}` : ''}`
    : '—';

  const address = companyProfile
    ? [companyProfile.address_line1, `${companyProfile.postal_code || ''} ${companyProfile.city || ''}`].filter(Boolean).join(', ')
    : '—';

  const { subject, body } = useMemo(() => renderDeletionResponse(responseType, {
    name: requesterName || 'Frau/Herr [Name]',
    requestDate: new Date(requestDate).toLocaleDateString('de-DE'),
    erasureScopeSummary: erasureSummary || 'Alle zu Ihrer Person gespeicherten Daten',
    executionDate: new Date().toLocaleDateString('de-DE'),
    erasedItemsSummary: erasureSummary || '— (bitte ergänzen)',
    retainedItemsSummary: retentionNotes || '— (bitte ergänzen)',
    legalHoldReason: legalHoldReason || '— (bitte ergänzen)',
    rejectionReason: 'Identität konnte nicht verifiziert werden.',
    companyLegalName,
    address,
    contactEmail: companyProfile?.email || '—',
    phone: companyProfile?.phone || '—',
  }), [requesterName, requestDate, companyProfile, responseType, erasureSummary, retentionNotes, legalHoldReason, companyLegalName, address]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`Betreff: ${subject}\n\n${body}`);
    setCopied(true);
    toast.success('Antworttext kopiert');
    setTimeout(() => setCopied(false), 2000);
  };

  if (disabled) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-500/5 p-4 text-sm text-amber-700">
        <FileText className="h-4 w-4 inline mr-1" />
        {disabledReason || 'Antwortvorlage erst nach Identitätsprüfung verfügbar.'}
      </div>
    );
  }

  if (!showResponse) {
    return (
      <Button variant="outline" size="sm" onClick={() => setShowResponse(true)}>
        <FileText className="h-3 w-3 mr-1" /> Antwortvorlage generieren
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Antwortvorlage (Art. 17 DSGVO)</p>
        <div className="flex items-center gap-2">
          <Select value={responseType} onValueChange={v => setResponseType(v as DeletionResponseType)}>
            <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="COMPLETED">Vollständig gelöscht</SelectItem>
              <SelectItem value="PARTIAL">Teilweise gelöscht</SelectItem>
              <SelectItem value="REJECTED">Abgelehnt</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            {copied ? 'Kopiert' : 'Kopieren'}
          </Button>
        </div>
      </div>
      <div className="rounded-md border bg-muted/20 p-3 text-xs font-medium text-muted-foreground">
        Betreff: {subject}
      </div>
      <Textarea value={body} readOnly className="min-h-[400px] text-sm font-mono" />
      <div className="flex items-center gap-3 pt-2 border-t">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Versandkanal:</Label>
          <Select value={responseChannel} onValueChange={setResponseChannel}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EMAIL">E-Mail</SelectItem>
              <SelectItem value="PORTAL">Portal</SelectItem>
              <SelectItem value="POSTAL">Post</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => onMarkSent(responseChannel, responseType)}>
          Als versendet markieren
        </Button>
      </div>
    </div>
  );
}
