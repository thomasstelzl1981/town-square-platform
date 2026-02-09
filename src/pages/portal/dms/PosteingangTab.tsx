import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable, StatusBadge, EmptyState, type Column } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Copy, FileText, Download, AlertCircle, CheckCircle, Clock, Loader2, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { resolveStorageSignedUrl } from '@/lib/storage-url';

interface InboundEmail {
  id: string;
  from_email: string;
  to_email: string;
  subject: string | null;
  received_at: string;
  attachment_count: number;
  pdf_count: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface InboundAttachment {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number | null;
  is_pdf: boolean;
  storage_path: string | null;
  document_id: string | null;
}

export function PosteingangTab() {
  const { user } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState<InboundEmail | null>(null);

  // Fetch mailbox address
  const { data: mailboxAddress } = useQuery({
    queryKey: ['inbound-mailbox'],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('sot-inbound-receive', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: undefined,
      });
      // Edge function GET with ?action=mailbox
      // We need to call via fetch directly for GET with query params
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) return null;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-inbound-receive?action=mailbox`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) return null;
      const result = await res.json();
      return result.address as string;
    },
    enabled: !!user,
  });

  // Fetch inbound emails
  const { data: emails = [], isLoading } = useQuery({
    queryKey: ['inbound-emails'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbound_emails')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as InboundEmail[];
    },
    enabled: !!user,
  });

  // Fetch attachments for selected email
  const { data: attachments = [], isLoading: attachmentsLoading } = useQuery({
    queryKey: ['inbound-attachments', selectedEmail?.id],
    queryFn: async () => {
      if (!selectedEmail) return [];
      const { data, error } = await supabase
        .from('inbound_attachments')
        .select('*')
        .eq('inbound_email_id', selectedEmail.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as InboundAttachment[];
    },
    enabled: !!selectedEmail,
  });

  const copyAddress = () => {
    if (mailboxAddress) {
      navigator.clipboard.writeText(mailboxAddress);
      toast.success('E-Mail-Adresse kopiert');
    }
  };

  const handleDownload = async (attachment: InboundAttachment) => {
    if (!attachment.document_id) {
      toast.error('Kein Dokument verknüpft');
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('sot-dms-download-url', {
        body: { document_id: attachment.document_id },
      });
      if (error) throw error;
      const url = resolveStorageSignedUrl(data.download_url);
      window.open(url, '_blank');
    } catch {
      toast.error('Download fehlgeschlagen');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '–';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Empfangen</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="gap-1 animate-pulse"><Loader2 className="h-3 w-3 animate-spin" />Verarbeitung</Badge>;
      case 'ready':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Bereit</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Fehler</Badge>;
      default:
        return <StatusBadge status={status} />;
    }
  };

  const columns: Column<InboundEmail>[] = [
    {
      key: 'received_at',
      header: 'Datum',
      render: (_, item) => (
        <span className="text-sm">
          {format(new Date(item.received_at), 'dd.MM.yyyy HH:mm', { locale: de })}
        </span>
      ),
    },
    {
      key: 'from_email',
      header: 'Von',
      render: (_, item) => (
        <span className="font-medium truncate max-w-[200px] block">{item.from_email}</span>
      ),
    },
    {
      key: 'subject',
      header: 'Betreff',
      render: (_, item) => (
        <span className="truncate max-w-[250px] block">{item.subject || '(Kein Betreff)'}</span>
      ),
    },
    {
      key: 'pdf_count',
      header: 'PDFs',
      render: (_, item) => (
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4 text-red-500" />
          <span>{item.pdf_count}</span>
          {item.attachment_count > item.pdf_count && (
            <span className="text-muted-foreground text-xs">
              (+{item.attachment_count - item.pdf_count})
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, item) => getStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: '',
      render: (_, item) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(item)}>
          Details
        </Button>
      ),
    },
  ];

  const pendingCount = emails.filter(e => e.status === 'received' || e.status === 'processing').length;
  const errorCount = emails.filter(e => e.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Upload Email Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-5 w-5" />
            Deine Upload-E-Mail
          </CardTitle>
          <CardDescription>
            Sende PDFs an diese Adresse. Anhänge landen automatisch hier und im Storage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-3 py-2 bg-muted rounded-lg font-mono text-sm">
              {mailboxAddress || 'Wird geladen...'}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={copyAddress}
              disabled={!mailboxAddress}
            >
              <Copy className="h-4 w-4 mr-1" />
              Kopieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="bg-card border rounded-lg px-4 py-3">
          <div className="text-2xl font-bold">{emails.length}</div>
          <div className="text-sm text-muted-foreground">Gesamt</div>
        </div>
        <div className="bg-card border rounded-lg px-4 py-3">
          <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          <div className="text-sm text-muted-foreground">Ausstehend</div>
        </div>
        {errorCount > 0 && (
          <div className="bg-card border rounded-lg px-4 py-3">
            <div className="text-2xl font-bold text-destructive">{errorCount}</div>
            <div className="text-sm text-muted-foreground">Fehler</div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card">
        {emails.length === 0 && !isLoading ? (
          <EmptyState
            icon={Inbox}
            title="Noch keine PDFs eingegangen"
            description={
              mailboxAddress
                ? `Sende PDFs an ${mailboxAddress} — sie erscheinen automatisch hier.`
                : 'Deine Upload-E-Mail wird eingerichtet...'
            }
          />
        ) : (
          <DataTable
            data={emails}
            columns={columns}
            isLoading={isLoading}
            onRowClick={(item) => setSelectedEmail(item)}
          />
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>E-Mail Details</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Von</span>
                  <span className="font-medium">{selectedEmail.from_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">An</span>
                  <span>{selectedEmail.to_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Betreff</span>
                  <span>{selectedEmail.subject || '(Kein Betreff)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empfangen</span>
                  <span>{format(new Date(selectedEmail.received_at), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(selectedEmail.status)}
                </div>
                {selectedEmail.error_message && (
                  <div className="p-2 bg-destructive/10 text-destructive rounded text-xs">
                    {selectedEmail.error_message}
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div>
                <h4 className="font-medium mb-2">Anhänge ({selectedEmail.attachment_count})</h4>
                {attachmentsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Anhänge</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 border rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className={`h-4 w-4 shrink-0 ${att.is_pdf ? 'text-red-500' : 'text-muted-foreground'}`} />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{att.filename}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(att.size_bytes)}
                              {att.is_pdf && <Badge variant="outline" className="ml-2 text-[10px] py-0">PDF</Badge>}
                            </div>
                          </div>
                        </div>
                        {att.document_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(att)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
