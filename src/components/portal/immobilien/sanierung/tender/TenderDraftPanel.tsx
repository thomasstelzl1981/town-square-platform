/**
 * TenderDraftPanel — E-Mail preview and sending (compact, no wrapper cards)
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, Send, Eye, Edit2, FileText, Paperclip, 
  Building2, Loader2, Check, AlertCircle
} from 'lucide-react';
import { ServiceCase } from '@/hooks/useServiceCases';
import { SelectedProvider } from './ProviderSearchPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { DESIGN } from '@/config/designManifest';

interface TenderDraftPanelProps {
  serviceCase: ServiceCase;
  selectedProviders: SelectedProvider[];
  attachmentIds?: string[];
  onSendComplete?: () => void;
}

export function TenderDraftPanel({
  serviceCase,
  selectedProviders,
  attachmentIds = [],
  onSendComplete,
}: TenderDraftPanelProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sentProviders, setSentProviders] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(
    serviceCase.deadline_offers || format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [editableSubject, setEditableSubject] = useState('');
  const [editableBody, setEditableBody] = useState('');
  const [hasEdited, setHasEdited] = useState(false);

  const getSubject = () => {
    const categoryLabels: Record<string, string> = {
      sanitaer: 'Sanitärarbeiten', elektro: 'Elektroarbeiten', maler: 'Malerarbeiten',
      dach: 'Dacharbeiten', fenster: 'Fensterarbeiten', heizung: 'Heizungsarbeiten',
      gutachter: 'Gutachten', hausverwaltung: 'Hausmeisterleistungen', sonstige: 'Handwerksleistungen',
    };
    return `Angebotsanfrage: ${categoryLabels[serviceCase.category] || serviceCase.category} — ${serviceCase.tender_id || serviceCase.public_id}`;
  };

  const getEmailBody = () => {
    const property = serviceCase.property;
    const unit = serviceCase.unit;
    
    let body = `Sehr geehrte Damen und Herren,

wir bitten um Abgabe eines Angebots für folgende Leistungen:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJEKT:
${property?.address || 'Adresse nicht angegeben'}
${property?.postal_code} ${property?.city}`;

    if (unit) body += `\nEinheit: ${unit.code || unit.unit_number}`;

    body += `\n
VORGANG:
Tender-ID: ${serviceCase.tender_id || serviceCase.public_id}
Titel: ${serviceCase.title}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LEISTUNGSBESCHREIBUNG:
${serviceCase.scope_description || serviceCase.description || 'Siehe Anhang'}
`;

    if (serviceCase.scope_line_items && serviceCase.scope_line_items.length > 0) {
      body += `\nPOSITIONEN:\n`;
      serviceCase.scope_line_items.forEach((item: Record<string, unknown>, index: number) => {
        body += `${index + 1}. ${item.description || item.title}`;
        if (item.quantity && item.unit) body += ` — ${item.quantity} ${item.unit}`;
        body += '\n';
      });
    }

    if (serviceCase.cost_estimate_min && serviceCase.cost_estimate_max) {
      body += `\nKOSTENRAHMEN (geschätzt):
${formatCurrency(serviceCase.cost_estimate_min / 100)} – ${formatCurrency(serviceCase.cost_estimate_max / 100)}\n`;
    }

    body += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANGEBOTSFRIST:
${format(new Date(deadlineDate), 'dd. MMMM yyyy', { locale: de })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    if (serviceCase.contact_name) body += `\nKONTAKT:\n${serviceCase.contact_name}\n`;
    if (serviceCase.contact_phone) body += `Tel: ${serviceCase.contact_phone}\n`;
    if (serviceCase.contact_email) body += `E-Mail: ${serviceCase.contact_email}\n`;

    if (customMessage) body += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nZUSÄTZLICHE HINWEISE:\n${customMessage}\n`;

    body += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bitte senden Sie Ihr Angebot an diese Adresse.
Bitte die Tender-ID "${serviceCase.tender_id || serviceCase.public_id}" im Betreff angeben.

Mit freundlichen Grüßen
`;
    return body;
  };

  const handleSendAll = async () => {
    if (selectedProviders.length === 0) { toast.error('Bitte wählen Sie mindestens einen Dienstleister aus'); return; }
    const providersWithEmail = selectedProviders.filter(p => p.email);
    if (providersWithEmail.length === 0) { toast.error('Keiner der Dienstleister hat eine E-Mail-Adresse'); return; }

    setIsSending(true);
    const subject = hasEdited ? editableSubject : getSubject();
    const body = hasEdited ? editableBody : getEmailBody();

    try {
      for (const provider of providersWithEmail) {
        const { error } = await supabase.functions.invoke('sot-renovation-outbound', {
          body: {
            service_case_id: serviceCase.id,
            provider: { name: provider.name, email: provider.email, phone: provider.phone },
            email: { to: provider.email, subject, body, attachment_ids: attachmentIds },
            deadline: deadlineDate,
          }
        });
        if (error) {
          console.error(`Error sending to ${provider.email}:`, error);
          toast.error(`Fehler beim Senden an ${provider.name}`);
        } else {
          setSentProviders(prev => [...prev, provider.place_id]);
        }
      }
      toast.success(`${providersWithEmail.length} Ausschreibung(en) versendet`);
      onSendComplete?.();
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Fehler beim Versenden');
    } finally {
      setIsSending(false);
    }
  };

  const providersWithEmail = selectedProviders.filter(p => p.email);
  const providersWithoutEmail = selectedProviders.filter(p => !p.email);

  return (
    <div className={DESIGN.SPACING.CARD}>
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <h4 className={DESIGN.TYPOGRAPHY.CARD_TITLE + ' flex items-center gap-2'}>
          <Mail className="h-3.5 w-3.5" />
          E-Mail-Entwurf
        </h4>
        <div className="flex gap-1">
          <Button variant={isPreviewMode ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setIsPreviewMode(true)}>
            <Eye className="h-3 w-3 mr-1" />Vorschau
          </Button>
          <Button variant={!isPreviewMode ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => {
            if (isPreviewMode) { setEditableSubject(hasEdited ? editableSubject : getSubject()); setEditableBody(hasEdited ? editableBody : getEmailBody()); }
            setIsPreviewMode(false);
          }}>
            <Edit2 className="h-3 w-3 mr-1" />Bearbeiten
          </Button>
        </div>
      </div>

      <p className={DESIGN.TYPOGRAPHY.HINT}>An {providersWithEmail.length} Dienstleister</p>

      {isPreviewMode ? (
        <div className="space-y-3">
          <div>
            <Label className={DESIGN.TYPOGRAPHY.HINT}>Betreff</Label>
            <div className="text-sm font-medium mt-0.5">{hasEdited ? editableSubject : getSubject()}</div>
          </div>
          <pre className="text-xs whitespace-pre-wrap font-sans bg-muted/50 p-3 rounded-lg max-h-[300px] overflow-y-auto">
            {hasEdited ? editableBody : getEmailBody()}
          </pre>
          {attachmentIds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {attachmentIds.map((id, i) => (
                <Badge key={id} variant="secondary" className="text-[10px]"><FileText className="h-3 w-3 mr-1" />Dok. {i + 1}</Badge>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div><Label className="text-xs">Betreff</Label><Input value={editableSubject} onChange={(e) => setEditableSubject(e.target.value)} className="h-8 text-sm" /></div>
          <div><Label className="text-xs">E-Mail-Text</Label><Textarea value={editableBody} onChange={(e) => setEditableBody(e.target.value)} rows={12} className="font-mono text-xs" /></div>
          <div><Label className="text-xs">Angebotsfrist</Label><Input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} className="h-8 text-sm" /></div>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setHasEdited(true); setIsPreviewMode(true); toast.success('Übernommen'); }}>
              <Check className="h-3 w-3 mr-1" />Speichern
            </Button>
          </div>
        </div>
      )}

      {/* Recipients */}
      {providersWithEmail.length > 0 && (
        <div className="space-y-1">
          <Label className={DESIGN.TYPOGRAPHY.HINT}>Empfänger</Label>
          {providersWithEmail.map((provider) => {
            const isSent = sentProviders.includes(provider.place_id);
            return (
              <div key={provider.place_id} className={`flex items-center justify-between p-1.5 rounded text-xs ${isSent ? 'bg-primary/10' : 'bg-muted/50'}`}>
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{provider.name}</span>
                  <span className="text-muted-foreground">{provider.email}</span>
                </div>
                {isSent && <Badge variant="secondary" className="text-[10px]"><Check className="h-2.5 w-2.5 mr-0.5" />Gesendet</Badge>}
              </div>
            );
          })}
        </div>
      )}

      {providersWithoutEmail.length > 0 && (
        <Alert className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">
            {providersWithoutEmail.length} ohne E-Mail: {providersWithoutEmail.map(p => p.name).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Send Button */}
      <Button onClick={handleSendAll} disabled={isSending || providersWithEmail.length === 0} className="w-full">
        {isSending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Wird gesendet...</>
        ) : (
          <><Send className="h-4 w-4 mr-2" />An {providersWithEmail.length} senden</>
        )}
      </Button>
    </div>
  );
}
