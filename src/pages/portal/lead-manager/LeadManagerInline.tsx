/**
 * Lead Manager — Inline Flow (MOD-10)
 * Complete campaign management: KPIs, demo campaigns, brand-based creation, leads
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
  Megaphone, Users, TrendingUp, CreditCard, Plus, Inbox, Sparkles, User,
  Check, Upload, Loader2, Calendar, MapPin, X, CheckCircle2, FolderKanban,
  ShoppingBag, Landmark, Search, ImagePlus, Eye,
} from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { DESIGN } from '@/config/designManifest';
import { toast } from 'sonner';

// Template images
import kaufyRenditeImg from '@/assets/templates/kaufy-rendite.jpg';
import kaufyShowcaseImg from '@/assets/templates/kaufy-showcase.jpg';
import futureroomKonditionenImg from '@/assets/templates/futureroom-konditionen.jpg';
import acquiarySourcingImg from '@/assets/templates/acquiary-sourcing.jpg';

// ─── Types & Constants ───────────────────────────────────────────────────────

interface LeadManagerInlineProps {
  contextMode?: 'brand' | 'project' | 'all';
  projectFilter?: string;
}

// Brand definitions with gradients matching BrandLinkWidget
const BRAND_CARDS = [
  {
    key: 'kaufy',
    name: 'KAUFY',
    tagline: 'Marktplatz & Investment',
    description: 'Immobilien kaufen, verkaufen und als Kapitalanlage entdecken.',
    gradient: 'from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)]',
    icon: ShoppingBag,
    templateCount: 4,
  },
  {
    key: 'futureroom',
    name: 'FutureRoom',
    tagline: 'Finanzierung',
    description: 'KI-gestützte Aufbereitung und digitale Bankeinreichung.',
    gradient: 'from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)]',
    icon: Landmark,
    templateCount: 4,
  },
  {
    key: 'acquiary',
    name: 'ACQUIARY',
    tagline: 'Sourcing & Akquisition',
    description: 'Immobilien-Sourcing, Analyse und strategische Akquisition.',
    gradient: 'from-[hsl(210,80%,50%)] to-[hsl(200,70%,40%)]',
    icon: Search,
    templateCount: 4,
  },
] as const;

const CONTEXT_EXTRA = [
  {
    key: 'project',
    name: 'Mein Projekt',
    tagline: 'Projekt-Kampagne',
    description: 'Wählen Sie ein Projekt aus Ihrem Portfolio.',
    gradient: 'from-[hsl(270,60%,50%)] to-[hsl(280,50%,60%)]',
    icon: FolderKanban,
  },
  {
    key: 'custom',
    name: 'Eigene Kampagne',
    tagline: 'Freie Gestaltung',
    description: 'Laden Sie eigene Bilder hoch und gestalten Sie Ihre Kampagne frei.',
    gradient: 'from-[hsl(0,0%,25%)] to-[hsl(0,0%,45%)]',
    icon: ImagePlus,
  },
] as const;

// Brand-specific templates with pre-filled content
interface TemplateConfig {
  key: string;
  name: string;
  description: string;
  caption: string;
  cta: string;
  image?: string;
}

const BRAND_TEMPLATES: Record<string, TemplateConfig[]> = {
  kaufy: [
    { key: 'T1', name: 'Rendite-Highlight', description: 'Renditezahlen und Fakten im Fokus. Zeigen Sie Investoren, was möglich ist.', caption: 'Bis zu 5,2% Mietrendite — Kapitalanlagen in Toplagen', cta: 'Jetzt Objekte entdecken', image: kaufyRenditeImg },
    { key: 'T2', name: 'Objekt-Showcase', description: 'Beispielobjekte und Standortvorteile präsentieren. Hochwertige Visualisierung.', caption: 'Neubauwohnungen ab 289.000 EUR — bezugsfertig 2026', cta: 'Exposé anfordern', image: kaufyShowcaseImg },
    { key: 'T3', name: 'Berater-Portrait', description: 'Persönliche Vorstellung des Beraters. Schaffen Sie Vertrauen durch Kompetenz und Nähe.', caption: 'Ihr Immobilienexperte — persönlich und kompetent', cta: 'Kostenlose Beratung' },
    { key: 'T4', name: 'Testimonial', description: 'Kundenstimmen und Erfolgsgeschichten. Zeigen Sie, dass andere Ihnen vertrauen.', caption: 'Über 200 zufriedene Investoren vertrauen Kaufy', cta: 'Erfolgsgeschichten lesen' },
  ],
  futureroom: [
    { key: 'T1', name: 'Konditionen-Highlight', description: 'Aktuelle Zinskonditionen und Bankpartner hervorheben. Vertrauen durch Zahlen.', caption: 'Beste Konditionen ab 2,8% — über 400 Bankpartner', cta: 'Konditionen vergleichen', image: futureroomKonditionenImg },
    { key: 'T2', name: 'Berater-Portrait', description: 'Ihr Finanzierungsexperte stellt sich vor. Digital und persönlich zugleich.', caption: 'Ihr Finanzierungsexperte — digital und persönlich', cta: 'Beratung buchen' },
    { key: 'T3', name: 'Region-Focus', description: 'Regionale Marktanalyse für Ihre Zielregion. Lokale Expertise zeigen.', caption: 'Finanzierungsmarkt München — aktuelle Analyse', cta: 'Marktbericht lesen' },
    { key: 'T4', name: 'Testimonial', description: 'Abschlussquoten und Erfolgsstatistiken. Beweisen Sie Ihre Kompetenz mit Zahlen.', caption: '98% Abschlussquote bei KI-gestützter Aufbereitung', cta: 'Jetzt starten' },
  ],
  acquiary: [
    { key: 'T1', name: 'Off-Market-Chancen', description: 'Exklusive Objekte vor allen anderen. Zeigen Sie Ihr Sourcing-Netzwerk.', caption: 'Off-Market-Chancen — exklusive Objekte vor allen anderen', cta: 'Portfolio ansehen', image: acquiarySourcingImg },
    { key: 'T2', name: 'Objekt-Showcase', description: 'Mehrfamilienhäuser und Renditeobjekte in A-Lagen präsentieren.', caption: 'Mehrfamilienhäuser in A-Lagen — 3-7% Rendite', cta: 'Objektliste anfordern' },
    { key: 'T3', name: 'Berater-Portrait', description: 'Ihr Akquisitionspartner — strategisch und diskret.', caption: 'Ihr Akquisitionspartner — strategisch und diskret', cta: 'Kontakt aufnehmen' },
    { key: 'T4', name: 'Sourcing-Hotspots', description: 'Regionale Analyse: Wo lohnen sich Investitionen 2026?', caption: 'Sourcing-Hotspots 2026 — wo sich Investitionen lohnen', cta: 'Analyse anfordern' },
  ],
  custom: [
    { key: 'T1', name: 'Eigenes Creative 1', description: 'Laden Sie ein eigenes Bild hoch und schreiben Sie Ihren Text.', caption: '', cta: '' },
    { key: 'T2', name: 'Eigenes Creative 2', description: 'Weiteres Creative mit eigenem Bild und Text.', caption: '', cta: '' },
  ],
  project: [
    { key: 'T1', name: 'Projekt-Showcase', description: 'Projektname, Ort und Visualisierung. Zeigen Sie, was gebaut wird.', caption: '', cta: 'Jetzt Exposé anfordern' },
    { key: 'T2', name: 'Preis-Highlight', description: 'Preisrange und Einheitentypen aus Projektdaten.', caption: '', cta: 'Preisliste anfordern' },
    { key: 'T3', name: 'Standort-Highlight', description: 'Lage und Infrastruktur des Projektstandorts.', caption: '', cta: 'Standort entdecken' },
    { key: 'T4', name: 'Verfügbarkeit', description: 'X von Y Einheiten frei — erzeugt Dringlichkeit.', caption: '', cta: 'Verfügbarkeit prüfen' },
  ],
};

// Demo campaigns
const DEMO_CAMPAIGNS = [
  {
    id: 'demo-kaufy-1',
    brand: 'kaufy',
    name: 'Kaufy Frühjahrs-Kampagne',
    status: 'live' as const,
    budget: 250000,
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    regions: ['München', 'Augsburg'],
    caption: 'Kapitalanlage ab 289.000 EUR — Jetzt beraten lassen',
    leads: 12,
  },
  {
    id: 'demo-fr-1',
    brand: 'futureroom',
    name: 'FutureRoom Finanzierungs-Kampagne',
    status: 'submitted' as const,
    budget: 300000,
    startDate: '2026-03-15',
    endDate: '2026-04-15',
    regions: ['Berlin', 'Hamburg'],
    caption: 'Beste Konditionen ab 2,8% — über 400 Bankpartner vergleichen',
    leads: 8,
  },
  {
    id: 'demo-acq-1',
    brand: 'acquiary',
    name: 'Acquiary Sourcing-Kampagne',
    status: 'paused' as const,
    budget: 180000,
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    regions: ['Frankfurt', 'Rhein-Main'],
    caption: 'Off-Market-Chancen in A-Lagen — exklusiv für Investoren',
    leads: 3,
  },
];

// Demo leads
const DEMO_LEADS = [
  { id: 'demo-lead-1', name: 'Thomas Müller', email: 'mueller@example.de', phone: '+49 171 2345678', brand: 'kaufy', status: 'qualified', date: '2026-03-12', campaign: 'Kaufy Frühjahrs-Kampagne' },
  { id: 'demo-lead-2', name: 'Sandra Weber', email: 'weber@example.de', phone: '+49 172 8765432', brand: 'futureroom', status: 'contacted', date: '2026-03-18', campaign: 'FutureRoom Finanzierungs-Kampagne' },
  { id: 'demo-lead-3', name: 'Dr. Klaus Hoffmann', email: 'hoffmann@example.de', phone: '+49 160 1112233', brand: 'kaufy', status: 'new', date: '2026-03-20', campaign: 'Kaufy Frühjahrs-Kampagne' },
  { id: 'demo-lead-4', name: 'Anna Schneider', email: 'schneider@example.de', phone: '+49 175 9988776', brand: 'acquiary', status: 'new', date: '2026-03-22', campaign: 'Acquiary Sourcing-Kampagne' },
  { id: 'demo-lead-5', name: 'Michael Braun', email: 'braun@example.de', phone: '+49 151 4455667', brand: 'futureroom', status: 'converted', date: '2026-03-08', campaign: 'FutureRoom Finanzierungs-Kampagne' },
];

const BRAND_LABELS: Record<string, string> = {
  futureroom: 'FutureRoom', kaufy: 'Kaufy', acquiary: 'Acquiary', project: 'Projekt', custom: 'Eigene',
};

const BRAND_GRADIENTS: Record<string, string> = {
  kaufy: 'from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)]',
  futureroom: 'from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)]',
  acquiary: 'from-[hsl(210,80%,50%)] to-[hsl(200,70%,40%)]',
  project: 'from-[hsl(270,60%,50%)] to-[hsl(280,50%,60%)]',
  custom: 'from-[hsl(0,0%,25%)] to-[hsl(0,0%,45%)]',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string }> = {
  submitted: { label: 'Eingereicht', variant: 'outline', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  live: { label: 'Live', variant: 'default', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  paused: { label: 'Pausiert', variant: 'secondary', color: 'bg-muted text-muted-foreground' },
  stopped: { label: 'Gestoppt', variant: 'destructive', color: 'bg-red-500/10 text-red-700 border-red-200' },
  completed: { label: 'Abgeschlossen', variant: 'secondary', color: 'bg-muted text-muted-foreground' },
};

const LEAD_STATUS_OPTIONS = [
  { value: 'new', label: 'Neu', color: 'bg-blue-500/10 text-blue-700' },
  { value: 'contacted', label: 'Kontaktiert', color: 'bg-amber-500/10 text-amber-700' },
  { value: 'qualified', label: 'Qualifiziert', color: 'bg-green-500/10 text-green-700' },
  { value: 'converted', label: 'Konvertiert', color: 'bg-emerald-500/10 text-emerald-700' },
  { value: 'lost', label: 'Verloren', color: 'bg-red-500/10 text-red-700' },
];

const PRESETS = ['Kapitalanlage', 'Eigennutz', 'Vermietung', 'Finanzierung'];

type SlotCreative = { caption: string; cta: string };

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

  // ── Filter state ──
  const [brandFilter, setBrandFilter] = useState('all');
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');

  // ── Campaign creation state ──
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [planStartDate, setPlanStartDate] = useState('2026-03-01');
  const [planEndDate, setPlanEndDate] = useState('2026-03-31');
  const [planBudget, setPlanBudget] = useState(2500);
  const [planRegions, setPlanRegions] = useState('');
  const [planPresets, setPlanPresets] = useState<string[]>(['Kapitalanlage']);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [personalization, setPersonalization] = useState({ name: '', region: '', claim: '' });
  const [creatives, setCreatives] = useState<Record<string, SlotCreative>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Data queries ──
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

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['lead-manager-inline-leads', activeTenantId, user?.id, leadStatusFilter, projectFilter],
    queryFn: async () => {
      if (!activeTenantId || !user?.id) return [];
      let q = supabase
        .from('social_leads')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('partner_user_id', user.id)
        .order('created_at', { ascending: false });
      if (leadStatusFilter !== 'all') q = q.eq('lead_status', leadStatusFilter);
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
  const currentTemplates = selectedContext ? (BRAND_TEMPLATES[selectedContext] || []) : [];

  const toggleSlot = (key: string) => setSelectedSlots(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  const togglePreset = (p: string) => setPlanPresets(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const handleSelectContext = (key: string) => {
    setSelectedContext(key);
    setSelectedSlots([]);
    setCreatives({});
    if (key !== 'project') setSelectedProjectId(null);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedContext('project');
    const proj = projects?.find(p => p.id === projectId);
    if (proj) {
      setPlanRegions(proj.city || '');
      setPersonalization(prev => ({ ...prev, region: proj.city || '' }));
    }
  };

  const handleBeauftragen = async () => {
    if (!activeTenantId || !user?.id) { toast.error('Bitte einloggen'); return; }
    if (!selectedContext) { toast.error('Bitte wählen Sie, für wen Sie werben möchten'); return; }
    if (selectedContext === 'project' && !selectedProjectId) { toast.error('Bitte Projekt auswählen'); return; }
    if (selectedSlots.length === 0) { toast.error('Bitte mindestens eine Vorlage auswählen'); return; }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('sot-social-mandate-submit', {
        body: {
          tenant_id: activeTenantId,
          brand_context: selectedContext === 'project' ? 'project' : selectedContext,
          project_id: selectedContext === 'project' ? selectedProjectId : null,
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
      toast.success('Kampagne erfolgreich eingereicht!');
      setSelectedSlots([]);
      setCreatives({});
      setSelectedContext(null);
      queryClient.invalidateQueries({ queryKey: ['lead-manager-inline-campaigns'] });
    } catch (e: any) {
      toast.error(e.message || 'Fehler beim Einreichen');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo KPIs (sum of demo + real)
  const demoTotalSpend = DEMO_CAMPAIGNS.reduce((s, c) => s + c.budget, 0);
  const demoLeadCount = DEMO_CAMPAIGNS.reduce((s, c) => s + c.leads, 0);
  const realTotalSpend = campaignData?.totalSpend || 0;
  const realLeadCount = campaignData?.leadCount || 0;
  const totalSpend = demoTotalSpend + realTotalSpend;
  const totalLeads = demoLeadCount + realLeadCount;
  const activeCampaigns = (campaignData?.activeCampaigns || 0) + DEMO_CAMPAIGNS.filter(c => c.status === 'live' || c.status === 'submitted').length;

  const kpis = [
    { label: 'Gesamtausgaben', value: formatCurrency(totalSpend), icon: CreditCard, color: 'text-primary' },
    { label: 'Leads generiert', value: `${totalLeads}`, icon: Users, color: 'text-green-600' },
    { label: 'Cost per Lead', value: totalLeads > 0 ? formatCurrency(Math.round(totalSpend / totalLeads)) : '–', icon: TrendingUp, color: 'text-amber-600' },
    { label: 'Aktive Kampagnen', value: `${activeCampaigns}`, icon: Megaphone, color: 'text-primary' },
  ];

  const filterBrands = [
    { key: 'all', label: 'Alle' },
    { key: 'kaufy', label: 'Kaufy' },
    { key: 'futureroom', label: 'FutureRoom' },
    { key: 'acquiary', label: 'Acquiary' },
    { key: 'project', label: 'Projekte' },
  ];

  // Combined leads: demo + real
  const filteredDemoLeads = DEMO_LEADS.filter(l => {
    if (leadStatusFilter !== 'all' && l.status !== leadStatusFilter) return false;
    if (brandFilter !== 'all' && l.brand !== brandFilter) return false;
    return true;
  });

  const selectedLeadData = DEMO_LEADS.find(l => l.id === selectedLeadId) || (leads?.find(l => l.id === selectedLeadId) ? { ...leads.find(l => l.id === selectedLeadId) as any, isReal: true } : null);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <PageShell>
      <ModulePageHeader
        title="LEAD MANAGER"
        description="Social-Media-Kampagnen planen, Creatives gestalten, Leads verwalten — alles an einem Ort."
      />

      <div className="space-y-8">

        {/* ━━━ KACHEL 1: KPIs ━━━ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">Übersicht</h2>
            </div>
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
                {filterBrands.map(b => (
                  <Badge key={b.key} variant={brandFilter === b.key ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setBrandFilter(b.key)}>
                    {b.label}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ━━━ KACHEL 2: Meine Kampagnen (Demo + Real) ━━━ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">Meine Kampagnen</h2>
            </div>

            <div className="space-y-3">
              {/* Demo campaigns */}
              {DEMO_CAMPAIGNS.filter(c => brandFilter === 'all' || c.brand === brandFilter).map(campaign => {
                const status = STATUS_CONFIG[campaign.status];
                const gradient = BRAND_GRADIENTS[campaign.brand];
                const isExpanded = expandedCampaignId === campaign.id;
                return (
                  <div
                    key={campaign.id}
                    className={`rounded-xl overflow-hidden border transition-all cursor-pointer ${isExpanded ? 'border-primary shadow-md' : 'hover:border-primary/30'}`}
                    onClick={() => setExpandedCampaignId(isExpanded ? null : campaign.id)}
                  >
                    {/* Gradient header bar */}
                    <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">DEMO</Badge>
                          <span className="font-medium text-sm">{campaign.name}</span>
                        </div>
                        <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{formatCurrency(campaign.budget)}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(campaign.startDate).toLocaleDateString('de-DE')} – {new Date(campaign.endDate).toLocaleDateString('de-DE')}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{campaign.regions.join(', ')}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{campaign.leads} Leads</span>
                      </div>
                      {isExpanded && (
                        <div className="pt-2 border-t border-border/50 mt-2">
                          <p className="text-sm text-muted-foreground italic">„{campaign.caption}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Real campaigns from DB */}
              {campaignData?.mandates?.filter((m: any) => brandFilter === 'all' || m.brand_context === brandFilter).map((m: any) => {
                const status = STATUS_CONFIG[m.status] || { label: m.status, variant: 'outline', color: '' };
                const gradient = BRAND_GRADIENTS[m.brand_context] || 'from-muted to-muted';
                const isExpanded = expandedCampaignId === m.id;
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl overflow-hidden border transition-all cursor-pointer ${isExpanded ? 'border-primary shadow-md' : 'hover:border-primary/30'}`}
                    onClick={() => setExpandedCampaignId(isExpanded ? null : m.id)}
                  >
                    <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{BRAND_LABELS[m.brand_context] || m.brand_context}</Badge>
                        </div>
                        <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{formatCurrency(m.budget_total_cents || 0)}</span>
                        {m.start_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(m.start_date).toLocaleDateString('de-DE')} – {m.end_date ? new Date(m.end_date).toLocaleDateString('de-DE') : '—'}</span>}
                        {m.regions && Array.isArray(m.regions) && (m.regions as string[]).length > 0 && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{(m.regions as string[]).join(', ')}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ━━━ KACHEL 3: Neue Kampagne erstellen ━━━ */}
        <Card className="border-primary/20">
          <CardContent className="p-5 md:p-8 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Plus className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold">Neue Kampagne erstellen</h2>
              </div>
              <p className="text-sm text-muted-foreground">Wählen Sie eine Vorlage oder erstellen Sie eine freie Kampagne. Sie können alles anpassen.</p>
            </div>

            {/* ── Schritt 1: Für wen werben? ── */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Schritt 1 — Für wen möchten Sie werben?</h3>
                <p className="text-xs text-muted-foreground">Wählen Sie eine Marke aus, um passende Vorlagen zu erhalten, oder erstellen Sie eine eigene Kampagne.</p>
              </div>

              {/* Brand cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {BRAND_CARDS.map(brand => {
                  const isSelected = selectedContext === brand.key;
                  return (
                    <div
                      key={brand.key}
                      onClick={() => handleSelectContext(brand.key)}
                      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all group ${isSelected ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : 'hover:shadow-md hover:scale-[1.01]'}`}
                    >
                      <div className={`bg-gradient-to-br ${brand.gradient} p-6 text-white min-h-[160px] flex flex-col justify-between`}>
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                            <brand.icon className="h-5 w-5 text-white" />
                          </div>
                          <h4 className="text-lg font-bold tracking-tight">{brand.name}</h4>
                          <p className="text-xs text-white/70 uppercase tracking-wider">{brand.tagline}</p>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-white/80 leading-relaxed">{brand.description}</p>
                          <p className="text-xs text-white/60 mt-2">{brand.templateCount} Vorlagen verfügbar</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Extra context cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CONTEXT_EXTRA.map(ctx => {
                  const isSelected = selectedContext === ctx.key;
                  return (
                    <div
                      key={ctx.key}
                      onClick={() => handleSelectContext(ctx.key)}
                      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}
                    >
                      <div className={`bg-gradient-to-br ${ctx.gradient} p-5 text-white min-h-[120px] flex items-center gap-4`}>
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                        )}
                        <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                          <ctx.icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold">{ctx.name}</h4>
                          <p className="text-xs text-white/70 uppercase tracking-wider">{ctx.tagline}</p>
                          <p className="text-sm text-white/80 mt-1">{ctx.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Project selector */}
              {selectedContext === 'project' && (
                <div className="space-y-2 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <Label className="text-sm font-medium">Projekt auswählen</Label>
                  <Select value={selectedProjectId || ''} onValueChange={handleSelectProject}>
                    <SelectTrigger><SelectValue placeholder="Projekt auswählen..." /></SelectTrigger>
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
                    <p className="text-xs text-primary">✓ {selectedProject.name} — {selectedProject.city}</p>
                  )}
                </div>
              )}
            </div>

            {/* Show remaining steps only when context is selected */}
            {selectedContext && (
              <>
                <Separator />

                {/* ── Schritt 2: Kampagnen-Details ── */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Schritt 2 — Kampagnen-Details</h3>
                    <p className="text-xs text-muted-foreground">Legen Sie Budget, Laufzeit und Zielgruppe fest. Alles kann jederzeit angepasst werden.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">Laufzeit von</Label>
                      <Input type="date" value={planStartDate} onChange={e => setPlanStartDate(e.target.value)} className="text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Laufzeit bis</Label>
                      <Input type="date" value={planEndDate} onChange={e => setPlanEndDate(e.target.value)} className="text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Gesamtbudget (EUR)</Label>
                      <Input type="number" value={planBudget} onChange={e => setPlanBudget(Number(e.target.value))} min={500} step={100} className="text-sm" />
                      <p className="text-[11px] text-muted-foreground">Empfohlen: 1.500 – 5.000 EUR pro Monat</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Regionen</Label>
                      <Input placeholder="z.B. München, Berlin" value={planRegions} onChange={e => setPlanRegions(e.target.value)} className="text-sm" />
                      <p className="text-[11px] text-muted-foreground">Kommagetrennt eingeben</p>
                    </div>
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

                {/* ── Schritt 3: Anzeigen gestalten ── */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Schritt 3 — Anzeigen gestalten</h3>
                    <p className="text-xs text-muted-foreground">
                      Wählen Sie bis zu 5 Vorlagen. Jede Vorlage wird als 4-Slide-Anzeige für Facebook & Instagram generiert.
                      Sie können Texte anpassen und eigene Bilder hochladen.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentTemplates.map(tmpl => {
                      const isSelected = selectedSlots.includes(tmpl.key);
                      const creative = creatives[tmpl.key];
                      return (
                        <div
                          key={tmpl.key}
                          className={`rounded-xl border-2 overflow-hidden transition-all ${isSelected ? 'border-primary shadow-md' : 'border-dashed border-border hover:border-primary/40'}`}
                        >
                          {/* Image area */}
                          <div
                            className={`relative h-[200px] bg-gradient-to-br ${BRAND_GRADIENTS[selectedContext!] || 'from-muted to-muted'} flex items-center justify-center cursor-pointer group`}
                            onClick={() => toggleSlot(tmpl.key)}
                          >
                            {tmpl.image ? (
                              <img src={tmpl.image} alt={tmpl.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center text-white/60">
                                <ImagePlus className="h-10 w-10 mx-auto mb-2" />
                                <p className="text-sm">Bild hochladen</p>
                              </div>
                            )}
                            {/* Selection overlay */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="h-6 w-6 text-primary-foreground" />
                                </div>
                              </div>
                            )}
                            {/* Template badge */}
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-black/50 text-white border-0 text-xs backdrop-blur-sm">{tmpl.key}</Badge>
                            </div>
                          </div>

                          {/* Content area */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm">{tmpl.name}</h4>
                              <Button variant={isSelected ? "default" : "outline"} size="sm" className="text-xs h-7" onClick={() => toggleSlot(tmpl.key)}>
                                {isSelected ? 'Ausgewählt' : 'Auswählen'}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{tmpl.description}</p>

                            {isSelected && (
                              <div className="space-y-2 pt-2 border-t border-border/50">
                                <div className="space-y-1">
                                  <Label className="text-xs">Caption</Label>
                                  <Textarea
                                    className="text-xs min-h-[60px]"
                                    placeholder="Anzeigentext eingeben..."
                                    value={creative?.caption ?? tmpl.caption}
                                    onChange={e => setCreatives(prev => ({
                                      ...prev,
                                      [tmpl.key]: { caption: e.target.value, cta: prev[tmpl.key]?.cta ?? tmpl.cta }
                                    }))}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Call-to-Action</Label>
                                  <Input
                                    className="text-xs h-8"
                                    placeholder="z.B. Jetzt beraten lassen"
                                    value={creative?.cta ?? tmpl.cta}
                                    onChange={e => setCreatives(prev => ({
                                      ...prev,
                                      [tmpl.key]: { caption: prev[tmpl.key]?.caption ?? tmpl.caption, cta: e.target.value }
                                    }))}
                                  />
                                </div>
                                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
                                  <Upload className="h-3 w-3" /> Eigenes Bild hochladen
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground">{selectedSlots.length} von {currentTemplates.length} Vorlagen ausgewählt</p>
                </div>

                <Separator />

                {/* ── Schritt 4: Personalisierung ── */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Schritt 4 — Personalisierung</h3>
                    <p className="text-xs text-muted-foreground">Ergänzen Sie Ihre persönlichen Daten. Diese werden in die Anzeigen integriert.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Beraterportrait</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center shrink-0">
                          <User className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                        <div className="space-y-1">
                          <Button variant="outline" size="sm" className="text-xs gap-1.5">
                            <Upload className="h-3 w-3" /> Foto hochladen
                          </Button>
                          <p className="text-[11px] text-muted-foreground">Quadratisch, mind. 400×400px</p>
                        </div>
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
                  {selectedContext === 'project' && selectedProject && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm space-y-1">
                      <p className="text-xs font-semibold text-primary">Automatisch aus Projekt vorbefüllt:</p>
                      <p className="text-xs">Projektname: <span className="font-medium">{selectedProject.name}</span> · Standort: <span className="font-medium">{selectedProject.city || '—'}</span> · Einheiten: <span className="font-medium">{selectedProject.total_units_count || '—'}</span></p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* ── Schritt 5: Zusammenfassung & Beauftragen ── */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Schritt 5 — Vorschau & Beauftragen</h3>
                    <p className="text-xs text-muted-foreground">Prüfen Sie Ihre Kampagne und beauftragen Sie die Veröffentlichung.</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <span className="text-muted-foreground text-xs">Kontext</span>
                      <p className="font-medium text-sm">{selectedContext === 'project' ? selectedProject?.name || 'Projekt' : BRAND_LABELS[selectedContext] || selectedContext}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <span className="text-muted-foreground text-xs">Budget</span>
                      <p className="font-medium text-sm">{formatEur(planBudget)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <span className="text-muted-foreground text-xs">Laufzeit</span>
                      <p className="font-medium text-sm">{new Date(planStartDate).toLocaleDateString('de-DE')} – {new Date(planEndDate).toLocaleDateString('de-DE')}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <span className="text-muted-foreground text-xs">Vorlagen</span>
                      <p className="font-medium text-sm">{selectedSlots.length} ausgewählt</p>
                    </div>
                  </div>

                  <ul className="text-xs space-y-1.5 text-muted-foreground">
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> {selectedSlots.length} Slideshow-Anzeigen für Facebook & Instagram</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Veröffentlichung über zentralen Meta-Account</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Lead-Erfassung & automatische Zuordnung zu Ihrem Portal</li>
                    <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Performance-Dashboard mit Echtzeit-Tracking</li>
                  </ul>

                  <Button className="w-full gap-2" size="lg" onClick={handleBeauftragen} disabled={isSubmitting || selectedSlots.length === 0}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Kampagne beauftragen — {formatEur(planBudget)}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ━━━ KACHEL 4: Meine Leads (Demo + Real) ━━━ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Meine Leads</h2>
              </div>
              <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  {LEAD_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {/* Demo leads */}
              {filteredDemoLeads.map(lead => {
                const statusOpt = LEAD_STATUS_OPTIONS.find(s => s.value === lead.status);
                const isSelected = selectedLeadId === lead.id;
                return (
                  <div key={lead.id}>
                    <div
                      className={`rounded-lg border p-3 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/30'}`}
                      onClick={() => setSelectedLeadId(isSelected ? null : lead.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{lead.name}</p>
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">DEMO</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(lead.date).toLocaleDateString('de-DE')} · {BRAND_LABELS[lead.brand]} · {lead.campaign}</p>
                          </div>
                        </div>
                        <Badge className={`${statusOpt?.color || ''} text-xs`}>{statusOpt?.label || lead.status}</Badge>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-1 p-4 rounded-lg border border-primary/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Lead-Details</p>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLeadId(null)}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-muted-foreground text-xs">Name</span><p>{lead.name}</p></div>
                          <div><span className="text-muted-foreground text-xs">E-Mail</span><p>{lead.email}</p></div>
                          <div><span className="text-muted-foreground text-xs">Telefon</span><p>{lead.phone}</p></div>
                          <div><span className="text-muted-foreground text-xs">Kampagne</span><p>{lead.campaign}</p></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Real leads from DB */}
              {leads?.map(lead => {
                const leadData = lead.lead_data as any;
                const isSelected = selectedLeadId === lead.id;
                const statusOpt = LEAD_STATUS_OPTIONS.find(s => s.value === lead.lead_status);
                return (
                  <div key={lead.id}>
                    <div
                      className={`rounded-lg border p-3 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/30'}`}
                      onClick={() => setSelectedLeadId(isSelected ? null : lead.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{leadData?.name || leadData?.email || 'Lead'}</p>
                            <p className="text-xs text-muted-foreground">{new Date(lead.created_at).toLocaleDateString('de-DE')} · {BRAND_LABELS[lead.brand_context || ''] || '—'}</p>
                          </div>
                        </div>
                        <Badge className={`${statusOpt?.color || ''} text-xs`}>{statusOpt?.label || lead.lead_status}</Badge>
                      </div>
                    </div>
                    {isSelected && (
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
                          <Select value={lead.lead_status} onValueChange={v => updateLeadMutation.mutate({ id: lead.id, updates: { lead_status: v } })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{LEAD_STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Notizen</label>
                          <Textarea
                            className="text-xs"
                            placeholder="Notizen zum Lead..."
                            defaultValue={lead.notes || ''}
                            onBlur={e => {
                              if (e.target.value !== (lead.notes || ''))
                                updateLeadMutation.mutate({ id: lead.id, updates: { notes: e.target.value } });
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredDemoLeads.length === 0 && (!leads || leads.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Noch keine Leads</p>
                  <p className="text-xs">Starten Sie eine Kampagne, um automatisch Leads zu generieren.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
}
