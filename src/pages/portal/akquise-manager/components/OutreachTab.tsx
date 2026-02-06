/**
 * Outreach Tab — E-Mail Queue + Versand
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, Send, Loader2, CheckCircle2, Clock, AlertCircle, 
  MailOpen, XCircle, Users, FileText, Wand2, Eye
} from 'lucide-react';
import { 
  useOutreachQueue, 
  useUserContactLinks,
  useAddToOutreachQueue,
  useRemoveFromOutreachQueue
} from '@/hooks/useAcqContacts';
import {
  useAcqOutboundMessages,
  useSendOutreach,
  useBulkSendOutreach,
  useEmailTemplates,
  renderTemplate,
  type AcqOutboundMessage,
  type EmailTemplate
} from '@/hooks/useAcqOutbound';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface OutreachTabProps {
  mandateId: string;
  mandateCode: string;
  clientName?: string;
  searchArea?: string;
  assetFocus?: string[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  queued: { label: 'Warteschlange', icon: Clock, color: 'bg-gray-100 text-gray-700' },
  sending: { label: 'Wird gesendet', icon: Loader2, color: 'bg-blue-100 text-blue-700' },
  sent: { label: 'Gesendet', icon: Send, color: 'bg-blue-100 text-blue-700' },
  delivered: { label: 'Zugestellt', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
  opened: { label: 'Geöffnet', icon: MailOpen, color: 'bg-purple-100 text-purple-700' },
  bounced: { label: 'Zurückgewiesen', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
  replied: { label: 'Beantwortet', icon: Mail, color: 'bg-green-100 text-green-700' },
  failed: { label: 'Fehlgeschlagen', icon: XCircle, color: 'bg-red-100 text-red-700' },
};

export function OutreachTab({ mandateId, mandateCode, clientName, searchArea, assetFocus }: OutreachTabProps) {
  const { data: queue = [], isLoading: loadingQueue } = useOutreachQueue(mandateId);
  const { data: allContacts = [] } = useUserContactLinks(mandateId);
  const { data: sentMessages = [], isLoading: loadingMessages } = useAcqOutboundMessages(mandateId);
  const { data: templates = [] } = useEmailTemplates('outreach');
  
  const addToQueue = useAddToOutreachQueue();
  const removeFromQueue = useRemoveFromOutreachQueue();
  const sendOutreach = useSendOutreach();
  const bulkSend = useBulkSendOutreach();
  
  const [showComposeDialog, setShowComposeDialog] = React.useState(false);
  const [showBulkDialog, setShowBulkDialog] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<EmailTemplate | null>(null);
  const [selectedContacts, setSelectedContacts] = React.useState<string[]>([]);
  const [customVariables, setCustomVariables] = React.useState<Record<string, string>>({});

  // Default template variables
  const defaultVariables = React.useMemo(() => ({
    mandate_code: mandateCode,
    client_name: clientName || '[Mandant]',
    search_area: searchArea || '[Region]',
    asset_focus: assetFocus?.join(', ') || '[Objekttyp]',
    sender_name: 'Ihr Akquise-Team',
  }), [mandateCode, clientName, searchArea, assetFocus]);

  const contactsNotInQueue = allContacts.filter(
    c => !c.in_outreach_queue && c.contact?.email
  );

  const handleSendSingle = async (contactId: string) => {
    if (!selectedTemplate) return;
    
    await sendOutreach.mutateAsync({
      mandateId,
      contactId,
      templateCode: selectedTemplate.code,
      variables: { ...defaultVariables, ...customVariables },
    });
    setShowComposeDialog(false);
  };

  const handleBulkSend = async () => {
    if (!selectedTemplate || selectedContacts.length === 0) return;
    
    await bulkSend.mutateAsync({
      mandateId,
      contactIds: selectedContacts,
      templateCode: selectedTemplate.code,
      variables: { ...defaultVariables, ...customVariables },
    });
    setSelectedContacts([]);
    setShowBulkDialog(false);
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAll = () => {
    const allIds = queue.filter(q => q.contact?.email).map(q => q.contact_id);
    setSelectedContacts(allIds);
  };

  const isLoading = loadingQueue || loadingMessages;

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const preview = selectedTemplate 
    ? renderTemplate(selectedTemplate, { ...defaultVariables, ...customVariables })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Outreach</h2>
          <p className="text-sm text-muted-foreground">
            E-Mail-Kampagnen für {mandateCode} verwalten
          </p>
        </div>
        <div className="flex gap-2">
          {queue.length > 0 && (
            <Button variant="outline" onClick={() => { selectAll(); setShowBulkDialog(true); }}>
              <Users className="h-4 w-4 mr-2" />
              Alle senden ({queue.length})
            </Button>
          )}
          <Button onClick={() => setShowComposeDialog(true)} disabled={queue.length === 0}>
            <Send className="h-4 w-4 mr-2" />
            E-Mail senden
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{queue.length}</div>
            <div className="text-sm text-muted-foreground">In Queue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {sentMessages.filter(m => ['sent', 'delivered'].includes(m.status)).length}
            </div>
            <div className="text-sm text-muted-foreground">Gesendet</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {sentMessages.filter(m => m.status === 'opened').length}
            </div>
            <div className="text-sm text-muted-foreground">Geöffnet</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {sentMessages.filter(m => m.status === 'replied').length}
            </div>
            <div className="text-sm text-muted-foreground">Beantwortet</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {sentMessages.filter(m => m.status === 'bounced').length}
            </div>
            <div className="text-sm text-muted-foreground">Bounced</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Outreach-Queue
              </span>
              {contactsNotInQueue.length > 0 && (
                <Badge variant="secondary">{contactsNotInQueue.length} verfügbar</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Kontakte in der Queue.</p>
                <p className="text-sm mt-1">Fügen Sie Kontakte über Sourcing hinzu.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {queue.map(link => (
                  <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedContacts.includes(link.contact_id)}
                        onCheckedChange={() => toggleContactSelection(link.contact_id)}
                      />
                      <div>
                        <div className="font-medium">
                          {link.contact?.first_name} {link.contact?.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {link.contact?.email}
                          {link.contact?.company && ` • ${link.contact.company}`}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeFromQueue.mutate(link.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gesendete Nachrichten
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sentMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine E-Mails gesendet.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {sentMessages.map(msg => {
                  const statusConfig = STATUS_CONFIG[msg.status] || STATUS_CONFIG.queued;
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div key={msg.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${statusConfig.color}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{msg.subject}</div>
                          <div className="text-xs text-muted-foreground">
                            An: {msg.contact?.email || 'Unbekannt'} • {formatDistanceToNow(new Date(msg.created_at), { locale: de, addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {statusConfig.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compose Dialog */}
      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>E-Mail verfassen</DialogTitle>
            <DialogDescription>Wählen Sie eine Vorlage und einen Empfänger.</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Vorlage</Label>
              <Select 
                value={selectedTemplate?.code || ''} 
                onValueChange={code => setSelectedTemplate(templates.find(t => t.code === code) || null)}
              >
                <SelectTrigger><SelectValue placeholder="Vorlage auswählen..." /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.code} value={t.code}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Variablen</Label>
                    <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Vorschau
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTemplate.variables?.map(v => (
                      <div key={v} className="space-y-1">
                        <Label className="text-xs">{v}</Label>
                        <Input 
                          size={1}
                          value={customVariables[v] || defaultVariables[v as keyof typeof defaultVariables] || ''}
                          onChange={e => setCustomVariables(prev => ({ ...prev, [v]: e.target.value }))}
                          placeholder={defaultVariables[v as keyof typeof defaultVariables] || v}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {showPreview && preview && (
                  <Card className="bg-muted/50">
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm">Betreff: {preview.subject}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>Empfänger</Label>
              <ScrollArea className="h-48 rounded-lg border p-2">
                {queue.map(link => (
                  <div 
                    key={link.id} 
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted ${selectedContacts.includes(link.contact_id) ? 'bg-primary/10' : ''}`}
                    onClick={() => toggleContactSelection(link.contact_id)}
                  >
                    <Checkbox checked={selectedContacts.includes(link.contact_id)} />
                    <div>
                      <div className="font-medium text-sm">{link.contact?.first_name} {link.contact?.last_name}</div>
                      <div className="text-xs text-muted-foreground">{link.contact?.email}</div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComposeDialog(false)}>Abbrechen</Button>
            <Button 
              onClick={() => selectedContacts.length === 1 
                ? handleSendSingle(selectedContacts[0])
                : handleBulkSend()
              }
              disabled={!selectedTemplate || selectedContacts.length === 0 || sendOutreach.isPending}
            >
              {sendOutreach.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Send className="h-4 w-4 mr-2" />
              Senden ({selectedContacts.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
