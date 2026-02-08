/**
 * AdminKiOfficeEmail — Zone 1 Resend-based Email Client
 * Transactional emails for admin communication (no IMAP)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, Column } from '@/components/shared/DataTable';
import { DetailDrawer } from '@/components/shared/DetailDrawer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Plus, 
  Send, 
  Mail, 
  MailOpen,
  Inbox,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Loader2,
  Eye,
  Reply
} from 'lucide-react';

interface OutboundEmail {
  id: string;
  to_email: string;
  to_name: string | null;
  contact_id: string | null;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  created_at: string;
}

interface InboundEmail {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  is_read: boolean;
  received_at: string;
  in_reply_to_id: string | null;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string | null;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  queued: { label: 'Wartend', icon: <Clock className="h-3 w-3" />, className: 'bg-gray-100 text-gray-800' },
  sent: { label: 'Gesendet', icon: <Send className="h-3 w-3" />, className: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Zugestellt', icon: <CheckCircle2 className="h-3 w-3" />, className: 'bg-green-100 text-green-800' },
  opened: { label: 'Geöffnet', icon: <MailOpen className="h-3 w-3" />, className: 'bg-purple-100 text-purple-800' },
  replied: { label: 'Beantwortet', icon: <Reply className="h-3 w-3" />, className: 'bg-indigo-100 text-indigo-800' },
  bounced: { label: 'Bounced', icon: <AlertCircle className="h-3 w-3" />, className: 'bg-red-100 text-red-800' },
  failed: { label: 'Fehlgeschlagen', icon: <AlertCircle className="h-3 w-3" />, className: 'bg-red-100 text-red-800' },
};

const outboundColumns: Column<OutboundEmail>[] = [
  {
    key: 'to_email',
    header: 'Empfänger',
    render: (_: unknown, email: OutboundEmail) => (
      <div className="flex flex-col">
        <span className="font-medium">{email.to_name || email.to_email}</span>
        {email.to_name && <span className="text-xs text-muted-foreground">{email.to_email}</span>}
      </div>
    ),
  },
  {
    key: 'subject',
    header: 'Betreff',
    render: (_: unknown, email: OutboundEmail) => (
      <span className="truncate max-w-[300px] block">{email.subject}</span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (_: unknown, email: OutboundEmail) => {
      const config = statusConfig[email.status] || statusConfig.queued;
      return (
        <Badge variant="outline" className={`gap-1 ${config.className}`}>
          {config.icon}
          {config.label}
        </Badge>
      );
    },
  },
  {
    key: 'sent_at',
    header: 'Gesendet',
    render: (_: unknown, email: OutboundEmail) => 
      email.sent_at 
        ? format(new Date(email.sent_at), 'dd.MM.yyyy HH:mm', { locale: de })
        : '-',
  },
];

const inboundColumns: Column<InboundEmail>[] = [
  {
    key: 'from_email',
    header: 'Absender',
    render: (_: unknown, email: InboundEmail) => (
      <div className="flex items-center gap-2">
        {!email.is_read && <div className="h-2 w-2 rounded-full bg-primary" />}
        <div className="flex flex-col">
          <span className={`font-medium ${!email.is_read ? 'font-semibold' : ''}`}>
            {email.from_name || email.from_email}
          </span>
          {email.from_name && <span className="text-xs text-muted-foreground">{email.from_email}</span>}
        </div>
      </div>
    ),
  },
  {
    key: 'subject',
    header: 'Betreff',
    render: (_: unknown, email: InboundEmail) => (
      <span className={`truncate max-w-[300px] block ${!email.is_read ? 'font-semibold' : ''}`}>
        {email.subject || '(Kein Betreff)'}
      </span>
    ),
  },
  {
    key: 'received_at',
    header: 'Empfangen',
    render: (_: unknown, email: InboundEmail) => 
      format(new Date(email.received_at), 'dd.MM.yyyy HH:mm', { locale: de }),
  },
];

interface ComposeFormData {
  contact_id: string;
  to_email: string;
  to_name: string;
  subject: string;
  body_text: string;
}

const emptyComposeData: ComposeFormData = {
  contact_id: '',
  to_email: '',
  to_name: '',
  subject: '',
  body_text: '',
};

export default function AdminKiOfficeEmail() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sent');
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState<ComposeFormData>(emptyComposeData);
  const [selectedOutbound, setSelectedOutbound] = useState<OutboundEmail | null>(null);
  const [selectedInbound, setSelectedInbound] = useState<InboundEmail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch outbound emails
  const { data: outboundEmails = [], isLoading: outboundLoading } = useQuery({
    queryKey: ['admin-outbound-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_outbound_emails')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OutboundEmail[];
    },
  });

  // Fetch inbound emails
  const { data: inboundEmails = [], isLoading: inboundLoading } = useQuery({
    queryKey: ['admin-inbound-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_inbound_emails')
        .select('*')
        .order('received_at', { ascending: false });
      if (error) throw error;
      return data as InboundEmail[];
    },
  });

  // Fetch admin contacts for recipient selection
  const { data: contacts = [] } = useQuery({
    queryKey: ['admin-contacts-for-email'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, company')
        .eq('scope', 'zone1_admin')
        .not('email', 'is', null)
        .order('last_name');
      if (error) throw error;
      return data as Contact[];
    },
  });

  // Send email mutation
  const sendMutation = useMutation({
    mutationFn: async (data: ComposeFormData) => {
      const { error } = await supabase.functions.invoke('sot-admin-mail-send', {
        body: {
          to_email: data.to_email,
          to_name: data.to_name || null,
          contact_id: data.contact_id || null,
          subject: data.subject,
          body_text: data.body_text,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('E-Mail wurde gesendet');
      queryClient.invalidateQueries({ queryKey: ['admin-outbound-emails'] });
      setComposeOpen(false);
      setComposeData(emptyComposeData);
    },
    onError: (error) => {
      toast.error('Fehler beim Senden: ' + error.message);
    },
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_inbound_emails')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inbound-emails'] });
    },
  });

  // Calculate statistics
  const stats = {
    sent: outboundEmails.length,
    delivered: outboundEmails.filter(e => ['delivered', 'opened', 'replied'].includes(e.status)).length,
    opened: outboundEmails.filter(e => ['opened', 'replied'].includes(e.status)).length,
    replied: outboundEmails.filter(e => e.status === 'replied').length,
    unread: inboundEmails.filter(e => !e.is_read).length,
  };

  const handleContactSelect = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setComposeData({
        ...composeData,
        contact_id: contactId,
        to_email: contact.email || '',
        to_name: `${contact.first_name} ${contact.last_name}`,
      });
    }
  };

  const handleOutboundRowClick = (email: OutboundEmail) => {
    setSelectedOutbound(email);
    setSelectedInbound(null);
    setDrawerOpen(true);
  };

  const handleInboundRowClick = (email: InboundEmail) => {
    setSelectedInbound(email);
    setSelectedOutbound(null);
    setDrawerOpen(true);
    if (!email.is_read) {
      markReadMutation.mutate(email.id);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">E-Mail</h1>
          <p className="text-muted-foreground">
            Admin-Kommunikation via Resend
          </p>
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neue E-Mail
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neue E-Mail</DialogTitle>
              <DialogDescription>
                E-Mail an Admin-Kontakt senden
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Empfänger (aus Kontakten)</Label>
                <Select value={composeData.contact_id} onValueChange={handleContactSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kontakt auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                        {contact.company && ` (${contact.company})`}
                        {' – '}
                        {contact.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="to_email">E-Mail-Adresse *</Label>
                  <Input
                    id="to_email"
                    type="email"
                    value={composeData.to_email}
                    onChange={(e) => setComposeData({ ...composeData, to_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to_name">Name</Label>
                  <Input
                    id="to_name"
                    value={composeData.to_name}
                    onChange={(e) => setComposeData({ ...composeData, to_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Betreff *</Label>
                <Input
                  id="subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body_text">Nachricht *</Label>
                <Textarea
                  id="body_text"
                  rows={8}
                  value={composeData.body_text}
                  onChange={(e) => setComposeData({ ...composeData, body_text: e.target.value })}
                  placeholder="Ihre Nachricht..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setComposeOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                onClick={() => sendMutation.mutate(composeData)}
                disabled={!composeData.to_email || !composeData.subject || !composeData.body_text || sendMutation.isPending}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Senden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesendet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zugestellt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.delivered}
              {stats.sent > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ({Math.round((stats.delivered / stats.sent) * 100)}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Geöffnet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.opened}
              {stats.sent > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ({Math.round((stats.opened / stats.sent) * 100)}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Beantwortet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.replied}
              {stats.sent > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ({Math.round((stats.replied / stats.sent) * 100)}%)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ungelesen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.unread}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sent" className="gap-2">
            <Send className="h-4 w-4" />
            Gesendet
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" />
            Eingang
            {stats.unread > 0 && (
              <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {stats.unread}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="mt-4">
          {outboundLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : outboundEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Keine E-Mails gesendet</h3>
              <p className="text-muted-foreground mt-1">
                Klicken Sie auf "Neue E-Mail" um zu beginnen.
              </p>
            </div>
          ) : (
            <DataTable
              columns={outboundColumns}
              data={outboundEmails}
              onRowClick={handleOutboundRowClick}
            />
          )}
        </TabsContent>

        <TabsContent value="inbox" className="mt-4">
          {inboundLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : inboundEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Keine eingehenden E-Mails</h3>
              <p className="text-muted-foreground mt-1">
                Antworten auf gesendete E-Mails erscheinen hier.
              </p>
            </div>
          ) : (
            <DataTable
              columns={inboundColumns}
              data={inboundEmails}
              onRowClick={handleInboundRowClick}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selectedOutbound ? 'Gesendete E-Mail' : 'Eingehende E-Mail'}
      >
        {selectedOutbound && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">An</Label>
              <div className="font-medium">{selectedOutbound.to_name || selectedOutbound.to_email}</div>
              {selectedOutbound.to_name && (
                <div className="text-sm text-muted-foreground">{selectedOutbound.to_email}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Betreff</Label>
              <div className="font-medium">{selectedOutbound.subject}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Status</Label>
              <div>
                {(() => {
                  const config = statusConfig[selectedOutbound.status] || statusConfig.queued;
                  return (
                    <Badge variant="outline" className={`gap-1 ${config.className}`}>
                      {config.icon}
                      {config.label}
                    </Badge>
                  );
                })()}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nachricht</Label>
              <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                {selectedOutbound.body_text || selectedOutbound.body_html}
              </div>
            </div>
            {selectedOutbound.sent_at && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Gesendet am</Label>
                <div>{format(new Date(selectedOutbound.sent_at), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
              </div>
            )}
          </div>
        )}
        {selectedInbound && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Von</Label>
              <div className="font-medium">{selectedInbound.from_name || selectedInbound.from_email}</div>
              {selectedInbound.from_name && (
                <div className="text-sm text-muted-foreground">{selectedInbound.from_email}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Betreff</Label>
              <div className="font-medium">{selectedInbound.subject || '(Kein Betreff)'}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nachricht</Label>
              <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                {selectedInbound.body_text || selectedInbound.body_html}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Empfangen am</Label>
              <div>{format(new Date(selectedInbound.received_at), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
