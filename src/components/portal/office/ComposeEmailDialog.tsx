import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, Send, X, ChevronDown, ChevronUp,
  Sparkles, Wand2, Scissors, MessageSquareText,
  Settings, FileText, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { VoiceButton } from '@/components/shared/VoiceButton';
import { useArmstrongVoice } from '@/hooks/useArmstrongVoice';

interface EmailAccountInfo {
  id: string;
  email_address: string;
  provider: string;
}

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: EmailAccountInfo[];
  defaultAccountId: string;
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

interface MailTemplate {
  id: string;
  name: string;
  category: string;
  subject_template: string;
  body_template: string;
  placeholders: any;
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
  accounts,
  defaultAccountId,
  onSent,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
}: ComposeEmailDialogProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccountId);
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];
  const accountId = selectedAccount?.id || '';
  const accountEmail = selectedAccount?.email_address || '';

  useEffect(() => {
    if (open) {
      setSelectedAccountId(defaultAccountId);
    }
  }, [open, defaultAccountId]);

  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isSending, setIsSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [dictationTarget, setDictationTarget] = useState<DictationTarget>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // PR 3: Signature & Footer toggles
  const [includeSignature, setIncludeSignature] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(false);
  const [signatureText, setSignatureText] = useState('');
  const [hasLetterhead, setHasLetterhead] = useState(false);

  // PR 3: Quality check
  const [qualityResult, setQualityResult] = useState<string | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);

  // PR 3: Templates
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [profileData, setProfileData] = useState<any>(null);

  // Contact typeahead state
  const [contactSuggestions, setContactSuggestions] = useState<ContactSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const toInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const isReply = !!initialBody;

  // Load profile + templates on open
  useEffect(() => {
    if (open) {
      setTo(initialTo);
      setSubject(initialSubject);
      setQualityResult(null);

      (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { data: profile } = await supabase
            .from('profiles')
            .select('email_signature, letterhead_company_line, letterhead_extra_line, letterhead_website, letterhead_bank_name, letterhead_iban, letterhead_bic, first_name, last_name, phone')
            .eq('id', user.id)
            .single();

          setProfileData(profile);
          setSignatureText(profile?.email_signature || '');
          const hasLh = !!(profile?.letterhead_company_line || profile?.letterhead_extra_line || profile?.letterhead_website);
          setHasLetterhead(hasLh);
          setIncludeFooter(hasLh);

          // PR 3: No client-side signature appending — server handles it
          if (!initialBody) {
            setBody('');
          } else {
            setBody(initialBody);
          }

          // Load templates
          const { data: tpls } = await supabase
            .from('mail_compose_templates')
            .select('id, name, category, subject_template, body_template, placeholders')
            .eq('is_active', true)
            .order('category')
            .order('name');
          setTemplates((tpls as MailTemplate[]) || []);
        } catch {
          setBody(initialBody || '');
        }
      })();
    }
  }, [open, initialTo, initialSubject, initialBody]);

  const voice = useArmstrongVoice();
  const lastTranscriptRef = useRef('');

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

  useEffect(() => {
    if (!open && voice.isListening) {
      voice.stopListening();
      setDictationTarget(null);
    }
  }, [open, voice.isListening, voice.stopListening]);

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

  // PR 3: Template selection
  const handleTemplateSelect = (template: MailTemplate) => {
    let subjectText = template.subject_template;
    let bodyTemplateText = template.body_template;

    // Replace placeholders from profile
    const replacements: Record<string, string> = {
      '{{agent_name}}': [profileData?.first_name, profileData?.last_name].filter(Boolean).join(' ') || '',
      '{{agent_phone}}': profileData?.phone || '',
      '{{agent_email}}': accountEmail || '',
    };

    // Try to extract recipient name from 'to' field contact
    const toEmail = to.split(/[,;]/)[0]?.trim();
    if (toEmail) {
      const matched = contactSuggestions.find(c => c.email === toEmail);
      if (matched) {
        replacements['{{first_name}}'] = matched.first_name || '';
        replacements['{{last_name}}'] = matched.last_name || '';
        replacements['{{company}}'] = '';
      }
    }

    for (const [key, val] of Object.entries(replacements)) {
      subjectText = subjectText.replaceAll(key, val);
      bodyTemplateText = bodyTemplateText.replaceAll(key, val);
    }

    // Warn about unresolved placeholders
    const unresolved = bodyTemplateText.match(/\{\{[^}]+\}\}/g);
    if (unresolved) {
      toast.warning(`Unaufgelöste Platzhalter: ${unresolved.join(', ')}`, {
        description: 'Bitte manuell ersetzen oder Kontaktdaten vervollständigen.',
      });
    }

    setSubject(subjectText);
    setBody(bodyTemplateText);
    toast.success(`Template "${template.name}" geladen`);
  };

  // AI assist
  const handleAiAction = async (action: 'text_improve' | 'text_shorten' | 'suggest_subject' | 'quality_check' | 'text_expand') => {
    const text = body.trim();
    if (!text) {
      toast.error('Bitte schreiben Sie zuerst einen Text');
      return;
    }

    if (action === 'quality_check') {
      setQualityLoading(true);
      setQualityResult(null);
      try {
        const fullText = subject ? `Betreff: ${subject}\n\n${text}` : text;
        const { data, error } = await supabase.functions.invoke('sot-mail-ai-assist', {
          body: { action: 'quality_check', text: fullText },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setQualityResult(data.result);
      } catch (err: any) {
        toast.error('Qualitätscheck fehlgeschlagen: ' + (err.message || 'Unbekannt'));
      } finally {
        setQualityLoading(false);
      }
      return;
    }

    setAiLoading(true);
    try {
      const requestBody: Record<string, string> = { action, text };
      if (action === 'text_expand') {
        if (subject) requestBody.subject = subject;
        if (to) requestBody.recipientName = to.split('@')[0].replace(/[._-]/g, ' ');
      }
      const { data, error } = await supabase.functions.invoke('sot-mail-ai-assist', {
        body: requestBody,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (action === 'suggest_subject') {
        setSubject(data.result);
        toast.success('Betreff vorgeschlagen');
      } else {
        setBody(data.result);
        const msgs: Record<string, string> = { text_improve: 'Text verbessert', text_shorten: 'Text gekürzt', text_expand: 'Text ausformuliert' };
        toast.success(msgs[action] || 'Fertig');
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
    setQualityResult(null);
    setIncludeSignature(true);
    setIncludeFooter(false);
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

      // PR 3: Send flags to server for body assembly
      const { data, error } = await supabase.functions.invoke('sot-mail-send', {
        body: {
          accountId,
          to: toAddresses,
          cc: ccAddresses,
          bcc: bccAddresses,
          subject: subject.trim(),
          bodyText: body,
          bodyHtml: body ? `<pre style="font-family: inherit; white-space: pre-wrap;">${body}</pre>` : undefined,
          includeSignature,
          includeFooter,
          isReply,
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

  // Group templates by category
  const templatesByCategory = useMemo(() => {
    const grouped: Record<string, MailTemplate[]> = {};
    for (const t of templates) {
      const cat = t.category || 'allgemein';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    }
    return grouped;
  }, [templates]);

  const categoryLabels: Record<string, string> = {
    vertrieb: 'Vertrieb',
    follow_up: 'Follow-up',
    termin: 'Termine',
    allgemein: 'Allgemein',
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
          {/* From — selectable when multiple accounts */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Von</Label>
            {accounts.length > 1 ? (
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <span className="flex items-center gap-2">
                        {acc.provider === 'google' ? (
                          <svg className="h-3 w-3" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg>
                        ) : (
                          <Settings className="h-3 w-3" />
                        )}
                        {acc.email_address}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm px-3 py-2 bg-muted/50 rounded-md">
                {accountEmail}
              </div>
            )}
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

          {/* Body with Voice + AI Toolbar + Template Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-body">Nachricht</Label>
              <div className="flex items-center gap-1">
                {/* Template Picker */}
                {templates.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        disabled={isSending}
                      >
                        <FileText className="h-3 w-3" />
                        Vorlage
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                      {Object.entries(templatesByCategory).map(([cat, tpls], idx) => (
                        <div key={cat}>
                          {idx > 0 && <DropdownMenuSeparator />}
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                            {categoryLabels[cat] || cat}
                          </div>
                          {tpls.map(t => (
                            <DropdownMenuItem key={t.id} onClick={() => handleTemplateSelect(t)}>
                              {t.name}
                            </DropdownMenuItem>
                          ))}
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* AI Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      disabled={aiLoading || qualityLoading || isSending}
                    >
                      {(aiLoading || qualityLoading) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      KI
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAiAction('text_expand')}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Ausformulieren
                    </DropdownMenuItem>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleAiAction('quality_check')}>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Qualitätscheck
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
              onChange={(e) => { setBody(e.target.value); setQualityResult(null); }}
              disabled={isSending}
              rows={10}
              className="resize-none"
            />
            {voice.isListening && dictationTarget === 'body' && (
              <p className="text-xs text-primary animate-pulse">
                🎤 Mikrofon aktiv — Sprechen Sie Ihre Nachricht...
              </p>
            )}

            {/* PR 3: Quality Check Result */}
            {qualityLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted/30 rounded-md">
                <Loader2 className="h-3 w-3 animate-spin" />
                Qualitätscheck läuft...
              </div>
            )}
            {qualityResult && (
              <div className="text-xs p-3 bg-muted/40 rounded-md border border-border/50 space-y-0.5 whitespace-pre-wrap">
                <div className="flex items-center gap-1 font-medium text-foreground mb-1">
                  <ShieldCheck className="h-3 w-3" />
                  Qualitätscheck
                </div>
                {qualityResult}
              </div>
            )}
          </div>

          {/* PR 3: Signature & Footer Toggles */}
          <div className="flex flex-col gap-2 pt-1 border-t border-border/30">
            <div className="flex items-center gap-2">
              <Checkbox
                id="sig-toggle"
                checked={includeSignature}
                onCheckedChange={(v) => setIncludeSignature(!!v)}
                disabled={isSending || !signatureText}
              />
              <label htmlFor="sig-toggle" className="text-xs text-muted-foreground cursor-pointer select-none">
                Signatur anhängen
              </label>
              {!signatureText && (
                <span className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Keine Signatur in Profil hinterlegt
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="footer-toggle"
                checked={includeFooter}
                onCheckedChange={(v) => setIncludeFooter(!!v)}
                disabled={isSending || !hasLetterhead}
              />
              <label htmlFor="footer-toggle" className="text-xs text-muted-foreground cursor-pointer select-none">
                Rechtlicher Footer (Impressum)
              </label>
              {!hasLetterhead && (
                <span className="text-xs text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Briefkopf-Daten in Stammdaten ausfüllen
                </span>
              )}
            </div>
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
