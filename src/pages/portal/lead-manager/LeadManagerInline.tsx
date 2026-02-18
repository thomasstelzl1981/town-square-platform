/**
 * Lead Manager — Inline Flow (MOD-10)
 * Single-page with 4 tiles: KPIs, Campaigns, New Campaign (step-by-step), Leads
 */
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Megaphone, Users, TrendingUp, CreditCard, Plus, Inbox, Image, Sparkles, User,
  FileText, Check, Upload, Loader2, Calendar, MapPin, X, Shield, CheckCircle2, FolderKanban,
} from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { DESIGN } from '@/config/designManifest';
import { toast } from 'sonner';

// ─── Types & Constants ───────────────────────────────────────────────────────

interface LeadManagerInlineProps {
  contextMode?: 'brand' | 'project' | 'all';
  projectFilter?: string;
}

const BRANDS = [
  { key: 'all', label: 'Alle' },
  { key: 'futureroom', label: 'FutureRoom' },
  { key: 'kaufy', label: 'Kaufy' },
  { key: 'lennox_friends', label: 'Lennox & Friends' },
  { key: 'acquiary', label: 'Acquiary' },
  { key: 'project', label: 'Projekte' },
];

const BRAND_OPTIONS = [
  { key: 'futureroom', label: 'FutureRoom' },
  { key: 'kaufy', label: 'Kaufy' },
  { key: 'lennox_friends', label: 'Lennox & Friends' },
  { key: 'acquiary', label: 'Acquiary' },
];

const BRAND_LABELS: Record<string, string> = {
  futureroom: 'FutureRoom', kaufy: 'Kaufy', lennox_friends: 'Lennox & Friends', acquiary: 'Acquiary', project: 'Projekt',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  submitted: { label: 'Eingereicht', variant: 'outline' },
  live: { label: 'Live', variant: 'default' },
  paused: { label: 'Pausiert', variant: 'secondary' },
  stopped: { label: 'Gestoppt', variant: 'destructive' },
  completed: { label: 'Abgeschlossen', variant: 'secondary' },
};

const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'Neu' },
  { value: 'contacted', label: 'Kontaktiert' },
  { value: 'qualified', label: 'Qualifiziert' },
  { value: 'converted', label: 'Konvertiert' },
  { value: 'lost', label: 'Verloren' },
];

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-700',
  contacted: 'bg-amber-500/10 text-amber-700',
  qualified: 'bg-green-500/10 text-green-700',
  converted: 'bg-emerald-500/10 text-emerald-700',
  lost: 'bg-red-500/10 text-red-700',
};

const BRAND_TEMPLATE_DEFS = [
  { key: 'T1', name: 'Rendite-Highlight', description: 'Renditezahlen & Fakten im Fokus' },
  { key: 'T2', name: 'Berater-Portrait', description: 'Persönliche Vorstellung des Beraters' },
  { key: 'T3', name: 'Objekt-Showcase', description: 'Beispielobjekte & Standortvorteile' },
  { key: 'T4', name: 'Testimonial', description: 'Kundenstimmen & Erfolgsgeschichten' },
  { key: 'T5', name: 'Region-Focus', description: 'Regionale Marktdaten & Chancen' },
];

const PROJECT_TEMPLATE_DEFS = [
  { key: 'T1', name: 'Projekt-Showcase', description: 'Projektname + Ort + Visualisierung' },
  { key: 'T2', name: 'Berater-Portrait', description: 'Persönliche Vorstellung des Beraters' },
  { key: 'T3', name: 'Preis-Highlight', description: 'Preisrange + Einheitentypen aus Projektdaten' },
  { key: 'T4', name: 'Standort-Highlight', description: 'Lage + Infrastruktur' },
  { key: 'T5', name: 'Verfügbarkeit', description: 'X von Y frei — erzeugt Dringlichkeit' },
];

const PRESETS = ['Kapitalanlage', 'Eigennutz', 'Vermietung', 'Finanzierung'];

const SLIDE_LABELS = ['Slide 1', 'Slide 2', 'Slide 3', 'Slide 4'];

type SlotCreative = { slides: string[]; caption: string; cta: string };

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);
}

function formatEur(amount: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LeadManagerInline({ contextMode = 'all', projectFilter }: LeadManagerInlineProps) {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();

  // ── Shared state ──
  const [brandFilter, setBrandFilter] = useState('all');
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [leadBrandFilter, setLeadBrandFilter] = useState('all');

  // ── Campaign planning state ──
  const [planContext, setPlanContext] = useState<'brand' | 'project'>(contextMode === 'project' ? 'project' : 'brand');
  const [selectedBrand, setSelectedBrand] = useState('kaufy');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [planGoal] = useState('Lead-Generierung');
  const [planPlatform] = useState('Facebook + Instagram (Paid)');
  const [planStartDate, setPlanStartDate] = useState('2026-03-01');
  const [planEndDate, setPlanEndDate] = useState('2026-03-31');
  const [planBudget, setPlanBudget] = useState(2500);
  const [planRegions, setPlanRegions] = useState('');
  const [planPresets, setPlanPresets] = useState<string[]>(['Kapitalanlage']);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [personalization, setPersonalization] = useState({ name: '', region: '', claim: '' });
  const [creatives, setCreatives] = useState<Record<string, SlotCreative>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Data queries ──

  // Projects (for project context)
  const { data: projects } = useQuery({
    queryKey: ['dev-projects-for-leads', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('dev_projects')
        .select('id, name, city, total_units_count')
        .eq('tenant_id', activeTenantId)
        .order('name');
      return data || [];
    },
    enabled: !!activeTenantId && (contextMode === 'project' || contextMode === 'all'),
  });

  // KPIs + Campaigns
  const { data: campaignData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['lead-manager-inline-campaigns', activeTenantId, user?.id, brandFilter, projectFilter],
    queryFn: async () => {
      if (!activeTenantId || !user?.id) return { mandates: [], totalSpend: 0, leadCount: 0, cpl: 0, activeCampaigns: 0 };
      let q = supabase
        .from('social_mandates')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('partner_user_id', user.id)
        .order('created_at', { ascending: false });
      if (brandFilter !== 'all' && brandFilter !== 'project') q = q.eq('brand_context', brandFilter);
      if (brandFilter === 'project') q = q.eq('brand_context', 'project');
      if (projectFilter) q = q.eq('project_id', projectFilter);
      const { data: mandates } = await q;
      const list = mandates || [];
      const totalSpend = list.reduce((s, m) => s + (m.budget_total_cents || 0), 0);
      const activeCampaigns = list.filter(m => m.status === 'live' || m.status === 'submitted').length;

      // Count leads
      let lq = supabase
        .from('social_leads')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', activeTenantId)
        .eq('partner_user_id', user.id);
      if (brandFilter !== 'all') lq = lq.eq('brand_context', brandFilter);
      const { count } = await lq;
      const leadCount = count || 0;

      return { mandates: list, totalSpend, leadCount, cpl: leadCount > 0 ? Math.round(totalSpend / leadCount) : 0, activeCampaigns };
    },
    enabled: !!activeTenantId && !!user?.id,
  });

  // Leads
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['lead-manager-inline-leads', activeTenantId, user?.id, leadStatusFilter, leadBrandFilter, projectFilter],
    queryFn: async () => {
      if (!activeTenantId || !user?.id) return [];
      let q = supabase
        .from('social_leads')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('partner_user_id', user.id)
        .order('created_at', { ascending: false });
      if (leadStatusFilter !== 'all') q = q.eq('lead_status', leadStatusFilter);
      if (leadBrandFilter !== 'all') q = q.eq('brand_context', leadBrandFilter);
      const { data } = await q;
      return data || [];
    },
    enabled: !!activeTenantId && !!user?.id,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('social_leads').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-manager-inline-leads'] });
      toast.success('Lead aktualisiert');
    },
  });

  // ── Helpers ──

  const selectedProject = useMemo(() => projects?.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

  const templateDefs = planContext === 'project' ? PROJECT_TEMPLATE_DEFS : BRAND_TEMPLATE_DEFS;

  const toggleSlot = (key: string) => setSelectedSlots(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  const togglePreset = (p: string) => setPlanPresets(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setPlanContext('project');
    const proj = projects?.find(p => p.id === projectId);
    if (proj) {
      setPlanRegions(proj.city || '');
      setPersonalization(prev => ({ ...prev, region: proj.city || '' }));
    }
  };

  const handleGenerate = useCallback(async () => {
    if (selectedSlots.length === 0) { toast.error('Bitte mindestens einen Template-Slot auswählen'); return; }
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1200));
    const newCreatives: Record<string, SlotCreative> = {};
    const projName = selectedProject?.name || '';
    for (const slotKey of selectedSlots) {
      const tmpl = templateDefs.find(t => t.key === slotKey);
      newCreatives[slotKey] = {
        slides: SLIDE_LABELS,
        caption: planContext === 'project' && projName
          ? `${projName} — ${tmpl?.name || slotKey}`
          : `${tmpl?.name || slotKey} — Ihre Chance`,
        cta: planContext === 'project' ? 'Jetzt Exposé anfordern' : 'Jetzt kostenlos beraten lassen',
      };
    }
    setCreatives(newCreatives);
    setIsGenerating(false);
    toast.success(`${selectedSlots.length} Creatives generiert`);
  }, [selectedSlots, planContext, selectedProject, templateDefs]);

  const handleBeauftragen = async () => {
    if (!activeTenantId || !user?.id) { toast.error('Bitte einloggen'); return; }
    if (planContext === 'project' && !selectedProjectId) { toast.error('Bitte Projekt auswählen'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('sot-social-mandate-submit', {
        body: {
          tenant_id: activeTenantId,
          brand_context: planContext === 'project' ? 'project' : selectedBrand,
          project_id: planContext === 'project' ? selectedProjectId : null,
          budget_total_cents: planBudget * 100,
          start_date: planStartDate,
          end_date: planEndDate,
          regions: planRegions.split(',').map(r => r.trim()).filter(Boolean),
          audience_preset: { presets: planPresets },
          template_slots: { selected: selectedSlots },
          personalization,
          creatives,
        },
      });
      if (error) throw error;
      toast.success('Mandat erfolgreich eingereicht!');
      // Reset
      setSelectedSlots([]);
      setCreatives({});
      queryClient.invalidateQueries({ queryKey: ['lead-manager-inline-campaigns'] });
    } catch (e: any) {
      toast.error(e.message || 'Fehler beim Einreichen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasCreatives = Object.keys(creatives).length > 0;
  const selectedLead = leads?.find(l => l.id === selectedLeadId);

  const kpis = [
    { label: 'Gesamtausgaben', value: campaignData ? formatCurrency(campaignData.totalSpend) : '–', icon: CreditCard, color: 'text-primary' },
    { label: 'Leads generiert', value: campaignData ? `${campaignData.leadCount}` : '–', icon: Users, color: 'text-green-500' },
    { label: 'CPL', value: campaignData ? formatCurrency(campaignData.cpl) : '–', icon: TrendingUp, color: 'text-amber-500' },
    { label: 'Aktive Kampagnen', value: campaignData ? `${campaignData.activeCampaigns}` : '–', icon: Megaphone, color: 'text-primary' },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <PageShell>
      <ModulePageHeader
        title="LEAD MANAGER"
        description={contextMode === 'project' ? 'Kampagnen für Ihre Projekte planen und Leads verwalten' : 'Kampagnen planen, Leads verwalten'}
      />

      <div className="space-y-8">

        {/* ━━━ KACHEL 1: KPIs ━━━ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Übersicht</h2>
            {campaignsLoading ? (
              <div className={DESIGN.KPI_GRID.FULL}>{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            ) : (
              <div className={DESIGN.KPI_GRID.FULL}>
                {kpis.map(kpi => (
                  <div key={kpi.label} className="rounded-xl border border-border/50 p-4 bg-muted/20">
                    <div className="flex items-center gap-2 mb-1"><kpi.icon className={`h-4 w-4 ${kpi.color}`} /></div>
                    <p className="text-xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                ))}
              </div>
            )}
            {contextMode !== 'project' && (
              <div className="flex flex-wrap gap-2">
                {BRANDS.map(b => (
                  <Badge key={b.key} variant={brandFilter === b.key ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setBrandFilter(b.key)}>
                    {b.label}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ━━━ KACHEL 2: Meine Kampagnen ━━━ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Meine Kampagnen</h2>
            {campaignsLoading ? (
              <div className="space-y-2">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            ) : campaignData?.mandates && campaignData.mandates.length > 0 ? (
              <div className="space-y-2">
                {campaignData.mandates.map((m: any) => {
                  const status = STATUS_CONFIG[m.status] || { label: m.status, variant: 'outline' as const };
                  const isExpanded = expandedCampaignId === m.id;
                  return (
                    <div key={m.id}>
                      <div
                        className={`rounded-lg border p-4 cursor-pointer transition-all ${isExpanded ? 'border-primary bg-primary/5' : 'hover:border-primary/30'}`}
                        onClick={() => setExpandedCampaignId(isExpanded ? null : m.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {m.brand_context === 'project' ? '📁 Projekt' : BRAND_LABELS[m.brand_context] || m.brand_context}
                            </Badge>
                            {m.start_date && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(m.start_date).toLocaleDateString('de-DE')} – {m.end_date ? new Date(m.end_date).toLocaleDateString('de-DE') : '—'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{formatCurrency(m.budget_total_cents || 0)}</span>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                        </div>
                        {m.regions && Array.isArray(m.regions) && (m.regions as string[]).length > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {(m.regions as string[]).join(', ')}
                          </div>
                        )}
                      </div>
                      {isExpanded && (
                        <div className="mt-1 p-4 rounded-lg border border-primary/20 bg-muted/10 text-sm space-y-2">
                          <p className="text-muted-foreground">Status: <span className="font-medium text-foreground">{status.label}</span></p>
                          <p className="text-muted-foreground">Erstellt: {new Date(m.created_at).toLocaleDateString('de-DE')}</p>
                          <p className="text-xs text-muted-foreground">ID: {m.id}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={Megaphone} title="Noch keine Kampagnen" description="Planen Sie unten Ihre erste Kampagne." />
            )}
          </CardContent>
        </Card>

        {/* ━━━ KACHEL 3: Neue Kampagne planen (Step-by-Step) ━━━ */}
        <Card className="border-primary/20">
          <CardContent className="p-5 space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary flex items-center gap-2">
              <Plus className="h-4 w-4" /> Neue Kampagne planen
            </h2>

            {/* Step 3a: Context */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schritt 1 — Kontext wählen</h3>
              <p className="text-sm text-muted-foreground">Was möchten Sie bewerben?</p>
              {contextMode !== 'project' && (
                <div className="flex flex-wrap gap-2">
                  {BRAND_OPTIONS.map(b => (
                    <Badge
                      key={b.key}
                      variant={planContext === 'brand' && selectedBrand === b.key ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => { setPlanContext('brand'); setSelectedBrand(b.key); setSelectedProjectId(null); }}
                    >
                      {planContext === 'brand' && selectedBrand === b.key && <Check className="h-3 w-3 mr-1" />}
                      {b.label}
                    </Badge>
                  ))}
                </div>
              )}
              {(contextMode === 'project' || contextMode === 'all') && (
                <>
                  {contextMode === 'all' && <Separator className="my-2" />}
                  <div className="space-y-2">
                    <Label className="text-xs">
                      <FolderKanban className="h-3.5 w-3.5 inline mr-1" />
                      {contextMode === 'project' ? 'Projekt auswählen' : '— oder Projekt bewerben —'}
                    </Label>
                    <Select
                      value={selectedProjectId || ''}
                      onValueChange={(v) => handleSelectProject(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Projekt auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.city || '—'}, {p.total_units_count || '?'} Einheiten)
                          </SelectItem>
                        ))}
                        {(!projects || projects.length === 0) && (
                          <SelectItem value="__none" disabled>Keine Projekte vorhanden</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedProject && (
                      <Badge variant="default" className="mt-1">
                        <Check className="h-3 w-3 mr-1" /> {selectedProject.name} — {selectedProject.city}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Step 3b: Parameters */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schritt 2 — Kampagnen-Parameter</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-xs">Ziel</Label><Input value={planGoal} disabled className="bg-muted/30 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Plattform</Label><Input value={planPlatform} disabled className="bg-muted/30 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Laufzeit von</Label><Input type="date" value={planStartDate} onChange={e => setPlanStartDate(e.target.value)} className="text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Laufzeit bis</Label><Input type="date" value={planEndDate} onChange={e => setPlanEndDate(e.target.value)} className="text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Gesamtbudget (EUR)</Label><Input type="number" value={planBudget} onChange={e => setPlanBudget(Number(e.target.value))} min={500} step={100} className="text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Regionen</Label><Input placeholder="z.B. München, Berlin" value={planRegions} onChange={e => setPlanRegions(e.target.value)} className="text-sm" /></div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Zielgruppe</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map(p => (
                    <Badge key={p} variant={planPresets.includes(p) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => togglePreset(p)}>
                      {planPresets.includes(p) && <Check className="h-3 w-3 mr-1" />}{p}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Step 3c: Template Slots */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schritt 3 — Template-Slots (5 CI Templates)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {templateDefs.map(t => {
                  const isSelected = selectedSlots.includes(t.key);
                  const isGenerated = !!creatives[t.key];
                  return (
                    <div key={t.key} onClick={() => toggleSlot(t.key)}
                      className={`relative rounded-xl border-2 p-3 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-dashed border-border bg-muted/20 hover:border-primary/40'}`}>
                      <Badge variant={isGenerated ? 'default' : isSelected ? 'secondary' : 'outline'} className="absolute top-2 right-2 text-[10px]">
                        {isGenerated ? '✓' : isSelected ? '●' : '○'}
                      </Badge>
                      <div className="h-12 w-full rounded-lg bg-muted/50 flex items-center justify-center mb-2">
                        {isGenerated ? <Sparkles className="h-5 w-5 text-primary/60" /> : <Image className="h-5 w-5 text-muted-foreground/50" />}
                      </div>
                      <p className="text-xs font-medium">{t.key}: {t.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.description}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{selectedSlots.length}/5 Slots gewählt</p>
            </div>

            <Separator />

            {/* Step 3d: Personalization */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schritt 4 — Personalisierung</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Beraterportrait</Label>
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center shrink-0">
                      <Upload className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">Foto hochladen</Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input placeholder="Ihr Name" value={personalization.name} onChange={e => setPersonalization(p => ({ ...p, name: e.target.value }))} className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Region</Label>
                  <Input placeholder="z.B. München & Umgebung" value={personalization.region} onChange={e => setPersonalization(p => ({ ...p, region: e.target.value }))} className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Claim (max. 80 Zeichen)</Label>
                  <Input placeholder="Ihr persönlicher Claim" maxLength={80} value={personalization.claim} onChange={e => setPersonalization(p => ({ ...p, claim: e.target.value }))} className="text-sm" />
                </div>
              </div>
              {planContext === 'project' && selectedProject && (
                <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm space-y-1">
                  <p className="text-xs font-semibold text-primary">Automatisch aus Projekt vorbefüllt:</p>
                  <p className="text-xs">Projektname: <span className="font-medium">{selectedProject.name}</span></p>
                  <p className="text-xs">Standort: <span className="font-medium">{selectedProject.city || '—'}</span></p>
                  <p className="text-xs">Einheiten: <span className="font-medium">{selectedProject.total_units_count || '—'}</span></p>
                </div>
              )}
            </div>

            <Separator />

            {/* Step 3e: Generate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schritt 5 — Creatives generieren</h3>
                <Button size="sm" onClick={handleGenerate} disabled={selectedSlots.length === 0 || isGenerating} className="gap-1.5 text-xs">
                  {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {isGenerating ? 'Generiere...' : `Generieren (${selectedSlots.length})`}
                </Button>
              </div>
              {hasCreatives && (
                <div className="space-y-3">
                  {selectedSlots.map(slotKey => {
                    const tmpl = templateDefs.find(t => t.key === slotKey);
                    const creative = creatives[slotKey];
                    if (!creative) return null;
                    return (
                      <div key={slotKey} className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium">{slotKey}: {tmpl?.name}</p>
                          <Badge variant="default" className="text-[10px]">✓ Generiert</Badge>
                        </div>
                        <div className="flex gap-1.5">
                          {creative.slides.map((sl, idx) => (
                            <div key={idx} className="h-16 flex-1 rounded-md bg-gradient-to-br from-muted/80 to-muted/40 border border-border/50 flex items-center justify-center">
                              <span className="text-[10px] text-muted-foreground">{sl}</span>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <Label className="text-[10px]">Caption</Label>
                            <Input value={creative.caption} onChange={e => setCreatives(prev => ({ ...prev, [slotKey]: { ...prev[slotKey], caption: e.target.value } }))} className="text-xs h-8" />
                          </div>
                          <div className="space-y-0.5">
                            <Label className="text-[10px]">CTA</Label>
                            <Input value={creative.cta} onChange={e => setCreatives(prev => ({ ...prev, [slotKey]: { ...prev[slotKey], cta: e.target.value } }))} className="text-xs h-8" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!hasCreatives && selectedSlots.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Wählen Sie oben mindestens einen Template-Slot aus</p>
              )}
            </div>

            {/* Step 3f: Summary + Submit */}
            {hasCreatives && selectedSlots.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schritt 6 — Zusammenfassung & Beauftragen</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Kontext</span>
                      <p className="font-medium text-sm">{planContext === 'project' ? selectedProject?.name || 'Projekt' : BRAND_LABELS[selectedBrand] || selectedBrand}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Budget</span>
                      <p className="font-medium text-sm">{formatEur(planBudget)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Laufzeit</span>
                      <p className="font-medium text-sm">{planStartDate} – {planEndDate}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Templates</span>
                      <p className="font-medium text-sm">{selectedSlots.length} Slots</p>
                    </div>
                  </div>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-600" /> {selectedSlots.length} Slideshow-Anzeigen</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-600" /> Veröffentlichung über zentralen Meta-Account</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-600" /> Lead-Erfassung & automatische Zuordnung</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-600" /> Performance-Dashboard</li>
                  </ul>
                  <Button className="w-full gap-2" size="lg" onClick={handleBeauftragen} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    Beauftragen — {formatEur(planBudget)}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ━━━ KACHEL 4: Meine Leads ━━━ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Meine Leads</h2>
            <div className="flex flex-wrap gap-3">
              <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  {LEAD_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {contextMode !== 'project' && (
                <Select value={leadBrandFilter} onValueChange={setLeadBrandFilter}>
                  <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Brand" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {Object.entries(BRAND_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            {leadsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : leads && leads.length > 0 ? (
              <div className="space-y-2">
                {leads.map(lead => {
                  const leadData = lead.lead_data as any;
                  const isSelected = selectedLeadId === lead.id;
                  return (
                    <div key={lead.id}>
                      <div
                        className={`rounded-lg border p-3 cursor-pointer transition-all ${isSelected ? 'border-primary' : 'hover:border-primary/30'}`}
                        onClick={() => setSelectedLeadId(isSelected ? null : lead.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{leadData?.name || leadData?.email || 'Lead'}</p>
                              <p className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString('de-DE')} · {BRAND_LABELS[lead.brand_context || ''] || '—'}</p>
                            </div>
                          </div>
                          <Badge className={LEAD_STATUS_COLORS[lead.lead_status] || ''}>
                            {LEAD_STATUS_OPTIONS.find(s => s.value === lead.lead_status)?.label || lead.lead_status}
                          </Badge>
                        </div>
                      </div>
                      {isSelected && selectedLead && (
                        <div className="mt-1 p-4 rounded-lg border border-primary/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Lead-Details</p>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedLeadId(null)}><X className="h-3.5 w-3.5" /></Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {leadData?.name && <div><span className="text-muted-foreground text-xs">Name</span><p>{leadData.name}</p></div>}
                            {leadData?.email && <div><span className="text-muted-foreground text-xs">E-Mail</span><p>{leadData.email}</p></div>}
                            {leadData?.phone && <div><span className="text-muted-foreground text-xs">Telefon</span><p>{leadData.phone}</p></div>}
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Status</label>
                            <Select value={selectedLead.lead_status} onValueChange={v => updateLeadMutation.mutate({ id: selectedLead.id, updates: { lead_status: v } })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{LEAD_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Notizen</label>
                            <Textarea
                              className="text-xs"
                              placeholder="Notizen zum Lead..."
                              defaultValue={selectedLead.notes || ''}
                              onBlur={e => {
                                if (e.target.value !== (selectedLead.notes || ''))
                                  updateLeadMutation.mutate({ id: selectedLead.id, updates: { notes: e.target.value } });
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={Inbox} title="Noch keine Leads" description="Starten Sie eine Kampagne, um automatisch Leads zu generieren." />
            )}
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
}