import { useState, useEffect } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  User, 
  FileText, 
  Send, 
  Save, 
  Loader2,
  Check,
  ChevronsUpDown,
  ChevronDown,
  Mail,
  Phone,
  FileOutput,
  Mic,
  History,
  Type,
  Download,
  Eye,
} from 'lucide-react';
import { LetterPreview, type LetterFont } from '@/components/portal/office/LetterPreview';
import { SenderSelector, CreateContextDialog, type SenderOption } from '@/components/shared';
import { generateLetterPdf, type LetterPdfData } from '@/lib/letterPdf';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData/engine';
interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
  salutation: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
}

interface LandlordContext {
  id: string;
  name: string;
  context_type: string;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  legal_form: string | null;
}

interface Profile {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  active_tenant_id: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  letterhead_logo_url: string | null;
}

export function BriefTab() {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-KONTEN');
  const [searchParams] = useSearchParams();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [manualRecipient, setManualRecipient] = useState(false);
  const [manualFields, setManualFields] = useState({
    salutation: '',
    first_name: '',
    last_name: '',
    company: '',
    street: '',
    postal_code: '',
    city: '',
  });
  const [subject, setSubject] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [channel, setChannel] = useState<'email' | 'fax' | 'post'>('email');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSenderId, setSelectedSenderId] = useState<string | null>(null);
  const [showCreateContext, setShowCreateContext] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [letterFont, setLetterFont] = useState<LetterFont>('din');

  // Fetch profile for private sender
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name, active_tenant_id, street, house_number, postal_code, city, letterhead_logo_url')
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });

  // Fetch landlord contexts for sender selection
  const { data: contexts = [] } = useQuery({
    queryKey: ['sender-contexts', activeTenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landlord_contexts')
        .select('id, name, context_type, street, house_number, postal_code, city, legal_form')
        .eq('tenant_id', activeTenantId!)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data as LandlordContext[];
    },
    enabled: !!activeTenantId,
  });

  // Build sender options
  const senderOptions: SenderOption[] = [
    // Private sender from profile
    {
      id: 'private',
      type: 'PRIVATE',
      label: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.display_name || 'Privatperson',
      sublabel: 'Persönlicher Absender',
      address: profile ? [
        [profile.street, profile.house_number].filter(Boolean).join(' '),
        [profile.postal_code, profile.city].filter(Boolean).join(' '),
      ].filter(Boolean).join(', ') || undefined : undefined,
    },
    // Business contexts (filtered by demo toggle)
    ...(demoEnabled ? contexts : contexts.filter(c => !isDemoId(c.id))).map((ctx): SenderOption => ({
      id: ctx.id,
      type: ctx.context_type as 'PRIVATE' | 'BUSINESS',
      label: ctx.name,
      sublabel: ctx.legal_form || (ctx.context_type === 'BUSINESS' ? 'Unternehmen' : 'Privat'),
      company: ctx.name,
      address: [
        [ctx.street, ctx.house_number].filter(Boolean).join(' '),
        [ctx.postal_code, ctx.city].filter(Boolean).join(' '),
      ].filter(Boolean).join(', ') || undefined,
    })),
  ];

  // Auto-select first sender on load
  useEffect(() => {
    if (!selectedSenderId && senderOptions.length > 0) {
      setSelectedSenderId(senderOptions[0].id);
    }
  }, [senderOptions, selectedSenderId]);

  // Get selected sender object
  const selectedSender = senderOptions.find(s => s.id === selectedSenderId);

  // Fetch contacts for picker
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-letter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, company, salutation, street, postal_code, city')
        .order('last_name');
      if (error) throw error;
      return data as Contact[];
    },
  });

  // Pre-fill from URL parameters (from TenancyTab links)
  useEffect(() => {
    if (prefillApplied || contacts.length === 0) return;

    const contactId = searchParams.get('contactId');
    const subjectParam = searchParams.get('subject');
    const promptParam = searchParams.get('prompt');

    if (contactId || subjectParam || promptParam) {
      if (subjectParam) setSubject(subjectParam);
      if (promptParam) setPrompt(promptParam);

      // Auto-select contact if passed via URL
      if (contactId) {
        const contact = contacts.find(c => c.id === contactId);
        if (contact) setSelectedContact(contact);
      }

      setPrefillApplied(true);
    }
  }, [searchParams, contacts, prefillApplied]);

  // Fetch recent drafts
  const { data: recentDrafts = [] } = useQuery({
    queryKey: ['recent-letter-drafts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('letter_drafts')
        .select('id, subject, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('active_tenant_id, id')
        .single();
      
      if (!profileData?.active_tenant_id) {
        throw new Error('Kein aktiver Mandant ausgewählt');
      }

      const { error } = await supabase.from('letter_drafts').insert({
        tenant_id: profileData.active_tenant_id,
        created_by: profileData.id,
        recipient_contact_id: selectedContact?.id || null,
        subject,
        prompt,
        body: generatedBody,
        status: 'draft',
        channel,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Entwurf gespeichert');
      queryClient.invalidateQueries({ queryKey: ['recent-letter-drafts'] });
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + error.message);
    },
  });

  // Build effective recipient from contact or manual fields
  const getEffectiveRecipient = (): Contact | null => {
    if (manualRecipient) {
      if (!manualFields.last_name.trim()) return null;
      return {
        id: '',
        first_name: manualFields.first_name,
        last_name: manualFields.last_name,
        email: null,
        company: manualFields.company || null,
        salutation: manualFields.salutation || null,
        street: manualFields.street || null,
        postal_code: manualFields.postal_code || null,
        city: manualFields.city || null,
      };
    }
    return selectedContact;
  };

  // Generate letter with AI
  const handleGenerate = async () => {
    const recipient = getEffectiveRecipient();
    if (!recipient) {
      toast.error('Bitte wählen Sie einen Empfänger aus oder geben Sie mindestens einen Nachnamen ein');
      return;
    }
    if (!prompt.trim()) {
      toast.error('Bitte beschreiben Sie Ihr Anliegen');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('sot-letter-generate', {
        body: {
          recipient: {
            name: `${recipient.first_name} ${recipient.last_name}`,
            company: recipient.company,
            salutation: recipient.salutation,
          },
          subject,
          prompt,
          senderIdentity: selectedSender ? {
            name: selectedSender.label,
            company: selectedSender.type === 'BUSINESS' ? selectedSender.company : undefined,
            address: selectedSender.address,
          } : undefined,
        },
      });

      if (response.error) {
        console.error('Letter generate error:', response.error);
        throw response.error;
      }
      
      const bodyText = response.data?.body;
      if (!bodyText) {
        console.error('Empty body in response:', response.data);
        throw new Error('Leere Antwort vom Server');
      }
      
      setGeneratedBody(bodyText);
      toast.success('Brief wurde generiert');
      
      // Auto-scroll to generated text
      setTimeout(() => {
        document.querySelector('[placeholder="Der generierte Brief erscheint hier..."]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (error: any) {
      toast.error('Fehler bei der Generierung: ' + error.message);
      // Fallback demo text with sender
      const senderLine = selectedSender?.type === 'BUSINESS' 
        ? `${selectedSender.company}\ni.A. ${[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Ihr Team'}`
        : [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Ihr Team';
      
      setGeneratedBody(`Sehr geehrte${recipient.first_name ? 'r' : ''} ${recipient.first_name || ''} ${recipient.last_name},

bezugnehmend auf ${subject || 'Ihr Anliegen'} möchten wir Ihnen folgendes mitteilen:

${prompt}

Für Rückfragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen,
${senderLine}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── PDF helpers ──
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [faxNumber, setFaxNumber] = useState('');

  const buildPdfData = (): LetterPdfData => {
    const r = getEffectiveRecipient();
    return {
      senderName: selectedSender?.label,
      senderCompany: selectedSender?.type === 'BUSINESS' ? selectedSender?.company : undefined,
      senderAddress: selectedSender?.address,
      senderCity: (() => {
        if (selectedSenderId === 'private') return profile?.city || undefined;
        const ctx = contexts.find(c => c.id === selectedSenderId);
        return ctx?.city || undefined;
      })(),
      senderRole: selectedSender?.sublabel !== 'Persönlicher Absender' ? selectedSender?.sublabel : undefined,
      recipientName: r ? `${r.first_name} ${r.last_name}` : undefined,
      recipientCompany: r?.company || undefined,
      recipientAddress: r ? [
        r.street,
        [r.postal_code, r.city].filter(Boolean).join(' '),
      ].filter(Boolean).join('\n') || undefined : undefined,
      subject,
      body: generatedBody,
    };
  };

  const handlePdfPreview = () => {
    if (!generatedBody) return;
    const { dataUrl } = generateLetterPdf(buildPdfData());
    setPdfPreviewUrl(dataUrl);
    setShowPdfPreview(true);
  };

  const handlePdfDownload = () => {
    if (!generatedBody) return;
    const { blob } = generateLetterPdf(buildPdfData());
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Brief_${subject?.replace(/[^a-zA-Z0-9äöüÄÖÜ]/g, '_') || 'Entwurf'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('PDF heruntergeladen');
  };

  const handleSend = async () => {
    const recipient = getEffectiveRecipient();
    if (!generatedBody || !recipient) return;

    // Validate channel-specific requirements
    if (channel === 'fax' && !faxNumber.trim()) {
      toast.error('Bitte geben Sie eine Faxnummer ein');
      return;
    }
    if (channel === 'email' && !recipient.email) {
      toast.error('Dieser Empfänger hat keine E-Mail-Adresse');
      return;
    }

    setIsSending(true);
    try {
      const { base64 } = generateLetterPdf(buildPdfData());
      const pdfFilename = `Brief_${subject?.replace(/[^a-zA-Z0-9]/g, '_') || 'Dokument'}.pdf`;
      const recipientFullName = `${recipient.first_name} ${recipient.last_name}`;

      let mailTo: string;
      let mailSubject: string;
      let mailHtml: string;
      let mailContext: string;

      if (channel === 'email') {
        // Direct email to recipient
        mailTo = recipient.email!;
        mailSubject = subject || 'Schreiben';
        mailHtml = `<p>Sehr geehrte${recipient.salutation === 'Frau' ? '' : 'r'} ${recipientFullName},</p>
<p>anbei erhalten Sie ein Schreiben zum Thema „${subject || 'siehe Anhang'}".</p>
<p>Bei Rückfragen stehen wir Ihnen gerne zur Verfügung.</p>
<p>Mit freundlichen Grüßen,<br/>${selectedSender?.label || 'Ihr Ansprechpartner'}</p>`;
        mailContext = 'letter_email';
      } else if (channel === 'fax') {
        // SimpleFax: fax number in subject
        mailTo = 'simplefax@systemofatown.com';
        mailSubject = faxNumber.trim();
        mailHtml = `<p>Fax an: ${faxNumber.trim()}</p><p>Empfänger: ${recipientFullName}</p>`;
        mailContext = 'letter_fax';
      } else {
        // SimpleBrief: just send the PDF
        mailTo = 'simplebrief@systemofatown.com';
        mailSubject = `Brief an ${recipientFullName}`;
        mailHtml = `<p>Brief-Versand an:</p><p>${recipientFullName}<br/>${recipient.street || ''}<br/>${[recipient.postal_code, recipient.city].filter(Boolean).join(' ')}</p>`;
        mailContext = 'letter_post';
      }

      const { error } = await supabase.functions.invoke('sot-system-mail-send', {
        body: {
          to: mailTo,
          subject: mailSubject,
          html: mailHtml,
          context: mailContext,
          attachments: [{ filename: pdfFilename, content: base64 }],
        },
      });

      if (error) throw error;

      // Save as sent draft
      const { data: profileData } = await supabase
        .from('profiles')
        .select('active_tenant_id, id')
        .single();

      if (profileData?.active_tenant_id) {
        await supabase.from('letter_drafts').insert({
          tenant_id: profileData.active_tenant_id,
          created_by: profileData.id,
          recipient_contact_id: recipient.id || null,
          subject,
          prompt,
          body: generatedBody,
          status: 'sent',
          channel,
        });
        queryClient.invalidateQueries({ queryKey: ['recent-letter-drafts'] });
      }

      const channelLabel = channel === 'email' ? 'E-Mail' : channel === 'fax' ? 'Fax' : 'Post';
      toast.success(`Brief per ${channelLabel} versendet`);
    } catch (error: any) {
      toast.error('Versandfehler: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const [draftsOpen, setDraftsOpen] = useState(false);

  return (
    <PageShell>
      <ModulePageHeader title="Briefgenerator" description="KI-gestützte Briefe erstellen und versenden" />
      <div className="space-y-6">

        {/* Step 0: Sender */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-3">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">0</Badge>
              Absender
            </Label>
            <SenderSelector
              options={senderOptions}
              selected={selectedSenderId}
              onSelect={setSelectedSenderId}
            />
          </CardContent>
        </Card>

        {/* Step 1: Recipient */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">1</Badge>
                Empfänger
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setManualRecipient(false); setSelectedContact(null); }}
                  className={cn("text-xs px-2.5 py-1 rounded-md transition-colors", !manualRecipient ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                >
                  Aus Kontakten
                </button>
                <button
                  type="button"
                  onClick={() => { setManualRecipient(true); setSelectedContact(null); }}
                  className={cn("text-xs px-2.5 py-1 rounded-md transition-colors", manualRecipient ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}
                >
                  Manuell eingeben
                </button>
              </div>
            </div>

            {!manualRecipient ? (
              <Popover open={contactOpen} onOpenChange={setContactOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={contactOpen}
                    className="w-full justify-between"
                  >
                    {selectedContact ? (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {selectedContact.first_name} {selectedContact.last_name}
                        {selectedContact.company && (
                          <span className="text-muted-foreground">• {selectedContact.company}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Kontakt suchen...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Kontakt suchen..." />
                    <CommandList>
                      <CommandEmpty>Kein Kontakt gefunden.</CommandEmpty>
                      <CommandGroup>
                        {contacts.map((contact) => (
                          <CommandItem
                            key={contact.id}
                            value={`${contact.first_name} ${contact.last_name}`}
                            onSelect={() => {
                              setSelectedContact(contact);
                              setContactOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedContact?.id === contact.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{contact.first_name} {contact.last_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {contact.company || contact.email || 'Keine Details'}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Select value={manualFields.salutation} onValueChange={(v) => setManualFields(f => ({ ...f, salutation: v }))}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Anrede" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Herr">Herr</SelectItem>
                      <SelectItem value="Frau">Frau</SelectItem>
                      <SelectItem value="Firma">Firma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="Vorname" value={manualFields.first_name} onChange={(e) => setManualFields(f => ({ ...f, first_name: e.target.value }))} className="h-9 text-sm" />
                <Input placeholder="Nachname *" value={manualFields.last_name} onChange={(e) => setManualFields(f => ({ ...f, last_name: e.target.value }))} className="h-9 text-sm" />
                <Input placeholder="Firma (optional)" value={manualFields.company} onChange={(e) => setManualFields(f => ({ ...f, company: e.target.value }))} className="col-span-2 h-9 text-sm" />
                <Input placeholder="Straße + Nr." value={manualFields.street} onChange={(e) => setManualFields(f => ({ ...f, street: e.target.value }))} className="col-span-2 h-9 text-sm" />
                <Input placeholder="PLZ" value={manualFields.postal_code} onChange={(e) => setManualFields(f => ({ ...f, postal_code: e.target.value }))} className="h-9 text-sm" />
                <Input placeholder="Ort" value={manualFields.city} onChange={(e) => setManualFields(f => ({ ...f, city: e.target.value }))} className="h-9 text-sm" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Subject */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-3">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">2</Badge>
              Betreff
            </Label>
            <Input
              placeholder="z.B. Mieterhöhung zum 01.04.2026"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Step 3: Prompt + Generate */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-4">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">3</Badge>
              Anliegen beschreiben
            </Label>
            <div className="relative">
              <Textarea
                placeholder="Schreiben Sie einen formellen Brief zur Ankündigung einer Mieterhöhung von 5% gemäß Mietspiegel..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px] pr-12"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 bottom-2"
                title="Spracheingabe (in Entwicklung)"
                disabled
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || (!selectedContact && !manualRecipient) || (manualRecipient && !manualFields.last_name.trim())}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Brief wird generiert...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Brief generieren
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Step 4: Edit generated letter */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-3">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">4</Badge>
              Brief bearbeiten
            </Label>
            <Textarea
              placeholder="Der generierte Brief erscheint hier..."
              value={generatedBody}
              onChange={(e) => setGeneratedBody(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Step 5: Preview */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-4">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">5</Badge>
              Brief-Vorschau
            </Label>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">DIN A4 Vorschau</h3>
              </div>
              <div className="flex items-center gap-2">
                <Select value={letterFont} onValueChange={(v) => setLetterFont(v as LetterFont)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <Type className="h-3 w-3 mr-1.5" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="din">D-DIN (System)</SelectItem>
                    <SelectItem value="arial">Arial</SelectItem>
                    <SelectItem value="calibri">Calibri</SelectItem>
                    <SelectItem value="times">Times New Roman</SelectItem>
                    <SelectItem value="georgia">Georgia</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePdfPreview} disabled={!generatedBody}>
                  <Eye className="h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePdfDownload} disabled={!generatedBody}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>

            <LetterPreview
              senderName={selectedSender?.label}
              senderCompany={selectedSender?.type === 'BUSINESS' ? selectedSender?.company : undefined}
              senderAddress={selectedSender?.address}
              senderCity={(() => {
                if (selectedSenderId === 'private') return profile?.city || undefined;
                const ctx = contexts.find(c => c.id === selectedSenderId);
                return ctx?.city || undefined;
              })()}
              senderRole={selectedSender?.sublabel !== 'Persönlicher Absender' ? selectedSender?.sublabel : undefined}
              logoUrl={profile?.letterhead_logo_url || undefined}
              recipientName={(() => { const r = getEffectiveRecipient(); return r ? `${r.first_name} ${r.last_name}` : undefined; })()}
              recipientCompany={(() => { const r = getEffectiveRecipient(); return r?.company || undefined; })()}
              recipientAddress={(() => { const r = getEffectiveRecipient(); return r ? [r.street, [r.postal_code, r.city].filter(Boolean).join(' ')].filter(Boolean).join('\n') || undefined : undefined; })()}
              subject={subject}
              body={generatedBody}
              font={letterFont}
            />
          </CardContent>
        </Card>

        {/* Step 6: Versand */}
        <Card className="glass-card">
          <CardContent className="p-5 space-y-4">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">6</Badge>
              Versand
            </Label>

            {/* Channel selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Versandkanal</Label>
              <RadioGroup value={channel} onValueChange={(v) => setChannel(v as typeof channel)} className="flex gap-4">
                <div className="flex items-center space-x-1.5">
                  <RadioGroupItem value="email" id="ch-email" />
                  <Label htmlFor="ch-email" className="flex items-center gap-1 cursor-pointer text-sm">
                    <Mail className="h-4 w-4" /> E-Mail
                  </Label>
                </div>
                <div className="flex items-center space-x-1.5">
                  <RadioGroupItem value="fax" id="ch-fax" />
                  <Label htmlFor="ch-fax" className="flex items-center gap-1 cursor-pointer text-sm">
                    <Phone className="h-4 w-4" /> Fax
                  </Label>
                </div>
                <div className="flex items-center space-x-1.5">
                  <RadioGroupItem value="post" id="ch-post" />
                  <Label htmlFor="ch-post" className="flex items-center gap-1 cursor-pointer text-sm">
                    <FileOutput className="h-4 w-4" /> Brief
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {channel === 'fax' && (
              <div className="space-y-1">
                <Label className="text-xs">Faxnummer</Label>
                <Input placeholder="z.B. +49 30 12345678" value={faxNumber} onChange={(e) => setFaxNumber(e.target.value)} />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {(() => {
                const r = getEffectiveRecipient();
                if (channel === 'email' && r?.email) return `An: ${r.email}`;
                if (channel === 'email') return 'Empfänger hat keine E-Mail-Adresse';
                return channel === 'fax' ? 'PDF wird als Fax gesendet' : 'PDF wird als Brief versendet';
              })()}
            </p>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 flex-1" onClick={() => saveDraftMutation.mutate()} disabled={!generatedBody || saveDraftMutation.isPending}>
                {saveDraftMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Entwurf speichern
              </Button>
              <Button className="gap-2 flex-1" disabled={!generatedBody || isSending} onClick={handleSend}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Jetzt senden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Drafts (collapsible) */}
        <Collapsible open={draftsOpen} onOpenChange={setDraftsOpen}>
          <Card className="glass-card">
            <CardContent className="p-4">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <History className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold">Letzte Entwürfe</h3>
                    {recentDrafts.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4">{recentDrafts.length}</Badge>
                    )}
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", draftsOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3">
                  {recentDrafts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Noch keine Entwürfe</p>
                  ) : (
                    <div className="space-y-1.5">
                      {recentDrafts.map((draft) => (
                        <button key={draft.id} className="w-full p-2 rounded-md border hover:bg-muted/50 transition-colors text-left">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-xs truncate">{draft.subject || 'Ohne Betreff'}</span>
                            <Badge variant={draft.status === 'sent' ? 'default' : 'secondary'} className="text-[10px] h-4">
                              {draft.status === 'sent' ? 'Gesendet' : 'Entwurf'}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(draft.created_at).toLocaleDateString('de-DE')}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>

      </div>

      {/* PDF Preview Dialog */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>PDF-Vorschau</DialogTitle>
            <DialogDescription>DIN A4 Brief im PDF-Format</DialogDescription>
          </DialogHeader>
          {pdfPreviewUrl && (
            <iframe
              src={pdfPreviewUrl}
              className="w-full flex-1 rounded-md border"
              style={{ minHeight: '70vh' }}
              title="Brief PDF Vorschau"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPdfPreview(false)}>Schließen</Button>
            <Button onClick={handlePdfDownload} className="gap-1.5">
              <Download className="h-4 w-4" />
              PDF herunterladen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Context Dialog */}
      <CreateContextDialog 
        open={showCreateContext} 
        onOpenChange={setShowCreateContext} 
      />
    </PageShell>
  );
}
