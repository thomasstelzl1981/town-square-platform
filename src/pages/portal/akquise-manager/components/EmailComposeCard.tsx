import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Loader2, FileText, Search } from 'lucide-react';
import { DictationButton } from '@/components/shared/DictationButton';
import { MSG_STATUS_CONFIG } from '@/components/akquise/acqConfigs';
import type { ContactStaging } from '@/hooks/useAcqContacts';

interface Props {
  mandateCreated: boolean;
  selectedContacts: ContactStaging[];
  onToggleContact: (id: string) => void;
  emailSubject: string;
  setEmailSubject: (v: string) => void;
  emailBody: string;
  setEmailBody: (v: string) => void;
  profileGenerated: boolean;
  clientName: string;
  onSend: () => void;
  isSending: boolean;
  sentMessages: any[];
}

export function EmailComposeCard({
  mandateCreated,
  selectedContacts, onToggleContact,
  emailSubject, setEmailSubject,
  emailBody, setEmailBody,
  profileGenerated, clientName,
  onSend, isSending,
  sentMessages,
}: Props) {
  return (
    <Card className="min-h-[500px]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4" />
          E-Mail-Versand
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recipients */}
        <div className="space-y-1">
          <Label className="text-xs">An:</Label>
          <div className="flex flex-wrap gap-1 min-h-[32px] p-2 rounded-md border bg-muted/30">
            {selectedContacts.length === 0 ? (
              <span className="text-xs text-muted-foreground">Kontakte links auswählen...</span>
            ) : (
              selectedContacts.map(c => (
                <Badge key={c.id} variant="secondary" className="text-xs">
                  {c.first_name || c.last_name ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : c.email}
                  <button className="ml-1 hover:text-destructive" onClick={() => onToggleContact(c.id)}>×</button>
                </Badge>
              ))
            )}
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1">
          <Label className="text-xs">Betreff:</Label>
          <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Betreff eingeben..." className="text-sm" />
        </div>

        {/* Body */}
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Label className="text-xs">Nachricht:</Label>
            <DictationButton onTranscript={(text) => setEmailBody(emailBody + ' ' + text)} />
          </div>
          <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={6} className="text-sm" placeholder="E-Mail Text..." />
        </div>

        {/* Attachment */}
        {profileGenerated && (
          <div className="flex items-center gap-2 p-2 rounded border bg-muted/30">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-xs flex-1">Ankaufsprofil_{clientName?.replace(/\s/g, '_') || 'Profil'}.pdf</span>
            <Badge variant="outline" className="text-[10px]">Anhang</Badge>
          </div>
        )}

        {/* Send */}
        <Button className="w-full" onClick={onSend} disabled={selectedContacts.length === 0 || isSending || !emailSubject.trim()}>
          {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Senden ({selectedContacts.length})
        </Button>

        {/* Recent sent messages */}
        {sentMessages.length > 0 && (
          <div className="border-t pt-3 space-y-1">
            <Label className="text-xs text-muted-foreground">Letzte Nachrichten</Label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {sentMessages.slice(0, 10).map((msg: any) => {
                const sc = MSG_STATUS_CONFIG[msg.status] || MSG_STATUS_CONFIG.queued;
                const StatusIcon = sc.icon;
                return (
                  <div key={msg.id} className="flex items-center gap-2 p-2 rounded text-xs border">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${sc.color}`}>
                      <StatusIcon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{msg.subject}</div>
                      <div className="text-muted-foreground truncate">{msg.contact?.email || '–'}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] flex-shrink-0">{sc.label}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
