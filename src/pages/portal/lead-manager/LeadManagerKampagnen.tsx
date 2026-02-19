/**
 * LeadManagerKampagnen — Campaign cockpit (MOD-10)
 * Real DB data only: KPIs from social_mandates/social_leads,
 * campaign list, 5-step creation wizard, lead inbox.
 */
import { useState, useMemo } from 'react';
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
import { Separator } from '@/components/ui/separator';
import {
  Megaphone, Users, TrendingUp, CreditCard, Plus, Inbox,
  User, Check, Loader2, Calendar, MapPin, ShoppingBag, Landmark, Search,
  FolderKanban, ImagePlus, ChevronDown, ChevronUp,
} from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { TemplateCard } from './TemplateCard';
import { DESIGN } from '@/config/designManifest';
import { toast } from 'sonner';

// ─── Constants ──────────────────────────────────────────────────────────────

const BRAND_CARDS = [
  { key: 'kaufy', name: 'KAUFY', tagline: 'Marktplatz & Investment', gradient: 'from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)]', icon: ShoppingBag },
  { key: 'futureroom', name: 'FutureRoom', tagline: 'Finanzierung', gradient: 'from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)]', icon: Landmark },
  { key: 'acquiary', name: 'ACQUIARY', tagline: 'Sourcing & Akquisition', gradient: 'from-[hsl(210,80%,50%)] to-[hsl(200,70%,40%)]', icon: Search },
] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Eingereicht', color: 'bg-amber-500/10 text-amber-700 border-amber-200' },
  live: { label: 'Live', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
  paused: { label: 'Pausiert', color: 'bg-muted text-muted-foreground' },
  stopped: { label: 'Gestoppt', color: 'bg-red-500/10 text-red-700 border-red-200' },
  completed: { label: 'Abgeschlossen', color: 'bg-muted text-muted-foreground' },
};

const LEAD_STATUS_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'new', label: 'Neu', color: 'bg-blue-500/10 text-blue-700' },
  { value: 'contacted', label: 'Kontaktiert', color: 'bg-amber-500/10 text-amber-700' },
  { value: 'qualified', label: 'Qualifiziert', color: 'bg-green-500/10 text-green-700' },
  { value: 'converted', label: 'Konvertiert', color: 'bg-emerald-500/10 text-emerald-700' },
  { value: 'lost', label: 'Verloren', color: 'bg-red-500/10 text-red-700' },
];

const BRAND_GRADIENTS: Record<string, string> = {
  kaufy: 'from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)]',
  futureroom: 'from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)]',
  acquiary: 'from-[hsl(210,80%,50%)] to-[hsl(200,70%,40%)]',
  project: 'from-[hsl(270,60%,50%)] to-[hsl(280,50%,60%)]',
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);
}

// ─── Component ──────────────────────────────────────────────────────────────

interface LeadManagerKampagnenProps {
  contextMode?: 'brand' | 'project' | 'all';
  projectFilter?: string;
}

export default function LeadManagerKampagnen({ contextMode = 'all', projectFilter }: LeadManagerKampagnenProps) {
  const { user, activeTenantId } = useAuth();
  const queryClient = useQueryClient();

  // ── Filter state ──
  const [brandFilter, setBrandFilter] = useState('all');
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // ── Campaign creation state ──
  const [showCreator, setShowCreator] = useState(false);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [planBudget, setPlanBudget] = useState(2500);
  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [planRegions, setPlanRegions] = useState('');
  const [personalization, setPersonalization] = useState({ name: '', region: '', claim: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Data queries ──
  const { data: campaignData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['lead-manager-campaigns', activeTenantId, user?.id, brandFilter, projectFilter],
    queryFn: async () => {
      if (!activeTenantId || !user?.id) return { mandates: [], totalSpend: 0, leadCount: 0, activeCampaigns: 0 };
      let q = supabase
        .from('social_mandates')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('partner_user_id', user.id)
        .order('created_at', { ascending: false });
      if (brandFilter !== 'all') q = q.eq('brand_context', brandFilter);
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
      return { mandates: list, totalSpend, leadCount: count || 0, activeCampaigns };
    },
    enabled: !!activeTenantId && !!user?.id,
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['lead-manager-leads', activeTenantId, user?.id, leadStatusFilter, projectFilter],
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

  // Templates for selected brand (campaign creation step 2)
  const { data: availableTemplates } = useQuery({
    queryKey: ['social-templates-for-campaign', activeTenantId, selectedContext],
    queryFn: async () => {
      if (!activeTenantId || !selectedContext) return [];
      const { data } = await supabase
        .from('social_templates')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('brand_context', selectedContext)
        .eq('active', true)
        .order('code');
      return data || [];
    },
    enabled: !!activeTenantId && !!selectedContext,
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('social_leads').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-manager-leads'] });
      toast.success('Lead aktualisiert');
    },
  });

  // ── Computed ──
  const totalSpend = campaignData?.totalSpend || 0;
  const totalLeads = campaignData?.leadCount || 0;
  const activeCampaigns = campaignData?.activeCampaigns || 0;
  const cpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;

  const kpis = [
    { label: 'Gesamtausgaben', value: formatCurrency(totalSpend), icon: CreditCard, color: 'text-primary' },
    { label: 'Leads generiert', value: `${totalLeads}`, icon: Users, color: 'text-green-600' },
    { label: 'Cost per Lead', value: totalLeads > 0 ? formatCurrency(cpl) : '–', icon: TrendingUp, color: 'text-amber-600' },
    { label: 'Aktive Kampagnen', value: `${activeCampaigns}`, icon: Megaphone, color: 'text-primary' },
  ];

  const filterBrands = [
    { key: 'all', label: 'Alle' },
    { key: 'kaufy', label: 'Kaufy' },
    { key: 'futureroom', label: 'FutureRoom' },
    { key: 'acquiary', label: 'Acquiary' },
    { key: 'project', label: 'Projekte' },
  ];

  // ── Campaign creation handlers ──
  const handleSelectContext = (key: string) => {
    setSelectedContext(key);
    setSelectedTemplates([]);
  };

  const toggleTemplate = (id: string) => {
    setSelectedTemplates(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const extractFields = (schema: any) => ({
    caption: schema?.caption?.default || '',
    cta: schema?.cta?.default || '',
    description: schema?.description || '',
  });

  const handleSubmit = async () => {
    if (!activeTenantId || !user?.id) return;
    if (!selectedContext) { toast.error('Bitte Marke wählen'); return; }
    if (!campaignName.trim()) { toast.error('Bitte Kampagnenname eingeben'); return; }
    if (selectedTemplates.length === 0) { toast.error('Bitte mindestens eine Vorlage auswählen'); return; }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('sot-social-mandate-submit', {
        body: {
          tenant_id: activeTenantId,
          brand_context: selectedContext,
          campaign_name: campaignName,
          budget_total_cents: planBudget * 100,
          start_date: planStartDate || null,
          end_date: planEndDate || null,
          regions: planRegions.split(',').map(r => r.trim()).filter(Boolean),
          template_ids: selectedTemplates,
          personalization,
        },
      });
      if (error) throw error;
      toast.success('Kampagne erfolgreich eingereicht!');
      setShowCreator(false);
      setSelectedContext(null);
      setSelectedTemplates([]);
      setCampaignName('');
      queryClient.invalidateQueries({ queryKey: ['lead-manager-campaigns'] });
    } catch (e: any) {
      toast.error(e.message || 'Fehler beim Einreichen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreator = () => {
    setShowCreator(false);
    setSelectedContext(null);
    setSelectedTemplates([]);
    setCampaignName('');
    setPlanBudget(2500);
    setPlanStartDate('');
    setPlanEndDate('');
    setPlanRegions('');
    setPersonalization({ name: '', region: '', claim: '' });
  };

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <PageShell>
      <ModulePageHeader
        title="KAMPAGNEN"
        description="Kampagnen erstellen, buchen und Leads verwalten."
        actions={undefined}
      />

      <div className="space-y-8">

        {/* ━━━ KPIs ━━━ */}
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

        {/* ━━━ Meine Kampagnen ━━━ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium">Meine Kampagnen</h2>
            </div>

            {campaignsLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : campaignData?.mandates && campaignData.mandates.length > 0 ? (
              <div className="space-y-3">
                {campaignData.mandates.map(m => {
                  const status = STATUS_CONFIG[m.status] || { label: m.status, color: 'bg-muted text-muted-foreground' };
                  const gradient = BRAND_GRADIENTS[m.brand_context] || BRAND_GRADIENTS.kaufy;
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
                          <span className="font-medium text-sm">{m.brand_context?.toUpperCase()}</span>
                          <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{formatCurrency(m.budget_total_cents || 0)}</span>
                          {m.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(m.start_date).toLocaleDateString('de-DE')} – {m.end_date ? new Date(m.end_date).toLocaleDateString('de-DE') : '—'}
                            </span>
                          )}
                          {m.regions && Array.isArray(m.regions) && (m.regions as string[]).length > 0 && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{(m.regions as string[]).join(', ')}</span>
                          )}
                        </div>
                        {isExpanded && (
                          <div className="pt-2 border-t border-border/50 mt-2 text-xs text-muted-foreground">
                            Erstellt: {new Date(m.created_at).toLocaleDateString('de-DE')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Megaphone}
                title="Noch keine Kampagnen"
                description="Erstellen Sie Ihre erste Kampagne, um Leads zu generieren."
              />
            )}
          </CardContent>
        </Card>

        {/* ━━━ Neue Kampagne erstellen ━━━ */}
        {(
          <Card>
            <CardContent className="p-5 space-y-6">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Neue Kampagne erstellen</h2>
              </div>

              {/* Schritt 1: Marke wählen */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Schritt 1: Für welche Marke möchten Sie werben?</h3>
                <p className="text-xs text-muted-foreground">Wählen Sie eine Marke. Die zugehörigen Vorlagen werden automatisch geladen.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {BRAND_CARDS.map(b => (
                    <div
                      key={b.key}
                      className={`rounded-xl overflow-hidden cursor-pointer transition-all ${selectedContext === b.key ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'}`}
                      onClick={() => handleSelectContext(b.key)}
                    >
                      <div className={`h-[120px] bg-gradient-to-br ${b.gradient} flex items-center justify-center`}>
                        <b.icon className="h-10 w-10 text-white/70" />
                      </div>
                      <div className="p-3 border border-t-0 rounded-b-xl">
                        <p className="font-semibold text-sm">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.tagline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schritt 2: Vorlagen auswählen */}
              {selectedContext && (
                <div className="space-y-3">
                  <Separator />
                  <h3 className="text-sm font-medium">Schritt 2: Vorlagen auswählen</h3>
                  <p className="text-xs text-muted-foreground">
                    Wählen Sie die Vorlagen, die Sie in dieser Kampagne verwenden möchten.
                    Vorlagen können in den jeweiligen Marken-Tabs bearbeitet werden.
                  </p>
                  {availableTemplates && availableTemplates.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableTemplates.map(t => (
                        <TemplateCard
                          key={t.id}
                          id={t.id}
                          name={t.name}
                          code={t.code}
                          brandGradient={BRAND_GRADIENTS[selectedContext] || BRAND_GRADIENTS.kaufy}
                          fields={extractFields(t.editable_fields_schema)}
                          active={t.active}
                          selectable
                          selected={selectedTemplates.includes(t.id)}
                          onSelect={toggleTemplate}
                          onSave={() => {}}
                          onToggleActive={() => {}}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                      Keine aktiven Vorlagen vorhanden. Bitte erstellen Sie zuerst Vorlagen im Tab „{BRAND_CARDS.find(b => b.key === selectedContext)?.name}".
                    </div>
                  )}
                </div>
              )}

              {/* Schritt 3: Kampagnen-Details */}
              {selectedContext && selectedTemplates.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <h3 className="text-sm font-medium">Schritt 3: Kampagnen-Details</h3>
                  <div className={DESIGN.FORM_GRID.FULL}>
                    <div>
                      <Label className="text-xs">Kampagnenname *</Label>
                      <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="z.B. Frühjahrs-Kampagne 2026" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Budget (EUR)</Label>
                      <Input type="number" value={planBudget} onChange={(e) => setPlanBudget(Number(e.target.value))} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Startdatum</Label>
                      <Input type="date" value={planStartDate} onChange={(e) => setPlanStartDate(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Enddatum</Label>
                      <Input type="date" value={planEndDate} onChange={(e) => setPlanEndDate(e.target.value)} className="mt-1" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">Regionen (kommagetrennt)</Label>
                      <Input value={planRegions} onChange={(e) => setPlanRegions(e.target.value)} placeholder="z.B. München, Berlin" className="mt-1" />
                    </div>
                  </div>
                </div>
              )}

              {/* Schritt 4: Personalisierung */}
              {selectedContext && selectedTemplates.length > 0 && campaignName.trim() && (
                <div className="space-y-3">
                  <Separator />
                  <h3 className="text-sm font-medium">Schritt 4: Personalisierung</h3>
                  <p className="text-xs text-muted-foreground">Ihre Angaben erscheinen auf den Anzeigen.</p>
                  <div className={DESIGN.FORM_GRID.FULL}>
                    <div>
                      <Label className="text-xs">Ihr Name</Label>
                      <Input value={personalization.name} onChange={(e) => setPersonalization(p => ({ ...p, name: e.target.value }))} placeholder="Max Mustermann" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Region</Label>
                      <Input value={personalization.region} onChange={(e) => setPersonalization(p => ({ ...p, region: e.target.value }))} placeholder="München" className="mt-1" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs">Claim / Slogan</Label>
                      <Input value={personalization.claim} onChange={(e) => setPersonalization(p => ({ ...p, claim: e.target.value }))} placeholder="Ihr Immobilienexperte in München" className="mt-1" />
                    </div>
                  </div>
                </div>
              )}

              {/* Schritt 5: Beauftragen */}
              {selectedContext && selectedTemplates.length > 0 && campaignName.trim() && (
                <div className="space-y-3">
                  <Separator />
                  <h3 className="text-sm font-medium">Schritt 5: Zusammenfassung & Beauftragen</h3>
                  <div className="rounded-xl bg-muted/30 border p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Marke</span><span className="font-medium">{BRAND_CARDS.find(b => b.key === selectedContext)?.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Kampagnenname</span><span className="font-medium">{campaignName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Vorlagen</span><span className="font-medium">{selectedTemplates.length} ausgewählt</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span className="font-medium">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(planBudget)}</span></div>
                    {planStartDate && <div className="flex justify-between"><span className="text-muted-foreground">Zeitraum</span><span className="font-medium">{planStartDate} – {planEndDate || '—'}</span></div>}
                    {planRegions && <div className="flex justify-between"><span className="text-muted-foreground">Regionen</span><span className="font-medium">{planRegions}</span></div>}
                  </div>
                  <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full gap-2" size="lg">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Kampagne beauftragen — {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(planBudget)}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ━━━ Meine Leads ━━━ */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Meine Leads</h2>
              </div>
              <div className="flex flex-wrap gap-1">
                {LEAD_STATUS_OPTIONS.map(s => (
                  <Badge
                    key={s.value}
                    variant={leadStatusFilter === s.value ? 'default' : 'outline'}
                    className="cursor-pointer text-[10px]"
                    onClick={() => setLeadStatusFilter(s.value)}
                  >
                    {s.label}
                  </Badge>
                ))}
              </div>
            </div>

            {leadsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : leads && leads.length > 0 ? (
              <div className="space-y-2">
                {leads.map(lead => {
                  const statusOpt = LEAD_STATUS_OPTIONS.find(s => s.value === lead.lead_status);
                  const isSelected = selectedLeadId === lead.id;
                  const ld = (lead.lead_data || {}) as Record<string, any>;
                  const displayName = ld.name || ld.first_name || ld.email || 'Unbekannt';
                  const displayEmail = ld.email || '';
                  const displayPhone = ld.phone || ld.telefon || '';
                  return (
                    <div
                      key={lead.id}
                      className={`rounded-lg border p-3 cursor-pointer transition-all ${isSelected ? 'border-primary shadow-sm' : 'hover:border-primary/30'}`}
                      onClick={() => setSelectedLeadId(isSelected ? null : lead.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{displayName}</span>
                        </div>
                        <Badge className={`text-[10px] ${statusOpt?.color || ''}`}>{statusOpt?.label || lead.lead_status}</Badge>
                      </div>
                      {isSelected && (
                        <div className="mt-2 pt-2 border-t border-border/50 space-y-1 text-xs text-muted-foreground">
                          {displayEmail && <p>E-Mail: {displayEmail}</p>}
                          {displayPhone && <p>Telefon: {displayPhone}</p>}
                          <p>Erstellt: {new Date(lead.created_at).toLocaleDateString('de-DE')}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Inbox}
                title="Noch keine Leads"
                description="Starten Sie eine Kampagne, um automatisch Leads zu generieren."
              />
            )}
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
}
