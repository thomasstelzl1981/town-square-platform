/**
 * AdminEmailTab — Zone 1 E-Mail Client
 * Analog zu Zone 2 EmailTab, aber für Platform Admin Kontext
 * Verwendet admin-scope mail_accounts
 */
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  Inbox, 
  Send, 
  FileEdit, 
  Trash2, 
  Archive, 
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

type EmailProvider = 'google' | 'microsoft' | 'imap';

interface EmailFolder {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const folders: EmailFolder[] = [
  { id: 'inbox', name: 'Eingang', icon: <Inbox className="h-4 w-4" /> },
  { id: 'sent', name: 'Gesendet', icon: <Send className="h-4 w-4" /> },
  { id: 'drafts', name: 'Entwürfe', icon: <FileEdit className="h-4 w-4" /> },
  { id: 'trash', name: 'Papierkorb', icon: <Trash2 className="h-4 w-4" /> },
  { id: 'archive', name: 'Archiv', icon: <Archive className="h-4 w-4" /> },
];

// IMAP Connection Form
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
            placeholder="admin@systemofatown.de"
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

// Connection Dialog
function ConnectionDialog({ 
  open, 
  onOpenChange, 
  onImapConnect, 
  isConnecting 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImapConnect: (data: any) => void;
  isConnecting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Admin E-Mail-Konto verbinden
          </DialogTitle>
          <DialogDescription>
            Verbinden Sie ein E-Mail-Konto für das Platform Admin KI-Office.
          </DialogDescription>
        </DialogHeader>
        
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
      </DialogContent>
    </Dialog>
  );
}

export function AdminEmailTab() {
  const queryClient = useQueryClient();
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch connected email accounts
  const { data: accounts = [], isLoading: isLoadingAccounts, refetch: refetchAccounts } = useQuery({
    queryKey: ['admin-email-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mail_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching mail accounts:', error);
        return [];
      }
      return data;
    },
  });

  const hasConnectedAccount = accounts.length > 0;
  const activeAccount = accounts[0];

  // Fetch messages
  const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['admin-email-messages', activeAccount?.id, selectedFolder],
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

  // IMAP connect handler
  const handleImapConnect = async (data: any) => {
    setIsConnecting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('sot-mail-connect', {
        body: { ...data, scope: 'zone1_admin' },
      });
      
      if (error) throw error;
      
      toast.success('E-Mail-Konto erfolgreich verbunden');
      setShowConnectionDialog(false);
      refetchAccounts();
    } catch (error: any) {
      toast.error('Verbindung fehlgeschlagen: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const filteredMessages = messages.filter((msg: any) => {
    const query = searchQuery.toLowerCase();
    return (
      msg.subject?.toLowerCase().includes(query) ||
      msg.from_address?.toLowerCase().includes(query) ||
      msg.body_text?.toLowerCase().includes(query)
    );
  });

  const selectedMessage = messages.find((m: any) => m.id === selectedEmail);

  // No account connected state
  if (!hasConnectedAccount && !isLoadingAccounts) {
    return (
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Admin E-Mail-Konto verbinden</CardTitle>
          <CardDescription>
            Verbinden Sie ein E-Mail-Konto, um Nachrichten im Admin KI-Office zu empfangen und zu versenden.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => setShowConnectionDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            E-Mail-Konto hinzufügen
          </Button>
        </CardContent>
        
        <ConnectionDialog
          open={showConnectionDialog}
          onOpenChange={setShowConnectionDialog}
          onImapConnect={handleImapConnect}
          isConnecting={isConnecting}
        />
      </Card>
    );
  }

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden">
      {/* Folder sidebar */}
      <div className="w-48 border-r bg-muted/30 p-2 flex flex-col">
        <Button 
          className="mb-4 w-full"
          onClick={() => toast.info('Compose-Dialog wird implementiert')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Neue E-Mail
        </Button>
        
        <nav className="space-y-1">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                selectedFolder === folder.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {folder.icon}
              {folder.name}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Synchronisieren
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => setShowConnectionDialog(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Einstellungen
          </Button>
        </div>
      </div>

      {/* Message list */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Keine Nachrichten</p>
            </div>
          ) : (
            filteredMessages.map((message: any) => (
              <button
                key={message.id}
                onClick={() => setSelectedEmail(message.id)}
                className={cn(
                  "w-full p-3 text-left border-b hover:bg-muted/50 transition-colors",
                  selectedEmail === message.id && "bg-muted",
                  !message.is_read && "bg-primary/5"
                )}
              >
                <div className="flex items-start gap-2">
                  {message.is_read ? (
                    <MailOpen className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                  ) : (
                    <Mail className="h-4 w-4 text-primary mt-1 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm truncate", !message.is_read && "font-semibold")}>
                        {message.from_name || message.from_address}
                      </span>
                      {message.is_starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                    </div>
                    <p className={cn("text-sm truncate", !message.is_read && "font-medium")}>
                      {message.subject || '(Kein Betreff)'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {message.body_text?.substring(0, 60)}...
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.received_at).toLocaleDateString('de-DE')}
                      </span>
                      {message.has_attachments && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Message detail */}
      <div className="flex-1 flex flex-col">
        {selectedMessage ? (
          <>
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold mb-2">{selectedMessage.subject || '(Kein Betreff)'}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Von: {selectedMessage.from_name || selectedMessage.from_address}</span>
                <span>{new Date(selectedMessage.received_at).toLocaleString('de-DE')}</span>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {selectedMessage.body_html ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }} />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans">{selectedMessage.body_text}</pre>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Wählen Sie eine Nachricht aus</p>
            </div>
          </div>
        )}
      </div>

      <ConnectionDialog
        open={showConnectionDialog}
        onOpenChange={setShowConnectionDialog}
        onImapConnect={handleImapConnect}
        isConnecting={isConnecting}
      />
    </div>
  );
}
