/**
 * MOD-05 Website Builder — Tile 3: SEO (ehemals MOD-21)
 * Meta-data editor with character counters
 */
import { useState, useEffect } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { useWebsites } from '@/hooks/useWebsites';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { TYPOGRAPHY, CARD, SPACING } from '@/config/designManifest';
import { cn } from '@/lib/utils';

export default function WBSeo() {
  const { data: websites } = useWebsites();
  const website = websites?.[0] as any;
  const qc = useQueryClient();
  const [seo, setSeo] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (website?.seo_json) setSeo(website.seo_json);
  }, [website?.seo_json]);

  if (!website) {
    return (
      <PageShell>
        <h2 className={TYPOGRAPHY.PAGE_TITLE}>SEO</h2>
        <div className={cn(CARD.CONTENT, 'text-center py-12')}>
          <p className={TYPOGRAPHY.MUTED}>Erstellen Sie zuerst eine Website.</p>
        </div>
      </PageShell>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tenant_websites' as any)
        .update({ seo_json: seo })
        .eq('id', website.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['tenant_websites'] });
      toast.success('SEO-Einstellungen gespeichert');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const titleLen = (seo.title || '').length;
  const descLen = (seo.description || '').length;

  return (
    <PageShell>
      <h2 className={TYPOGRAPHY.PAGE_TITLE}>SEO</h2>
      <div className={SPACING.SECTION}>
        <div className={cn(CARD.CONTENT, 'space-y-4')}>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <h3 className={TYPOGRAPHY.CARD_TITLE}>Meta-Daten für {website.name}</h3>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Seitentitel</Label>
              <span className={cn('text-xs', titleLen > 60 ? 'text-destructive' : 'text-muted-foreground')}>
                {titleLen}/60
              </span>
            </div>
            <Input
              className="h-9 text-sm"
              value={seo.title || ''}
              onChange={e => setSeo((s: any) => ({ ...s, title: e.target.value }))}
              placeholder={website.name}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Meta-Beschreibung</Label>
              <span className={cn('text-xs', descLen > 160 ? 'text-destructive' : 'text-muted-foreground')}>
                {descLen}/160
              </span>
            </div>
            <Textarea
              className="text-sm min-h-[80px]"
              value={seo.description || ''}
              onChange={e => setSeo((s: any) => ({ ...s, description: e.target.value }))}
              placeholder="Beschreibung für Suchmaschinen..."
            />
          </div>

          <div>
            <Label>OG-Image URL</Label>
            <Input
              className="h-9 text-sm"
              value={seo.og_image || ''}
              onChange={e => setSeo((s: any) => ({ ...s, og_image: e.target.value }))}
              placeholder="https://..."
            />
            <p className={cn(TYPOGRAPHY.HINT, 'mt-1')}>Wird bei Social-Media-Shares angezeigt (empfohlen: 1200×630px)</p>
          </div>

          {/* Preview */}
          <div className="border border-border/30 rounded-lg p-4 bg-muted/10">
            <p className="text-xs text-muted-foreground mb-2">Google-Vorschau</p>
            <p className="text-primary text-base font-medium truncate">{seo.title || website.name}</p>
            <p className="text-xs text-muted-foreground truncate">{`${window.location.origin}/website/sites/${website.slug}`}</p>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{seo.description || 'Keine Beschreibung vorhanden.'}</p>
          </div>

          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? 'Speichert...' : 'SEO speichern'}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
