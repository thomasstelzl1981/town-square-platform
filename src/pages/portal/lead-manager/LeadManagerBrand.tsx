/**
 * LeadManagerBrand — Brand Gallery (Zone 2, MOD-10)
 * Shows Zone 1 approved master templates as read-only social-media previews.
 * Partners can use these templates when creating campaigns.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/shared/EmptyState';
import { TemplateCard } from './TemplateCard';
import { TEMPLATE_IMAGES } from './templateImages';
import { Megaphone, Info, ImageIcon } from 'lucide-react';

// ─── Brand Config ───────────────────────────────────────────────────────────

interface BrandConfig {
  key: string;
  label: string;
  description: string;
  gradient: string;
}

const BRANDS: Record<string, BrandConfig> = {
  kaufy: {
    key: 'kaufy',
    label: 'Kaufy',
    description: 'Freigegebene Werbevorlagen für Kaufy. Wählen Sie Vorlagen für Ihre Kampagnen.',
    gradient: 'from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)]',
  },
  futureroom: {
    key: 'futureroom',
    label: 'FutureRoom',
    description: 'Freigegebene Werbevorlagen für FutureRoom. Wählen Sie Vorlagen für Ihre Kampagnen.',
    gradient: 'from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)]',
  },
  acquiary: {
    key: 'acquiary',
    label: 'Acquiary',
    description: 'Freigegebene Werbevorlagen für Acquiary. Wählen Sie Vorlagen für Ihre Kampagnen.',
    gradient: 'from-[hsl(210,80%,50%)] to-[hsl(200,70%,40%)]',
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function LeadManagerBrand() {
  const { activeTenantId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Derive brand from route: /portal/lead-manager/kaufy → 'kaufy'
  const segments = location.pathname.split('/');
  const brandKey = segments[segments.length - 1] || 'kaufy';
  const brand = BRANDS[brandKey];

  // ── Load approved master templates from Zone 1 ──
  const { data: templates, isLoading } = useQuery({
    queryKey: ['brand-gallery-templates', brand?.key],
    queryFn: async () => {
      if (!brand) return [];
      const { data } = await supabase
        .from('social_templates')
        .select('*')
        .eq('brand_context', brand.key)
        .eq('approved', true)
        .eq('active', true)
        .order('code');
      return data || [];
    },
    enabled: !!brand,
  });

  // ── Extract fields from schema ──
  const extractFields = (schema: any) => ({
    caption: schema?.caption?.default || '',
    cta: schema?.cta?.default || '',
    description: schema?.description || '',
  });

  /** Resolve image: prefer image_urls array, then image_url, then static fallback */
  const resolveImage = (t: any): string | undefined => {
    const urls = t.image_urls as string[] | null;
    if (urls && urls.length > 0) return urls[0];
    if (t.image_url) return t.image_url;
    return TEMPLATE_IMAGES[t.code];
  };

  const handleUseCampaign = () => {
    navigate('/portal/lead-manager/kampagnen');
  };

  if (!brand) {
    return (
      <PageShell>
        <EmptyState icon={Megaphone} title="Marke nicht gefunden" description="Bitte wählen Sie eine gültige Marke." />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        title={`${brand.label} — Vorlagen`}
        description={brand.description}
      />

      {/* Info Banner */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground mb-6">
        <Info className="h-4 w-4 shrink-0" />
        <span>
          Diese Vorlagen wurden vom Administrator freigegeben. Um sie in einer Kampagne zu verwenden, wechseln Sie zum Kampagnen-Tab.
        </span>
        <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={handleUseCampaign}>
          <Megaphone className="h-3.5 w-3.5 mr-1.5" />
          Kampagne erstellen
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[450px]" />)}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              id={t.id}
              name={t.name}
              code={t.code}
              brandGradient={brand.gradient}
              fields={extractFields(t.editable_fields_schema)}
              active={t.active}
              imageUrl={resolveImage(t)}
              imageUrls={(t.image_urls as string[]) || []}
              readOnly
              onSave={() => {}}
              onToggleActive={() => {}}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <EmptyState
              icon={Megaphone}
              title="Noch keine freigegebenen Vorlagen"
              description="Der Administrator muss zuerst Posts in Zone 1 erstellen und freigeben."
            />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
