import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, Send, X, ChevronDown, ChevronUp,
  Sparkles, Wand2, Scissors, MessageSquareText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VoiceButton } from '@/components/shared/VoiceButton';
import { useArmstrongVoice } from '@/hooks/useArmstrongVoice';

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  accountEmail: string;
  onSent: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

type DictationTarget = 'subject' | 'body' | null;

interface ContactSuggestion {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
  accountId,
  accountEmail,
  onSent,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
}: ComposeEmailDialogProps) {
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isSending, setIsSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [dictationTarget, setDictationTarget] = useState<DictationTarget>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Contact typeahead state
  const [contactSuggestions, setContactSuggestions] = useState<ContactSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const toInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Load email signature on open (only for new emails without initial body)
  useEffect(() => {
    if (open) {
      setTo(initialTo);
      setSubject(initialSubject);

      // Only load signature for new emails (no initial body = not a reply)
      if (!initialBody) {
        (async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase
              .from('profiles')
              .select('email_signature')
              .eq('id', user.id)
              .single();
            if (profile?.email_signature) {
              setBody(`\n\n--\n${profile.email_signature}`);
            } else {
              setBody('');
            }
          } catch {
            setBody('');
          }
        })();
      } else {
        setBody(initialBody);
      }
    }
  }, [open, initialTo, initialSubject, initialBody]);

  const voice = useArmstrongVoice();
  const lastTranscriptRef = useRef('');

  // Watch for transcript changes and append to the target field
  useEffect(() => {
    if (voice.transcript && voice.transcript !== lastTranscriptRef.current) {
      const newText = voice.transcript.slice(lastTranscriptRef.current.length);
      lastTranscriptRef.current = voice.transcript;

      if (dictationTarget === 'subject') {
        setSubject(prev => prev + newText);
      } else if (dictationTarget === 'body') {
        setBody(prev => prev + newText);
      }
    }
  }, [voice.transcript, dictationTarget]);

  // Stop dictation when dialog closes
  useEffect(() => {
    if (!open && voice.isListening) {
      voice.stopListening();
      setDictationTarget(null);
    }
  }, [open, voice.isListening, voice.stopListening]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
        toInputRef.current && !toInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleDictation = (target: DictationTarget) => {
    if (voice.isListening && dictationTarget === target) {
      voice.stopListening();
      setDictationTarget(null);
      lastTranscriptRef.current = '';
    } else {
      if (voice.isListening) {
        voice.stopListening();
      }
      setDictationTarget(target);
      lastTranscriptRef.current = voice.transcript || '';
      voice.startListening();
    }
  };

  // Contact search
  const searchContacts = useCallback(async (query: string) => {
    if (query.length < 2) {
      setContactSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSuggestionLoading(true);
    try {
      const { data } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name')
        .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .not('email', 'is', null)
        .limit(8);
      const filtered = (data || []).filter(c => c.email) as ContactSuggestion[];
      setContactSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } catch {
      setContactSuggestions([]);
    } finally {
      setSuggestionLoading(false);
    }
  }, []);

  const handleToChange = (value: string) => {
    setTo(value);
    // Get the last segment after comma/semicolon for searching
    const parts = value.split(/[,;]/);
    const lastPart = parts[parts.length - 1].trim();
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchContacts(lastPart), 250);
  };

  const selectContact = (contact: ContactSuggestion) => {
    const parts = to.split(/[,;]/);
    parts[parts.length - 1] = ` ${contact.email}`;
    setTo(parts.join(',').replace(/^,\s*/, ''));
    setShowSuggestions(false);
    toInputRef.current?.focus();
  };

  // AI assist
  const handleAiAction = async (action: 'text_improve' | 'text_shorten' | 'suggest_subject') => {
    const text = body.trim();
    if (!text) {
      toast.error('Bitte schreiben Sie zuerst einen Text');
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-mail-ai-assist', {
        body: { action, text },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (action === 'suggest_subject') {
        setSubject(data.result);
        toast.success('Betreff vorgeschlagen');
      } else {
        setBody(data.result);
        toast.success(action === 'text_improve' ? 'Text verbessert' : 'Text gekürzt');
      }
    } catch (err: any) {
      toast.error('KI-Fehler: ' + (err.message || 'Unbekannt'));
    } finally {
      setAiLoading(false);
    }
  };

  const resetForm = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
    setShowCcBcc(false);
    setDictationTarget(null);
    lastTranscriptRef.current = '';
    setContactSuggestions([]);
    setShowSuggestions(false);
  };

  const handleClose = () => {
    if (isSending) return;
    if (voice.isListening) {
      voice.stopListening();
    }
    resetForm();
    onOpenChange(false);
  };

  const handleSend = async () => {
    if (!to.trim()) {
      toast.error('Bitte geben Sie einen Empfänger an');
      return;
    }
    if (!subject.trim()) {
      toast.error('Bitte geben Sie einen Betreff an');
      return;
    }

    setIsSending(true);
    try {
      const parseEmails = (input: string) =>
        input.split(/[,;]/)
          .map(e => e.trim())
          .filter(e => e.length > 0 && e.includes('@'));

      const toAddresses = parseEmails(to);
      const ccAddresses = cc ? parseEmails(cc) : undefined;
      const bccAddresses = bcc ? parseEmails(bcc) : undefined;

      if (toAddresses.length === 0) {
        throw new Error('Ungültige E-Mail-Adresse');
      }

      const { data, error } = await supabase.functions.invoke('sot-mail-send', {
        body: {
          accountId,
          to: toAddresses,
          cc: ccAddresses,
          bcc: bccAddresses,
          subject: subject.trim(),
          bodyText: body,
          bodyHtml: body ? `<pre style="font-family: inherit; white-space: pre-wrap;">${body}</pre>` : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('E-Mail wurde gesendet');
      resetForm();
      onSent();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Send email error:', error);
      toast.error('Senden fehlgeschlagen: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Neue E-Mail
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-4">
          {/* From (read-only) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Von</Label>
            <div className="text-sm px-3 py-2 bg-muted/50 rounded-md">
              {accountEmail}
            </div>
          </div>

          {/* To with typeahead */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-to">An</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() => setShowCcBcc(!showCcBcc)}
              >
                {showCcBcc ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                CC/BCC
              </Button>
            </div>
            <div className="relative">
              <Input
                ref={toInputRef}
                id="email-to"
                placeholder="empfaenger@email.de"
                value={to}
                onChange={(e) => handleToChange(e.target.value)}
                onFocus={() => { if (contactSuggestions.length > 0) setShowSuggestions(true); }}
                disabled={isSending}
                autoComplete="off"
              />
              {showSuggestions && contactSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
                >
                  {contactSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2 transition-colors"
                      onClick={() => selectContact(c)}
                    >
                      <span className="font-medium truncate">
                        {[c.first_name, c.last_name].filter(Boolean).join(' ') || c.email}
                      </span>
                      {(c.first_name || c.last_name) && (
                        <span className="text-muted-foreground text-xs truncate">{c.email}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Mehrere Empfänger mit Komma trennen
            </p>
          </div>

          {/* CC & BCC */}
          {showCcBcc && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email-cc">CC</Label>
                <Input
                  id="email-cc"
                  placeholder="cc@email.de"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  disabled={isSending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-bcc">BCC</Label>
                <Input
                  id="email-bcc"
                  placeholder="bcc@email.de"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  disabled={isSending}
                />
              </div>
            </>
          )}

          {/* Subject with Voice */}
          <div className="space-y-2">
            <Label htmlFor="email-subject">Betreff</Label>
            <div className="flex items-center gap-2">
              <Input
                id="email-subject"
                placeholder="Betreff eingeben..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSending}
                className="flex-1"
                autoComplete="off"
                name="email-subject-field"
              />
              <VoiceButton
                isListening={voice.isListening && dictationTarget === 'subject'}
                isProcessing={voice.isProcessing && dictationTarget === 'subject'}
                isSpeaking={voice.isSpeaking}
                isConnected={voice.isConnected}
                error={voice.error}
                onToggle={() => handleDictation('subject')}
                size="sm"
              />
            </div>
          </div>

          {/* Body with Voice + AI Toolbar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-body">Nachricht</Label>
              <div className="flex items-center gap-1">
                {/* AI Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={aiLoading || isSending}
                    >
                      {aiLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      KI
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAiAction('text_improve')}>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Text verbessern
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAiAction('text_shorten')}>
                      <Scissors className="h-4 w-4 mr-2" />
                      Text kürzen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAiAction('suggest_subject')}>
                      <MessageSquareText className="h-4 w-4 mr-2" />
                      Betreff vorschlagen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <VoiceButton
                  isListening={voice.isListening && dictationTarget === 'body'}
                  isProcessing={voice.isProcessing && dictationTarget === 'body'}
                  isSpeaking={voice.isSpeaking}
                  isConnected={voice.isConnected}
                  error={voice.error}
                  onToggle={() => handleDictation('body')}
                  size="sm"
                />
              </div>
            </div>
            <Textarea
              id="email-body"
              placeholder="Ihre Nachricht... (Mikrofon-Button für Spracheingabe)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isSending}
              rows={12}
              className="resize-none"
            />
            {voice.isListening && dictationTarget === 'body' && (
              <p className="text-xs text-primary animate-pulse">
                🎤 Mikrofon aktiv — Sprechen Sie Ihre Nachricht...
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSending}
          >
            <X className="h-4 w-4 mr-2" />
            Abbrechen
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !to.trim() || !subject.trim()}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Senden
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
