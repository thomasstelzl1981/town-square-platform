/**
 * ProjectLandingObjekt — Objekt-Detailseite + Exposé-Download
 * 
 * Projektbeschreibung, Key Facts, Bildergalerie (aus dev_projects.project_images),
 * Exposé-PDF Download aus DMS
 */
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCachedSignedUrl } from '@/lib/imageCache';
import { Loader2, Building2, MapPin, Calendar, Ruler, Home, Zap, FileDown, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
        .in('status', ['draft', 'preview', 'active'])
        .maybeSingle();

      if (!lp?.project_id) return null;

      const { data: project } = await supabase
        .from('dev_projects')
        .select('id, name, city, address, postal_code, description, full_description, project_images, total_units_count, total_area_sqm, construction_year, energy_class, energy_source, project_code')
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

      // Query DMS for exposé files
      let exposeFiles: Array<{ id: string; name: string; storage_path: string }> = [];
      if ((project as any).project_code) {
        const projectCode = (project as any).project_code;
        const { data: nodes } = await (supabase as any)
          .from('storage_nodes')
          .select('id, name, storage_path')
          .eq('type', 'file')
          .ilike('folder_path', `%${projectCode}%01_expose%`)
          .not('storage_path', 'is', null);
        exposeFiles = (nodes || []);
      }

      return { landingPage: lp, project, imageUrls, exposeFiles };
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      const { data: signedData, error } = await supabase.storage
        .from('tenant-documents')
        .createSignedUrl(storagePath, 300);
      if (error || !signedData?.signedUrl) throw error;
      const a = document.createElement('a');
      a.href = signedData.signedUrl;
      a.download = fileName;
      a.target = '_blank';
      a.click();
    } catch {
      toast.error('Download fehlgeschlagen');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[hsl(210,80%,55%)]" /></div>;
  }

  if (!data) {
    return <div className="text-center py-24"><Building2 className="w-12 h-12 mx-auto text-[hsl(215,16%,47%)] mb-4" /><p className="text-[hsl(215,16%,47%)]">Projekt nicht gefunden.</p></div>;
  }

  const { landingPage, project, imageUrls, exposeFiles } = data;
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
        <h1 className="text-3xl md:text-4xl font-bold text-[hsl(220,20%,10%)]">{project.name}</h1>
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

      {/* Location */}
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
                <img src={imageUrls[slot.key]} alt={slot.label} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                  <span className="text-sm font-medium text-white">{slot.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exposé Download */}
      {exposeFiles.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-[hsl(220,20%,10%)] mb-4">Dokumente zum Download</h2>
          <div className="space-y-3">
            {exposeFiles.map((file) => (
              <Card key={file.id} className="border-[hsl(214,32%,91%)]">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(0,80%,55%,0.1)] flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[hsl(0,80%,55%)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[hsl(220,20%,10%)]">{file.name}</p>
                      <p className="text-xs text-[hsl(215,16%,47%)]">PDF-Dokument</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleDownload(file.storage_path, file.name)}
                  >
                    <FileDown className="h-4 w-4" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="text-center pt-4">
        <Link to={`/website/projekt/${slug}/beratung`}>
          <Button className="h-12 px-8 rounded-lg bg-[hsl(220,20%,10%)] hover:bg-[hsl(220,20%,20%)] text-base">
            Kostenlose Beratung anfragen
          </Button>
        </Link>
      </div>
    </div>
  );
}
