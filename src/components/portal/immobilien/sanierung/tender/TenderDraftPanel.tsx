import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, Send, Eye, Edit2, FileText, Paperclip, User, Phone, 
  MessageSquare, Building2, Calendar, Loader2, Check, AlertCircle
} from 'lucide-react';
import { ServiceCase } from '@/hooks/useServiceCases';
import { SelectedProvider } from './ProviderSearchPanel';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

// ============================================================================
// Types
// ============================================================================
interface TenderDraftPanelProps {
  serviceCase: ServiceCase;
  selectedProviders: SelectedProvider[];
  attachmentIds?: string[];
  onSendComplete?: () => void;
}

interface EmailDraft {
  to: string;
  subject: string;
  body: string;
  attachments: string[];
}

// ============================================================================
// Component
// ============================================================================
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

  // Build email subject
  const getSubject = () => {
    const categoryLabels: Record<string, string> = {
      sanitaer: 'Sanitärarbeiten',
      elektro: 'Elektroarbeiten',
      maler: 'Malerarbeiten',
      dach: 'Dacharbeiten',
      fenster: 'Fensterarbeiten',
      heizung: 'Heizungsarbeiten',
      gutachter: 'Gutachten',
      hausverwaltung: 'Hausmeisterleistungen',
      sonstige: 'Handwerksleistungen',
    };
    
    return `Angebotsanfrage: ${categoryLabels[serviceCase.category] || serviceCase.category} — ${serviceCase.tender_id || serviceCase.public_id}`;
  };

  // Build email body
  const getEmailBody = () => {
    const property = serviceCase.property;
    const unit = serviceCase.unit;
    
    let body = `Sehr geehrte Damen und Herren,

wir bitten um Abgabe eines Angebots für folgende Leistungen:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OBJEKT:
${property?.address || 'Adresse nicht angegeben'}
${property?.postal_code} ${property?.city}`;

    if (unit) {
      body += `\nEinheit: ${unit.code || unit.unit_number}`;
    }

    body += `\n
VORGANG:
Tender-ID: ${serviceCase.tender_id || serviceCase.public_id}
Titel: ${serviceCase.title}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LEISTUNGSBESCHREIBUNG:
${serviceCase.scope_description || serviceCase.description || 'Siehe Anhang'}
`;

    // Add line items if available
    if (serviceCase.scope_line_items && serviceCase.scope_line_items.length > 0) {
      body += `\nPOSITIONEN:\n`;
      serviceCase.scope_line_items.forEach((item: Record<string, unknown>, index: number) => {
        body += `${index + 1}. ${item.description || item.title}`;
        if (item.quantity && item.unit) {
          body += ` — ${item.quantity} ${item.unit}`;
        }
        body += '\n';
      });
    }

    // Add cost estimate if available
    if (serviceCase.cost_estimate_min && serviceCase.cost_estimate_max) {
      body += `\nKOSTENRAHMEN (geschätzt):
${formatCurrency(serviceCase.cost_estimate_min / 100)} – ${formatCurrency(serviceCase.cost_estimate_max / 100)}\n`;
    }

    body += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANGEBOTSFRIST:
${format(new Date(deadlineDate), 'dd. MMMM yyyy', { locale: de })}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KONTAKT FÜR RÜCKFRAGEN:
`;

    if (serviceCase.contact_name) {
      body += `${serviceCase.contact_name}\n`;
    }
    if (serviceCase.contact_phone) {
      body += `Tel: ${serviceCase.contact_phone}\n`;
    }
    if (serviceCase.contact_email) {
      body += `E-Mail: ${serviceCase.contact_email}\n`;
    }
    if (serviceCase.contact_whatsapp) {
      body += `WhatsApp: ${serviceCase.contact_whatsapp}\n`;
    }

    // Add custom message if provided
    if (customMessage) {
      body += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ZUSÄTZLICHE HINWEISE:
${customMessage}\n`;
    }

    body += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bitte senden Sie Ihr Angebot an diese Adresse.
Bitte die Tender-ID "${serviceCase.tender_id || serviceCase.public_id}" im Betreff angeben.

Mit freundlichen Grüßen
`;

    return body;
  };

  // Send tenders to all selected providers
  const handleSendAll = async () => {
    if (selectedProviders.length === 0) {
      toast.error('Bitte wählen Sie mindestens einen Dienstleister aus');
      return;
    }

    const providersWithEmail = selectedProviders.filter(p => p.email);
    if (providersWithEmail.length === 0) {
      toast.error('Keiner der ausgewählten Dienstleister hat eine E-Mail-Adresse');
      return;
    }

    setIsSending(true);
    const subject = getSubject();
    const body = getEmailBody();

    try {
      for (const provider of providersWithEmail) {
        const { error } = await supabase.functions.invoke('sot-renovation-outbound', {
          body: {
            service_case_id: serviceCase.id,
            provider: {
              name: provider.name,
              email: provider.email,
              phone: provider.phone,
            },
            email: {
              to: provider.email,
              subject,
              body,
              attachment_ids: attachmentIds,
            },
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

      const successCount = providersWithEmail.length;
      toast.success(`${successCount} Ausschreibung(en) versendet`);
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
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              E-Mail-Vorschau
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={isPreviewMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsPreviewMode(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Vorschau
              </Button>
              <Button
                variant={!isPreviewMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsPreviewMode(false)}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Bearbeiten
              </Button>
            </div>
          </div>
          <CardDescription>
            Diese E-Mail wird an {providersWithEmail.length} Dienstleister gesendet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPreviewMode ? (
            <div className="space-y-4">
              {/* Subject */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Betreff</Label>
                <div className="font-medium">{getSubject()}</div>
              </div>

              <Separator />

              {/* Body Preview */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nachricht</Label>
                <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/50 p-4 rounded-lg max-h-[400px] overflow-y-auto">
                  {getEmailBody()}
                </pre>
              </div>

              {/* Attachments */}
              {attachmentIds.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    Anhänge ({attachmentIds.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {attachmentIds.map((id, index) => (
                      <Badge key={id} variant="secondary">
                        <FileText className="h-3 w-3 mr-1" />
                        Dokument {index + 1}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Deadline */}
              <div className="space-y-2">
                <Label>Angebotsfrist</Label>
                <Input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              {/* Custom Message */}
              <div className="space-y-2">
                <Label>Zusätzliche Hinweise (optional)</Label>
                <Textarea
                  placeholder="z.B. Besichtigungstermin, besondere Anforderungen..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Info Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Kontaktdaten in der E-Mail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {serviceCase.contact_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {serviceCase.contact_name}
              </div>
            )}
            {serviceCase.contact_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {serviceCase.contact_phone}
              </div>
            )}
            {serviceCase.contact_email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {serviceCase.contact_email}
              </div>
            )}
            {serviceCase.contact_whatsapp && (
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                {serviceCase.contact_whatsapp}
              </div>
            )}
          </div>
          {!serviceCase.contact_name && !serviceCase.contact_phone && !serviceCase.contact_email && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Keine Kontaktdaten hinterlegt. Bitte ergänzen Sie diese im Vorgang.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recipients */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Empfänger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {providersWithEmail.map((provider) => {
            const isSent = sentProviders.includes(provider.place_id);
            return (
              <div
                key={provider.place_id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  isSent ? 'bg-primary/10' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{provider.name}</span>
                  <span className="text-sm text-muted-foreground">{provider.email}</span>
                </div>
                {isSent && (
                  <Badge variant="secondary">
                    <Check className="h-3 w-3 mr-1" />
                    Gesendet
                  </Badge>
                )}
              </div>
            );
          })}

          {providersWithoutEmail.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {providersWithoutEmail.length} Dienstleister ohne E-Mail-Adresse können nicht angeschrieben werden:
                {' '}{providersWithoutEmail.map(p => p.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Send Button */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSendAll}
          disabled={isSending || providersWithEmail.length === 0}
          size="lg"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Wird gesendet...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              An {providersWithEmail.length} Dienstleister senden
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
