/**
 * MOD-21 Website Builder — Tile 1: Websites Dashboard
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Globe, ExternalLink } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWebsites } from '@/hooks/useWebsites';
import { CARD, TYPOGRAPHY, SPACING } from '@/config/designManifest';
import { cn } from '@/lib/utils';

export default function WBWebsites() {
  const { data: websites, isLoading, createWebsite } = useWebsites();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', industry: '', target_audience: '', goal: 'branding' });
  const navigate = useNavigate();

  const handleCreate = () => {
    if (!form.name || !form.slug) return;
    createWebsite.mutate(
      { ...form, slug: form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-') },
      { onSuccess: (data: any) => {
        setShowCreate(false);
        setForm({ name: '', slug: '', industry: '', target_audience: '', goal: 'branding' });
        navigate(`/portal/website-builder/${data.id}/editor`);
      }},
    );
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      published: 'bg-emerald-500/10 text-emerald-600',
      suspended: 'bg-destructive/10 text-destructive',
    };
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', map[status] || map.draft)}>
        {status === 'draft' ? 'Entwurf' : status === 'published' ? 'Online' : 'Gesperrt'}
      </span>
    );
  };

  return (
    <PageShell>
      <div className={SPACING.SECTION}>
        {/* Create Button */}
        <div className="flex items-center justify-between">
          <h2 className={TYPOGRAPHY.PAGE_TITLE}>Websites</h2>
          <Button onClick={() => setShowCreate(!showCreate)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Neue Website
          </Button>
        </div>

        {/* Inline Create Form */}
        {showCreate && (
          <div className={cn(CARD.CONTENT, 'space-y-4')}>
            <h3 className={TYPOGRAPHY.CARD_TITLE}>Neue Website erstellen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Firmenname *</Label>
                <Input placeholder="Meine Firma GmbH" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') }))} />
              </div>
              <div>
                <Label>URL-Slug *</Label>
                <Input placeholder="meine-firma" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
                <p className={cn(TYPOGRAPHY.HINT, 'mt-1')}>/website/sites/{form.slug || '...'}</p>
              </div>
              <div>
                <Label>Branche</Label>
                <Input placeholder="z.B. Immobilien, IT, Gastronomie" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
              </div>
              <div>
                <Label>Zielgruppe</Label>
                <Input placeholder="z.B. Kapitalanleger, Familien" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} />
              </div>
              <div>
                <Label>Ziel</Label>
                <Select value={form.goal} onValueChange={v => setForm(f => ({ ...f, goal: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branding">Branding</SelectItem>
                    <SelectItem value="leads">Lead-Generierung</SelectItem>
                    <SelectItem value="sales">Verkauf</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!form.name || !form.slug || createWebsite.isPending}>
                Website erstellen
              </Button>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>Abbrechen</Button>
            </div>
          </div>
        )}

        {/* Website List */}
        {isLoading ? (
          <p className={TYPOGRAPHY.MUTED}>Laden...</p>
        ) : !websites?.length ? (
          <div className={cn(CARD.CONTENT, 'text-center py-12')}>
            <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className={TYPOGRAPHY.MUTED}>Noch keine Websites erstellt</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" /> Erste Website erstellen
            </Button>
          </div>
        ) : (
          <WidgetGrid variant="kpi">
            {websites.map((w: any) => (
              <div
                key={w.id}
                className={cn(CARD.CONTENT, CARD.INTERACTIVE, 'flex flex-col justify-between')}
                onClick={() => navigate(`/portal/website-builder/${w.id}/editor`)}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className={TYPOGRAPHY.CARD_TITLE}>{w.name}</p>
                    {statusBadge(w.status)}
                  </div>
                  <p className={TYPOGRAPHY.HINT}>/{w.slug}</p>
                </div>
                {w.status === 'published' && (
                  <a
                    href={`/website/sites/${w.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-primary flex items-center gap-1 mt-3"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" /> Ansehen
                  </a>
                )}
              </div>
            ))}
          </WidgetGrid>
        )}
      </div>
    </PageShell>
  );
}
