import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { cn } from '@/lib/utils';
import { ComposeEmailDialog } from '@/components/portal/office/ComposeEmailDialog';
import { AccountIntegrationDialog } from '@/components/portal/office/AccountIntegrationDialog';
// PageShell removed — email client uses its own full-height container
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { 
  Inbox, 
  Send, 
  FileEdit, 
  Trash2, 
  Archive, 
  FolderPlus,
  Search,
  Star,
  Paperclip,
  Mail,
  MailOpen,
  RefreshCw,
  Settings,
  Plus,
  Link2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Reply,
  ReplyAll,
  Forward
} from 'lucide-react';

// Email Account Types
type EmailProvider = 'google' | 'microsoft' | 'imap';

interface EmailAccount {
  id: string;
  provider: EmailProvider;
  email_address: string;
  display_name: string;
  sync_status: 'connected' | 'syncing' | 'error' | 'disconnected';
  last_sync_at: string | null;
}

interface EmailFolder {
  id: string;
  name: string;
  icon: React.ReactNode;
  count?: number;
}

const folders: EmailFolder[] = [
  { id: 'inbox', name: 'Eingang', icon: <Inbox className="h-4 w-4" /> },
  { id: 'sent', name: 'Gesendet', icon: <Send className="h-4 w-4" /> },
  { id: 'drafts', name: 'Entwürfe', icon: <FileEdit className="h-4 w-4" /> },
  { id: 'trash', name: 'Papierkorb', icon: <Trash2 className="h-4 w-4" /> },
  { id: 'archive', name: 'Archiv', icon: <Archive className="h-4 w-4" /> },
];

// IMAP Connection Form Component
function ImapConnectionForm({ onConnect, isConnecting }: { onConnect: (data: any) => void; isConnecting: boolean }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    imap_host: '',
    imap_port: '993',
    smtp_host: '',
    smtp_port: '587',
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="email">E-Mail-Adresse</Label>
          <Input
            id="email"
            type="email"
            placeholder="ihre@email.de"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="password">Passwort / App-Passwort</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imap_host">IMAP Server</Label>
          <Input
            id="imap_host"
            placeholder="imap.example.com"
            value={formData.imap_host}
            onChange={(e) => setFormData({ ...formData, imap_host: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imap_port">IMAP Port</Label>
          <Input
            id="imap_port"
            placeholder="993"
            value={formData.imap_port}
            onChange={(e) => setFormData({ ...formData, imap_port: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp_host">SMTP Server</Label>
          <Input
            id="smtp_host"
            placeholder="smtp.example.com"
            value={formData.smtp_host}
            onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp_port">SMTP Port</Label>
          <Input
            id="smtp_port"
            placeholder="587"
            value={formData.smtp_port}
            onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })}
          />
        </div>
      </div>
      <Button 
        onClick={() => onConnect({ ...formData, provider: 'imap' })}
        disabled={isConnecting || !formData.email || !formData.password || !formData.imap_host}
        className="w-full"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Verbindung wird hergestellt...
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4 mr-2" />
            IMAP-Konto verbinden
          </>
        )}
      </Button>
    </div>
  );
}

// Connection Dialog Component
function ConnectionDialog({ 
  open, 
  onOpenChange, 
  onGoogleConnect, 
  onMicrosoftConnect, 
  onImapConnect, 
  isConnecting 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoogleConnect: () => void;
  onMicrosoftConnect: () => void;
  onImapConnect: (data: any) => void;
  isConnecting: boolean;
}) {
  const [connectionTab, setConnectionTab] = useState<EmailProvider>('google');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-Mail-Konto verbinden
          </DialogTitle>
          <DialogDescription>
            Verbinden Sie Ihr E-Mail-Konto, um Nachrichten direkt in System of a Town zu empfangen und zu versenden.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={connectionTab} onValueChange={(v) => setConnectionTab(v as EmailProvider)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="google" className="gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </TabsTrigger>
            <TabsTrigger value="microsoft" className="gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
              </svg>
              Microsoft
            </TabsTrigger>
            <TabsTrigger value="imap" className="gap-2">
              <Settings className="h-4 w-4" />
              IMAP
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="google" className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Gmail & Google Workspace</p>
                    <p className="text-sm text-muted-foreground">
                      Verbinden Sie Ihr Google-Konto für nahtlose Gmail-Integration
                    </p>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                  <li>• Lesen und Senden von E-Mails</li>
                  <li>• Automatische Synchronisation</li>
                  <li>• Sichere OAuth 2.0 Authentifizierung</li>
                </ul>
              </div>
              <Button 
                onClick={onGoogleConnect} 
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Mit Google anmelden
              </Button>
            </TabsContent>

            <TabsContent value="microsoft" className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Microsoft 365 & Outlook</p>
                    <p className="text-sm text-muted-foreground">
                      Verbinden Sie Ihr Microsoft-Konto für Outlook-Integration
                    </p>
                  </div>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                  <li>• Outlook.com & Microsoft 365</li>
                  <li>• Exchange Online Support</li>
                  <li>• Azure AD Authentifizierung</li>
                </ul>
              </div>
              <Button 
                onClick={onMicrosoftConnect}
                disabled={isConnecting}
                variant="outline"
                className="w-full"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Mit Microsoft anmelden
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Microsoft-Integration wird in Kürze verfügbar sein
              </p>
            </TabsContent>

            <TabsContent value="imap" className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3 mb-4">
                <div className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">IMAP/SMTP Konfiguration</p>
                    <p className="text-sm text-muted-foreground">
                      Manuelle Konfiguration für alle E-Mail-Anbieter
                    </p>
                  </div>
                </div>
              </div>
              <ImapConnectionForm 
                onConnect={onImapConnect} 
                isConnecting={isConnecting} 
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Email Detail Panel with action buttons in header + auto body fetch + auto-retry
function EmailDetailPanel({
  email,
  activeAccount,
  isLoadingBody,
  bodyFetchError,
  onFetchBody,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onArchive,
  onToggleStar,
  setBodyFetchError,
  isPending,
}: {
  email: any;
  activeAccount: any;
  isLoadingBody: boolean;
  bodyFetchError: boolean;
  setBodyFetchError: (v: boolean) => void;
  onFetchBody: (email: any) => void;
  onReply: (email: any) => void;
  onReplyAll: (email: any) => void;
  onForward: (email: any) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onToggleStar: (id: string, starred: boolean) => void;
  isPending: { delete: boolean; archive: boolean; star: boolean };
}) {
  const [fetchTriggered, setFetchTriggered] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Auto-fetch body when email has no content
  useEffect(() => {
    if (email && !email.body_text && !email.body_html && !isLoadingBody && !fetchTriggered && !bodyFetchError) {
      setFetchTriggered(true);
      onFetchBody(email);
    }
  }, [email?.id]);

  // Reset trigger + retry count when email changes
  useEffect(() => {
    setFetchTriggered(false);
    setRetryCount(0);
  }, [email?.id]);

  // Auto-retry with exponential backoff (2s, 4s)
  useEffect(() => {
    if (!bodyFetchError) return;
    if (retryCount >= maxRetries) return;
    if (!email || email.body_text || email.body_html) return;
    const delay = (retryCount + 1) * 2000;
    const timer = setTimeout(() => {
      if (import.meta.env.DEV) {
        console.log(`[EmailDetail] Auto-retry #${retryCount + 1} for ${email.id}`);
      }
      setRetryCount(prev => prev + 1);
      setBodyFetchError(false);
      setFetchTriggered(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [bodyFetchError, retryCount]);

  if (!email) return null;

  const hasBody = email.body_text || email.body_html;
  const showRetryButton = bodyFetchError && retryCount >= maxRetries && !hasBody;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Email Header with ALL action buttons */}
      <div className="p-4 border-b space-y-3 shrink-0 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold flex-1 min-w-0">{email.subject || '(Kein Betreff)'}</h2>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Reply actions */}
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Antworten" onClick={() => onReply(email)}>
              <Reply className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Allen antworten" onClick={() => onReplyAll(email)}>
              <ReplyAll className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Weiterleiten" onClick={() => onForward(email)}>
              <Forward className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-5 mx-1" />
            {/* Management actions */}
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Markieren"
              onClick={() => onToggleStar(email.id, email.is_starred)} disabled={isPending.star}>
              <Star className={cn("h-4 w-4", email.is_starred && "text-yellow-500 fill-yellow-500")} />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Archivieren"
              onClick={() => onArchive(email.id)} disabled={isPending.archive}>
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Löschen"
              onClick={() => onDelete(email.id)} disabled={isPending.delete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {(email.from_name || email.from_address || '?')[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{email.from_name || email.from_address}</span>
              {email.from_name && (
                <span className="text-sm text-muted-foreground">&lt;{email.from_address}&gt;</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              An: {Array.isArray(email.to_addresses) ? email.to_addresses.join(', ') : activeAccount?.email_address}
            </div>
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {new Date(email.received_at).toLocaleString('de-DE', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>
      </div>
      {/* Email Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoadingBody ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm">
              {retryCount > 0 ? `Erneuter Versuch (${retryCount}/${maxRetries})...` : 'E-Mail-Inhalt wird geladen...'}
            </p>
          </div>
        ) : showRetryButton ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-3" />
            <p className="text-sm mb-2">Inhalt konnte nach {maxRetries} Versuchen nicht geladen werden.</p>
            <Button variant="outline" size="sm" onClick={() => { setRetryCount(0); setFetchTriggered(false); }}>
              <RefreshCw className="h-3 w-3 mr-2" />
              Erneut versuchen
            </Button>
          </div>
        ) : email.body_html ? (
          <iframe
            sandbox="allow-same-origin allow-popups"
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
              body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
                     margin: 0; padding: 16px; overflow-wrap: break-word; word-break: break-word;
                     color: #1a1a1a; background: transparent; }
              img { max-width: 100% !important; height: auto !important; }
              table { max-width: 100% !important; width: auto !important; }
              * { max-width: 100% !important; box-sizing: border-box; }
              a { color: #2563eb; }
            </style></head><body>${email.body_html}</body></html>`}
            className="w-full border-0"
            style={{ minHeight: '400px', height: 'auto' }}
            title="E-Mail-Inhalt"
            onLoad={(e) => {
              const iframe = e.currentTarget;
              try {
                const body = iframe.contentDocument?.body;
                if (body) {
                  iframe.style.height = body.scrollHeight + 'px';
                }
              } catch {
                iframe.style.height = '600px';
              }
            }}
          />
        ) : (
          <ScrollArea className="h-full min-h-[400px] p-4">
            <pre className="whitespace-pre-wrap text-sm font-sans">
              {email.body_text || email.snippet || 'Kein Inhalt'}
            </pre>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

export function EmailTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [composeInitialTo, setComposeInitialTo] = useState('');
  const [composeInitialSubject, setComposeInitialSubject] = useState('');
  const [composeInitialBody, setComposeInitialBody] = useState('');
  const [isLoadingBody, setIsLoadingBody] = useState(false);
  const [bodyFetchError, setBodyFetchError] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('__init__');

  const openCompose = (to = '', subject = '', body = '') => {
    setComposeInitialTo(to);
    setComposeInitialSubject(subject);
    setComposeInitialBody(body);
    setShowComposeDialog(true);
  };

  const handleReply = (email: any) => {
    const fromAddr = email.from_address || '';
    const subj = email.subject || '';
    const date = new Date(email.received_at).toLocaleString('de-DE');
    const sender = email.from_name || email.from_address || '';
    const quoted = `\n\n--- Am ${date} schrieb ${sender}: ---\n${email.body_text || email.snippet || ''}`;
    openCompose(fromAddr, subj.startsWith('Re:') ? subj : `Re: ${subj}`, quoted);
  };

  const handleReplyAll = (email: any) => {
    const fromAddr = email.from_address || '';
    const toAddrs = Array.isArray(email.to_addresses) ? email.to_addresses : [];
    const allRecipients = [fromAddr, ...toAddrs].filter((a: string) => a && a !== activeAccount?.email_address);
    const subj = email.subject || '';
    const date = new Date(email.received_at).toLocaleString('de-DE');
    const sender = email.from_name || email.from_address || '';
    const quoted = `\n\n--- Am ${date} schrieb ${sender}: ---\n${email.body_text || email.snippet || ''}`;
    openCompose(allRecipients.join(', '), subj.startsWith('Re:') ? subj : `Re: ${subj}`, quoted);
  };

  const handleForward = (email: any) => {
    const subj = email.subject || '';
    const date = new Date(email.received_at).toLocaleString('de-DE');
    const sender = email.from_name || email.from_address || '';
    const quoted = `\n\n--- Weitergeleitete Nachricht ---\nVon: ${sender}\nDatum: ${date}\nBetreff: ${subj}\n\n${email.body_text || email.snippet || ''}`;
    openCompose('', subj.startsWith('Fwd:') ? subj : `Fwd: ${subj}`, quoted);
  };

  // Fetch connected email accounts from database
  const { data: accounts = [], isLoading: isLoadingAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['email-accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mail_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching mail accounts:', error);
        return [];
      }
      return data as EmailAccount[];
    },
  });

  const hasConnectedAccount = accounts.length > 0;

  // Initialize selectedAccountId to first account once loaded
  useEffect(() => {
    if (accounts.length > 0 && selectedAccountId === '__init__') {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Reset selectedEmail when switching accounts
  const handleAccountChange = (value: string) => {
    setSelectedAccountId(value as string | 'all');
    setSelectedEmail(null);
  };

  // Derive activeAccount from selectedAccountId (for compose, detail panel, etc.)
  const activeAccount = selectedAccountId === 'all' || selectedAccountId === '__init__'
    ? accounts[0]
    : accounts.find(a => a.id === selectedAccountId) || accounts[0];

  // Build account IDs for queries
  const queryAccountIds = selectedAccountId === 'all' || selectedAccountId === '__init__'
    ? accounts.map(a => a.id)
    : [selectedAccountId];

  // Fetch messages for selected account(s)
  const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['email-messages', selectedAccountId, selectedFolder],
    queryFn: async () => {
      if (queryAccountIds.length === 0) return [];
      
      const query = supabase
        .from('mail_messages')
        .select('*')
        .in('account_id', queryAccountIds)
        .eq('folder', selectedFolder.toUpperCase())
        .order('received_at', { ascending: false })
        .limit(50);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
      return data;
    },
    enabled: hasConnectedAccount,
  });

  // ─── Background Polling: check for new messages every 60s ───
  const lastKnownIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!hasConnectedAccount) return;
    // Set initial known ID
    if (messages.length > 0) {
      lastKnownIdRef.current = messages[0]?.id;
    }
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('mail_messages')
          .select('id')
          .in('account_id', queryAccountIds)
          .eq('folder', selectedFolder.toUpperCase())
          .order('received_at', { ascending: false })
          .limit(1);
        const newestId = data?.[0]?.id;
        if (newestId && newestId !== lastKnownIdRef.current) {
          lastKnownIdRef.current = newestId;
          queryClient.invalidateQueries({ queryKey: ['email-messages', selectedAccountId, selectedFolder] });
        }
      } catch { /* silent */ }
    }, 60_000);
    return () => clearInterval(interval);
  }, [selectedAccountId, selectedFolder, hasConnectedAccount]);

  // Delete mutation - moves email to trash or permanently deletes if already in trash
  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!activeAccount) throw new Error('No account selected');
      
      const message = messages.find((m: any) => m.id === messageId);
      if (!message) throw new Error('Message not found');
      
      if (selectedFolder === 'trash') {
        // Permanently delete if already in trash
        const { error } = await supabase
          .from('mail_messages')
          .delete()
          .eq('id', messageId);
        if (error) throw error;
      } else {
        // Move to trash
        const { error } = await supabase
          .from('mail_messages')
          .update({ folder: 'TRASH' })
          .eq('id', messageId);
        if (error) throw error;
      }
      return messageId;
    },
    onSuccess: (messageId) => {
      toast.success(selectedFolder === 'trash' ? 'E-Mail endgültig gelöscht' : 'E-Mail in Papierkorb verschoben');
      if (selectedEmail === messageId) {
        setSelectedEmail(null);
      }
      refetchMessages();
    },
    onError: (error: any) => {
      toast.error('Löschen fehlgeschlagen: ' + error.message);
    },
  });

  // Archive mutation - moves email to archive
  const archiveMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!activeAccount) throw new Error('No account selected');
      
      const { error } = await supabase
        .from('mail_messages')
        .update({ folder: 'ARCHIVE' })
        .eq('id', messageId);
      if (error) throw error;
      return messageId;
    },
    onSuccess: (messageId) => {
      toast.success('E-Mail archiviert');
      if (selectedEmail === messageId) {
        setSelectedEmail(null);
      }
      refetchMessages();
    },
    onError: (error: any) => {
      toast.error('Archivieren fehlgeschlagen: ' + error.message);
    },
  });

  // Toggle star mutation
  const toggleStarMutation = useMutation({
    mutationFn: async ({ messageId, isStarred }: { messageId: string; isStarred: boolean }) => {
      const { error } = await supabase
        .from('mail_messages')
        .update({ is_starred: !isStarred })
        .eq('id', messageId);
      if (error) throw error;
      return { messageId, newStarred: !isStarred };
    },
    onSuccess: ({ newStarred }) => {
      toast.success(newStarred ? 'E-Mail markiert' : 'Markierung entfernt');
      refetchMessages();
    },
    onError: (error: any) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  // Sync mutation — syncs all accounts sequentially when "all" is selected
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!hasConnectedAccount) throw new Error('No account selected');
      
      const accountsToSync = selectedAccountId === 'all'
        ? accounts
        : [activeAccount].filter(Boolean);
      
      for (const account of accountsToSync) {
        const { data, error } = await supabase.functions.invoke('sot-mail-sync', {
          body: { accountId: account.id, folder: selectedFolder },
        });
        if (error) throw error;
      }
      return { synced: accountsToSync.length };
    },
    onSuccess: ({ synced }) => {
      toast.success(synced > 1 ? `${synced} Konten synchronisiert` : 'Postfach synchronisiert');
      refetchMessages();
    },
    onError: (error: any) => {
      toast.error('Synchronisation fehlgeschlagen: ' + error.message);
    },
  });

  // Handle OAuth connection for Google via dedicated Gmail OAuth popup flow
  const handleGoogleConnect = async () => {
    setIsConnecting(true);
    try {
      // 1. Get the OAuth URL from our dedicated edge function
      const { data, error } = await supabase.functions.invoke('sot-mail-gmail-auth', {
        body: { action: 'init' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.authUrl) throw new Error('Keine Auth-URL erhalten');

      // 2. Open popup window for Google OAuth
      const popup = window.open(
        data.authUrl,
        'gmail-auth',
        'width=600,height=700,menubar=no,toolbar=no,location=yes'
      );

      // Helper to handle the auth result
      const handleResult = (msg: any) => {
        cleanup();
        if (msg.success) {
          toast.success('Gmail erfolgreich verbunden!');
          refetchAccounts();
          setShowConnectionDialog(false);
        } else {
          toast.error('Gmail-Verbindung fehlgeschlagen: ' + (msg.error || 'Unbekannt'));
        }
        setIsConnecting(false);
      };

      // Cleanup function
      const cleanup = () => {
        window.removeEventListener('message', handleMessage);
        window.removeEventListener('storage', handleStorage);
        clearInterval(pollTimer);
      };

      // 3a. Listen for postMessage from popup callback
      const handleMessage = (event: MessageEvent) => {
        try {
          const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (msg?.type === 'gmail_auth_result') {
            handleResult(msg);
          }
        } catch { /* ignore non-JSON messages */ }
      };

      // 3b. Listen for localStorage fallback (works when window.opener is null)
      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'gmail_auth_result' && e.newValue) {
          try {
            const msg = JSON.parse(e.newValue);
            localStorage.removeItem('gmail_auth_result');
            handleResult(msg);
          } catch { /* ignore parse errors */ }
        }
      };

      window.addEventListener('message', handleMessage);
      window.addEventListener('storage', handleStorage);

      // 4. Fallback: poll if popup is closed without postMessage
      const pollTimer = setInterval(() => {
        if (popup && popup.closed) {
          cleanup();
          setTimeout(() => {
            refetchAccounts();
            setIsConnecting(false);
          }, 1500);
        }
      }, 1000);
    } catch (error: any) {
      toast.error('Google-Verbindung fehlgeschlagen: ' + error.message);
      setIsConnecting(false);
    }
  };

  // Handle OAuth connection for Microsoft (Azure AD - prepared but not yet active)
  const handleMicrosoftConnect = async () => {
    setIsConnecting(true);
    try {
      // Microsoft OAuth requires Azure AD configuration
      // This is prepared but needs Azure App Registration
      toast.info('Microsoft 365-Integration erfordert Azure-Konfiguration. Bitte kontaktieren Sie den Administrator.');
      // When configured, use:
      // const { data, error } = await supabase.auth.signInWithOAuth({
      //   provider: 'azure',
      //   options: {
      //     scopes: 'Mail.Read Mail.Send Calendars.ReadWrite Contacts.Read offline_access',
      //     redirectTo: `${window.location.origin}/portal/office/email`,
      //   },
      // });
    } catch (error: any) {
      toast.error('Microsoft-Verbindung fehlgeschlagen');
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle IMAP connection
  const handleImapConnect = async (connectionData: any) => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-mail-connect', {
        body: connectionData,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast.success('IMAP-Konto erfolgreich verbunden');
      setShowConnectionDialog(false);
      refetchAccounts();
    } catch (error: any) {
      console.error('IMAP connection error:', error);
      toast.error('IMAP-Verbindung fehlgeschlagen: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsConnecting(false);
    }
  };

  // Loading state
  if (isLoadingAccounts) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Email Client UI - ALWAYS visible, connection via button
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden px-2 py-3 md:px-6 md:py-4">
      <div className="shrink-0">
        <ModulePageHeader title="E-Mail" description="Ihr KI-gestützter E-Mail-Client" />
      </div>
      {/* Connection Dialog */}
      <AccountIntegrationDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
      />

      {/* Compose Email Dialog */}
      <ComposeEmailDialog
        open={showComposeDialog}
        onOpenChange={(open) => {
          setShowComposeDialog(open);
          if (!open) {
            setComposeInitialTo('');
            setComposeInitialSubject('');
            setComposeInitialBody('');
          }
        }}
        accounts={accounts}
        defaultAccountId={activeAccount?.id || ''}
        initialTo={composeInitialTo}
        initialSubject={composeInitialSubject}
        initialBody={composeInitialBody}
        onSent={() => {
          refetchMessages();
        }}
      />

      {/* 3-Panel Email Client Layout */}
      <Card className="glass-card flex-1 min-h-0 overflow-hidden mt-4">
        <div className="grid grid-cols-12 h-full">
        {/* Left Sidebar - Folders */}
        <div className="col-span-2 border-r flex flex-col overflow-hidden">
          <div className="p-3 border-b space-y-3">
            {/* Account Switcher */}
            {accounts.length > 0 && (
              <Select value={selectedAccountId} onValueChange={handleAccountChange}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Konto wählen" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length > 1 && (
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        Alle Konten
                      </span>
                    </SelectItem>
                  )}
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <span className="flex items-center gap-2">
                        {acc.provider === 'google' ? (
                          <svg className="h-3 w-3" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg>
                        ) : (
                          <Settings className="h-3 w-3" />
                        )}
                        <span className="truncate">{acc.email_address}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button 
              className="w-full gap-2" 
              size="sm" 
              disabled={!hasConnectedAccount}
              onClick={() => setShowComposeDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Neue E-Mail
            </Button>
          </div>
          <Separator className="my-3" />
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  disabled={!hasConnectedAccount}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                    selectedFolder === folder.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground',
                    !hasConnectedAccount && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {folder.icon}
                  <span className="flex-1 text-left">{folder.name}</span>
                  {folder.count !== undefined && folder.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {folder.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Middle - Email List */}
        <div className="col-span-4 border-r flex flex-col overflow-hidden">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="E-Mails durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  disabled={!hasConnectedAccount}
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                disabled={!hasConnectedAccount || syncMutation.isPending}
                onClick={() => syncMutation.mutate()}
              >
                <RefreshCw className={cn("h-4 w-4", syncMutation.isPending && "animate-spin")} />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            {hasConnectedAccount ? (
              isLoadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length > 0 ? (
                <div className="divide-y">
                {messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'relative group w-full p-3 text-left transition-colors duration-150 cursor-pointer',
                        'hover:bg-accent/50',
                        selectedEmail === msg.id && 'bg-accent',
                        !msg.is_read && 'bg-primary/5 hover:bg-primary/10'
                      )}
                      onClick={() => setSelectedEmail(msg.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {msg.is_starred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                            <span className={cn("text-sm truncate", !msg.is_read && "font-semibold")}>
                              {msg.from_name || msg.from_address}
                            </span>
                            {/* Account badge in unified inbox mode */}
                            {selectedAccountId === 'all' && accounts.length > 1 && (() => {
                              const msgAccount = accounts.find(a => a.id === msg.account_id);
                              return msgAccount ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                                  {msgAccount.provider === 'google' ? 'Gmail' : msgAccount.email_address.split('@')[0]}
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                          <p className={cn("text-sm truncate", !msg.is_read && "font-medium")}>
                            {msg.subject || '(Kein Betreff)'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {msg.snippet}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap group-hover:hidden">
                          {new Date(msg.received_at).toLocaleDateString('de-DE')}
                        </div>
                        {/* Hover actions */}
                        <div className="hidden group-hover:flex items-center gap-0.5 absolute right-2 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm rounded-md border p-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toggleStarMutation.mutate({ messageId: msg.id, isStarred: msg.is_starred }); }}>
                            <Star className={cn("h-3.5 w-3.5", msg.is_starred && "text-yellow-500 fill-yellow-500")} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); archiveMutation.mutate(msg.id); }}>
                            <Archive className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(msg.id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Keine E-Mails in diesem Ordner</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                    className="mt-2"
                  >
                    <RefreshCw className={cn("h-3 w-3 mr-1", syncMutation.isPending && "animate-spin")} />
                    Synchronisieren
                  </Button>
                </div>
              )
            ) : (
              <div className="p-8 text-center">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold mb-2">Kein E-Mail-Konto verbunden</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Verbinden Sie Ihr E-Mail-Konto, um Nachrichten zu empfangen und zu versenden.
                </p>
                <Button onClick={() => setShowConnectionDialog(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Konto verbinden
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right - Email Detail / Preview */}
        <div className="col-span-6 flex flex-col overflow-hidden">
          {selectedEmail && messages.length > 0 ? (
            <EmailDetailPanel
              email={messages.find((m: any) => m.id === selectedEmail)}
              activeAccount={activeAccount}
              isLoadingBody={isLoadingBody}
              bodyFetchError={bodyFetchError}
              setBodyFetchError={setBodyFetchError}
              onFetchBody={async (email: any) => {
                setIsLoadingBody(true);
                setBodyFetchError(false);
                try {
                  const { data, error } = await supabase.functions.invoke('sot-mail-fetch-body', {
                    body: { messageId: email.id, uid: email.message_id },
                  });
                  if (error || !data?.success) {
                    setBodyFetchError(true);
                  } else {
                    // Optimistic cache update — patch this message in the query cache
                    queryClient.setQueryData(
                      ['email-messages', selectedAccountId, selectedFolder],
                      (oldMessages: any[] | undefined) => {
                        if (!oldMessages) return oldMessages;
                        return oldMessages.map((m: any) =>
                          m.id === email.id
                            ? { ...m, body_text: data.body_text || m.body_text, body_html: data.body_html || m.body_html, snippet: data.snippet || m.snippet }
                            : m
                        );
                      }
                    );
                  }
                } catch {
                  setBodyFetchError(true);
                } finally {
                  setIsLoadingBody(false);
                }
              }}
              onReply={handleReply}
              onReplyAll={handleReplyAll}
              onForward={handleForward}
              onDelete={(id: string) => deleteMutation.mutate(id)}
              onArchive={(id: string) => archiveMutation.mutate(id)}
              onToggleStar={(id: string, starred: boolean) => toggleStarMutation.mutate({ messageId: id, isStarred: starred })}
              isPending={{
                delete: deleteMutation.isPending,
                archive: archiveMutation.isPending,
                star: toggleStarMutation.isPending,
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              {hasConnectedAccount ? (
                <div className="space-y-3">
                  <MailOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="font-semibold">Keine E-Mail ausgewählt</h3>
                  <p className="text-sm text-muted-foreground">
                    Wählen Sie eine E-Mail aus der Liste, um sie anzuzeigen
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Mail className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                  <h3 className="font-semibold">E-Mail-Client</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Nach der Verbindung eines E-Mail-Kontos können Sie hier Ihre Nachrichten lesen und verwalten.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </Card>
    </div>
  );
}
