/**
 * LeadManagerProjekte — Project-based campaign entry (MOD-10)
 * Shows projects from dev_projects with action to start a campaign.
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, MapPin, Building2, Megaphone } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { EmptyState } from '@/components/shared/EmptyState';

export default function LeadManagerProjekte() {
  const { activeTenantId } = useAuth();
  const navigate = useNavigate();

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

  const handleCreateCampaign = (projectId: string) => {
    // Navigate to campaigns tab — the wizard will pick up context
    navigate(`/portal/lead-manager/kampagnen?project=${projectId}`);
  };

  return (
    <PageShell>
      <ModulePageHeader
        title="Projekte — Kampagnen"
        description="Erstellen Sie Kampagnen basierend auf Ihren Projekten. Projektdaten werden automatisch übernommen."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <Card key={p.id} className="overflow-hidden hover:border-primary/30 transition-colors">
              <div className="h-[100px] bg-gradient-to-br from-[hsl(270,60%,50%)] to-[hsl(280,50%,60%)] flex items-end p-4">
                <FolderKanban className="h-6 w-6 text-white/70" />
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
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
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {p.status || 'Aktiv'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => handleCreateCampaign(p.id)}
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  Kampagne erstellen
                </Button>
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
              description="Erstellen Sie zuerst ein Projekt im Projektmanager, um projektbezogene Kampagnen zu starten."
            />
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
