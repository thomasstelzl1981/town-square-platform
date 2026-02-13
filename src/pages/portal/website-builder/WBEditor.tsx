/**
 * MOD-21 Website Builder — Inline Editor
 * Split-view: Editor (left) + Live Preview (right)
 * Full field editing for all 8 section types, DnD reorder, Credits-based contract
 */
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Eye, Send, Plus, Trash2, GripVertical, EyeOff, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWebsite } from '@/hooks/useWebsites';
import { useWebsitePage, useSections } from '@/hooks/useSections';
import { useHostingContract } from '@/hooks/useHostingContract';
import { SectionRenderer } from '@/shared/website-renderer';
import { SECTION_TYPES, SECTION_TYPE_LABELS, type SectionType, type WebsiteSection } from '@/shared/website-renderer/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CARD, TYPOGRAPHY } from '@/config/designManifest';

export default function WBEditor() {
  const { websiteId } = useParams<{ websiteId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: website } = useWebsite(websiteId);
  const { data: page } = useWebsitePage(websiteId);
  const { data: sections, addSection, updateSection, deleteSection } = useSections(page?.id);
  const { data: contract, isActive: hasActiveContract } = useHostingContract(websiteId);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [showContract, setShowContract] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleAiGenerate = async () => {
    if (!websiteId || !website) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-website-ai-generate', {
        body: {
          website_id: websiteId,
          name: website.name,
          industry: website.industry,
          target_audience: website.target_audience,
          goal: website.goal,
          template_id: website.branding_json?.template_id || 'modern',
        },
      });
      if (error) throw error;
      toast.success(`${data.sections_count} Sections generiert`);
      queryClient.invalidateQueries({ queryKey: ['website_sections', page?.id] });
    } catch (e: any) {
      toast.error(e.message || 'Fehler bei der KI-Generierung');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!hasActiveContract) {
      setShowContract(true);
      return;
    }
    setPublishLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-website-publish', {
        body: { website_id: websiteId },
      });
      if (error) throw error;
      toast.success(`Website veröffentlicht (v${data.version})`);
      queryClient.invalidateQueries({ queryKey: ['tenant_websites'] });
    } catch (e: any) {
      toast.error(e.message || 'Fehler beim Veröffentlichen');
    } finally {
      setPublishLoading(false);
    }
  };

  const handleAddSection = (type: SectionType) => {
    addSection.mutate({ section_type: type, sort_order: (sections?.length || 0) });
  };

  const handleUpdateContent = useCallback((sectionId: string, field: string, value: any) => {
    const section = sections?.find((s: any) => s.id === sectionId);
    if (!section) return;
    const newContent = { ...section.content_json, [field]: value };
    updateSection.mutate({ id: sectionId, content_json: newContent });
  }, [sections, updateSection]);

  const handleUpdateContentFull = useCallback((sectionId: string, content: any) => {
    updateSection.mutate({ id: sectionId, content_json: content });
  }, [updateSection]);

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

  const mappedSections: WebsiteSection[] = (sections || []).map((s: any) => ({
    id: s.id,
    section_type: s.section_type,
    sort_order: s.sort_order,
    content_json: s.content_json || {},
    design_json: s.design_json || {},
    is_visible: s.is_visible ?? true,
  }));

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/portal/website-builder')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className={TYPOGRAPHY.CARD_TITLE}>{website?.name || 'Editor'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleAiGenerate} disabled={aiLoading}>
            <Sparkles className="h-4 w-4 mr-1" />
            {aiLoading ? 'Generiert...' : 'KI generieren'}
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishLoading}>
            <Send className="h-4 w-4 mr-1" />
            {publishLoading ? 'Wird veröffentlicht...' : 'Veröffentlichen'}
          </Button>
        </div>
      </div>

      {/* Contract Banner */}
      {showContract && !hasActiveContract && (
        <ContractBanner websiteId={websiteId!} onClose={() => setShowContract(false)} />
      )}

      {/* Editor + Preview */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full overflow-y-auto p-4 space-y-3">
            {mappedSections.length === 0 && (
              <div className={cn(CARD.CONTENT, 'text-center py-8')}>
                <p className={TYPOGRAPHY.MUTED}>Noch keine Sections. Nutzen Sie die KI-Generierung oder fügen Sie manuell Sections hinzu.</p>
              </div>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={mappedSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {mappedSections.map(section => (
                  <SortableSectionCard
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
            {/* Add Section */}
            <div className="pt-2">
              <Select onValueChange={(v) => handleAddSection(v as SectionType)}>
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
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full overflow-y-auto bg-white dark:bg-zinc-900">
            <SectionRenderer sections={mappedSections} branding={website?.branding_json} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

/* ─── Sortable Wrapper ─── */
function SortableSectionCard(props: {
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
      <SectionEditorCard {...props} dragListeners={listeners} />
    </div>
  );
}

/* ─── Section Editor Card ─── */
function SectionEditorCard({ section, isExpanded, onToggle, onDelete, onToggleVisibility, onUpdateContent, onUpdateContentFull, dragListeners }: {
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
    <div className={cn(CARD.BASE, 'border border-border/30', !section.is_visible && 'opacity-50')}>
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
          {renderContentFields(section.section_type, content, onUpdateContent, onUpdateContentFull)}
        </div>
      )}
    </div>
  );
}

/* ─── Content Fields per Section Type ─── */
function renderContentFields(
  type: SectionType,
  content: Record<string, any>,
  onUpdate: (field: string, value: any) => void,
  onUpdateFull: (content: any) => void,
) {
  switch (type) {
    case 'hero':
      return (
        <>
          <FieldInput label="Headline" value={content.headline} onChange={v => onUpdate('headline', v)} />
          <FieldInput label="Subline" value={content.subline} onChange={v => onUpdate('subline', v)} />
          <FieldInput label="CTA Text" value={content.cta_text} onChange={v => onUpdate('cta_text', v)} />
          <FieldInput label="CTA Link" value={content.cta_link} onChange={v => onUpdate('cta_link', v)} />
          <FieldInput label="Hintergrundbild URL" value={content.background_image_url} onChange={v => onUpdate('background_image_url', v)} />
        </>
      );
    case 'about':
      return (
        <>
          <FieldInput label="Titel" value={content.title} onChange={v => onUpdate('title', v)} />
          <FieldTextarea label="Text" value={content.text} onChange={v => onUpdate('text', v)} />
          <FieldInput label="Bild URL" value={content.image_url} onChange={v => onUpdate('image_url', v)} />
        </>
      );
    case 'contact':
      return (
        <>
          <FieldInput label="Titel" value={content.title} onChange={v => onUpdate('title', v)} />
          <FieldInput label="Untertitel" value={content.subtitle} onChange={v => onUpdate('subtitle', v)} />
        </>
      );
    case 'footer':
      return (
        <>
          <FieldInput label="Firmenname" value={content.company_name} onChange={v => onUpdate('company_name', v)} />
          <FieldInput label="Impressum URL" value={content.impressum_url} onChange={v => onUpdate('impressum_url', v)} />
          <FieldInput label="Datenschutz URL" value={content.datenschutz_url} onChange={v => onUpdate('datenschutz_url', v)} />
        </>
      );
    case 'features':
    case 'services':
      return (
        <>
          <FieldInput label="Titel" value={content.title} onChange={v => onUpdate('title', v)} />
          <ItemsArrayEditor
            items={content.items || []}
            fields={['icon', 'title', 'description']}
            labels={{ icon: 'Icon (Emoji)', title: 'Titel', description: 'Beschreibung' }}
            onChange={items => onUpdateFull({ ...content, items })}
          />
        </>
      );
    case 'testimonials':
      return (
        <>
          <FieldInput label="Titel" value={content.title} onChange={v => onUpdate('title', v)} />
          <ItemsArrayEditor
            items={content.items || []}
            fields={['name', 'quote', 'role']}
            labels={{ name: 'Name', quote: 'Zitat', role: 'Rolle' }}
            onChange={items => onUpdateFull({ ...content, items })}
          />
        </>
      );
    case 'gallery':
      return (
        <>
          <FieldInput label="Titel" value={content.title} onChange={v => onUpdate('title', v)} />
          <GalleryEditor
            images={content.images || []}
            onChange={images => onUpdateFull({ ...content, images })}
          />
        </>
      );
    default:
      return <FieldInput label="Titel" value={content.title} onChange={v => onUpdate('title', v)} />;
  }
}

/* ─── Items Array Editor (Features/Services/Testimonials) ─── */
function ItemsArrayEditor({ items, fields, labels, onChange }: {
  items: Record<string, any>[];
  fields: string[];
  labels: Record<string, string>;
  onChange: (items: Record<string, any>[]) => void;
}) {
  const addItem = () => {
    const blank: Record<string, string> = {};
    fields.forEach(f => blank[f] = '');
    onChange([...items, blank]);
  };
  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">Einträge ({items.length})</Label>
      {items.map((item, i) => (
        <div key={i} className="border border-border/20 rounded-md p-2 space-y-1.5 relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 absolute top-1 right-1 text-destructive"
            onClick={() => removeItem(i)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {fields.map(f => (
            <div key={f}>
              <Label className="text-[10px] text-muted-foreground">{labels[f]}</Label>
              {f === 'description' || f === 'quote' ? (
                <Textarea
                  className="text-xs min-h-[50px]"
                  value={item[f] || ''}
                  onChange={e => updateItem(i, f, e.target.value)}
                />
              ) : (
                <Input className="h-7 text-xs" value={item[f] || ''} onChange={e => updateItem(i, f, e.target.value)} />
              )}
            </div>
          ))}
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={addItem}>
        <Plus className="h-3 w-3 mr-1" /> Eintrag hinzufügen
      </Button>
    </div>
  );
}

/* ─── Gallery Editor ─── */
function GalleryEditor({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">Bilder ({images.length})</Label>
      {images.map((url, i) => (
        <div key={i} className="flex gap-1.5 items-center">
          <Input
            className="h-7 text-xs flex-1"
            placeholder="Bild-URL"
            value={url}
            onChange={e => { const next = [...images]; next[i] = e.target.value; onChange(next); }}
          />
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => onChange(images.filter((_, idx) => idx !== i))}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={() => onChange([...images, ''])}>
        <Plus className="h-3 w-3 mr-1" /> Bild hinzufügen
      </Button>
    </div>
  );
}

/* ─── Shared Field Components ─── */
function FieldInput({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="h-8 text-sm" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function FieldTextarea({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Textarea className="text-sm min-h-[80px]" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

/* ─── Contract Banner (Credits-based, no Stripe) ─── */
function ContractBanner({ websiteId, onClose }: { websiteId: string; onClose: () => void }) {
  const { createContract } = useHostingContract(websiteId);
  const [terms, setTerms] = useState(false);
  const [responsibility, setResponsibility] = useState(false);

  return (
    <div className="border-b border-border/30 bg-muted/20 px-6 py-4 space-y-3">
      <h3 className="font-semibold">Website-Hosting aktivieren</h3>
      <p className="text-sm text-muted-foreground">
        Um Ihre Website zu veröffentlichen, aktivieren Sie das Hosting. Credits werden beim Veröffentlichen abgebucht.
      </p>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
        <li>Hosting auf deutscher Infrastruktur</li>
        <li>SSL-Zertifikat inklusive</li>
        <li>DSGVO-konform</li>
        <li>Credits-basierte Abrechnung</li>
      </ul>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="rounded" />
          Ich akzeptiere die Hostingbedingungen
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={responsibility} onChange={e => setResponsibility(e.target.checked)} className="rounded" />
          Ich bestätige, dass ich für die Inhalte verantwortlich bin
        </label>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!terms || !responsibility || createContract.isPending}
          onClick={() => createContract.mutate({ accepted_terms: terms, content_responsibility: responsibility }, { onSuccess: onClose })}
        >
          Hosting aktivieren
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>Abbrechen</Button>
      </div>
    </div>
  );
}
