/**
 * MeetingResultDrawer — Shows meeting summary, tasks, decisions, open questions
 * With email send and contact conversation archive functionality
 */

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Archive, Loader2, CheckCircle2, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useUserMailAccount } from '@/hooks/useUserMailAccount';

interface MeetingOutput {
  summary_md: string | null;
  action_items_json: any[];
  decisions_json: any[];
  open_questions_json: any[];
}

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface MeetingResultDrawerProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeetingResultDrawer({ sessionId, open, onOpenChange }: MeetingResultDrawerProps) {
  const [output, setOutput] = useState<MeetingOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactList, setShowContactList] = useState(false);
  const { hasAccount, accountEmail } = useUserMailAccount();

  // Load output
  useEffect(() => {
    if (!open || !sessionId) return;
    setLoading(true);
    supabase
      .from('meeting_outputs')
      .select('*')
      .eq('session_id', sessionId)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setOutput({
            summary_md: (data as any).summary_md,
            action_items_json: (data as any).action_items_json || [],
            decisions_json: (data as any).decisions_json || [],
            open_questions_json: (data as any).open_questions_json || [],
          });
        }
        setLoading(false);
      });
  }, [open, sessionId]);

  // Search contacts
  useEffect(() => {
    if (!contactSearch || contactSearch.length < 2) {
      setContacts([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .or(`first_name.ilike.%${contactSearch}%,last_name.ilike.%${contactSearch}%,email.ilike.%${contactSearch}%`)
        .limit(5);
      setContacts((data as Contact[]) || []);
      setShowContactList(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [contactSearch]);

  const handleSend = async () => {
    const recipientEmail = selectedContact?.email || emailInput;
    if (!recipientEmail) {
      toast.error('Bitte E-Mail-Adresse eingeben oder Kontakt wählen');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('sot-meeting-send', {
        body: {
          session_id: sessionId,
          recipients: [{
            type: selectedContact ? 'contact' : 'email',
            id: selectedContact?.id,
            email: recipientEmail,
          }],
        },
      });
      if (error) throw error;
      toast.success('Protokoll gesendet', {
        description: selectedContact ? 'Auch im Kontakt-Konversationsverlauf gespeichert' : undefined,
      });
    } catch (e) {
      console.error('[MeetingResult] Send error:', e);
      toast.error('Fehler beim Senden');
    } finally {
      setSending(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    await supabase.from('meeting_sessions').update({ status: 'archived' } as any).eq('id', sessionId);
    toast.success('Protokoll archiviert');
    setArchiving(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Meeting-Protokoll</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : output ? (
          <div className="flex flex-col h-full gap-4 mt-4">
            <Tabs defaultValue="summary" className="flex-1 min-h-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary">Zusammenfassung</TabsTrigger>
                <TabsTrigger value="tasks">Aufgaben</TabsTrigger>
                <TabsTrigger value="decisions">Entscheidungen</TabsTrigger>
                <TabsTrigger value="open">Offen</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[40vh] mt-3">
                <TabsContent value="summary" className="mt-0 prose prose-sm dark:prose-invert max-w-none">
                  {output.summary_md ? (
                    <ReactMarkdown>{output.summary_md}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground">Keine Zusammenfassung verfügbar</p>
                  )}
                </TabsContent>

                <TabsContent value="tasks" className="mt-0 space-y-2">
                  {output.action_items_json.length > 0 ? (
                    output.action_items_json.map((item: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                        {item.owner && <span className="text-xs text-primary mt-1 block">→ {item.owner}</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine Aufgaben erkannt</p>
                  )}
                </TabsContent>

                <TabsContent value="decisions" className="mt-0 space-y-2">
                  {output.decisions_json.length > 0 ? (
                    output.decisions_json.map((d: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                        <p className="text-sm">{typeof d === 'string' ? d : d.text || d.decision}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine Entscheidungen erkannt</p>
                  )}
                </TabsContent>

                <TabsContent value="open" className="mt-0 space-y-2">
                  {output.open_questions_json.length > 0 ? (
                    output.open_questions_json.map((q: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                        <p className="text-sm">{typeof q === 'string' ? q : q.text || q.question}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine offenen Punkte</p>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            {/* Recipient & Send */}
            <div className="border-t border-border/50 pt-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Protokoll versenden
              </p>
              {hasAccount ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Versand über <span className="font-medium text-foreground">{accountEmail}</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Versand über System-Adresse. Verbinde dein E-Mail-Konto für persönlichen Versand.
                </p>
              )}

              <div className="relative">
                <Input
                  placeholder="Kontakt suchen oder E-Mail eingeben..."
                  value={selectedContact ? `${selectedContact.first_name || ''} ${selectedContact.last_name || ''} <${selectedContact.email}>` : contactSearch || emailInput}
                  onChange={(e) => {
                    setSelectedContact(null);
                    const val = e.target.value;
                    if (val.includes('@')) {
                      setEmailInput(val);
                      setContactSearch('');
                    } else {
                      setContactSearch(val);
                      setEmailInput('');
                    }
                  }}
                  className="text-sm"
                />
                {showContactList && contacts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {contacts.map(c => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
                        onClick={() => {
                          setSelectedContact(c);
                          setShowContactList(false);
                          setContactSearch('');
                        }}
                      >
                        <span className="font-medium">{c.first_name} {c.last_name}</span>
                        {c.email && <span className="text-muted-foreground ml-2 text-xs">{c.email}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArchive}
                  disabled={archiving}
                  className="gap-1"
                >
                  {archiving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Archive className="h-3 w-3" />}
                  Speichern
                </Button>
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={sending || (!emailInput && !selectedContact)}
                  className="gap-1 flex-1"
                >
                  {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  Senden
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Kein Protokoll gefunden
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
