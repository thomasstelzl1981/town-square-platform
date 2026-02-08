/**
 * AIReplyAssistant — Armstrong-powered Email Reply Generator
 * Generates contextual email replies using AI
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EmailThread, ThreadMessage } from '@/hooks/useAdminEmailThreads';

interface AIReplyAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thread: EmailThread | null;
  messages: ThreadMessage[];
  onAccept: (text: string) => void;
}

type ToneType = 'professional' | 'friendly' | 'sales';

const TONE_OPTIONS: { value: ToneType; label: string; desc: string }[] = [
  { value: 'professional', label: 'Professionell', desc: 'Sachlich und formal' },
  { value: 'friendly', label: 'Freundlich', desc: 'Warm und persönlich' },
  { value: 'sales', label: 'Verkauf', desc: 'Überzeugend und aktionsorientiert' },
];

export function AIReplyAssistant({ 
  open, 
  onOpenChange, 
  thread, 
  messages,
  onAccept 
}: AIReplyAssistantProps) {
  const [selectedTone, setSelectedTone] = useState<ToneType>('professional');
  const [generatedReply, setGeneratedReply] = useState('');
  const [copied, setCopied] = useState(false);

  const generateReply = useMutation({
    mutationFn: async () => {
      if (!thread?.contact) {
        throw new Error('Kein Kontakt ausgewählt');
      }

      // Build context from thread messages
      const conversationContext = messages.map(m => ({
        type: m.type,
        from: m.type === 'inbound' ? m.from_email : 'System of a Town',
        text: m.body_text || '',
        date: m.sent_at || m.received_at,
      }));

      // Call Armstrong advisor for email reply generation
      const { data, error } = await supabase.functions.invoke('sot-armstrong-advisor', {
        body: {
          action_code: 'ARM.Z1.DRAFT_EMAIL_REPLY',
          zone: 'Z1',
          input_context: {
            contact: {
              name: `${thread.contact.first_name} ${thread.contact.last_name}`,
              company: thread.contact.company,
              category: thread.contact.category,
              email: thread.contact.email,
            },
            thread_subject: thread.subject,
            conversation: conversationContext,
            tone: selectedTone,
          },
        },
      });

      if (error) throw error;
      return data?.result?.draft_text || data?.content || '';
    },
    onSuccess: (text) => {
      setGeneratedReply(text);
    },
    onError: (error) => {
      toast.error('Fehler bei KI-Generierung: ' + error.message);
    },
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('In Zwischenablage kopiert');
  };

  const handleAccept = () => {
    onAccept(generatedReply);
    setGeneratedReply('');
  };

  const handleClose = () => {
    setGeneratedReply('');
    onOpenChange(false);
  };

  // Get last inbound message for preview
  const lastInbound = messages.filter(m => m.type === 'inbound').pop();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Antwort-Assistent
          </DialogTitle>
          <DialogDescription>
            Generiere eine kontextbezogene Antwort mit Armstrong AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Context Preview */}
          {lastInbound && (
            <Card className="p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground mb-1">Letzte Nachricht von {thread?.contact?.first_name}:</p>
              <p className="text-sm line-clamp-3">{lastInbound.body_text}</p>
            </Card>
          )}

          {/* Tone Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Tonalität auswählen:</p>
            <div className="flex gap-2">
              {TONE_OPTIONS.map(tone => (
                <Button
                  key={tone.value}
                  variant={selectedTone === tone.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTone(tone.value)}
                  className="flex-1"
                >
                  <div className="text-left">
                    <span className="block">{tone.label}</span>
                    <span className="text-xs opacity-70">{tone.desc}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          {!generatedReply && (
            <Button
              onClick={() => generateReply.mutate()}
              disabled={generateReply.isPending || !thread}
              className="w-full"
            >
              {generateReply.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generiere Antwort...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Antwort generieren
                </>
              )}
            </Button>
          )}

          {/* Generated Reply */}
          {generatedReply && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">KI-Entwurf</Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => generateReply.mutate()}
                    disabled={generateReply.isPending}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                value={generatedReply}
                onChange={(e) => setGeneratedReply(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Abbrechen
          </Button>
          {generatedReply && (
            <Button onClick={handleAccept}>
              Übernehmen & Bearbeiten
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
