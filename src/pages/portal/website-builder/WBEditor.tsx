/**
 * MOD-21 Website Builder — Inline Editor
 * Split-view: Editor (left) + Live Preview (right)
 */
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Send, Plus, Trash2, GripVertical, EyeOff, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
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
  const { data: website } = useWebsite(websiteId);
  const { data: page } = useWebsitePage(websiteId);
  const { data: sections, addSection, updateSection, deleteSection } = useSections(page?.id);
  const { data: contract, isActive: hasActiveContract } = useHostingContract(websiteId);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [showContract, setShowContract] = useState(false);

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
        },
      });
      if (error) throw error;
      toast.success(`${data.sections_count} Sections generiert`);
      // Refetch sections
      window.location.reload();
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
          <Button variant="ghost" size="sm" onClick={() => navigate('/portal/website-builder/websites')}>
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
        <ContractBanner
          websiteId={websiteId!}
          onClose={() => setShowContract(false)}
        />
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
            {mappedSections.map(section => (
              <SectionEditorCard
                key={section.id}
                section={section}
                isExpanded={expandedSection === section.id}
                onToggle={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                onDelete={() => deleteSection.mutate(section.id)}
                onToggleVisibility={() => updateSection.mutate({ id: section.id, is_visible: !section.is_visible })}
                onUpdateContent={(field, value) => handleUpdateContent(section.id, field, value)}
              />
            ))}
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
            <SectionRenderer
              sections={mappedSections}
              branding={website?.branding_json}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function SectionEditorCard({ section, isExpanded, onToggle, onDelete, onToggleVisibility, onUpdateContent }: {
  section: WebsiteSection;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onUpdateContent: (field: string, value: any) => void;
}) {
  const content = section.content_json as Record<string, any>;

  return (
    <div className={cn(CARD.BASE, 'border border-border/30', !section.is_visible && 'opacity-50')}>
      <div className="flex items-center gap-2 px-3 py-2 cursor-pointer" onClick={onToggle}>
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
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
          {renderContentFields(section.section_type, content, onUpdateContent)}
        </div>
      )}
    </div>
  );
}

function renderContentFields(type: SectionType, content: Record<string, any>, onUpdate: (field: string, value: any) => void) {
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
    default:
      return (
        <>
          <FieldInput label="Titel" value={content.title} onChange={v => onUpdate('title', v)} />
          <p className="text-xs text-muted-foreground">Erweiterte Felder werden in Phase 2 unterstützt. Nutzen Sie die KI-Generierung für vollständige Inhalte.</p>
        </>
      );
  }
}

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

function ContractBanner({ websiteId, onClose }: { websiteId: string; onClose: () => void }) {
  const { createContract } = useHostingContract(websiteId);
  const [terms, setTerms] = useState(false);
  const [responsibility, setResponsibility] = useState(false);

  return (
    <div className="border-b border-border/30 bg-muted/20 px-6 py-4 space-y-3">
      <h3 className="font-semibold">Website Hosting Vertrag abschließen</h3>
      <p className="text-sm text-muted-foreground">
        Um Ihre Website zu veröffentlichen, benötigen Sie einen aktiven Hosting-Vertrag (50 €/Monat).
      </p>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
        <li>Hosting durch uns auf deutscher Infrastruktur</li>
        <li>SSL-Zertifikat inklusive</li>
        <li>Monatlich kündbar</li>
        <li>DSGVO-konform</li>
      </ul>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="rounded" />
          Ich akzeptiere die Hostingbedingungen
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={responsibility} onChange={e => setResponsibility(e.target.checked)} className="rounded" />
          Ich bestätige, dass ich für Inhalte verantwortlich bin
        </label>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!terms || !responsibility || createContract.isPending}
          onClick={() => createContract.mutate({ accepted_terms: terms, content_responsibility: responsibility }, { onSuccess: onClose })}
        >
          Kostenpflichtig abonnieren
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>Abbrechen</Button>
      </div>
    </div>
  );
}
