/**
 * LeadManagerBrand — Brand-specific Content Workshop (MOD-10)
 * Loads/seeds templates from social_templates for the brand derived from the current route.
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplateCard } from './TemplateCard';
import { toast } from 'sonner';
import { DESIGN } from '@/config/designManifest';
import { TEMPLATE_IMAGES } from './templateImages';

// ─── Brand Config ───────────────────────────────────────────────────────────

interface BrandConfig {
  key: string;
  label: string;
  description: string;
  gradient: string;
  defaults: Array<{
    code: string;
    name: string;
    caption: string;
    cta: string;
    description: string;
  }>;
}

const BRANDS: Record<string, BrandConfig> = {
  kaufy: {
    key: 'kaufy',
    label: 'Kaufy',
    description: 'Bereiten Sie hier Ihre Werbeinhalte für Kaufy vor. Diese Vorlagen stehen Ihnen bei der Kampagnenerstellung zur Verfügung.',
    gradient: 'from-[hsl(220,85%,55%)] to-[hsl(245,75%,60%)]',
    defaults: [
      { code: 'KAU-RENDITE', name: 'Rendite-Highlight', caption: 'Bis zu 5,2% Mietrendite — Kapitalanlagen in Toplagen', cta: 'Jetzt Objekte entdecken', description: 'Renditezahlen und Fakten im Fokus. Zeigen Sie Investoren, was möglich ist.' },
      { code: 'KAU-SHOWCASE', name: 'Objekt-Showcase', caption: 'Neubauwohnungen ab 289.000 EUR — bezugsfertig 2026', cta: 'Exposé anfordern', description: 'Beispielobjekte und Standortvorteile präsentieren.' },
      { code: 'KAU-PORTRAIT', name: 'Berater-Portrait', caption: 'Ihr Immobilienexperte — persönlich und kompetent', cta: 'Kostenlose Beratung', description: 'Persönliche Vorstellung des Beraters. Vertrauen durch Kompetenz.' },
      { code: 'KAU-TESTIMONIAL', name: 'Testimonial', caption: 'Über 200 zufriedene Investoren vertrauen Kaufy', cta: 'Erfolgsgeschichten lesen', description: 'Kundenstimmen und Erfolgsgeschichten.' },
    ],
  },
  futureroom: {
    key: 'futureroom',
    label: 'FutureRoom',
    description: 'Bereiten Sie hier Ihre Werbeinhalte für FutureRoom vor. Diese Vorlagen stehen Ihnen bei der Kampagnenerstellung zur Verfügung.',
    gradient: 'from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)]',
    defaults: [
      { code: 'FR-KONDITIONEN', name: 'Konditionen-Highlight', caption: 'Beste Konditionen ab 2,8% — über 400 Bankpartner', cta: 'Konditionen vergleichen', description: 'Aktuelle Zinskonditionen und Bankpartner hervorheben.' },
      { code: 'FR-PORTRAIT', name: 'Berater-Portrait', caption: 'Ihr Finanzierungsexperte — digital und persönlich', cta: 'Beratung buchen', description: 'Ihr Finanzierungsexperte stellt sich vor.' },
      { code: 'FR-REGION', name: 'Region-Focus', caption: 'Finanzierungsmarkt München — aktuelle Analyse', cta: 'Marktbericht lesen', description: 'Regionale Marktanalyse für Ihre Zielregion.' },
      { code: 'FR-TESTIMONIAL', name: 'Testimonial', caption: '98% Abschlussquote bei KI-gestützter Aufbereitung', cta: 'Jetzt starten', description: 'Abschlussquoten und Erfolgsstatistiken.' },
    ],
  },
  acquiary: {
    key: 'acquiary',
    label: 'Acquiary',
    description: 'Bereiten Sie hier Ihre Werbeinhalte für Acquiary vor. Diese Vorlagen stehen Ihnen bei der Kampagnenerstellung zur Verfügung.',
    gradient: 'from-[hsl(210,80%,50%)] to-[hsl(200,70%,40%)]',
    defaults: [
      { code: 'ACQ-OFFMARKET', name: 'Off-Market-Chancen', caption: 'Off-Market-Chancen — exklusive Objekte vor allen anderen', cta: 'Portfolio ansehen', description: 'Exklusive Objekte vor allen anderen. Sourcing-Netzwerk zeigen.' },
      { code: 'ACQ-SHOWCASE', name: 'Objekt-Showcase', caption: 'Mehrfamilienhäuser in A-Lagen — 3-7% Rendite', cta: 'Objektliste anfordern', description: 'Mehrfamilienhäuser und Renditeobjekte in A-Lagen präsentieren.' },
      { code: 'ACQ-PORTRAIT', name: 'Berater-Portrait', caption: 'Ihr Akquisitionspartner — strategisch und diskret', cta: 'Kontakt aufnehmen', description: 'Ihr Akquisitionspartner — strategisch und diskret.' },
      { code: 'ACQ-HOTSPOTS', name: 'Sourcing-Hotspots', caption: 'Sourcing-Hotspots 2026 — wo sich Investitionen lohnen', cta: 'Analyse anfordern', description: 'Regionale Analyse: Wo lohnen sich Investitionen 2026?' },
    ],
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function LeadManagerBrand() {
  const { activeTenantId } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Derive brand from route: /portal/lead-manager/kaufy → 'kaufy'
  const segments = location.pathname.split('/');
  const brandKey = segments[segments.length - 1] || 'kaufy';
  const brand = BRANDS[brandKey];

  // ── Load templates ──
  const queryKey = ['social-templates', activeTenantId, brand?.key];

  const { data: templates, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeTenantId || !brand) return [];
      const { data } = await supabase
        .from('social_templates')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('brand_context', brand.key)
        .order('code');
      return data || [];
    },
    enabled: !!activeTenantId && !!brand,
  });

  // ── Lazy seeding: create defaults if none exist ──
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!activeTenantId || isLoading || seeded) return;
    if (templates && templates.length > 0) return;

    const seedDefaults = async () => {
      const inserts = brand.defaults.map(d => ({
        tenant_id: activeTenantId,
        code: d.code,
        name: d.name,
        brand_context: brand.key,
        editable_fields_schema: {
          caption: { default: d.caption, label: 'Anzeigentext' },
          cta: { default: d.cta, label: 'Call-to-Action' },
          description: d.description,
        },
        active: true,
      }));

      const { error } = await supabase.from('social_templates').insert(inserts);
      if (error) {
        console.error('Template seeding failed:', error);
      } else {
        queryClient.invalidateQueries({ queryKey });
        setSeeded(true);
      }
    };

    seedDefaults();
  }, [activeTenantId, isLoading, templates, seeded, brand, queryClient, queryKey]);

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: { caption: string; cta: string; description?: string } }) => {
      const { error } = await supabase
        .from('social_templates')
        .update({
          editable_fields_schema: {
            caption: { default: fields.caption, label: 'Anzeigentext' },
            cta: { default: fields.cta, label: 'Call-to-Action' },
            description: fields.description || '',
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Vorlage gespeichert');
    },
    onError: () => toast.error('Fehler beim Speichern'),
  });

  // ── Toggle active ──
  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('social_templates')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ── Extract fields from schema ──
  const extractFields = (schema: any) => ({
    caption: schema?.caption?.default || '',
    cta: schema?.cta?.default || '',
    description: schema?.description || '',
  });

  return (
    <PageShell>
      <ModulePageHeader
        title={`${brand.label} — Anzeigenvorlagen`}
        description={brand.description}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[450px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(templates || []).map(t => (
            <TemplateCard
              key={t.id}
              id={t.id}
              name={t.name}
              code={t.code}
              brandGradient={brand.gradient}
              fields={extractFields(t.editable_fields_schema)}
              active={t.active}
              isSaving={saveMutation.isPending}
              onSave={(id, fields) => saveMutation.mutate({ id, fields })}
              onToggleActive={(id, active) => toggleMutation.mutate({ id, active })}
              imageUrl={(t as any).image_url || TEMPLATE_IMAGES[t.code]}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
