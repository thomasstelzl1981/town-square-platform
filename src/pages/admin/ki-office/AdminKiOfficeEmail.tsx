/**
 * AdminKiOfficeEmail — Zone 1 Marketing Email Hub
 * 3-Panel Layout: Threads | Conversation | Contact Panel
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Send, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Import sub-components
import { ThreadList } from '@/components/admin/ki-office/ThreadList';
import { ConversationView } from '@/components/admin/ki-office/ConversationView';
import { ContactPanel } from '@/components/admin/ki-office/ContactPanel';
import { AIReplyAssistant } from '@/components/admin/ki-office/AIReplyAssistant';
import { useAdminEmailThreads, type EmailThread } from '@/hooks/useAdminEmailThreads';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
}

interface ComposeFormData {
  contact_id: string;
  to_email: string;
  to_name: string;
  subject: string;
  body_text: string;
}

const emptyComposeData: ComposeFormData = {
  contact_id: '',
  to_email: '',
  to_name: '',
  subject: '',
  body_text: '',
};

export default function AdminKiOfficeEmail() {
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState<ComposeFormData>(emptyComposeData);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  const { threads, isLoading, useThreadMessages, markThreadRead, findOrCreateThread } = useAdminEmailThreads();

  // Get messages for selected thread
  const { data: threadMessages = [], isLoading: messagesLoading } = useThreadMessages(selectedThread?.id || null);

  // Fetch admin contacts for recipient selection
  const { data: contacts = [] } = useQuery({
    queryKey: ['admin-contacts-for-email'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, company')
        .eq('scope', 'zone1_admin')
        .not('email', 'is', null)
        .order('last_name');
      if (error) throw error;
      return data as Contact[];
    },
  });

  // Send email mutation
  const sendMutation = useMutation({
    mutationFn: async (data: ComposeFormData) => {
      // First, find or create a thread for this contact
      let threadId: string | null = null;
      if (data.contact_id) {
        threadId = await findOrCreateThread.mutateAsync({
          contactId: data.contact_id,
          subject: data.subject,
        });
      }

      const { error } = await supabase.functions.invoke('sot-admin-mail-send', {
        body: {
          to_email: data.to_email,
          to_name: data.to_name || null,
          contact_id: data.contact_id || null,
          subject: data.subject,
          body_text: data.body_text,
          thread_id: threadId,
        },
      });
      if (error) throw error;
      return threadId;
    },
    onSuccess: (threadId) => {
      toast.success('E-Mail wurde gesendet');
      queryClient.invalidateQueries({ queryKey: ['admin-email-threads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-outbound-emails'] });
      if (threadId) {
        queryClient.invalidateQueries({ queryKey: ['admin-thread-messages', threadId] });
      }
      setComposeOpen(false);
      setComposeData(emptyComposeData);
    },
    onError: (error) => {
      toast.error('Fehler beim Senden: ' + error.message);
    },
  });

  // Mark thread as read when selected
  useEffect(() => {
    if (selectedThread?.id && selectedThread.unread_count > 0) {
      markThreadRead.mutate(selectedThread.id);
    }
  }, [selectedThread?.id]);

  const handleContactSelect = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setComposeData({
        ...composeData,
        contact_id: contactId,
        to_email: contact.email || '',
        to_name: `${contact.first_name} ${contact.last_name}`,
      });
    }
  };

  const handleThreadSelect = (thread: EmailThread) => {
    setSelectedThread(thread);
  };

  const handleComposeFromPanel = () => {
    if (selectedThread?.contact) {
      setComposeData({
        contact_id: selectedThread.contact.id,
        to_email: selectedThread.contact.email || '',
        to_name: `${selectedThread.contact.first_name} ${selectedThread.contact.last_name}`,
        subject: selectedThread.subject?.startsWith('Re:') 
          ? selectedThread.subject 
          : `Re: ${selectedThread.subject || ''}`,
        body_text: '',
      });
    }
    setComposeOpen(true);
  };

  const handleAIReply = () => {
    setAiAssistantOpen(true);
  };

  const handleAIReplyAccept = (text: string) => {
    // Insert AI-generated text into compose
    if (selectedThread?.contact) {
      setComposeData({
        contact_id: selectedThread.contact.id,
        to_email: selectedThread.contact.email || '',
        to_name: `${selectedThread.contact.first_name} ${selectedThread.contact.last_name}`,
        subject: selectedThread.subject?.startsWith('Re:') 
          ? selectedThread.subject 
          : `Re: ${selectedThread.subject || ''}`,
        body_text: text,
      });
      setComposeOpen(true);
    }
    setAiAssistantOpen(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">E-Mail-Konversationen</h1>
          <p className="text-sm text-muted-foreground">
            Marketing & Kommunikation — {threads.length} Konversationen
          </p>
        </div>
        <Button onClick={() => setComposeOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue E-Mail
        </Button>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Thread List */}
        <div className="w-80 shrink-0">
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThread?.id || null}
            onSelectThread={handleThreadSelect}
            isLoading={isLoading}
          />
        </div>

        {/* Center: Conversation */}
        <ConversationView
          thread={selectedThread}
          messages={threadMessages}
          isLoading={messagesLoading}
          onGenerateAIReply={selectedThread ? handleAIReply : undefined}
        />

        {/* Right: Contact Panel */}
        <ContactPanel
          thread={selectedThread}
          onComposeEmail={handleComposeFromPanel}
          onGenerateAIReply={handleAIReply}
        />
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neue E-Mail</DialogTitle>
            <DialogDescription>
              E-Mail an Admin-Kontakt senden
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Empfänger (aus Kontakten)</Label>
              <Select value={composeData.contact_id} onValueChange={handleContactSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Kontakt auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                      {contact.company && ` (${contact.company})`}
                      {' – '}
                      {contact.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="to_email">E-Mail-Adresse *</Label>
                <Input
                  id="to_email"
                  type="email"
                  value={composeData.to_email}
                  onChange={(e) => setComposeData({ ...composeData, to_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to_name">Name</Label>
                <Input
                  id="to_name"
                  value={composeData.to_name}
                  onChange={(e) => setComposeData({ ...composeData, to_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Betreff *</Label>
              <Input
                id="subject"
                value={composeData.subject}
                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body_text">Nachricht *</Label>
              <Textarea
                id="body_text"
                rows={8}
                value={composeData.body_text}
                onChange={(e) => setComposeData({ ...composeData, body_text: e.target.value })}
                placeholder="Ihre Nachricht..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={() => sendMutation.mutate(composeData)}
              disabled={!composeData.to_email || !composeData.subject || !composeData.body_text || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Reply Assistant Dialog */}
      <AIReplyAssistant
        open={aiAssistantOpen}
        onOpenChange={setAiAssistantOpen}
        thread={selectedThread}
        messages={threadMessages}
        onAccept={handleAIReplyAccept}
      />
    </div>
  );
}
