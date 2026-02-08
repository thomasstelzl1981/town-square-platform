import { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ComposeEmailDialog } from '@/components/portal/office/ComposeEmailDialog';
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
  ExternalLink
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

export function EmailTab() {
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch connected email accounts from database
  const { data: accounts = [], isLoading: isLoadingAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['email-accounts'],
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
  const activeAccount = accounts[0]; // Use first account as default

  // Fetch messages for selected account
  const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['email-messages', activeAccount?.id, selectedFolder],
    queryFn: async () => {
      if (!activeAccount) return [];
      
      const { data, error } = await supabase
        .from('mail_messages')
        .select('*')
        .eq('account_id', activeAccount.id)
        .eq('folder', selectedFolder.toUpperCase())
        .order('received_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
      return data;
    },
    enabled: !!activeAccount,
  });

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

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!activeAccount) throw new Error('No account selected');
      
      const { data, error } = await supabase.functions.invoke('sot-mail-sync', {
        body: { accountId: activeAccount.id, folder: selectedFolder },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Postfach synchronisiert');
      refetchMessages();
    },
    onError: (error: any) => {
      toast.error('Synchronisation fehlgeschlagen: ' + error.message);
    },
  });

  // Handle OAuth connection for Google (using Lovable Cloud)
  const handleGoogleConnect = async () => {
    setIsConnecting(true);
    try {
      // Use Supabase auth for Google OAuth with extended scopes
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/contacts.readonly',
          ].join(' '),
          redirectTo: `${window.location.origin}/portal/office/email`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      toast.success('Weiterleitung zu Google...');
    } catch (error: any) {
      toast.error('Google-Verbindung fehlgeschlagen: ' + error.message);
    } finally {
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
    <div className="space-y-4">
      {/* Connection Dialog */}
      <ConnectionDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
        onGoogleConnect={handleGoogleConnect}
        onMicrosoftConnect={handleMicrosoftConnect}
        onImapConnect={handleImapConnect}
        isConnecting={isConnecting}
      />

      {/* Compose Email Dialog */}
      <ComposeEmailDialog
        open={showComposeDialog}
        onOpenChange={setShowComposeDialog}
        accountId={activeAccount?.id || ''}
        accountEmail={activeAccount?.email_address || ''}
        onSent={() => {
          refetchMessages();
        }}
      />

      {/* 3-Panel Email Client Layout */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-280px)]">
        {/* Left Sidebar - Folders */}
        <div className="col-span-2 border rounded-lg p-3 space-y-2">
          <Button 
            className="w-full gap-2" 
            size="sm" 
            disabled={!hasConnectedAccount}
            onClick={() => setShowComposeDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Neue E-Mail
          </Button>
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
        <div className="col-span-4 border rounded-lg flex flex-col">
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
                    <button
                      key={msg.id}
                      onClick={() => setSelectedEmail(msg.id)}
                      className={cn(
                        'w-full p-3 text-left transition-colors duration-150',
                        'hover:bg-accent/50',
                        selectedEmail === msg.id && 'bg-accent',
                        !msg.is_read && 'bg-primary/5 hover:bg-primary/10'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {msg.is_starred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                            <span className={cn("text-sm truncate", !msg.is_read && "font-semibold")}>
                              {msg.from_name || msg.from_address}
                            </span>
                          </div>
                          <p className={cn("text-sm truncate", !msg.is_read && "font-medium")}>
                            {msg.subject || '(Kein Betreff)'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {msg.snippet}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(msg.received_at).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    </button>
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
        <div className="col-span-6 border rounded-lg flex flex-col overflow-hidden">
          {selectedEmail && messages.length > 0 ? (
            (() => {
              const email = messages.find((m: any) => m.id === selectedEmail);
              if (!email) return null;
              return (
                <div className="flex flex-col h-full">
                  {/* Email Header */}
                  <div className="p-4 border-b space-y-3">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-semibold">{email.subject || '(Kein Betreff)'}</h2>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => toggleStarMutation.mutate({ messageId: email.id, isStarred: email.is_starred })}
                          disabled={toggleStarMutation.isPending}
                        >
                          <Star className={cn("h-4 w-4", email.is_starred && "text-yellow-500 fill-yellow-500")} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => archiveMutation.mutate(email.id)}
                          disabled={archiveMutation.isPending}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => deleteMutation.mutate(email.id)}
                          disabled={deleteMutation.isPending}
                        >
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
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  {/* Email Body */}
                  <ScrollArea className="flex-1 p-4">
                    {email.body_html ? (
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: email.body_html }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {email.body_text || email.snippet || 'Kein Inhalt'}
                      </pre>
                    )}
                  </ScrollArea>
                  {/* Email Actions */}
                  <div className="p-3 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Send className="h-4 w-4" />
                      Antworten
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Send className="h-4 w-4" />
                      Allen antworten
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Send className="h-4 w-4" />
                      Weiterleiten
                    </Button>
                  </div>
                </div>
              );
            })()
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
    </div>
  );
}
