/**
 * ConversationView — Email Conversation Display
 * Shows chronological messages in a thread with reply capability
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Send, 
  Reply, 
  Sparkles, 
  ArrowUp, 
  ArrowDown,
  Mail,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { ThreadMessage, EmailThread } from '@/hooks/useAdminEmailThreads';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConversationViewProps {
  thread: EmailThread | null;
  messages: ThreadMessage[];
  isLoading?: boolean;
  onGenerateAIReply?: () => void;
}

const STATUS_ICONS = {
  queued: <Badge variant="outline" className="text-xs">Wartend</Badge>,
  sent: <CheckCircle2 className="h-3 w-3 text-blue-500" />,
  delivered: <CheckCircle2 className="h-3 w-3 text-green-500" />,
  opened: <CheckCircle2 className="h-3 w-3 text-purple-500" />,
  replied: <CheckCircle2 className="h-3 w-3 text-indigo-500" />,
  failed: <AlertCircle className="h-3 w-3 text-red-500" />,
};

export function ConversationView({ 
  thread, 
  messages, 
  isLoading,
  onGenerateAIReply 
}: ConversationViewProps) {
  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const queryClient = useQueryClient();

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!thread?.contact?.email) {
        throw new Error('Keine E-Mail-Adresse für diesen Kontakt');
      }

      const lastMessage = messages[messages.length - 1];
      const subject = thread.subject?.startsWith('Re:') 
        ? thread.subject 
        : `Re: ${thread.subject || 'Ihre Anfrage'}`;

      const { error } = await supabase.functions.invoke('sot-admin-mail-send', {
        body: {
          to_email: thread.contact.email,
          to_name: `${thread.contact.first_name} ${thread.contact.last_name}`,
          contact_id: thread.contact.id,
          subject,
          body_text: replyText,
        },
      });

      if (error) throw error;

      // Update thread with new message
      await supabase
        .from('admin_email_threads')
        .update({
          message_count: thread.message_count + 1,
          last_activity_at: new Date().toISOString(),
          status: 'awaiting_reply',
        })
        .eq('id', thread.id);
    },
    onSuccess: () => {
      toast.success('Antwort gesendet');
      setReplyText('');
      setShowReplyBox(false);
      queryClient.invalidateQueries({ queryKey: ['admin-email-threads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-thread-messages', thread?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-outbound-emails'] });
    },
    onError: (error) => {
      toast.error('Fehler beim Senden: ' + error.message);
    },
  });

  if (!thread) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Wählen Sie eine Konversation aus</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <h2 className="font-semibold truncate">{thread.subject || '(Kein Betreff)'}</h2>
        <p className="text-sm text-muted-foreground">
          {thread.contact?.first_name} {thread.contact?.last_name}
          {thread.contact?.company && ` · ${thread.contact.company}`}
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Keine Nachrichten in dieser Konversation</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Reply Box */}
      <div className="p-4 border-t bg-muted/30">
        {showReplyBox ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Ihre Antwort..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerateAIReply}
                  disabled={!onGenerateAIReply}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  KI-Vorschlag
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyText('');
                  }}
                >
                  Abbrechen
                </Button>
                <Button
                  size="sm"
                  onClick={() => sendReply.mutate()}
                  disabled={!replyText.trim() || sendReply.isPending}
                >
                  {sendReply.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1" />
                  )}
                  Senden
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            className="w-full"
            variant="outline"
            onClick={() => setShowReplyBox(true)}
          >
            <Reply className="h-4 w-4 mr-2" />
            Antworten
          </Button>
        )}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ThreadMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.type === 'outbound';
  const timestamp = message.sent_at || message.received_at;

  return (
    <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
      <Card className={cn(
        'max-w-[80%] p-4',
        isOutbound 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-background'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center gap-2 mb-2 text-xs',
          isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {isOutbound ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          <span>{isOutbound ? 'Gesendet' : 'Empfangen'}</span>
          {timestamp && (
            <span>
              {format(new Date(timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
            </span>
          )}
          {isOutbound && message.status && (
            <span className="ml-auto">
              {STATUS_ICONS[message.status as keyof typeof STATUS_ICONS]}
            </span>
          )}
        </div>

        {/* Subject (if first message or subject differs) */}
        {message.subject && (
          <p className={cn(
            'text-sm font-medium mb-2',
            isOutbound ? 'text-primary-foreground' : 'text-foreground'
          )}>
            {message.subject}
          </p>
        )}

        {/* Body */}
        <div className={cn(
          'text-sm whitespace-pre-wrap',
          isOutbound ? 'text-primary-foreground/90' : 'text-foreground'
        )}>
          {message.body_text || (
            <div 
              dangerouslySetInnerHTML={{ __html: message.body_html || '' }}
              className="prose prose-sm max-w-none"
            />
          )}
        </div>
      </Card>
    </div>
  );
}
