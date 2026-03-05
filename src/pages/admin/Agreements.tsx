/**
 * Agreements Page — Orchestrator
 * R-25: 506 → ~120 lines
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { AgreementsTemplateDialog, AgreementsViewDialog } from '@/components/admin/agreements';
import { AgreementsTemplateTable } from '@/components/admin/agreements/AgreementsTemplateTable';
import { AgreementsConsentLog } from '@/components/admin/agreements/AgreementsConsentLog';

interface AgreementTemplate {
  id: string; code: string; title: string; content: string; version: number;
  is_active: boolean; requires_consent: boolean; valid_from: string; valid_until: string | null; created_at: string;
}

interface UserConsent {
  id: string; user_id: string; tenant_id: string | null; template_id: string;
  template_version: number; status: 'accepted' | 'declined' | 'withdrawn';
  consented_at: string; ip_address: string | null; created_at: string;
}

export default function AgreementsPage() {
  const { isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<AgreementTemplate[]>([]);
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AgreementTemplate | null>(null);
  const [viewTemplate, setViewTemplate] = useState<AgreementTemplate | null>(null);

  useEffect(() => { if (isPlatformAdmin) fetchData(); }, [isPlatformAdmin]);

  async function fetchData() {
    setLoading(true); setError(null);
    try {
      const [tRes, cRes] = await Promise.all([
        supabase.from('agreement_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('user_consents').select('*').order('consented_at', { ascending: false }).limit(200),
      ]);
      if (tRes.error) throw tRes.error;
      if (cRes.error) throw cRes.error;
      setTemplates(tRes.data || []);
      setConsents(cRes.data || []);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setLoading(false); }
  }

  const getTemplateName = (id: string) => templates.find(t => t.id === id)?.title || id.slice(0, 8) + '...';

  if (!isPlatformAdmin) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Nur für Platform Admins</p></div>;
  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Agreements & Consents</h1><p className="text-muted-foreground">Verwalte Vereinbarungsvorlagen und protokollierte Zustimmungen</p></div>
      {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Vorlagen</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><span className="text-2xl font-bold">{templates.filter(t => t.is_active).length}</span><span className="text-muted-foreground text-sm">aktiv</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Zustimmungen</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /><span className="text-2xl font-bold">{consents.filter(c => c.status === 'accepted').length}</span><span className="text-muted-foreground text-sm">akzeptiert</span></div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Gesamt Consents</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-2xl font-bold">{consents.length}</span><span className="text-muted-foreground text-sm">protokolliert</span></div></CardContent></Card>
      </div>

      <Tabs defaultValue="templates">
        <TabsList><TabsTrigger value="templates">Vorlagen</TabsTrigger><TabsTrigger value="consents">Consent-Log</TabsTrigger></TabsList>
        <TabsContent value="templates"><AgreementsTemplateTable templates={templates} onNew={() => { setEditingTemplate(null); setTemplateDialogOpen(true); }} onEdit={t => { setEditingTemplate(t); setTemplateDialogOpen(true); }} onView={setViewTemplate} /></TabsContent>
        <TabsContent value="consents"><AgreementsConsentLog consents={consents} getTemplateName={getTemplateName} /></TabsContent>
      </Tabs>

      <AgreementsTemplateDialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen} editingTemplate={editingTemplate} onSaved={fetchData} onError={setError} />
      <AgreementsViewDialog template={viewTemplate} onClose={() => setViewTemplate(null)} />
    </div>
  );
}
