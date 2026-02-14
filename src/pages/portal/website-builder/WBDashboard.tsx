/**
 * MOD-05 Website Builder — Redesigned Dashboard
 * Template gallery + Work tiles (AI, company data, images, editor) + Full-size live preview
 */
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Globe, ExternalLink, Check, Palette, Search, Eye, Sparkles, Send, Building2, Image, Upload, FileText, Trash2, GripVertical, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploader } from '@/components/shared/FileUploader';
import { useWebsites } from '@/hooks/useWebsites';
import { useHostingContract } from '@/hooks/useHostingContract';
import { useWebsitePage, useSections } from '@/hooks/useSections';
import { SectionRenderer } from '@/shared/website-renderer';
import { DESIGN_TEMPLATES, DEFAULT_TEMPLATE_ID, getTemplate } from '@/shared/website-renderer/designTemplates';
import { SECTION_TYPES, SECTION_TYPE_LABELS, type SectionType, type WebsiteSection } from '@/shared/website-renderer/types';
import { CARD, TYPOGRAPHY, SPACING, DEMO_WIDGET, INFO_BANNER } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DEMO_SECTIONS, DEMO_BRANDING } from './DemoSections';
import { WebsiteThumbnail } from './WebsiteThumbnail';
import { ProcessStepper, type StepId } from './ProcessStepper';
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
  const [currentStep, setCurrentStep] = useState<StepId>('design');
  const [form, setForm] = useState({ name: '', slug: '', industry: '', target_audience: '', goal: 'branding', template_id: DEFAULT_TEMPLATE_ID });

  const isDemo = activeId === '__demo__';
  const activeWebsite = isDemo ? DEMO_WEBSITE : websites?.find((w: any) => w.id === activeId) || null;

  const handleCreate = () => {
    if (!form.name || !form.slug) return;
    const template = DESIGN_TEMPLATES.find(t => t.id === form.template_id) || DESIGN_TEMPLATES[0];
    createWebsite.mutate(
      { ...form, slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'), branding_json: { ...template.branding, template_id: form.template_id } },
      { onSuccess: (data: any) => { setShowCreate(false); setForm({ name: '', slug: '', industry: '', target_audience: '', goal: 'branding', template_id: DEFAULT_TEMPLATE_ID }); setActiveId(data.id); setCurrentStep('design'); } },
    );
  };

  const handleSelectTemplate = (templateId: string) => {
    setForm(f => ({ ...f, template_id: templateId }));
    setShowCreate(true);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { draft: 'bg-muted text-muted-foreground', published: 'bg-emerald-500/10 text-emerald-600', suspended: 'bg-destructive/10 text-destructive', demo: 'bg-primary/10 text-primary' };
    const labels: Record<string, string> = { draft: 'Entwurf', published: 'Online', suspended: 'Gesperrt', demo: 'Demo' };
    return <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', map[status] || map.draft)}>{labels[status] || status}</span>;
  };

  const completedSteps: StepId[] = [];
  if (activeWebsite && activeWebsite.branding_json?.template_id) completedSteps.push('design');

  return (
    <PageShell>
      <ModulePageHeader title="Website Builder" description="Erstellen, gestalten und veröffentlichen Sie Ihre Unternehmenswebsite — alles an einem Ort." />

      {/* Template gallery removed — template selection now only in inline detail */}

      {/* ─── Create Form ─── */}
      {showCreate && (
        <div className={cn(CARD.CONTENT, 'space-y-4 border border-primary/20')}>
          <h3 className={TYPOGRAPHY.CARD_TITLE}>Neue Website erstellen — {DESIGN_TEMPLATES.find(t => t.id === form.template_id)?.name || 'Modern'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Firmenname *</Label><Input placeholder="Meine Firma GmbH" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') }))} /></div>
            <div><Label>URL-Slug *</Label><Input placeholder="meine-firma" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /><p className={cn(TYPOGRAPHY.HINT, 'mt-1')}>/website/sites/{form.slug || '...'}</p></div>
            <div><Label>Branche</Label><Input placeholder="z.B. Immobilien" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} /></div>
            <div><Label>Zielgruppe</Label><Input placeholder="z.B. Kapitalanleger" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} /></div>
            <div><Label>Ziel</Label><Select value={form.goal} onValueChange={v => setForm(f => ({ ...f, goal: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="branding">Branding</SelectItem><SelectItem value="leads">Lead-Generierung</SelectItem><SelectItem value="sales">Verkauf</SelectItem></SelectContent></Select></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={!form.name || !form.slug || createWebsite.isPending}>
              <Sparkles className="h-4 w-4 mr-1" />Website erstellen
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Abbrechen</Button>
          </div>
        </div>
      )}

      {/* ─── My Websites Grid ─── */}
      <div className={cn(SPACING.SECTION)}>
        
        <WidgetGrid>
          {/* Demo tile */}
          <WidgetCell>
            <div
              className={cn(
                CARD.BASE, CARD.INTERACTIVE, 'h-full flex flex-col overflow-hidden',
                activeId === '__demo__' && 'ring-2 ring-primary',
                DEMO_WIDGET.CARD, DEMO_WIDGET.HOVER,
              )}
              onClick={() => { setActiveId(activeId === '__demo__' ? null : '__demo__'); setCurrentStep('design'); }}
            >
              <div className="h-[60%] overflow-hidden bg-muted/20">
                <WebsiteThumbnail sections={DEMO_SECTIONS} branding={DEMO_BRANDING} />
              </div>
              <div className="p-3 flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className={TYPOGRAPHY.CARD_TITLE}>Muster GmbH</p>
                    {statusBadge('demo')}
                  </div>
                  <p className={TYPOGRAPHY.HINT}>So sieht ein fertiger Auftrag aus</p>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-primary"><Eye className="h-3 w-3" /> Demo ansehen</div>
              </div>
            </div>
          </WidgetCell>

          {/* Real websites */}
          {(websites || []).map((w: any) => (
            <WidgetCell key={w.id}>
              <div
                className={cn(CARD.BASE, CARD.INTERACTIVE, 'h-full flex flex-col overflow-hidden', activeId === w.id && 'ring-2 ring-primary')}
                onClick={() => { setActiveId(activeId === w.id ? null : w.id); setCurrentStep('design'); }}
              >
                <div className="h-[60%] overflow-hidden bg-muted/20">
                  <SiteThumbFromDB websiteId={w.id} branding={w.branding_json} />
                </div>
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className={TYPOGRAPHY.CARD_TITLE}>{w.name}</p>
                      {statusBadge(w.status)}
                    </div>
                    <p className={TYPOGRAPHY.HINT}>/{w.slug}</p>
                  </div>
                  {w.status === 'published' && (
                    <a href={`/website/sites/${w.slug}`} target="_blank" rel="noopener" className="text-xs text-primary flex items-center gap-1 mt-2" onClick={e => e.stopPropagation()}>
                      <ExternalLink className="h-3 w-3" /> Ansehen
                    </a>
                  )}
                </div>
              </div>
            </WidgetCell>
          ))}

          {/* CTA tile */}
          <WidgetCell>
            <div
              className={cn(CARD.CONTENT, CARD.INTERACTIVE, 'h-full flex flex-col items-center justify-center border-dashed border-2 border-border/40')}
              onClick={() => { setShowCreate(!showCreate); setActiveId(null); }}
            >
              <Plus className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-muted-foreground">Neue Website</span>
            </div>
          </WidgetCell>
        </WidgetGrid>
      </div>

      {/* ─── Inline Detail with Process Stepper ─── */}
      {activeWebsite && (
        <div className={cn(SPACING.SECTION)}>
          <ProcessStepper currentStep={currentStep} onStepClick={setCurrentStep} completedSteps={completedSteps} />

          {isDemo && currentStep === 'design' && (
            <div className={cn(INFO_BANNER.BASE, INFO_BANNER.HINT, 'mt-4')}>
              <p className={TYPOGRAPHY.MUTED}>
                Dies ist eine Demo-Website mit Beispieldaten. Klicken Sie oben auf ein Template, um Ihre eigene Website zu erstellen.
              </p>
            </div>
          )}

          {/* Step 1: Design */}
          {currentStep === 'design' && (
            <div className="space-y-6 mt-4">
              {/* Work tiles row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tile: KI-Eingabe */}
                <AiDescriptionTile website={activeWebsite} isDemo={isDemo} />
                {/* Tile: Firmendaten / Impressum */}
                <CompanyDataTile website={activeWebsite} isDemo={isDemo} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Tile: Bild-Upload */}
                <ImageUploadTile website={activeWebsite} isDemo={isDemo} />
                {/* Tile: Design & Branding */}
                <DesignSection website={activeWebsite} isDemo={isDemo} />
              </div>

              {/* Full-size Editable Live Preview */}
              <div className={cn(CARD.CONTENT, 'space-y-3')}>
                <div className="flex items-center justify-between">
                  <h3 className={TYPOGRAPHY.CARD_TITLE}>
                    {isDemo ? 'Live-Vorschau' : '✏️ Live-Vorschau — Klicken Sie auf Text oder Bilder zum Bearbeiten'}
                  </h3>
                  {!isDemo && (
                    <Button size="sm" variant="outline" onClick={() => window.open(`/portal/website-builder/${activeWebsite.id}/editor`, '_self')}>
                      <Sparkles className="h-4 w-4 mr-1" /> Split-View Editor
                    </Button>
                  )}
                </div>
                <div className="border border-border/30 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                  {isDemo ? (
                    <SectionRenderer sections={DEMO_SECTIONS} branding={DEMO_BRANDING} />
                  ) : (
                    <EditablePreview websiteId={activeWebsite.id} branding={activeWebsite.branding_json} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Content — Inline Section Editor */}
          {currentStep === 'content' && (
            <div className="mt-4">
              {isDemo ? (
                <div className={cn(CARD.CONTENT, 'space-y-3')}>
                  <h3 className={TYPOGRAPHY.CARD_TITLE}>Inhalte (Demo)</h3>
                  <p className={TYPOGRAPHY.MUTED}>Die Demo-Website zeigt Beispiel-Sections. Erstellen Sie Ihre eigene Website, um Inhalte zu bearbeiten.</p>
                  <div className="border border-border/30 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                    <SectionRenderer sections={DEMO_SECTIONS} branding={DEMO_BRANDING} />
                  </div>
                </div>
              ) : (
                <InlineSectionEditor websiteId={activeWebsite.id} branding={activeWebsite.branding_json} />
              )}
            </div>
          )}

          {/* Step 3: Publish */}
          {currentStep === 'publish' && (
            <div className="space-y-4 mt-4">
              <SeoSection website={activeWebsite} isDemo={isDemo} />
              <ContractSection website={activeWebsite} isDemo={isDemo} />
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}

/* ═══════════════════════════════════════════════════
   WORK TILES
   ═══════════════════════════════════════════════════ */

/* ─── KI-Eingabe Tile ─── */
function AiDescriptionTile({ website, isDemo }: { website: any; isDemo: boolean }) {
  const qc = useQueryClient();
  const [description, setDescription] = useState(website.ai_description || '');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiGenerate = async () => {
    if (isDemo || !description.trim()) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-website-ai-generate', {
        body: {
          website_id: website.id,
          name: website.name,
          industry: website.industry,
          target_audience: website.target_audience,
          goal: website.goal,
          template_id: website.branding_json?.template_id || 'modern',
          company_description: description,
        },
      });
      if (error) throw error;
      toast.success(`${data.sections_count || 'Alle'} Sections mit KI generiert`);
      qc.invalidateQueries({ queryKey: ['website_sections'] });
      qc.invalidateQueries({ queryKey: ['tenant_websites'] });
    } catch (e: any) {
      toast.error(e.message || 'Fehler bei der KI-Generierung');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={cn(CARD.CONTENT, 'space-y-3')}>
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className={TYPOGRAPHY.CARD_TITLE}>KI-Inhaltsgenerierung</h3>
      </div>
      <p className={TYPOGRAPHY.HINT}>
        Beschreiben Sie Ihre Firma, Dienstleistungen und Zielgruppe. Die KI erstellt daraus alle Website-Inhalte.
      </p>
      <Textarea
        className="min-h-[120px] text-sm"
        placeholder="Erzählen Sie uns von Ihrer Firma: Was machen Sie? Wer sind Ihre Kunden? Was macht Sie besonders? Welche Leistungen bieten Sie an?"
        value={description}
        onChange={e => setDescription(e.target.value)}
        disabled={isDemo}
      />
      <div className="flex items-center justify-between">
        <span className={cn('text-xs', description.length > 0 ? 'text-muted-foreground' : 'text-destructive/60')}>
          {description.length} Zeichen {description.length < 50 && '(min. 50 empfohlen)'}
        </span>
        <Button
          onClick={handleAiGenerate}
          disabled={isDemo || aiLoading || description.trim().length < 10}
          size="sm"
        >
          <Sparkles className="h-4 w-4 mr-1" />
          {aiLoading ? 'Generiert...' : 'Website mit KI füllen'}
        </Button>
      </div>
      {isDemo && <p className={cn(TYPOGRAPHY.HINT, 'italic')}>In der Demo nicht verfügbar — erstellen Sie Ihre eigene Website.</p>}
    </div>
  );
}

/* ─── Firmendaten / Impressum Tile ─── */
function CompanyDataTile({ website, isDemo }: { website: any; isDemo: boolean }) {
  const qc = useQueryClient();
  const [data, setData] = useState<Record<string, string>>({
    company_name: website.impressum?.company_name || website.name || '',
    legal_form: website.impressum?.legal_form || '',
    street: website.impressum?.street || '',
    zip_city: website.impressum?.zip_city || '',
    phone: website.impressum?.phone || '',
    email: website.impressum?.email || '',
    ceo: website.impressum?.ceo || '',
    register_court: website.impressum?.register_court || '',
    register_number: website.impressum?.register_number || '',
    vat_id: website.impressum?.vat_id || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (isDemo) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('tenant_websites' as any).update({ impressum: data }).eq('id', website.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['tenant_websites'] });
      toast.success('Firmendaten gespeichert');
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const fields: { key: string; label: string; placeholder: string }[] = [
    { key: 'company_name', label: 'Firmenname', placeholder: 'Muster GmbH' },
    { key: 'legal_form', label: 'Rechtsform', placeholder: 'GmbH' },
    { key: 'ceo', label: 'Geschäftsführer', placeholder: 'Max Mustermann' },
    { key: 'street', label: 'Straße', placeholder: 'Musterstraße 1' },
    { key: 'zip_city', label: 'PLZ / Ort', placeholder: '10115 Berlin' },
    { key: 'phone', label: 'Telefon', placeholder: '+49 30 123456' },
    { key: 'email', label: 'E-Mail', placeholder: 'info@firma.de' },
    { key: 'register_court', label: 'Registergericht', placeholder: 'Amtsgericht Berlin-Charlottenburg' },
    { key: 'register_number', label: 'Handelsregister-Nr.', placeholder: 'HRB 123456' },
    { key: 'vat_id', label: 'USt-IdNr.', placeholder: 'DE123456789' },
  ];

  return (
    <div className={cn(CARD.CONTENT, 'space-y-3')}>
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className={TYPOGRAPHY.CARD_TITLE}>Firmendaten & Impressum</h3>
      </div>
      <p className={TYPOGRAPHY.HINT}>
        Diese Daten werden für das automatische Impressum und die Kontaktseite verwendet.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {fields.map(f => (
          <div key={f.key}>
            <Label className="text-xs">{f.label}</Label>
            <Input
              className="h-8 text-sm"
              placeholder={f.placeholder}
              value={data[f.key] || ''}
              onChange={e => setData(d => ({ ...d, [f.key]: e.target.value }))}
              disabled={isDemo}
            />
          </div>
        ))}
      </div>
      {!isDemo && (
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? 'Speichert...' : 'Firmendaten speichern'}
        </Button>
      )}
    </div>
  );
}

/* ─── Bild-Upload Tile ─── */
function ImageUploadTile({ website, isDemo }: { website: any; isDemo: boolean }) {
  const [images, setImages] = useState<{ name: string; url: string }[]>(website.uploaded_images || []);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    if (isDemo) return;
    setUploading(true);
    try {
      const newImages: { name: string; url: string }[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `website-images/${website.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('tenant-documents').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('tenant-documents').getPublicUrl(path);
        newImages.push({ name: file.name, url: urlData.publicUrl });
      }
      const all = [...images, ...newImages];
      setImages(all);
      // persist image list on website
      await supabase.from('tenant_websites' as any).update({ uploaded_images: all }).eq('id', website.id);
      toast.success(`${newImages.length} Bild(er) hochgeladen`);
    } catch (e: any) {
      toast.error(e.message || 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    setImages(next);
    await supabase.from('tenant_websites' as any).update({ uploaded_images: next }).eq('id', website.id);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL kopiert — fügen Sie sie in ein Bild-Feld ein');
  };

  return (
    <div className={cn(CARD.CONTENT, 'space-y-3')}>
      <div className="flex items-center gap-2">
        <Image className="h-5 w-5 text-primary" />
        <h3 className={TYPOGRAPHY.CARD_TITLE}>Eigene Bilder</h3>
      </div>
      <p className={TYPOGRAPHY.HINT}>
        Laden Sie Logo, Teamfotos oder Projektbilder hoch. Per Klick auf die URL können Sie das Bild in Sections einfügen.
      </p>
      <FileUploader
        onFilesSelected={handleUpload}
        accept="image/*"
        multiple
        disabled={isDemo || uploading}
        label={uploading ? 'Wird hochgeladen...' : 'Bilder hier ablegen'}
        hint="JPG, PNG, WebP bis 10 MB"
      />
      {images.length > 0 && (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {images.map((img, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-md border border-border/20 bg-muted/10">
              <img src={img.url} alt={img.name} className="h-10 w-10 rounded object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{img.name}</p>
                <button onClick={() => copyUrl(img.url)} className="text-[10px] text-primary hover:underline truncate block max-w-full text-left">URL kopieren</button>
              </div>
              {!isDemo && (
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-destructive" onClick={() => removeImage(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      {isDemo && <p className={cn(TYPOGRAPHY.HINT, 'italic')}>In der Demo nicht verfügbar.</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   INLINE SECTION EDITOR (Step 2)
   ═══════════════════════════════════════════════════ */
function InlineSectionEditor({ websiteId, branding }: { websiteId: string; branding: any }) {
  const qc = useQueryClient();
  const { data: page } = useWebsitePage(websiteId);
  const { data: sections, addSection, updateSection, deleteSection } = useSections(page?.id);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const mappedSections: WebsiteSection[] = (sections || []).map((s: any) => ({
    id: s.id,
    section_type: s.section_type,
    sort_order: s.sort_order,
    content_json: s.content_json || {},
    design_json: s.design_json || {},
    is_visible: s.is_visible ?? true,
  }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !sections) return;
    const oldIndex = sections.findIndex((s: any) => s.id === active.id);
    const newIndex = sections.findIndex((s: any) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sections, oldIndex, newIndex);
    reordered.forEach((s: any, i: number) => {
      updateSection.mutate({ id: s.id, sort_order: i });
    });
  };

  const handleUpdateContent = (sectionId: string, field: string, value: any) => {
    const section = sections?.find((s: any) => s.id === sectionId);
    if (!section) return;
    updateSection.mutate({ id: sectionId, content_json: { ...section.content_json, [field]: value } });
  };

  const handleUpdateContentFull = (sectionId: string, content: any) => {
    updateSection.mutate({ id: sectionId, content_json: content });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Section list + editor */}
      <div className={cn(CARD.CONTENT, 'space-y-3')}>
        <div className="flex items-center justify-between">
          <h3 className={TYPOGRAPHY.CARD_TITLE}>Sections bearbeiten</h3>
          <Button size="sm" variant="outline" onClick={() => window.open(`/portal/website-builder/${websiteId}/editor`, '_self')}>
            Split-View Editor
          </Button>
        </div>

        {mappedSections.length === 0 && (
          <p className={TYPOGRAPHY.MUTED}>Noch keine Sections. Nutzen Sie die KI-Generierung (Schritt 1) oder fügen Sie manuell hinzu.</p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={mappedSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {mappedSections.map(section => (
              <InlineSortableCard
                key={section.id}
                section={section}
                isExpanded={expandedSection === section.id}
                onToggle={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                onDelete={() => deleteSection.mutate(section.id)}
                onToggleVisibility={() => updateSection.mutate({ id: section.id, is_visible: !section.is_visible })}
                onUpdateContent={(field, value) => handleUpdateContent(section.id, field, value)}
                onUpdateContentFull={(content) => handleUpdateContentFull(section.id, content)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <Select onValueChange={(v) => addSection.mutate({ section_type: v as SectionType, sort_order: (sections?.length || 0) })}>
          <SelectTrigger className="border-dashed">
            <Plus className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Section hinzufügen" />
          </SelectTrigger>
          <SelectContent>
            {SECTION_TYPES.map(type => (
              <SelectItem key={type} value={type}>{SECTION_TYPE_LABELS[type]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right: Live Preview */}
      <div className={cn(CARD.CONTENT, 'space-y-3')}>
        <h3 className={TYPOGRAPHY.CARD_TITLE}>Live-Vorschau</h3>
        <div className="border border-border/30 rounded-lg overflow-hidden overflow-y-auto bg-white dark:bg-zinc-900" style={{ maxHeight: '80vh' }}>
          {mappedSections.length > 0 ? (
            <SectionRenderer sections={mappedSections} branding={branding} />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p className="text-sm">Fügen Sie Sections hinzu, um die Vorschau zu sehen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Inline Sortable Card ─── */
function InlineSortableCard(props: {
  section: WebsiteSection;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onUpdateContent: (field: string, value: any) => void;
  onUpdateContentFull: (content: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <InlineSectionCard {...props} dragListeners={listeners} />
    </div>
  );
}

function InlineSectionCard({ section, isExpanded, onToggle, onDelete, onToggleVisibility, onUpdateContent, onUpdateContentFull, dragListeners }: {
  section: WebsiteSection;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onUpdateContent: (field: string, value: any) => void;
  onUpdateContentFull: (content: any) => void;
  dragListeners?: any;
}) {
  const content = section.content_json as Record<string, any>;

  return (
    <div className={cn('border border-border/30 rounded-lg', !section.is_visible && 'opacity-50')}>
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer" onClick={onToggle}>
        <div {...dragListeners} className="cursor-grab active:cursor-grabbing" onClick={e => e.stopPropagation()}>
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
        <span className="text-sm font-medium flex-1">{SECTION_TYPE_LABELS[section.section_type]}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); onToggleVisibility(); }}>
          {section.is_visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={e => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="h-3 w-3" />
        </Button>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-border/20 pt-2">
          {renderFields(section.section_type, content, onUpdateContent, onUpdateContentFull)}
        </div>
      )}
    </div>
  );
}

/* ─── Field renderer ─── */
function renderFields(type: SectionType, content: Record<string, any>, onUpdate: (f: string, v: any) => void, onUpdateFull: (c: any) => void) {
  switch (type) {
    case 'hero':
      return (<><FI label="Headline" value={content.headline} onChange={v => onUpdate('headline', v)} /><FI label="Subline" value={content.subline} onChange={v => onUpdate('subline', v)} /><FI label="CTA Text" value={content.cta_text} onChange={v => onUpdate('cta_text', v)} /><FI label="CTA Link" value={content.cta_link} onChange={v => onUpdate('cta_link', v)} /><FI label="Hintergrundbild URL" value={content.background_image_url} onChange={v => onUpdate('background_image_url', v)} /></>);
    case 'about':
      return (<><FI label="Titel" value={content.title} onChange={v => onUpdate('title', v)} /><FT label="Text" value={content.text} onChange={v => onUpdate('text', v)} /><FI label="Bild URL" value={content.image_url} onChange={v => onUpdate('image_url', v)} /></>);
    case 'contact':
      return (<><FI label="Titel" value={content.title} onChange={v => onUpdate('title', v)} /><FI label="Untertitel" value={content.subtitle} onChange={v => onUpdate('subtitle', v)} /></>);
    case 'footer':
      return (<><FI label="Firmenname" value={content.company_name} onChange={v => onUpdate('company_name', v)} /><FI label="Impressum URL" value={content.impressum_url} onChange={v => onUpdate('impressum_url', v)} /><FI label="Datenschutz URL" value={content.datenschutz_url} onChange={v => onUpdate('datenschutz_url', v)} /></>);
    case 'features': case 'services':
      return (<><FI label="Titel" value={content.title} onChange={v => onUpdate('title', v)} /><InlineItemsEditor items={content.items || []} fields={['icon', 'title', 'description']} labels={{ icon: 'Icon', title: 'Titel', description: 'Beschreibung' }} onChange={items => onUpdateFull({ ...content, items })} /></>);
    case 'testimonials':
      return (<><FI label="Titel" value={content.title} onChange={v => onUpdate('title', v)} /><InlineItemsEditor items={content.items || []} fields={['name', 'quote', 'role']} labels={{ name: 'Name', quote: 'Zitat', role: 'Rolle' }} onChange={items => onUpdateFull({ ...content, items })} /></>);
    case 'gallery':
      return (<><FI label="Titel" value={content.title} onChange={v => onUpdate('title', v)} /><InlineGalleryEditor images={content.images || []} onChange={images => onUpdateFull({ ...content, images })} /></>);
    default:
      return <FI label="Titel" value={content.title} onChange={v => onUpdate('title', v)} />;
  }
}

function FI({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return <div><Label className="text-xs">{label}</Label><Input className="h-8 text-sm" value={value || ''} onChange={e => onChange(e.target.value)} /></div>;
}
function FT({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return <div><Label className="text-xs">{label}</Label><Textarea className="text-sm min-h-[80px]" value={value || ''} onChange={e => onChange(e.target.value)} /></div>;
}

function InlineItemsEditor({ items, fields, labels, onChange }: { items: Record<string, any>[]; fields: string[]; labels: Record<string, string>; onChange: (items: Record<string, any>[]) => void }) {
  const addItem = () => { const blank: Record<string, string> = {}; fields.forEach(f => blank[f] = ''); onChange([...items, blank]); };
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">Einträge ({items.length})</Label>
      {items.map((item, i) => (
        <div key={i} className="border border-border/20 rounded-md p-2 space-y-1 relative">
          <Button variant="ghost" size="icon" className="h-5 w-5 absolute top-1 right-1 text-destructive" onClick={() => onChange(items.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
          {fields.map(f => (
            <div key={f}>
              <Label className="text-[10px] text-muted-foreground">{labels[f]}</Label>
              {f === 'description' || f === 'quote' ? (
                <Textarea className="text-xs min-h-[40px]" value={item[f] || ''} onChange={e => { const next = [...items]; next[i] = { ...next[i], [f]: e.target.value }; onChange(next); }} />
              ) : (
                <Input className="h-7 text-xs" value={item[f] || ''} onChange={e => { const next = [...items]; next[i] = { ...next[i], [f]: e.target.value }; onChange(next); }} />
              )}
            </div>
          ))}
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Eintrag hinzufügen</Button>
    </div>
  );
}

function InlineGalleryEditor({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">Bilder ({images.length})</Label>
      {images.map((url, i) => (
        <div key={i} className="flex gap-1.5 items-center">
          <Input className="h-7 text-xs flex-1" placeholder="Bild-URL" value={url} onChange={e => { const next = [...images]; next[i] = e.target.value; onChange(next); }} />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => onChange(images.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={() => onChange([...images, ''])}><Plus className="h-3 w-3 mr-1" /> Bild hinzufügen</Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EXISTING SUB-SECTIONS (Design, SEO, Contract, SiteThumb)
   ═══════════════════════════════════════════════════ */

function SiteThumbFromDB({ websiteId, branding }: { websiteId: string; branding: any }) {
  const { data: page } = useWebsitePage(websiteId);
  const { data: sections } = useSections(page?.id);
  const mapped = (sections || []).map((s: any) => ({
    id: s.id, section_type: s.section_type, sort_order: s.sort_order,
    content_json: s.content_json || {}, design_json: s.design_json || {}, is_visible: s.is_visible ?? true,
  }));
  if (mapped.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-muted-foreground"><Globe className="h-8 w-8 opacity-20" /></div>;
  }
  return <WebsiteThumbnail sections={mapped} branding={branding} />;
}

function RealSectionPreview({ websiteId, branding }: { websiteId: string; branding: any }) {
  const { data: page } = useWebsitePage(websiteId);
  const { data: sections } = useSections(page?.id);
  const mapped = (sections || []).map((s: any) => ({
    id: s.id, section_type: s.section_type, sort_order: s.sort_order,
    content_json: s.content_json || {}, design_json: s.design_json || {}, is_visible: s.is_visible ?? true,
  }));
  if (mapped.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground"><p className="text-sm">Noch keine Sections. Nutzen Sie die KI-Generierung oder den Section-Editor.</p></div>;
  }
  return <SectionRenderer sections={mapped} branding={branding} />;
}

/** Editable preview — inline editing directly in the rendered website */
function EditablePreview({ websiteId, branding }: { websiteId: string; branding: any }) {
  const qc = useQueryClient();
  const { data: page } = useWebsitePage(websiteId);
  const { data: sections, updateSection } = useSections(page?.id);
  const mapped = (sections || []).map((s: any) => ({
    id: s.id, section_type: s.section_type, sort_order: s.sort_order,
    content_json: s.content_json || {}, design_json: s.design_json || {}, is_visible: s.is_visible ?? true,
  }));

  const handleContentChange = (sectionId: string, field: string, value: any) => {
    const section = sections?.find((s: any) => s.id === sectionId);
    if (!section) return;
    // For nested fields like 'items', replace entirely; for simple fields, merge
    const newContent = { ...section.content_json, [field]: value };
    updateSection.mutate({ id: sectionId, content_json: newContent });
  };

  if (mapped.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground"><p className="text-sm">Noch keine Sections. Nutzen Sie die KI-Generierung oder den Section-Editor.</p></div>;
  }

  return (
    <SectionRenderer
      sections={mapped}
      branding={branding}
      editable
      onSectionContentChange={handleContentChange}
    />
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
    try {
      const { error } = await supabase.from('tenant_websites' as any).update({ branding_json: b }).eq('id', website.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['tenant_websites'] });
      toast.success('Design gespeichert');
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /><h3 className={TYPOGRAPHY.CARD_TITLE}>Hosting-Vertrag</h3></div>
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
        ) : (
          <>
            <p className={TYPOGRAPHY.MUTED}>Kein Hosting-Vertrag vorhanden.</p>
            <Button size="sm" onClick={() => window.open(`/portal/website-builder/${website.id}/editor`, '_self')}>
              <Send className="h-4 w-4 mr-1" /> Im Editor aktivieren
            </Button>
          </>
        )}
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
