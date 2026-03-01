import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Settings,
  Mail,
  CalendarDays,
  Users,
  Link2,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Apple,
  Plus,
} from 'lucide-react';

interface AccountIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MailAccount {
  id: string;
  provider: string;
  email_address: string;
  display_name: string;
  sync_status: string;
  last_sync_at: string | null;
  sync_mail: boolean;
  sync_calendar: boolean;
  sync_contacts: boolean;
  last_calendar_sync_at: string | null;
  last_contacts_sync_at: string | null;
}

// Provider icon helper
function ProviderIcon({ provider, className }: { provider: string; className?: string }) {
  if (provider === 'google') {
    return (
      <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    );
  }
  if (provider === 'microsoft') {
    return (
      <svg className={cn("h-4 w-4", className)} viewBox="0 0 24 24">
        <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
      </svg>
    );
  }
  if (provider === 'icloud_carddav') {
    return <Apple className={cn("h-4 w-4", className)} />;
  }
  return <Settings className={cn("h-4 w-4", className)} />;
}

function providerLabel(provider: string) {
  switch (provider) {
    case 'google': return 'Google';
    case 'microsoft': return 'Microsoft';
    case 'imap': return 'IMAP';
    case 'icloud_carddav': return 'iCloud';
    default: return provider;
  }
}

// IMAP Connection Form
function ImapConnectionForm({ onConnect, isConnecting }: { onConnect: (data: any) => void; isConnecting: boolean }) {
  const [formData, setFormData] = useState({
    email: '', password: '', imap_host: '', imap_port: '993', smtp_host: '', smtp_port: '587',
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>E-Mail-Adresse</Label>
          <Input type="email" placeholder="ihre@email.de" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Passwort / App-Passwort</Label>
          <Input type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>IMAP Server</Label>
          <Input placeholder="imap.example.com" value={formData.imap_host} onChange={(e) => setFormData({ ...formData, imap_host: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>IMAP Port</Label>
          <Input placeholder="993" value={formData.imap_port} onChange={(e) => setFormData({ ...formData, imap_port: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>SMTP Server</Label>
          <Input placeholder="smtp.example.com" value={formData.smtp_host} onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>SMTP Port</Label>
          <Input placeholder="587" value={formData.smtp_port} onChange={(e) => setFormData({ ...formData, smtp_port: e.target.value })} />
        </div>
      </div>
      <Button onClick={() => onConnect({ ...formData, provider: 'imap' })} disabled={isConnecting || !formData.email || !formData.password || !formData.imap_host} className="w-full">
        {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
        IMAP-Konto verbinden
      </Button>
    </div>
  );
}

// iCloud CardDAV Form
function ICloudConnectionForm({ onConnect, isConnecting }: { onConnect: (data: any) => void; isConnecting: boolean }) {
  const [formData, setFormData] = useState({ email: '', password: '' });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Für iCloud benötigen Sie ein <strong>App-spezifisches Passwort</strong>. 
            Erstellen Sie es unter <a href="https://appleid.apple.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">appleid.apple.com</a> → Anmeldung und Sicherheit → App-spezifische Passwörter.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Apple-ID / E-Mail</Label>
        <Input type="email" placeholder="ihre@icloud.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>App-spezifisches Passwort</Label>
        <Input type="password" placeholder="xxxx-xxxx-xxxx-xxxx" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
      </div>
      <Button onClick={() => onConnect({ email: formData.email, password: formData.password, provider: 'icloud_carddav' })} disabled={isConnecting || !formData.email || !formData.password} className="w-full">
        {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Apple className="h-4 w-4 mr-2" />}
        iCloud Kontakte verbinden
      </Button>
    </div>
  );
}

export function AccountIntegrationDialog({ open, onOpenChange }: AccountIntegrationDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'accounts' | 'add'>('accounts');
  const [addProvider, setAddProvider] = useState<string>('google');
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch all mail accounts
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['mail-accounts-integration', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mail_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MailAccount[];
    },
    enabled: open,
  });

  // Update sync flags
  const updateSyncMutation = useMutation({
    mutationFn: async ({ accountId, field, value }: { accountId: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from('mail_accounts')
        .update({ [field]: value } as any)
        .eq('id', accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-accounts-integration'] });
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  // Sync contacts
  const syncContactsMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke('sot-contacts-sync', {
        body: { accountId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data?.syncedContacts || 0} Kontakte synchronisiert`);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['mail-accounts-integration'] });
    },
    onError: (error) => {
      toast.error('Kontakte-Sync fehlgeschlagen: ' + error.message);
    },
  });

  // Sync calendar
  const syncCalendarMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke('sot-calendar-sync', {
        body: { accountId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data?.syncedEvents || 0} Termine synchronisiert`);
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['mail-accounts-integration'] });
    },
    onError: (error) => {
      toast.error('Kalender-Sync fehlgeschlagen: ' + error.message);
    },
  });

  // Sync mail
  const syncMailMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke('sot-mail-sync', {
        body: { accountId, folder: 'inbox' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('E-Mails synchronisiert');
      queryClient.invalidateQueries({ queryKey: ['email-messages'] });
    },
    onError: (error) => {
      toast.error('E-Mail-Sync fehlgeschlagen: ' + error.message);
    },
  });

  // Delete account
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from('mail_accounts')
        .delete()
        .eq('id', accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Konto entfernt');
      queryClient.invalidateQueries({ queryKey: ['mail-accounts-integration'] });
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  // Sync all active services for an account
  const handleSyncAll = async (account: MailAccount) => {
    const promises: Promise<any>[] = [];
    if (account.sync_mail) promises.push(syncMailMutation.mutateAsync(account.id));
    if (account.sync_contacts) promises.push(syncContactsMutation.mutateAsync(account.id));
    if (account.sync_calendar) promises.push(syncCalendarMutation.mutateAsync(account.id));
    if (promises.length === 0) {
      toast.info('Keine Synchronisierung aktiviert');
      return;
    }
    try {
      await Promise.allSettled(promises);
    } catch {
      // individual errors handled by mutations
    }
  };

  // Google OAuth via dedicated Gmail OAuth popup flow (same as EmailTab)
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

      // 3. Listen for postMessage from popup callback
      const handleMessage = (event: MessageEvent) => {
        try {
          const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (msg?.type === 'gmail_auth_result') {
            window.removeEventListener('message', handleMessage);
            if (msg.success) {
              toast.success('Gmail erfolgreich verbunden!');
              queryClient.invalidateQueries({ queryKey: ['mail-accounts-integration'] });
              queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
              setActiveTab('accounts');
            } else {
              toast.error('Gmail-Verbindung fehlgeschlagen: ' + (msg.error || 'Unbekannt'));
            }
            setIsConnecting(false);
          }
        } catch { /* ignore non-JSON messages */ }
      };

      window.addEventListener('message', handleMessage);

      // 4. Fallback: poll if popup is closed without postMessage
      const pollTimer = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(pollTimer);
          window.removeEventListener('message', handleMessage);
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['mail-accounts-integration'] });
            queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
            setIsConnecting(false);
          }, 1500);
        }
      }, 1000);
    } catch (error: any) {
      toast.error('Google-Verbindung fehlgeschlagen: ' + error.message);
      setIsConnecting(false);
    }
  };

  // Microsoft OAuth (prepared)
  const handleMicrosoftConnect = async () => {
    toast.info('Microsoft 365-Integration erfordert Azure-Konfiguration. Bitte kontaktieren Sie den Administrator.');
  };

  // IMAP connect
  const handleImapConnect = async (connectionData: any) => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-mail-connect', { body: connectionData });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('IMAP-Konto erfolgreich verbunden');
      setActiveTab('accounts');
      queryClient.invalidateQueries({ queryKey: ['mail-accounts-integration'] });
      queryClient.invalidateQueries({ queryKey: ['email-accounts'] });
    } catch (error: any) {
      toast.error('IMAP-Verbindung fehlgeschlagen: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsConnecting(false);
    }
  };

  // iCloud CardDAV connect
  const handleICloudConnect = async (connectionData: any) => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-mail-connect', {
        body: { ...connectionData, provider: 'icloud_carddav' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('iCloud Kontakte verbunden');
      setActiveTab('accounts');
      queryClient.invalidateQueries({ queryKey: ['mail-accounts-integration'] });
    } catch (error: any) {
      toast.error('iCloud-Verbindung fehlgeschlagen: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsConnecting(false);
    }
  };

  const isSyncing = syncMailMutation.isPending || syncContactsMutation.isPending || syncCalendarMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Konto-Integrationen
          </DialogTitle>
          <DialogDescription>
            Verbinden Sie Ihre E-Mail-, Kalender- und Kontaktkonten und steuern Sie, was synchronisiert wird.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="accounts">Verbundene Konten</TabsTrigger>
            <TabsTrigger value="add" className="gap-1">
              <Plus className="h-3.5 w-3.5" />
              Konto hinzufügen
            </TabsTrigger>
          </TabsList>

          {/* Connected Accounts */}
          <TabsContent value="accounts" className="flex-1 overflow-auto mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Mail className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Noch keine Konten verbunden.</p>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Konto hinzufügen
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4 pr-2">
                  {accounts.map((account) => (
                    <div key={account.id} className="rounded-lg border p-4 space-y-3">
                      {/* Account header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <ProviderIcon provider={account.provider} className="text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{account.email_address}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {providerLabel(account.provider)}
                              </Badge>
                              {account.sync_status === 'connected' && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-3 w-3" /> Verbunden
                                </span>
                              )}
                              {account.sync_status === 'error' && (
                                <span className="flex items-center gap-1 text-destructive">
                                  <AlertCircle className="h-3 w-3" /> Fehler
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSyncAll(account)}
                            disabled={isSyncing}
                            title="Alles synchronisieren"
                          >
                            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              if (confirm(`Konto "${account.email_address}" wirklich entfernen?`)) {
                                deleteAccountMutation.mutate(account.id);
                              }
                            }}
                            disabled={deleteAccountMutation.isPending}
                            title="Konto entfernen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Sync toggles */}
                      <div className="grid grid-cols-3 gap-3">
                        {/* Mail sync - not for icloud_carddav */}
                        {account.provider !== 'icloud_carddav' && (
                          <div className="flex items-center justify-between rounded-md border px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium">E-Mail</span>
                            </div>
                            <Switch
                              checked={account.sync_mail}
                              onCheckedChange={(checked) =>
                                updateSyncMutation.mutate({ accountId: account.id, field: 'sync_mail', value: checked })
                              }
                            />
                          </div>
                        )}

                        {/* Calendar sync - only for google/microsoft */}
                        {(account.provider === 'google' || account.provider === 'microsoft') && (
                          <div className="flex items-center justify-between rounded-md border px-3 py-2">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium">Kalender</span>
                            </div>
                            <Switch
                              checked={account.sync_calendar}
                              onCheckedChange={(checked) =>
                                updateSyncMutation.mutate({ accountId: account.id, field: 'sync_calendar', value: checked })
                              }
                            />
                          </div>
                        )}

                        {/* Contacts sync - for all providers */}
                        <div className="flex items-center justify-between rounded-md border px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium">Kontakte</span>
                          </div>
                          <Switch
                            checked={account.sync_contacts}
                            onCheckedChange={(checked) =>
                              updateSyncMutation.mutate({ accountId: account.id, field: 'sync_contacts', value: checked })
                            }
                          />
                        </div>
                      </div>

                      {/* Last sync timestamps */}
                      <div className="flex gap-4 text-[10px] text-muted-foreground">
                        {account.last_sync_at && (
                          <span>Mail: {new Date(account.last_sync_at).toLocaleString('de-DE')}</span>
                        )}
                        {account.last_calendar_sync_at && (
                          <span>Kalender: {new Date(account.last_calendar_sync_at).toLocaleString('de-DE')}</span>
                        )}
                        {account.last_contacts_sync_at && (
                          <span>Kontakte: {new Date(account.last_contacts_sync_at).toLocaleString('de-DE')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Add Account */}
          <TabsContent value="add" className="flex-1 overflow-auto mt-4">
            <Tabs value={addProvider} onValueChange={setAddProvider}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="google" className="gap-1.5 text-xs">
                  <ProviderIcon provider="google" className="h-3.5 w-3.5" />
                  Google
                </TabsTrigger>
                <TabsTrigger value="microsoft" className="gap-1.5 text-xs">
                  <ProviderIcon provider="microsoft" className="h-3.5 w-3.5" />
                  Microsoft
                </TabsTrigger>
                <TabsTrigger value="imap" className="gap-1.5 text-xs">
                  <Settings className="h-3.5 w-3.5" />
                  IMAP
                </TabsTrigger>
                <TabsTrigger value="icloud" className="gap-1.5 text-xs">
                  <Apple className="h-3.5 w-3.5" />
                  iCloud
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
                          E-Mail, Kalender und Kontakte werden automatisch synchronisiert.
                        </p>
                      </div>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                      <li>• Gmail lesen und senden</li>
                      <li>• Google Kalender synchronisieren</li>
                      <li>• Google Kontakte importieren</li>
                      <li>• Sichere OAuth 2.0 Authentifizierung</li>
                    </ul>
                  </div>
                  <Button onClick={handleGoogleConnect} disabled={isConnecting} className="w-full">
                    {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                    Mit Google verbinden
                  </Button>
                </TabsContent>

                <TabsContent value="microsoft" className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Microsoft 365 & Outlook</p>
                        <p className="text-sm text-muted-foreground">
                          Outlook-E-Mail, Kalender und Kontakte synchronisieren.
                        </p>
                      </div>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-8">
                      <li>• Outlook.com & Microsoft 365</li>
                      <li>• Exchange Online Support</li>
                      <li>• Azure AD Authentifizierung</li>
                    </ul>
                  </div>
                  <Button onClick={handleMicrosoftConnect} disabled={isConnecting} variant="outline" className="w-full">
                    {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                    Mit Microsoft verbinden
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Microsoft-Integration wird in Kürze verfügbar sein
                  </p>
                </TabsContent>

                <TabsContent value="imap" className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-3 mb-2">
                    <div className="flex items-start gap-3">
                      <Settings className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">IMAP/SMTP Konfiguration</p>
                        <p className="text-sm text-muted-foreground">
                          Manuelle Konfiguration für alle E-Mail-Anbieter. Nur E-Mail-Sync.
                        </p>
                      </div>
                    </div>
                  </div>
                  <ImapConnectionForm onConnect={handleImapConnect} isConnecting={isConnecting} />
                </TabsContent>

                <TabsContent value="icloud" className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-3 mb-2">
                    <div className="flex items-start gap-3">
                      <Apple className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">iCloud Kontakte (CardDAV)</p>
                        <p className="text-sm text-muted-foreground">
                          Synchronisieren Sie Ihre iPhone/iPad-Kontakte über iCloud.
                        </p>
                      </div>
                    </div>
                  </div>
                  <ICloudConnectionForm onConnect={handleICloudConnect} isConnecting={isConnecting} />
                </TabsContent>
              </div>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
