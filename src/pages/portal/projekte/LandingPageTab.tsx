/**
 * Landing Page Tab — MOD-13 PROJEKTE Reiter 4
 * 
 * REFACTORED: Live-Preview Editor replacing old LandingPageBuilder
 * Shows Zone 3 project website in browser frame + inline editor for texts/advisors
 * Domain activation blocked until Zone 1 billing is ready.
 */
import { useState } from 'react';
import { PROJEKTCALC_DEFAULTS } from '@/engines/projektCalc/spec';
import { DESIGN, getActiveWidgetGlow } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDevProjects } from '@/hooks/useDevProjects';
import { LoadingState } from '@/components/shared/LoadingState';
import { isDemoId } from '@/engines/demoData/engine';
import { useLandingPageByProject, useCreateLandingPage, generateSlug } from '@/hooks/useLandingPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Globe, Plus, Building2, ExternalLink, Eye, RefreshCw, 
  Copy, Check, Save, Loader2, Lock, AlertTriangle, Info, Sparkles, RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ProjectPortfolioRow } from '@/types/projekte';
import { LandingPagePublishSection } from '@/components/projekte/landing-page/LandingPagePublishSection';

// ─── Editor Form State ───────────────────────────────────────────
interface EditorState {
  hero_headline: string;
  hero_subheadline: string;
  about_text: string;
  highlights_json: string[];
  footer_company_name: string;
  footer_address: string;
}

// ─── Status Badges ───────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Entwurf', variant: 'secondary' },
  preview: { label: 'Vorschau (36h)', variant: 'default' },
  active: { label: 'Aktiv', variant: 'default' },
  locked: { label: 'Gesperrt', variant: 'destructive' },
};

export default function LandingPageTab() {
  const queryClient = useQueryClient();
  const { projects, isLoading, portfolioRows } = useDevProjects();
  const [selectedId, setSelectedId] = useState<string>(portfolioRows[0]?.id || '');
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const isSelectedDemo = isDemoId(selectedId);
  const isNewMode = selectedId === 'new';

  const activeProject: ProjectPortfolioRow | null = portfolioRows.find(p => p.id === selectedId) || portfolioRows[0] || null;
  const rawProject = projects.find(p => p.id === selectedId);
  const projectName = activeProject?.name || 'Projekt';
  const projectId = activeProject?.id;
  const organizationId = rawProject?.tenant_id;

  const { data: landingPage, isLoading: lpLoading } = useLandingPageByProject(projectId);
  const createLandingPage = useCreateLandingPage();

  // ─── Editor State ────────────────────────────────────────────
  const [editor, setEditor] = useState<EditorState>({
    hero_headline: '',
    hero_subheadline: '',
    about_text: '',
    highlights_json: [],
    footer_company_name: '',
    footer_address: '',
  });
  const [editorDirty, setEditorDirty] = useState(false);

  // Sync editor state when landing page loads
  const [lastLpId, setLastLpId] = useState<string | null>(null);
  if (landingPage && landingPage.id !== lastLpId) {
    setLastLpId(landingPage.id);
    setEditor({
      hero_headline: landingPage.hero_headline || projectName,
      hero_subheadline: landingPage.hero_subheadline || '',
      about_text: landingPage.location_description || rawProject?.description || '',
      highlights_json: (landingPage as any).highlights_json || [],
      footer_company_name: (landingPage as any).footer_company_name || '',
      footer_address: (landingPage as any).footer_address || '',
    });
    setEditorDirty(false);
  }

  // ─── Save mutation ───────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!landingPage?.id) throw new Error('No landing page');
      const { error } = await supabase
        .from('landing_pages')
        .update({
          hero_headline: editor.hero_headline,
          hero_subheadline: editor.hero_subheadline,
          location_description: editor.about_text,
          highlights_json: editor.highlights_json as any,
          footer_company_name: editor.footer_company_name,
          footer_address: editor.footer_address,
        })
        .eq('id', landingPage.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Änderungen gespeichert');
      setEditorDirty(false);
      queryClient.invalidateQueries({ queryKey: ['landing-page', projectId] });
    },
    onError: () => toast.error('Speichern fehlgeschlagen'),
  });

  // ─── Create landing page with data population ──────────────
  const handleCreate = async () => {
    if (!projectId || !organizationId) return;
    const slug = generateSlug(projectName);

    // Load developer context for impressum/footer data
    let devCtx: any = null;
    if (rawProject?.developer_context_id) {
      const { data } = await supabase
        .from('developer_contexts')
        .select('name, legal_form, managing_director, street, house_number, postal_code, city, phone, email, hrb_number, ust_id')
        .eq('id', rawProject.developer_context_id as string)
        .maybeSingle();
      devCtx = data;
    }

    // Build footer/contact fields from developer context
    const footerCompany = devCtx
      ? `${devCtx.name || ''}${devCtx.legal_form ? ` ${devCtx.legal_form}` : ''}`.trim()
      : '';
    const footerAddress = devCtx
      ? [
          `${devCtx.street || ''} ${devCtx.house_number || ''}`.trim(),
          `${devCtx.postal_code || ''} ${devCtx.city || ''}`.trim(),
        ].filter(Boolean).join(', ')
      : '';
    const contactEmail = devCtx?.email || '';
    const contactPhone = devCtx?.phone || '';

    // Build imprint text from developer context
    let imprintText = '';
    if (devCtx) {
      const parts = [
        footerCompany,
        footerAddress,
        devCtx.managing_director ? `Geschäftsführer: ${devCtx.managing_director}` : '',
        devCtx.hrb_number ? `Handelsregister: ${devCtx.hrb_number}` : '',
        devCtx.ust_id ? `USt-IdNr.: ${devCtx.ust_id}` : '',
        contactEmail ? `E-Mail: ${contactEmail}` : '',
        contactPhone ? `Telefon: ${contactPhone}` : '',
      ].filter(Boolean);
      imprintText = parts.join('\n');
    }

    // Get descriptions from project
    const aboutText = rawProject?.full_description || rawProject?.description || '';
    const locationDescription = rawProject?.location_description || '';

    // Build address subheadline
    const addressParts = [rawProject?.address, activeProject?.postal_code, activeProject?.city].filter(Boolean);
    const heroSubheadline = addressParts.join(', ');

    // Build highlights from features
    const features = Array.isArray((rawProject as any)?.features) ? ((rawProject as any).features as string[]) : [];

    await createLandingPage.mutateAsync({
      project_id: projectId,
      organization_id: organizationId,
      slug,
      hero_headline: projectName,
      hero_subheadline: heroSubheadline,
      about_text: aboutText,
      location_description: locationDescription,
      contact_email: contactEmail,
      contact_phone: contactPhone,
    });

    // After creation, update the additional fields via a direct update
    // (highlights_json, footer fields, imprint are not in CreateLandingPageInput)
    const { data: newLp } = await supabase
      .from('landing_pages')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (newLp?.id) {
      await supabase
        .from('landing_pages')
        .update({
          highlights_json: features as any,
          footer_company_name: footerCompany,
          footer_address: footerAddress,
          imprint_text: imprintText,
          privacy_text: 'Datenschutzerklärung wird vom Anbieter bereitgestellt.',
        })
        .eq('id', newLp.id);
    }

    queryClient.invalidateQueries({ queryKey: ['landing-page', projectId] });
  };

  // ─── Reset landing page ────────────────────────────────────
  const handleReset = async () => {
    if (!landingPage?.id) return;
    setResetting(true);
    try {
      const { error } = await supabase
        .from('landing_pages')
        .delete()
        .eq('id', landingPage.id);
      if (error) throw error;
      setLastLpId(null);
      queryClient.invalidateQueries({ queryKey: ['landing-page'] });
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] });
      toast.success('Landing Page zurückgesetzt');
    } catch {
      toast.error('Zurücksetzen fehlgeschlagen');
    } finally {
      setResetting(false);
    }
  };

  // ─── AI Website Optimization (full section structure) ────
  const handleAiGenerate = async () => {
    if (!projectId || !landingPage?.id || !organizationId) return;
    setAiGenerating(true);
    try {
      // Step 1: Generate project descriptions if missing
      if (!rawProject?.full_description) {
        const { data: descData, error: descErr } = await supabase.functions.invoke('sot-project-description', {
          body: { projectId },
        });
        if (descErr) console.warn('Description generation failed, continuing with website generation');
        if (descData?.description) {
          await supabase.from('dev_projects').update({ full_description: descData.description }).eq('id', projectId);
        }
        if (descData?.location_description) {
          await supabase.from('dev_projects').update({ location_description: descData.location_description }).eq('id', projectId);
        }
      }

      // Step 2: Call sot-website-ai-generate for complete website structure
      // First ensure we have a tenant_website entry
      let { data: website } = await supabase
        .from('tenant_websites')
        .select('id')
        .eq('tenant_id', organizationId)
        .maybeSingle();

      if (!website) {
        const { data: newSite } = await supabase
          .from('tenant_websites')
          .insert({
            tenant_id: organizationId,
            name: projectName,
            slug: landingPage.slug || 'home',
            created_by: (await supabase.auth.getUser()).data.user?.id || '',
          })
          .select('id')
          .single();
        website = newSite;
      }

      if (website) {
        const { data: aiData, error: aiErr } = await supabase.functions.invoke('sot-website-ai-generate', {
          body: {
            website_id: website.id,
            name: projectName,
            industry: 'Immobilien / Kapitalanlage',
            target_audience: 'Kapitalanleger und Investoren',
            goal: 'lead_generation',
            template_id: 'modern',
          },
        });
        if (aiErr) throw aiErr;
        if (aiData?.error) throw new Error(aiData.error);
        toast.success('KI-Website optimiert', {
          description: `${aiData?.sections_count || 6} Sektionen generiert — Hero, Features, About, Services, Kontakt, Footer.`,
        });
      }

      // Refresh all related queries
      queryClient.invalidateQueries({ queryKey: ['landing-page', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
    } catch (err: any) {
      const msg = err?.message || 'Unbekannter Fehler';
      if (msg.includes('Rate-Limit') || msg.includes('429')) {
        toast.error('Rate-Limit erreicht', { description: 'Bitte in einer Minute erneut versuchen.' });
      } else {
        toast.error('KI-Website-Optimierung fehlgeschlagen', { description: msg });
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCopy = async () => {
    const url = `${window.location.origin}/website/projekt/${landingPage?.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link kopiert');
    setTimeout(() => setCopied(false), 2000);
  };

  const updateEditor = (field: keyof EditorState, value: any) => {
    setEditor(prev => ({ ...prev, [field]: value }));
    setEditorDirty(true);
  };

  if (isLoading || lpLoading) return <LoadingState />;

  const slug = landingPage?.slug || '';
  const previewUrl = `/website/projekt/${slug}`;
  const status = landingPage?.status || 'draft';
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const hasLandingPage = !!landingPage && !isNewMode;

  return (
    <PageShell>
      <ModulePageHeader
        title="LANDING PAGE"
        description={hasLandingPage
          ? `Projekt-Website für „${projectName}" — ${statusCfg.label}`
          : 'Erstellen Sie automatisch eine Projekt-Website mit Investment-Rechner'}
      />

      {/* Widget Grid */}
      <WidgetGrid>
        {portfolioRows.map((p) => (
          <WidgetCell key={p.id}>
            <Card
              className={cn(
                'h-full cursor-pointer transition-all hover:shadow-lg group flex flex-col',
                getActiveWidgetGlow('amber'),
                isDemoId(p.id) && DESIGN.DEMO_WIDGET.CARD,
                isDemoId(p.id) && DESIGN.DEMO_WIDGET.HOVER,
                p.id === selectedId && 'ring-2 ring-primary shadow-glow',
              )}
              onClick={() => setSelectedId(p.id)}
            >
              <CardContent className="p-4 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-[10px]">{p.project_code}</Badge>
                  {isDemoId(p.id) && <Badge className={DESIGN.DEMO_WIDGET.BADGE}>DEMODATEN</Badge>}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-1 py-2">
                  <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
                    {isDemoId(p.id) ? <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <Building2 className="h-5 w-5 text-primary" />}
                  </div>
                  <p className="font-semibold text-sm leading-tight line-clamp-2">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.postal_code} {p.city}</p>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-[10px]">{p.total_units_count} Einheiten</Badge>
                </div>
              </CardContent>
            </Card>
          </WidgetCell>
        ))}
      </WidgetGrid>

      {/* Inline Detail */}
      <div className="mt-6 space-y-6">
        {/* No landing page yet → Create button */}
        {!hasLandingPage && !isNewMode && selectedId && (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center gap-4">
              <div className="p-4 rounded-2xl bg-primary/10">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Website für „{projectName}" erstellen</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Erstellt automatisch eine Projekt-Website mit Einheitenliste, Investment-Rechner und Kontaktformular.
                  Beschreibungen, Bilder und Impressum werden aus dem Datenblatt übernommen.
                </p>
              </div>
              <Button onClick={handleCreate} disabled={createLandingPage.isPending} className="gap-2">
                {createLandingPage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Website erstellen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Has landing page → Browser Frame + Editor */}
        {hasLandingPage && (
          <>
            {isSelectedDemo && (
              <Badge variant="secondary" className="opacity-60">Beispieldaten — Entwurf basiert auf Demodaten</Badge>
            )}

            {/* Browser Frame */}
            <div className="rounded-2xl border-2 border-border shadow-2xl bg-background overflow-hidden max-w-6xl mx-auto">
              {/* Browser Chrome */}
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                </div>
                <div className="flex-1 flex items-center gap-2 bg-background rounded-lg px-3 py-1.5 border text-sm text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{slug}.kaufy.app</span>
                </div>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => window.open(previewUrl, '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  Öffnen
                </Button>
              </div>

              {/* Embedded Preview — scaled desktop simulation, dynamic height from content */}
              <div className="relative w-full overflow-hidden">
                <iframe 
                  src={previewUrl}
                  className="border-0 origin-top-left"
                  style={{
                    width: '1440px',
                    height: '900px',
                    transform: 'scale(0.5)',
                    transformOrigin: 'top left',
                  }}
                  scrolling="no"
                  title="Landing Page Preview"
                  onLoad={(e) => {
                    const iframe = e.currentTarget;
                    const container = iframe.parentElement;
                    if (!container) return;
                    const scale = container.offsetWidth / 1440;
                    
                    // Try to read actual content height (same-origin)
                    try {
                      const doc = iframe.contentDocument;
                      if (doc) {
                        const scrollH = doc.body.scrollHeight || doc.documentElement.scrollHeight;
                        iframe.style.height = `${scrollH}px`;
                        iframe.style.transform = `scale(${scale})`;
                        container.style.height = `${scrollH * scale}px`;
                        return;
                      }
                    } catch (_) {
                      // cross-origin fallback
                    }
                    
                    // Fallback: fixed 900px height
                    iframe.style.transform = `scale(${scale})`;
                    container.style.height = `${900 * scale}px`;
                  }}
                />
              </div>
            </div>

            {/* Copyable Link */}
            <div className="flex items-center gap-2 max-w-6xl mx-auto">
              <Input readOnly value={`${window.location.origin}${previewUrl}`} className="flex-1 text-xs font-mono" />
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Kopiert' : 'Kopieren'}
              </Button>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap max-w-6xl mx-auto">
              <div className="flex items-center gap-3">
                <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                {landingPage?.created_at && (
                  <span className="text-xs text-muted-foreground">
                    Erstellt {new Date(landingPage.created_at).toLocaleDateString('de-DE')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={handleReset}
                  disabled={resetting}
                >
                  {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Zurücksetzen
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(previewUrl, '_blank')}>
                  <Eye className="h-3.5 w-3.5" />
                  Vorschau
                </Button>
              </div>
            </div>

            {/* ─── Inline Editor ──────────────────────────────────── */}
            <Card className="max-w-6xl mx-auto">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Inhalte bearbeiten
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={handleAiGenerate}
                      disabled={aiGenerating}
                    >
                      {aiGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      KI-Website optimieren
                    </Button>
                    <Button 
                      size="sm" 
                      className="gap-1.5" 
                      disabled={!editorDirty || saveMutation.isPending}
                      onClick={() => saveMutation.mutate()}
                    >
                      {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Speichern
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hero */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hero-Headline</Label>
                    <Input
                      value={editor.hero_headline}
                      onChange={(e) => updateEditor('hero_headline', e.target.value)}
                      placeholder="Projektname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hero-Subheadline</Label>
                    <Input
                      value={editor.hero_subheadline}
                      onChange={(e) => updateEditor('hero_subheadline', e.target.value)}
                      placeholder="Standort oder Kurzbeschreibung"
                    />
                  </div>
                </div>

                <Separator />

                {/* About Text */}
                <div className="space-y-2">
                  <Label>Projektbeschreibung (Objekt-Seite)</Label>
                  <Textarea
                    value={editor.about_text}
                    onChange={(e) => updateEditor('about_text', e.target.value)}
                    placeholder="Beschreibung des Projekts, Lage, Ausstattung..."
                    className="min-h-[120px]"
                    style={{ fieldSizing: 'content' } as any}
                  />
                </div>

                <Separator />

                {/* Footer */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Firma (Footer)</Label>
                    <Input
                      value={editor.footer_company_name}
                      onChange={(e) => updateEditor('footer_company_name', e.target.value)}
                      placeholder="Muster GmbH"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Adresse (Footer)</Label>
                    <Input
                      value={editor.footer_address}
                      onChange={(e) => updateEditor('footer_address', e.target.value)}
                      placeholder="Musterstraße 1, 12345 Stadt"
                    />
                  </div>
                </div>

                <Separator />

                {/* Bilder-Hinweis */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Bilder verwalten</p>
                    <p>Bilder für die Website werden im <strong>Projekt-Datenblatt</strong> hochgeladen (Hero, Außen, Innen, Umgebung, Logo). 
                    Änderungen dort werden automatisch auf der Website übernommen.</p>
                  </div>
                </div>

                <Separator />

                {/* Impressum & Rechtliches */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Impressum & Rechtliches</p>
                      <p>Impressum und Datenschutz werden automatisch aus der Verkaufsgesellschaft (Bauträger-Kontext) generiert. Nur bei Bedarf manuell überschreiben.</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Domain Hinweis */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <Lock className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Eigene Domain — noch nicht verfügbar</p>
                    <p className="text-muted-foreground">
                      Die Anbindung einer eigenen Domain (z.B. via IONOS) wird freigeschaltet, sobald das Billing-System in Zone 1 aktiv ist. 
                      Bis dahin ist die Website unter der Vorschau-URL erreichbar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Publishing Section */}
            <div className="max-w-6xl mx-auto">
              <LandingPagePublishSection landingPage={landingPage} />
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
