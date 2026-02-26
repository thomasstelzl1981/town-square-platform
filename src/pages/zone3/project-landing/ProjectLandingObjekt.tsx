/**
 * ProjectLandingObjekt — Objekt-Detailseite
 * 
 * Projektbeschreibung, Key Facts, Bildergalerie (aus dev_projects.project_images)
 */
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCachedSignedUrl } from '@/lib/imageCache';
import { Loader2, Building2, MapPin, Calendar, Ruler, Home, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ImageSlot {
  storagePath?: string;
  fileName?: string;
}

export default function ProjectLandingObjekt() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['project-landing-objekt', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data: lp } = await supabase
        .from('landing_pages')
        .select('id, project_id, about_text, location_description, highlights_json')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (!lp?.project_id) return null;

      const { data: project } = await supabase
        .from('dev_projects')
        .select('id, name, city, address, postal_code, description, full_description, project_images, total_units_count, total_area_sqm, construction_year, energy_class, energy_source')
        .eq('id', lp.project_id)
        .maybeSingle();

      if (!project) return null;

      // Generate signed URLs for all image slots
      const projectImages = project.project_images as Record<string, ImageSlot> | null;
      const imageUrls: Record<string, string> = {};

      if (projectImages) {
        await Promise.all(
          Object.entries(projectImages).map(async ([key, slot]) => {
            if (slot?.storagePath) {
              const url = await getCachedSignedUrl(slot.storagePath);
              if (url) imageUrls[key] = url;
            }
          })
        );
      }

      return { landingPage: lp, project, imageUrls };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(210,80%,55%)]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-24">
        <Building2 className="w-12 h-12 mx-auto text-[hsl(215,16%,47%)] mb-4" />
        <p className="text-[hsl(215,16%,47%)]">Projekt nicht gefunden.</p>
      </div>
    );
  }

  const { landingPage, project, imageUrls } = data;
  const description = landingPage.about_text || (project as any).full_description || project.description || '';
  const locationDescription = landingPage.location_description || '';
  const highlights = (landingPage.highlights_json as string[] | null) || [];

  const facts = [
    { icon: Home, label: 'Einheiten', value: project.total_units_count },
    { icon: Ruler, label: 'Gesamtfläche', value: project.total_area_sqm ? `${Math.round(project.total_area_sqm)} m²` : null },
    { icon: Calendar, label: 'Baujahr', value: project.construction_year },
    { icon: Zap, label: 'Energieklasse', value: (project as any).energy_class },
    { icon: MapPin, label: 'Standort', value: [project.postal_code, project.city].filter(Boolean).join(' ') },
  ].filter(f => f.value);

  const imageSlots = [
    { key: 'exterior', label: 'Außenansicht' },
    { key: 'interior', label: 'Innenansicht' },
    { key: 'surroundings', label: 'Umgebung' },
  ].filter(s => imageUrls[s.key]);

  return (
    <div className="py-12 px-6 lg:px-10 space-y-12">
      {/* Title */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-[hsl(220,20%,10%)]">
          {project.name}
        </h1>
        {project.city && (
          <div className="flex items-center gap-2 mt-2 text-[hsl(215,16%,47%)]">
            <MapPin className="h-4 w-4" />
            <span>{[project.address, project.postal_code, project.city].filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Key Facts */}
      {facts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {facts.map((fact, i) => (
            <Card key={i} className="border-[hsl(214,32%,91%)]">
              <CardContent className="p-4 text-center">
                <fact.icon className="h-5 w-5 mx-auto mb-2 text-[hsl(210,80%,55%)]" />
                <div className="text-lg font-bold text-[hsl(220,20%,10%)]">{fact.value}</div>
                <div className="text-xs text-[hsl(215,16%,47%)]">{fact.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Description */}
      {description && (
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold text-[hsl(220,20%,10%)] mb-4">Über das Projekt</h2>
          <div className="prose prose-sm max-w-none text-[hsl(215,16%,47%)] leading-relaxed whitespace-pre-line">
            {description}
          </div>
        </div>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-[hsl(220,20%,10%)] mb-4">Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-[hsl(210,30%,97%)] rounded-xl">
                <div className="w-6 h-6 rounded-full bg-[hsl(210,80%,55%,0.15)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-[hsl(210,80%,55%)]">✓</span>
                </div>
                <span className="text-sm text-[hsl(220,20%,10%)]">{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location Description */}
      {locationDescription && (
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold text-[hsl(220,20%,10%)] mb-4">Lage & Umgebung</h2>
          <div className="prose prose-sm max-w-none text-[hsl(215,16%,47%)] leading-relaxed whitespace-pre-line">
            {locationDescription}
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {imageSlots.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-[hsl(220,20%,10%)] mb-4">Bildergalerie</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {imageSlots.map((slot) => (
              <div key={slot.key} className="relative overflow-hidden rounded-xl aspect-[4/3]">
                <img
                  src={imageUrls[slot.key]}
                  alt={slot.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                  <span className="text-sm font-medium text-white">{slot.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
