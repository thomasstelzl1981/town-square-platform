/**
 * MOD-05 Website Builder — Single scrollable dashboard (Golden Path Standard)
 * WidgetGrid (Demo + Real Websites + CTA) + Inline-Flow sections
 */
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Globe, ExternalLink, Check, Palette, Search, Eye } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWebsites } from '@/hooks/useWebsites';
import { useHostingContract } from '@/hooks/useHostingContract';
import { DESIGN_TEMPLATES, DEFAULT_TEMPLATE_ID, getTemplate } from '@/shared/website-renderer/designTemplates';
import { CARD, TYPOGRAPHY, SPACING } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import VersionHistory from './VersionHistory';

const DEMO_WEBSITE = {
  id: '__demo__',
  name: 'Muster GmbH',
  slug: 'muster-gmbh',
  status: 'demo',
  industry: 'Immobilien',
  target_audience: 'Kapitalanleger',
  goal: 'branding',
  branding_json: { template_id: 'modern', primary_color: '#2563EB', font: 'Inter' },
  seo_json: { title: 'Muster GmbH – Ihr Immobilienpartner', description: 'Wir sind Ihr kompetenter Partner für Immobilieninvestments in ganz Deutschland.', og_image: '' },
} as any;

export default function WBDashboard() {
  const { data: websites, isLoading, createWebsite } = useWebsites();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', industry: '', target_audience: '', goal: 'branding', template_id: DEFAULT_TEMPLATE_ID });

  const isDemo = activeId === '__demo__';
  const activeWebsite = isDemo ? DEMO_WEBSITE : websites?.find((w: any) => w.id === activeId) || null;

  const handleCreate = () => {
    if (!form.name || !form.slug) return;
    const template = DESIGN_TEMPLATES.find(t => t.id === form.template_id) || DESIGN_TEMPLATES[0];
    createWebsite.mutate(
      { ...form, slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'), branding_json: { ...template.branding, template_id: form.template_id } },
      { onSuccess: (data: any) => { setShowCreate(false); setForm({ name: '', slug: '', industry: '', target_audience: '', goal: 'branding', template_id: DEFAULT_TEMPLATE_ID }); setActiveId(data.id); } },
    );
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { draft: 'bg-muted text-muted-foreground', published: 'bg-emerald-500/10 text-emerald-600', suspended: 'bg-destructive/10 text-destructive', demo: 'bg-primary/10 text-primary' };
    const labels: Record<string, string> = { draft: 'Entwurf', published: 'Online', suspended: 'Gesperrt', demo: 'Demo' };
    return <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', map[status] || map.draft)}>{labels[status] || status}</span>;
  };

  return (
    <PageShell>
      <ModulePageHeader title="Website Builder" description="Erstellen, gestalten und veröffentlichen Sie Ihre Unternehmenswebsite — alles an einem Ort." />

      <WidgetGrid>
        <WidgetCell>
          <div className={cn(CARD.CONTENT, CARD.INTERACTIVE, 'h-full flex flex-col justify-between', activeId === '__demo__' && 'ring-2 ring-primary')} onClick={() => setActiveId(activeId === '__demo__' ? null : '__demo__')}>
            <div>
              <div className="flex items-center justify-between mb-2"><p className={TYPOGRAPHY.CARD_TITLE}>Muster GmbH</p>{statusBadge('demo')}</div>
              <p className={TYPOGRAPHY.HINT}>/muster-gmbh</p>
              <p className="text-[10px] text-muted-foreground mt-2">So sieht ein fertiger Website-Auftrag aus</p>
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs text-primary"><Eye className="h-3 w-3" /> Demo ansehen</div>
          </div>
        </WidgetCell>

        {(websites || []).map((w: any) => (
          <WidgetCell key={w.id}>
            <div className={cn(CARD.CONTENT, CARD.INTERACTIVE, 'h-full flex flex-col justify-between', activeId === w.id && 'ring-2 ring-primary')} onClick={() => setActiveId(activeId === w.id ? null : w.id)}>
              <div>
                <div className="flex items-center justify-between mb-2"><p className={TYPOGRAPHY.CARD_TITLE}>{w.name}</p>{statusBadge(w.status)}</div>
                <p className={TYPOGRAPHY.HINT}>/{w.slug}</p>
              </div>
              {w.status === 'published' && <a href={`/website/sites/${w.slug}`} target="_blank" rel="noopener" className="text-xs text-primary flex items-center gap-1 mt-3" onClick={e => e.stopPropagation()}><ExternalLink className="h-3 w-3" /> Ansehen</a>}
            </div>
          </WidgetCell>
        ))}

        <WidgetCell>
          <div className={cn(CARD.CONTENT, CARD.INTERACTIVE, 'h-full flex flex-col items-center justify-center border-dashed border-2 border-border/40')} onClick={() => { setShowCreate(!showCreate); setActiveId(null); }}>
            <Plus className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm font-medium text-muted-foreground">Neue Website</span>
          </div>
        </WidgetCell>
      </WidgetGrid>

      {showCreate && (
        <div className={cn(CARD.CONTENT, 'space-y-4')}>
          <h3 className={TYPOGRAPHY.CARD_TITLE}>Neue Website erstellen</h3>
          <div>
            <Label className="mb-2 block">Design-Template wählen</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {DESIGN_TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => setForm(f => ({ ...f, template_id: t.id }))}
                  className={cn('relative rounded-lg p-3 text-left transition-all border-2', form.template_id === t.id ? 'border-primary ring-2 ring-primary/20' : 'border-border/30 hover:border-border/60')}>
                  <div className="h-12 rounded-md mb-2" style={{ background: t.preview_gradient }} />
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.description}</p>
                  {form.template_id === t.id && <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground" /></div>}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Firmenname *</Label><Input placeholder="Meine Firma GmbH" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') }))} /></div>
            <div><Label>URL-Slug *</Label><Input placeholder="meine-firma" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /><p className={cn(TYPOGRAPHY.HINT, 'mt-1')}>/website/sites/{form.slug || '...'}</p></div>
            <div><Label>Branche</Label><Input placeholder="z.B. Immobilien" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} /></div>
            <div><Label>Zielgruppe</Label><Input placeholder="z.B. Kapitalanleger" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} /></div>
            <div><Label>Ziel</Label><Select value={form.goal} onValueChange={v => setForm(f => ({ ...f, goal: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="branding">Branding</SelectItem><SelectItem value="leads">Lead-Generierung</SelectItem><SelectItem value="sales">Verkauf</SelectItem></SelectContent></Select></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={!form.name || !form.slug || createWebsite.isPending}>Website erstellen</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Abbrechen</Button>
          </div>
        </div>
      )}

      {activeWebsite && (
        <div className={cn(SPACING.SECTION)}>
          <DesignSection website={activeWebsite} isDemo={isDemo} />
          <SeoSection website={activeWebsite} isDemo={isDemo} />
          {!isDemo && (
            <div className={cn(CARD.CONTENT, 'space-y-3')}>
              <div className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /><h3 className={TYPOGRAPHY.CARD_TITLE}>Section-Editor</h3></div>
              <p className={TYPOGRAPHY.MUTED}>Bearbeiten Sie die Inhalte im visuellen Editor mit Live-Vorschau.</p>
              <Button size="sm" onClick={() => window.open(`/portal/website-builder/${activeWebsite.id}/editor`, '_self')}>Editor öffnen</Button>
            </div>
          )}
          <ContractSection website={activeWebsite} isDemo={isDemo} />
        </div>
      )}
    </PageShell>
  );
}

function DesignSection({ website, isDemo }: { website: any; isDemo: boolean }) {
  const qc = useQueryClient();
  const [branding, setBranding] = useState<any>(website.branding_json || {});
  const [saving, setSaving] = useState(false);
  useEffect(() => { setBranding(website.branding_json || {}); }, [website.branding_json]);
  const currentTemplate = branding.template_id || 'modern';

  const saveBranding = async (b: any) => {
    if (isDemo) return;
    setSaving(true);
    try { const { error } = await supabase.from('tenant_websites' as any).update({ branding_json: b }).eq('id', website.id); if (error) throw error; qc.invalidateQueries({ queryKey: ['tenant_websites'] }); toast.success('Design gespeichert'); }
    catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className={cn(CARD.CONTENT, 'space-y-4')}>
      <div className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /><h3 className={TYPOGRAPHY.CARD_TITLE}>Design & Branding</h3></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {DESIGN_TEMPLATES.map(t => (
          <button key={t.id} type="button" disabled={isDemo}
            onClick={() => { const tpl = getTemplate(t.id); const nb = { ...branding, ...tpl.branding, template_id: t.id }; setBranding(nb); if (!isDemo) saveBranding(nb); }}
            className={cn('relative rounded-lg p-3 text-left transition-all border-2', currentTemplate === t.id ? 'border-primary ring-2 ring-primary/20' : 'border-border/30 hover:border-border/60', isDemo && 'opacity-70 cursor-default')}>
            <div className="h-12 rounded-md mb-2" style={{ background: t.preview_gradient }} />
            <p className="text-sm font-medium">{t.name}</p>
            <p className="text-[10px] text-muted-foreground">{t.description}</p>
            {currentTemplate === t.id && <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center"><Check className="h-3 w-3 text-primary-foreground" /></div>}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label>Primärfarbe</Label><div className="flex gap-2 items-center"><input type="color" value={branding.primary_color || '#2563EB'} onChange={e => setBranding((b: any) => ({ ...b, primary_color: e.target.value }))} className="h-9 w-12 rounded border border-border cursor-pointer" disabled={isDemo} /><Input className="h-9 text-sm flex-1" value={branding.primary_color || ''} onChange={e => setBranding((b: any) => ({ ...b, primary_color: e.target.value }))} disabled={isDemo} /></div></div>
        <div><Label>Schriftart</Label><Select value={branding.font || 'Inter'} onValueChange={v => setBranding((b: any) => ({ ...b, font: v }))} disabled={isDemo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Inter">Inter</SelectItem><SelectItem value="Georgia">Georgia</SelectItem><SelectItem value="system-ui">System</SelectItem></SelectContent></Select></div>
        <div><Label>Logo URL</Label><Input className="h-9 text-sm" value={branding.logo_url || ''} onChange={e => setBranding((b: any) => ({ ...b, logo_url: e.target.value }))} disabled={isDemo} /></div>
      </div>
      {!isDemo && <Button onClick={() => saveBranding(branding)} disabled={saving} size="sm">{saving ? 'Speichert...' : 'Branding speichern'}</Button>}
    </div>
  );
}

function SeoSection({ website, isDemo }: { website: any; isDemo: boolean }) {
  const qc = useQueryClient();
  const [seo, setSeo] = useState<any>(website.seo_json || {});
  const [saving, setSaving] = useState(false);
  useEffect(() => { setSeo(website.seo_json || {}); }, [website.seo_json]);
  const titleLen = (seo.title || '').length;
  const descLen = (seo.description || '').length;

  const handleSave = async () => {
    if (isDemo) return;
    setSaving(true);
    try { const { error } = await supabase.from('tenant_websites' as any).update({ seo_json: seo }).eq('id', website.id); if (error) throw error; qc.invalidateQueries({ queryKey: ['tenant_websites'] }); toast.success('SEO gespeichert'); }
    catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className={cn(CARD.CONTENT, 'space-y-4')}>
      <div className="flex items-center gap-2"><Search className="h-5 w-5 text-primary" /><h3 className={TYPOGRAPHY.CARD_TITLE}>SEO & Meta-Daten</h3></div>
      <div><div className="flex items-center justify-between"><Label>Seitentitel</Label><span className={cn('text-xs', titleLen > 60 ? 'text-destructive' : 'text-muted-foreground')}>{titleLen}/60</span></div><Input className="h-9 text-sm" value={seo.title || ''} onChange={e => setSeo((s: any) => ({ ...s, title: e.target.value }))} disabled={isDemo} placeholder={website.name} /></div>
      <div><div className="flex items-center justify-between"><Label>Meta-Beschreibung</Label><span className={cn('text-xs', descLen > 160 ? 'text-destructive' : 'text-muted-foreground')}>{descLen}/160</span></div><Textarea className="text-sm min-h-[80px]" value={seo.description || ''} onChange={e => setSeo((s: any) => ({ ...s, description: e.target.value }))} disabled={isDemo} /></div>
      <div><Label>OG-Image URL</Label><Input className="h-9 text-sm" value={seo.og_image || ''} onChange={e => setSeo((s: any) => ({ ...s, og_image: e.target.value }))} disabled={isDemo} placeholder="https://..." /></div>
      <div className="border border-border/30 rounded-lg p-4 bg-muted/10">
        <p className="text-xs text-muted-foreground mb-2">Google-Vorschau</p>
        <p className="text-primary text-base font-medium truncate">{seo.title || website.name}</p>
        <p className="text-xs text-muted-foreground truncate">{`${window.location.origin}/website/sites/${website.slug}`}</p>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{seo.description || 'Keine Beschreibung vorhanden.'}</p>
      </div>
      {!isDemo && <Button onClick={handleSave} disabled={saving} size="sm">{saving ? 'Speichert...' : 'SEO speichern'}</Button>}
    </div>
  );
}

function ContractSection({ website, isDemo }: { website: any; isDemo: boolean }) {
  const { data: contract, isLoading } = useHostingContract(isDemo ? undefined : website.id);
  const statusMap: Record<string, { label: string; color: string }> = { active: { label: 'Aktiv (Credits-basiert)', color: 'text-emerald-600' }, pending: { label: 'Ausstehend', color: 'text-amber-600' }, suspended: { label: 'Gesperrt', color: 'text-destructive' }, cancelled: { label: 'Gekündigt', color: 'text-muted-foreground' } };

  return (
    <div className="space-y-4">
      <div className={cn(CARD.CONTENT, 'space-y-3')}>
        <h3 className={TYPOGRAPHY.CARD_TITLE}>Hosting-Vertrag</h3>
        {isDemo ? (
          <>
            <div className="flex items-center gap-2"><span className={TYPOGRAPHY.LABEL}>Status:</span><span className="text-sm font-medium text-emerald-600">Aktiv (Demo)</span></div>
            <div className="flex items-center gap-2"><span className={TYPOGRAPHY.LABEL}>Abrechnung:</span><span className="text-sm">Credits-basiert</span></div>
            <p className={TYPOGRAPHY.HINT}>Vertrag abgeschlossen am 01.01.2026</p>
          </>
        ) : isLoading ? <p className={TYPOGRAPHY.MUTED}>Laden...</p> : contract ? (
          <>
            <div className="flex items-center gap-2"><span className={TYPOGRAPHY.LABEL}>Status:</span><span className={cn('text-sm font-medium', statusMap[contract.status]?.color)}>{statusMap[contract.status]?.label || contract.status}</span></div>
            <div className="flex items-center gap-2"><span className={TYPOGRAPHY.LABEL}>Abrechnung:</span><span className="text-sm">Credits-basiert</span></div>
            {contract.credits_charged > 0 && <div className="flex items-center gap-2"><span className={TYPOGRAPHY.LABEL}>Credits:</span><span className="text-sm">{contract.credits_charged}</span></div>}
            {contract.accepted_terms_at && <p className={TYPOGRAPHY.HINT}>Vertrag: {new Date(contract.accepted_terms_at).toLocaleDateString('de-DE')}</p>}
          </>
        ) : <p className={TYPOGRAPHY.MUTED}>Kein Hosting-Vertrag vorhanden.</p>}
      </div>
      {!isDemo && <VersionHistory websiteId={website.id} websiteSlug={website.slug} />}
      {isDemo && (
        <div className={cn(CARD.CONTENT, 'space-y-2')}>
          <h3 className={TYPOGRAPHY.CARD_TITLE}>Versionshistorie</h3>
          <div className={cn(CARD.CONTENT, 'flex items-center justify-between')}>
            <div><span className="text-sm font-medium">v1</span><span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded ml-2">Aktuell</span><p className={TYPOGRAPHY.HINT}>01.01.2026, 10:00</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
