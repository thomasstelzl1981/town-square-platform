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
  Eye,
  Loader2,
  Check,
  ChevronsUpDown,
  Mail,
  Phone,
  FileOutput,
  Mic,
  History
} from 'lucide-react';
import { SenderSelector, CreateContextDialog, type SenderOption } from '@/components/shared';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
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

  // Fetch profile for private sender
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name, active_tenant_id')
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
      address: '', // Could be extended with profile address
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
        .select('id, first_name, last_name, email, company')
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
      <div className="col-span-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              KI-Briefgenerator
            </CardTitle>
            <CardDescription>
              Erstellen Sie professionelle Geschäftsbriefe mit Unterstützung von Armstrong AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            {/* Step 5: Channel Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">5</Badge>
                Versandkanal
              </Label>
              <RadioGroup value={channel} onValueChange={(v) => setChannel(v as typeof channel)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center gap-1 cursor-pointer">
                    <Mail className="h-4 w-4" />
                    E-Mail (Systemmail)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fax" id="fax" />
                  <Label htmlFor="fax" className="flex items-center gap-1 cursor-pointer">
                    <Phone className="h-4 w-4" />
                    Fax
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="post" id="post" />
                  <Label htmlFor="post" className="flex items-center gap-1 cursor-pointer">
                    <FileOutput className="h-4 w-4" />
                    Post
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2" disabled={!generatedBody}>
                <Eye className="h-4 w-4" />
                PDF Vorschau
              </Button>
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={() => saveDraftMutation.mutate()}
                disabled={!generatedBody || saveDraftMutation.isPending}
              >
                {saveDraftMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Als Entwurf speichern
              </Button>
              <Button className="gap-2 flex-1" disabled={!generatedBody}>
                <Send className="h-4 w-4" />
                Senden & Bestätigen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar - Recent Drafts */}
      <div className="col-span-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Letzte Entwürfe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {recentDrafts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Noch keine Entwürfe vorhanden
                </p>
              ) : (
                <div className="space-y-2">
                  {recentDrafts.map((draft) => (
                    <button
                      key={draft.id}
                      className="w-full p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {draft.subject || 'Ohne Betreff'}
                        </span>
                        <Badge variant={draft.status === 'sent' ? 'default' : 'secondary'} className="text-xs">
                          {draft.status === 'sent' ? 'Gesendet' : 'Entwurf'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(draft.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Vorlagen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm h-auto py-2">
                Mieterhöhung ankündigen
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm h-auto py-2">
                Nebenkostenabrechnung
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm h-auto py-2">
                Kündigung bestätigen
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm h-auto py-2">
                Mahnung
              </Button>
            </div>
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
