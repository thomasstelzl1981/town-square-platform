import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Loader2, 
  FileText,
  CheckCircle,
  AlertTriangle,
  Pencil,
  Eye
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AgreementTemplate {
  id: string;
  code: string;
  title: string;
  content: string;
  version: number;
  is_active: boolean;
  requires_consent: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

interface UserConsent {
  id: string;
  user_id: string;
  tenant_id: string | null;
  template_id: string;
  template_version: number;
  status: 'accepted' | 'declined' | 'withdrawn';
  consented_at: string;
  ip_address: string | null;
  created_at: string;
}

export default function AgreementsPage() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<AgreementTemplate[]>([]);
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Template dialog
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AgreementTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    code: '',
    title: '',
    content: '',
    is_active: true,
    requires_consent: true,
  });
  const [saving, setSaving] = useState(false);

  // View dialog
  const [viewTemplate, setViewTemplate] = useState<AgreementTemplate | null>(null);

  useEffect(() => {
    if (isPlatformAdmin) {
      fetchData();
    }
  }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [templatesRes, consentsRes] = await Promise.all([
        supabase.from('agreement_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('user_consents').select('*').order('consented_at', { ascending: false }).limit(200),
      ]);

      if (templatesRes.error) throw templatesRes.error;
      if (consentsRes.error) throw consentsRes.error;

      setTemplates(templatesRes.data || []);
      setConsents(consentsRes.data || []);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  const getTemplateName = (templateId: string) => {
    return templates.find(t => t.id === templateId)?.title || templateId.slice(0, 8) + '...';
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'accepted':
        return 'default';
      case 'declined':
        return 'destructive';
      case 'withdrawn':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const openTemplateDialog = (template?: AgreementTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        code: template.code,
        title: template.title,
        content: template.content,
        is_active: template.is_active,
        requires_consent: template.requires_consent,
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        code: '',
        title: '',
        content: '',
        is_active: true,
        requires_consent: true,
      });
    }
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.code || !templateForm.title || !templateForm.content) return;
    setSaving(true);
    try {
      if (editingTemplate) {
        // Update increments version
        const { error } = await supabase
          .from('agreement_templates')
          .update({
            title: templateForm.title,
            content: templateForm.content,
            is_active: templateForm.is_active,
            requires_consent: templateForm.requires_consent,
            version: editingTemplate.version + 1,
          })
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agreement_templates')
          .insert({
            code: templateForm.code,
            title: templateForm.title,
            content: templateForm.content,
            is_active: templateForm.is_active,
            requires_consent: templateForm.requires_consent,
          });
        if (error) throw error;
      }
      setTemplateDialogOpen(false);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!isPlatformAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Nur für Platform Admins</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agreements & Consents</h1>
        <p className="text-muted-foreground">
          Verwalte Vereinbarungsvorlagen und protokollierte Zustimmungen
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vorlagen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{templates.filter(t => t.is_active).length}</span>
              <span className="text-muted-foreground text-sm">aktiv</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zustimmungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{consents.filter(c => c.status === 'accepted').length}</span>
              <span className="text-muted-foreground text-sm">akzeptiert</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt Consents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{consents.length}</span>
              <span className="text-muted-foreground text-sm">protokolliert</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Vorlagen</TabsTrigger>
          <TabsTrigger value="consents">Consent-Log</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openTemplateDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Vorlage
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Consent erforderlich</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Keine Vorlagen vorhanden
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map(template => (
                    <TableRow key={template.id}>
                      <TableCell className="font-mono text-sm">{template.code}</TableCell>
                      <TableCell className="font-medium">{template.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">v{template.version}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {template.requires_consent ? (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openTemplateDialog(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="consents" className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Consent-Logs sind unveränderlich und dienen als Audit-Trail für rechtliche Nachvollziehbarkeit.
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader>
              <CardTitle>Consent-Protokoll</CardTitle>
              <CardDescription>Letzte 200 protokollierte Zustimmungen</CardDescription>
            </CardHeader>
            <CardContent>
              {consents.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">Keine Zustimmungen protokolliert</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Zeitpunkt</TableHead>
                      <TableHead>Vorlage</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consents.map(consent => (
                      <TableRow key={consent.id}>
                        <TableCell className="text-sm">
                          {format(new Date(consent.consented_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </TableCell>
                        <TableCell>{getTemplateName(consent.template_id)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">v{consent.template_version}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(consent.status)}>
                            {consent.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {consent.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {consent.ip_address || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage'}</DialogTitle>
            <DialogDescription>
              {editingTemplate 
                ? 'Änderungen erhöhen die Versionsnummer automatisch.'
                : 'Erstelle eine neue Vereinbarungsvorlage'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={templateForm.code}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="z.B. SALES_MANDATE"
                  disabled={!!editingTemplate}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="z.B. Verkaufsmandat"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Inhalt</Label>
              <Textarea
                id="content"
                value={templateForm.content}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Vollständiger Text der Vereinbarung..."
                rows={8}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={templateForm.is_active}
                    onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Aktiv</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="requires_consent"
                    checked={templateForm.requires_consent}
                    onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, requires_consent: checked }))}
                  />
                  <Label htmlFor="requires_consent">Zustimmung erforderlich</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSaveTemplate} 
              disabled={saving || !templateForm.code || !templateForm.title || !templateForm.content}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Template Dialog */}
      <Dialog open={!!viewTemplate} onOpenChange={() => setViewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewTemplate?.title}</DialogTitle>
            <DialogDescription>
              Code: {viewTemplate?.code} | Version: {viewTemplate?.version}
            </DialogDescription>
          </DialogHeader>
          {viewTemplate && (
            <ScrollArea className="h-[400px] border rounded-md p-4 bg-muted/30">
              <pre className="whitespace-pre-wrap text-sm">{viewTemplate.content}</pre>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}