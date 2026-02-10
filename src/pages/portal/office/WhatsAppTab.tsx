/**
 * WhatsApp Messenger Tab — MOD-02 KI Office Tile 6
 * 
 * Full messenger UI with conversation list + chat thread.
 * Supports realtime message updates via Supabase Realtime.
 * Owner-Control conversations are pinned and visually distinct.
 */

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Star, Paperclip, Phone, Download, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  wa_contact_e164: string;
  contact_name: string | null;
  is_owner_control: boolean;
  last_message_at: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  direction: 'in' | 'out';
  body_text: string | null;
  message_type: string;
  owner_control_command: boolean;
  status: string;
  created_at: string;
  media_count: number;
}

interface Attachment {
  id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  storage_node_id: string | null;
}

export function WhatsAppTab() {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch conversations
  const { data: conversations = [], isLoading: convsLoading } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
  });

  // Sort: Owner-Control pinned on top
  const sortedConversations = [...conversations].sort((a, b) => {
    if (a.is_owner_control && !b.is_owner_control) return -1;
    if (!a.is_owner_control && b.is_owner_control) return 1;
    return 0;
  });

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: msgsLoading } = useQuery({
    queryKey: ['whatsapp-messages', selectedConvId],
    queryFn: async () => {
      if (!selectedConvId) return [];
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', selectedConvId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
    enabled: !!selectedConvId,
  });

  // Fetch attachments for messages
  const messageIds = messages.map(m => m.id);
  const { data: attachments = [] } = useQuery({
    queryKey: ['whatsapp-attachments', messageIds],
    queryFn: async () => {
      if (messageIds.length === 0) return [];
      const { data, error } = await supabase
        .from('whatsapp_attachments')
        .select('*')
        .in('message_id', messageIds);
      if (error) throw error;
      return (data ?? []) as (Attachment & { message_id: string })[];
    },
    enabled: messageIds.length > 0,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
          queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'whatsapp_messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ conversationId, text }: { conversationId: string; text: string }) => {
      const { data, error } = await supabase.functions.invoke('sot-whatsapp-send', {
        body: { conversation_id: conversationId, text },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', selectedConvId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
    onError: () => {
      toast({
        title: 'Fehler',
        description: 'Nachricht konnte nicht gesendet werden.',
        variant: 'destructive',
      });
    },
  });

  const handleSend = () => {
    if (!messageText.trim() || !selectedConvId) return;
    sendMutation.mutate({ conversationId: selectedConvId, text: messageText.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAttachmentsForMessage = (messageId: string) =>
    attachments.filter((a: any) => a.message_id === messageId);

  // Empty state
  if (convsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-muted-foreground">Lade Konversationen...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight uppercase">WhatsApp</h1>
        <p className="text-muted-foreground mt-1">Nachrichten und Konversationen verwalten</p>
      </div>
    <Card className="glass-card overflow-hidden flex h-[calc(100vh-320px)]">
      {/* Left: Conversation List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm font-semibold">WhatsApp Chats</span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {sortedConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Keine Konversationen vorhanden.
              <br /><br />
              Nachrichten erscheinen hier, sobald sie über WhatsApp eingehen.
            </div>
          ) : (
            sortedConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-3 cursor-pointer border-b transition-colors hover:bg-accent/50 ${
                  selectedConvId === conv.id ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {conv.is_owner_control && (
                        <Star className="h-3.5 w-3.5 text-primary fill-primary flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm truncate">
                        {conv.is_owner_control
                          ? 'Armstrong Control'
                          : conv.contact_name || conv.wa_contact_e164}
                      </span>
                    </div>
                    {!conv.is_owner_control && conv.contact_name && (
                      <div className="text-xs text-muted-foreground truncate">
                        {conv.wa_contact_e164}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {conv.last_message_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conv.last_message_at), 'HH:mm', { locale: de })}
                      </span>
                    )}
                    {conv.unread_count > 0 && (
                      <Badge variant="default" className="text-xs px-1.5 py-0">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
                {conv.is_owner_control && (
                  <Badge variant="outline" className="mt-1 text-xs border-primary/30 text-primary">
                    <Bot className="h-3 w-3 mr-1" />
                    Armstrong
                  </Badge>
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Right: Chat Thread */}
      <div className="flex-1 flex flex-col">
        {!selectedConvId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Wählen Sie eine Konversation aus</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {selectedConv?.is_owner_control && (
                    <Star className="h-4 w-4 text-primary fill-primary" />
                  )}
                  <span className="font-semibold">
                    {selectedConv?.is_owner_control
                      ? 'Armstrong Control'
                      : selectedConv?.contact_name || selectedConv?.wa_contact_e164}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {selectedConv?.wa_contact_e164}
                </div>
              </div>
              {selectedConv?.is_owner_control && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Bot className="h-3 w-3 mr-1" />
                  Owner-Control aktiv
                </Badge>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {msgsLoading ? (
                <div className="text-center text-muted-foreground">Lade Nachrichten...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm">
                  Noch keine Nachrichten in dieser Konversation.
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOut = msg.direction === 'out';
                    const msgAttachments = getAttachmentsForMessage(msg.id);

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-3 py-2 ${
                            isOut
                              ? 'bg-primary text-primary-foreground'
                              : msg.owner_control_command
                                ? 'bg-primary/10 border border-primary/20'
                                : 'bg-muted'
                          }`}
                        >
                          {msg.owner_control_command && !isOut && (
                            <div className="flex items-center gap-1 text-xs text-primary mb-1">
                              <Bot className="h-3 w-3" />
                              Armstrong Command
                            </div>
                          )}
                          {msg.body_text && (
                            <p className="text-sm whitespace-pre-wrap">{msg.body_text}</p>
                          )}
                          {msgAttachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msgAttachments.map((att: any) => (
                                <div
                                  key={att.id}
                                  className="flex items-center gap-2 text-xs bg-background/50 rounded p-1.5"
                                >
                                  <Paperclip className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate flex-1">{att.file_name}</span>
                                  <Download className="h-3 w-3 flex-shrink-0 cursor-pointer opacity-70 hover:opacity-100" />
                                </div>
                              ))}
                            </div>
                          )}
                          <div
                            className={`text-xs mt-1 ${
                              isOut ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            {format(new Date(msg.created_at), 'HH:mm', { locale: de })}
                            {isOut && (
                              <span className="ml-1">
                                {msg.status === 'sent' && '✓'}
                                {msg.status === 'delivered' && '✓✓'}
                                {msg.status === 'read' && '✓✓'}
                                {msg.status === 'failed' && '✕'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Composer */}
            <div className="p-3 border-t flex items-center gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Nachricht eingeben..."
                className="flex-1"
                disabled={sendMutation.isPending}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!messageText.trim() || sendMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
    </div>
  );
}
