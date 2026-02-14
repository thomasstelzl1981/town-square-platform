/**
 * MOD-05 Website Builder — Tile 2: Design (Branding) (ehemals MOD-21)
 * Template switcher + manual branding fields
 */
import { useState, useEffect } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Palette } from 'lucide-react';
import { useWebsites } from '@/hooks/useWebsites';
import { DESIGN_TEMPLATES, getTemplate } from '@/shared/website-renderer/designTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TYPOGRAPHY, CARD, SPACING } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export default function WBDesign() {
  const { data: websites } = useWebsites();
  const website = websites?.[0] as any;
  const qc = useQueryClient();

  const [branding, setBranding] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (website?.branding_json) setBranding(website.branding_json);
  }, [website?.branding_json]);

  if (!website) {
    return (
      <PageShell>
        <h2 className={TYPOGRAPHY.PAGE_TITLE}>Design</h2>
        <div className={cn(CARD.CONTENT, 'text-center py-12')}>
          <p className={TYPOGRAPHY.MUTED}>Erstellen Sie zuerst eine Website.</p>
        </div>
      </PageShell>
    );
  }

  const currentTemplate = branding.template_id || 'modern';

  const handleTemplateSwitch = async (templateId: string) => {
    const t = getTemplate(templateId);
    const newBranding = { ...branding, ...t.branding, template_id: templateId };
    setBranding(newBranding);
    await saveBranding(newBranding);
  };

  const saveBranding = async (b: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tenant_websites' as any)
        .update({ branding_json: b })
        .eq('id', website.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['tenant_websites'] });
      qc.invalidateQueries({ queryKey: ['tenant_website', website.id] });
      toast.success('Design gespeichert');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <h2 className={TYPOGRAPHY.PAGE_TITLE}>Design</h2>
      <div className={SPACING.SECTION}>
        {/* Template Picker */}
        <div className={cn(CARD.CONTENT, 'space-y-4')}>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <h3 className={TYPOGRAPHY.CARD_TITLE}>Design-Template</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {DESIGN_TEMPLATES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTemplateSwitch(t.id)}
                className={cn(
                  'relative rounded-lg p-3 text-left transition-all border-2',
                  currentTemplate === t.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border/30 hover:border-border/60'
                )}
              >
                <div className="h-12 rounded-md mb-2" style={{ background: t.preview_gradient }} />
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.description}</p>
                {currentTemplate === t.id && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Branding Fields */}
        <div className={cn(CARD.CONTENT, 'space-y-4')}>
          <h3 className={TYPOGRAPHY.CARD_TITLE}>Individuelle Anpassungen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Primärfarbe</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={branding.primary_color || '#2563EB'}
                  onChange={e => setBranding((b: any) => ({ ...b, primary_color: e.target.value }))}
                  className="h-9 w-12 rounded border border-border cursor-pointer"
                />
                <Input
                  className="h-9 text-sm flex-1"
                  value={branding.primary_color || ''}
                  onChange={e => setBranding((b: any) => ({ ...b, primary_color: e.target.value }))}
                  placeholder="#2563EB"
                />
              </div>
            </div>
            <div>
              <Label>Schriftart</Label>
              <Select
                value={branding.font || 'Inter'}
                onValueChange={v => setBranding((b: any) => ({ ...b, font: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter (Modern)</SelectItem>
                  <SelectItem value="Georgia">Georgia (Klassisch)</SelectItem>
                  <SelectItem value="system-ui">System (Minimal)</SelectItem>
                  <SelectItem value="Playfair Display">Playfair Display (Elegant)</SelectItem>
                  <SelectItem value="Poppins">Poppins (Frisch)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input
                className="h-9 text-sm"
                value={branding.logo_url || ''}
                onChange={e => setBranding((b: any) => ({ ...b, logo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Favicon URL</Label>
              <Input
                className="h-9 text-sm"
                value={branding.favicon_url || ''}
                onChange={e => setBranding((b: any) => ({ ...b, favicon_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <Button onClick={() => saveBranding(branding)} disabled={saving} size="sm">
            {saving ? 'Speichert...' : 'Branding speichern'}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
