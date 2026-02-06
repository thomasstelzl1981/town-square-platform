/**
 * Inbound Tab — Eingegangene Nachrichten + Exposé-Konvertierung
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, Inbox, Loader2, CheckCircle2, Paperclip, 
  FileText, ArrowRight, Clock, AlertCircle, ExternalLink
} from 'lucide-react';
import { 
  useAcqInboundMessages, 
  useConvertToOffer,
  type AcqInboundMessage
} from '@/hooks/useAcqOutbound';
import { formatDistanceToNow, format } from 'date-fns';
import { de } from 'date-fns/locale';

interface InboundTabProps {
  mandateId: string;
  mandateCode: string;
}

const ROUTING_METHOD_LABELS: Record<string, string> = {
  token: 'Routing-Token',
  email_match: 'E-Mail-Match',
  thread: 'Thread-Zuordnung',
  ai_fallback: 'KI-Zuordnung',
  manual: 'Manuell',
};

export function InboundTab({ mandateId, mandateCode }: InboundTabProps) {
  const { data: messages = [], isLoading } = useAcqInboundMessages(mandateId);
  const convertToOffer = useConvertToOffer();
  
  const [selectedMessage, setSelectedMessage] = React.useState<AcqInboundMessage | null>(null);
  const [showConvertDialog, setShowConvertDialog] = React.useState(false);

  const unreadCount = messages.filter(m => !m.routed_at).length;
  const withAttachments = messages.filter(m => m.attachments && m.attachments.length > 0);

  const handleConvert = async () => {
    if (!selectedMessage) return;
    
    await convertToOffer.mutateAsync({
      inboundId: selectedMessage.id,
      mandateId,
    });
    setShowConvertDialog(false);
    setSelectedMessage(null);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Eingang</h2>
          <p className="text-sm text-muted-foreground">
            Eingegangene Nachrichten für {mandateCode}
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {unreadCount} neu
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{messages.length}</div>
            <div className="text-sm text-muted-foreground">Gesamt</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            <div className="text-sm text-muted-foreground">Unbearbeitet</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{withAttachments.length}</div>
            <div className="text-sm text-muted-foreground">Mit Anhang</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {messages.filter(m => m.routing_confidence >= 80).length}
            </div>
            <div className="text-sm text-muted-foreground">Auto-zugeordnet</div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Keine Nachrichten</h3>
            <p className="text-muted-foreground mt-2">
              Eingehende E-Mails werden hier automatisch zugeordnet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" />
              Nachrichten ({messages.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {messages.map(message => (
                <MessageRow 
                  key={message.id} 
                  message={message}
                  onView={() => setSelectedMessage(message)}
                  onConvert={() => { setSelectedMessage(message); setShowConvertDialog(true); }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage && !showConvertDialog} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  {selectedMessage.subject || '(Kein Betreff)'}
                </DialogTitle>
                <DialogDescription>
                  Von: {selectedMessage.from_email} • 
                  {format(new Date(selectedMessage.received_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="content" className="mt-4">
                <TabsList>
                  <TabsTrigger value="content">Inhalt</TabsTrigger>
                  {selectedMessage.attachments?.length > 0 && (
                    <TabsTrigger value="attachments">
                      Anhänge ({selectedMessage.attachments.length})
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="meta">Routing-Info</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="mt-4">
                  <ScrollArea className="h-80 rounded-lg border p-4 bg-muted/30">
                    {selectedMessage.body_html ? (
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm">
                        {selectedMessage.body_text || '(Kein Inhalt)'}
                      </pre>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="attachments" className="mt-4">
                  <div className="space-y-2">
                    {selectedMessage.attachments?.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{att.filename}</div>
                            <div className="text-xs text-muted-foreground">{att.mime_type}</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={att.storage_path} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Öffnen
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="meta" className="mt-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <Label className="text-xs text-muted-foreground">Zuordnungsmethode</Label>
                          <div className="font-medium mt-1">
                            {ROUTING_METHOD_LABELS[selectedMessage.routing_method || ''] || 'Unbekannt'}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <Label className="text-xs text-muted-foreground">Konfidenz</Label>
                          <div className="font-medium mt-1">
                            {selectedMessage.routing_confidence}%
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    {selectedMessage.needs_routing && (
                      <div className="p-4 rounded-lg bg-orange-50 border-orange-200 border">
                        <div className="flex items-center gap-2 text-orange-700">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">Manuelle Zuordnung erforderlich</span>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>Schließen</Button>
                {selectedMessage.attachments?.length > 0 && (
                  <Button onClick={() => setShowConvertDialog(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Als Angebot anlegen
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert to Offer Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Als Angebot anlegen</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein neues Angebot aus dieser E-Mail. Anhänge werden automatisch übernommen.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="py-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="text-sm space-y-2">
                    <div><strong>Betreff:</strong> {selectedMessage.subject}</div>
                    <div><strong>Von:</strong> {selectedMessage.from_email}</div>
                    {selectedMessage.attachments?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        <span>{selectedMessage.attachments.length} Anhänge werden übernommen</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>Abbrechen</Button>
            <Button onClick={handleConvert} disabled={convertToOffer.isPending}>
              {convertToOffer.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <FileText className="h-4 w-4 mr-2" />
              Angebot erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper component for Label
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className || ''}`}>{children}</div>;
}

// Message row component
function MessageRow({ 
  message, 
  onView, 
  onConvert 
}: { 
  message: AcqInboundMessage; 
  onView: () => void; 
  onConvert: () => void;
}) {
  const hasAttachments = message.attachments && message.attachments.length > 0;
  const isNew = !message.routed_at;
  
  return (
    <div 
      className={`p-4 hover:bg-muted/50 cursor-pointer ${isNew ? 'bg-blue-50/50' : ''}`}
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${isNew ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium truncate ${isNew ? 'text-blue-900' : ''}`}>
                {message.subject || '(Kein Betreff)'}
              </span>
              {isNew && <Badge variant="default" className="text-xs">Neu</Badge>}
              {hasAttachments && (
                <Badge variant="outline" className="text-xs">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {message.attachments!.length}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              Von: {message.from_email}
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(message.received_at), { locale: de, addSuffix: true })}
              {message.routing_method && (
                <>
                  <span>•</span>
                  <span>{ROUTING_METHOD_LABELS[message.routing_method]}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasAttachments && (
            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onConvert(); }}>
              <FileText className="h-4 w-4 mr-1" />
              Angebot
            </Button>
          )}
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
