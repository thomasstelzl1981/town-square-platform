import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Mail,
  Phone,
  FileOutput,
  Mic,
  History,
  Type,
} from 'lucide-react';
import { LetterPreview, type LetterFont } from '@/components/portal/office/LetterPreview';
import { SenderSelector, CreateContextDialog, type SenderOption } from '@/components/shared';

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
  const [searchParams] = useSearchParams();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
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
      label: profile?.display_name || profile?.first_name || 'Privatperson',
      sublabel: 'Persönlicher Absender',
      address: profile ? [
        [profile.street, profile.house_number].filter(Boolean).join(' '),
        [profile.postal_code, profile.city].filter(Boolean).join(' '),
      ].filter(Boolean).join(', ') || undefined : undefined,
    },
    // Business contexts
    ...contexts.map((ctx): SenderOption => ({
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
        recipient_contact_id: selectedContact?.id,
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

  // Generate letter with AI
  const handleGenerate = async () => {
    if (!selectedContact) {
      toast.error('Bitte wählen Sie einen Empfänger aus');
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
            name: `${selectedContact.first_name} ${selectedContact.last_name}`,
            company: selectedContact.company,
            salutation: selectedContact.salutation,
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

      if (response.error) throw response.error;
      
      setGeneratedBody(response.data.body || 'Fehler bei der Generierung');
      toast.success('Brief wurde generiert');
    } catch (error: any) {
      toast.error('Fehler bei der Generierung: ' + error.message);
      // Fallback demo text with sender
      const senderLine = selectedSender?.type === 'BUSINESS' 
        ? `${selectedSender.company}\ni.A. ${profile?.display_name || 'Ihr Team'}`
        : profile?.display_name || 'Ihr Team';
      
      setGeneratedBody(`Sehr geehrte${selectedContact.first_name ? 'r' : ''} ${selectedContact.first_name || ''} ${selectedContact.last_name},

bezugnehmend auf ${subject || 'Ihr Anliegen'} möchten wir Ihnen folgendes mitteilen:

${prompt}

Für Rückfragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen,
${senderLine}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Main Form */}
      <div className="col-span-7 space-y-6">
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">KI-Briefgenerator</h3>
                <p className="text-xs text-muted-foreground">Professionelle Geschäftsbriefe mit Armstrong AI</p>
              </div>
            </div>
            <div className="space-y-6">
            {/* Step 0: Sender Selection (One-Click) */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">0</Badge>
                Absender (ein Klick)
              </Label>
              <SenderSelector
                options={senderOptions}
                selected={selectedSenderId}
                onSelect={setSelectedSenderId}
                onAddContext={() => setShowCreateContext(true)}
              />
            </div>

            <Separator />

            {/* Step 1: Recipient */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">1</Badge>
                Empfänger auswählen
              </Label>
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
            </div>

            {/* Step 2: Subject */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">2</Badge>
                Betreff
              </Label>
              <Input
                placeholder="z.B. Mieterhöhung zum 01.04.2026"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            {/* Step 3: Prompt */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">3</Badge>
                Beschreiben Sie Ihr Anliegen
              </Label>
              <div className="relative">
                <Textarea
                  placeholder="Schreiben Sie einen formellen Brief zur Ankündigung einer Mieterhöhung von 5% gemäß Mietspiegel. Der Mieter wohnt seit 3 Jahren in der Wohnung..."
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
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !selectedContact}
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

            <Separator />

            {/* Step 4: Generated Letter */}
            <div className="space-y-2">
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
            </div>

            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Preview + Actions + Drafts */}
      <div className="col-span-5 space-y-4">
        {/* Letter Preview */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">Brief-Vorschau</h3>
              </div>
              <Select value={letterFont} onValueChange={(v) => setLetterFont(v as LetterFont)}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
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
              recipientName={selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : undefined}
              recipientCompany={selectedContact?.company || undefined}
              recipientAddress={selectedContact ? [
                selectedContact.street,
                [selectedContact.postal_code, selectedContact.city].filter(Boolean).join(' '),
              ].filter(Boolean).join('\n') || undefined : undefined}
              subject={subject}
              body={generatedBody}
              font={letterFont}
            />
          </CardContent>
        </Card>

        {/* Dispatch Channel + Actions */}
        <Card className="glass-card">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Versandkanal</Label>
              <RadioGroup value={channel} onValueChange={(v) => setChannel(v as typeof channel)} className="flex gap-3">
                <div className="flex items-center space-x-1.5">
                  <RadioGroupItem value="email" id="ch-email" />
                  <Label htmlFor="ch-email" className="flex items-center gap-1 cursor-pointer text-xs">
                    <Mail className="h-3.5 w-3.5" />
                    E-Mail
                  </Label>
                </div>
                <div className="flex items-center space-x-1.5">
                  <RadioGroupItem value="fax" id="ch-fax" />
                  <Label htmlFor="ch-fax" className="flex items-center gap-1 cursor-pointer text-xs">
                    <Phone className="h-3.5 w-3.5" />
                    Fax
                  </Label>
                </div>
                <div className="flex items-center space-x-1.5">
                  <RadioGroupItem value="post" id="ch-post" />
                  <Label htmlFor="ch-post" className="flex items-center gap-1 cursor-pointer text-xs">
                    <FileOutput className="h-3.5 w-3.5" />
                    Post
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="gap-1.5 flex-1" 
                onClick={() => saveDraftMutation.mutate()}
                disabled={!generatedBody || saveDraftMutation.isPending}
              >
                {saveDraftMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Speichern
              </Button>
              <Button size="sm" className="gap-1.5 flex-1" disabled={!generatedBody}>
                <Send className="h-3.5 w-3.5" />
                Senden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Drafts (compact) */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <History className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">Letzte Entwürfe</h3>
            </div>
            <ScrollArea className="h-[160px]">
              {recentDrafts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Noch keine Entwürfe
                </p>
              ) : (
                <div className="space-y-1.5">
                  {recentDrafts.map((draft) => (
                    <button
                      key={draft.id}
                      className="w-full p-2 rounded-md border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs truncate">
                          {draft.subject || 'Ohne Betreff'}
                        </span>
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
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Create Context Dialog */}
      <CreateContextDialog 
        open={showCreateContext} 
        onOpenChange={setShowCreateContext} 
      />
    </div>
  );
}
