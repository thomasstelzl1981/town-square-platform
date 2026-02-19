import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/shared';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Copy, FileText, Download, AlertCircle, CheckCircle, Clock, Loader2, Inbox, Eye, Upload, ExternalLink, Info } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { resolveStorageSignedUrl } from '@/lib/storage-url';
import { useNavigate } from 'react-router-dom';
import { DESIGN } from '@/config/designManifest';
import { PosteingangAuslesungCard } from '@/components/dms/PosteingangAuslesungCard';
import { PostserviceCard } from '@/components/dms/PostserviceCard';
import { StorageExtractionCard } from '@/components/dms/StorageExtractionCard';

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
  const { user, activeTenantId } = useAuth();
  const navigate = useNavigate();
  const [selectedEmail, setSelectedEmail] = useState<InboundEmail | null>(null);

  // Check for active postservice mandate
  const { data: activeMandate, isLoading: mandateLoading } = useQuery({
    queryKey: ['postservice-mandate-active', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data, error } = await supabase
        .from('postservice_mandates')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!activeTenantId,
  });

  const hasActiveContract = !!activeMandate;

  // Only fetch mailbox + emails if contract is active
  const { data: mailboxAddress } = useQuery({
    queryKey: ['inbound-mailbox'],
    queryFn: async () => {
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
    enabled: !!user && hasActiveContract,
  });

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
    enabled: !!user && hasActiveContract,
  });

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

  const SKELETON_ROWS = 10;

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE: No active contract → Info screen
  // ═══════════════════════════════════════════════════════════════════════════
  if (mandateLoading) {
    return (
      <PageShell>
        <ModulePageHeader title="Posteingang" description="Dein digitaler Postservice für eingehende Dokumente" />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  if (!hasActiveContract) {
    return (
      <PageShell>
        <ModulePageHeader title="Posteingang" description="Dein digitaler Postservice für eingehende Dokumente" />

        <Card className="glass-card max-w-2xl mx-auto">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto p-4 rounded-2xl bg-primary/10 w-fit mb-3">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Digitaler Postservice</CardTitle>
            <CardDescription className="text-base mt-1">
              Empfange deine Post digital – automatisch ausgelesen, sortiert und archiviert.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* How it works */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">So funktioniert es</h4>
              <div className="grid gap-3">
                {[
                  { step: '1', text: 'Postservice aktivieren und Vertrag abschließen' },
                  { step: '2', text: 'Persönliche Inbound-E-Mail-Adresse erhalten' },
                  { step: '3', text: 'PDFs per E-Mail senden oder Post-Scan-Dienst einrichten' },
                  { step: '4', text: 'Dokumente werden automatisch ausgelesen und vorsortiert' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {item.step}
                    </div>
                    <span className="text-sm text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* External services hint */}
            <div className="p-4 rounded-xl bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground">Externe Post-Scan-Dienste</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Du kannst Dienste wie <strong>CAYA</strong>, <strong>Dropscan</strong> oder <strong>E-Post</strong> nutzen, 
                um physische Post digitalisieren zu lassen. Die gescannten PDFs leitest du dann an deine 
                persönliche Inbound-Adresse weiter.
              </p>
            </div>

            {/* Manual upload hint */}
            <div className="p-4 rounded-xl bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground">Manueller PDF-Upload</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Alternativ kannst du PDFs auch direkt über den <strong>Storage-Tab</strong> hochladen 
                und manuell in die richtige Ordnerstruktur einsortieren.
              </p>
            </div>

            {/* CTA */}
            <Button
              className="w-full"
              size="lg"
              onClick={() => navigate('/portal/dms/intelligenz')}
            >
              <Mail className="h-4 w-4 mr-2" />
              Postservice aktivieren
            </Button>

            {/* Pricing hint */}
            <p className="text-xs text-center text-muted-foreground">
              Ab 30 Credits/Monat · 3 Credits pro verarbeitetem Dokument
            </p>
          </CardContent>
        </Card>

        {/* Steuerungs-Kacheln */}
        <div className={DESIGN.WIDGET_GRID.FULL}>
          <PosteingangAuslesungCard />
          <StorageExtractionCard tenantId={activeTenantId} />
          <PostserviceCard />
        </div>
      </PageShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVE CONTRACT: Show full inbox
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <PageShell>
      <ModulePageHeader title="Posteingang" description="Dein digitaler Postservice für eingehende Dokumente" />

      {/* Table */}
      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto"><Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[140px]">Datum</TableHead>
              <TableHead className="w-[200px]">Von</TableHead>
              <TableHead>Betreff</TableHead>
              <TableHead className="w-[80px] text-center">PDFs</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[80px] text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-7 w-16 ml-auto rounded" /></TableCell>
                </TableRow>
              ))
            ) : emails.length > 0 ? (
              emails.map((email) => (
                <TableRow
                  key={email.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedEmail(email)}
                >
                  <TableCell className="text-sm tabular-nums">
                    {format(new Date(email.received_at), 'dd.MM.yy HH:mm', { locale: de })}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium truncate max-w-[180px] block text-sm">{email.from_email}</span>
                  </TableCell>
                  <TableCell>
                    <span className="truncate max-w-[250px] block text-sm">{email.subject || '(Kein Betreff)'}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-sm font-medium">{email.pdf_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(email.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); setSelectedEmail(email); }}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={`empty-${i}`} className="hover:bg-transparent">
                    <TableCell className="text-muted-foreground/30 text-sm">––.––.–– ––:––</TableCell>
                    <TableCell><div className="h-3 w-28 bg-muted/20 rounded" /></TableCell>
                    <TableCell><div className="h-3 bg-muted/20 rounded" style={{ width: `${50 + Math.random() * 40}%` }} /></TableCell>
                    <TableCell className="text-center text-muted-foreground/30">–</TableCell>
                    <TableCell><div className="h-5 w-16 bg-muted/20 rounded-full" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table></div>

        {!isLoading && emails.length === 0 && (
          <div className="border-t px-4 py-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Inbox className="h-4 w-4" />
              <span>Noch keine E-Mails eingegangen</span>
            </div>
            {mailboxAddress && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Sende PDFs an <strong>{mailboxAddress}</strong> — sie erscheinen automatisch hier.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Upload Email Card */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              Deine Upload-E-Mail
            </CardTitle>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Aktiv</span>
            </div>
          </div>
          <CardDescription>
            Sende PDFs an diese Adresse. Anhänge landen automatisch hier und im Storage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-3 py-2.5 bg-muted rounded-lg font-mono text-sm border">
              {mailboxAddress || 'Wird geladen...'}
            </code>
            <Button variant="outline" size="sm" onClick={copyAddress} disabled={!mailboxAddress}>
              <Copy className="h-4 w-4 mr-1" />
              Kopieren
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Pro verarbeitetem Dokument wird 1 Credit berechnet.
          </p>
        </CardContent>
      </Card>

      {/* Steuerungs-Kacheln */}
      <div className={DESIGN.WIDGET_GRID.FULL}>
        <PosteingangAuslesungCard />
        <StorageExtractionCard tenantId={activeTenantId} />
        <PostserviceCard />
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>E-Mail Details</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
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
                      <div key={att.id} className="flex items-center justify-between p-2 border rounded-lg">
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
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(att)}>
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
    </PageShell>
  );
}
