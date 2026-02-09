/**
 * Portfolio Tab - Project List with Aufteiler KPIs
 * MOD-13 PROJEKTE
 */

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useDevProjects } from '@/hooks/useDevProjects';
import { useDeveloperContexts } from '@/hooks/useDeveloperContexts';
import { 
  CreateProjectDialog, 
  ProjectPortfolioTable, 
  CreateDeveloperContextDialog,
  QuickIntakeUploader,
} from '@/components/projekte';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PortfolioTab() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { contexts, defaultContext, isLoading: loadingContexts } = useDeveloperContexts();
  const [selectedContextId, setSelectedContextId] = useState<string | undefined>(undefined);
  const { portfolioRows, isLoadingPortfolio, deleteProject } = useDevProjects(selectedContextId);
  
  const [createProjectOpen, setCreateProjectOpen] = useState(searchParams.get('create') === '1');
  const [createContextOpen, setCreateContextOpen] = useState(false);

  const isLoading = loadingContexts || isLoadingPortfolio;

  // No longer blocking on missing contexts - Magic Intake will auto-create
  // Context can be created via Dashboard or settings

  const handleDeleteProject = async (id: string) => {
    if (confirm('Projekt wirklich löschen? Alle zugehörigen Daten werden entfernt.')) {
      await deleteProject.mutateAsync(id);
    }
  };

  const handleProjectCreated = (projectId: string) => {
    navigate(`/portal/projekte/${projectId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Projekt-Portfolio</h2>
          <p className="text-muted-foreground">
            Übersicht aller Bauträger- und Aufteiler-Projekte
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Context Filter */}
          <Select
            value={selectedContextId || 'all'}
            onValueChange={(v) => setSelectedContextId(v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Alle Gesellschaften" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Gesellschaften</SelectItem>
              {contexts.map((ctx) => (
                <SelectItem key={ctx.id} value={ctx.id}>
                  {ctx.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <QuickIntakeUploader 
            onSuccess={(projectId) => navigate(`/portal/projekte/${projectId}`)} 
          />
          
          <Button onClick={() => setCreateProjectOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Neues Projekt
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : portfolioRows.length === 0 ? (
        <EmptyState
          title="Keine Projekte"
          description="Erstellen Sie Ihr erstes Bauträger- oder Aufteiler-Projekt."
          action={{ label: 'Projekt erstellen', onClick: () => setCreateProjectOpen(true) }}
        />
      ) : (
        <ProjectPortfolioTable 
          rows={portfolioRows}
          onDelete={handleDeleteProject}
        />
      )}

      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onSuccess={handleProjectCreated}
        defaultContextId={selectedContextId || defaultContext?.id}
      />
    </div>
  );
}
