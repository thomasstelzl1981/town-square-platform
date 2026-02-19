/**
 * LeadManagerProjekte — Project-based template workshop (MOD-10)
 * Shows projects from dev_projects, with per-project ad templates.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, MapPin, Building2 } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { EmptyState } from '@/components/shared/EmptyState';

export default function LeadManagerProjekte() {
  const { activeTenantId } = useAuth();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['lead-manager-projekte', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data } = await supabase
        .from('dev_projects')
        .select('id, name, city, status, total_units_count')
        .eq('tenant_id', activeTenantId)
        .order('name');
      return data || [];
    },
    enabled: !!activeTenantId,
  });

  return (
    <PageShell>
      <ModulePageHeader
        title="Projekte — Anzeigenvorlagen"
        description="Erstellen Sie Werbevorlagen basierend auf Ihren Projekten. Projektdaten werden automatisch übernommen."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <Card key={p.id} className="hover:border-primary/30 transition-colors cursor-pointer">
              <div className="h-[100px] bg-gradient-to-br from-[hsl(270,60%,50%)] to-[hsl(280,50%,60%)] flex items-end p-4">
                <FolderKanban className="h-6 w-6 text-white/70" />
              </div>
              <CardContent className="p-4 space-y-2">
                <p className="font-semibold">{p.name}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {p.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{p.city}
                    </span>
                  )}
                  {p.total_units_count && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />{p.total_units_count} Einheiten
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {p.status || 'Aktiv'}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Projekt-Vorlagen werden automatisch mit Projektdaten befüllt.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <EmptyState
              icon={FolderKanban}
              title="Keine Projekte vorhanden"
              description="Erstellen Sie zuerst ein Projekt im Projektmanager, um projektbezogene Anzeigenvorlagen zu erstellen."
            />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
