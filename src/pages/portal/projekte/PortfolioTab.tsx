/**
 * Portfolio Tab - Arbeitsfläche mit Projekt-Widgets + Sticky-Kalkulator
 * MOD-13 PROJEKTE — P0 Redesign
 * 
 * NEVER shows EmptyState only — always structured UI with placeholders.
 */

import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useDevProjects } from '@/hooks/useDevProjects';
import { useDeveloperContexts } from '@/hooks/useDeveloperContexts';
import { 
  CreateProjectDialog, 
  CreateDeveloperContextDialog,
  QuickIntakeUploader,
} from '@/components/projekte';
import { ProjectCard, ProjectCardPlaceholder } from '@/components/projekte/ProjectCard';
import { StickyCalculatorPanel } from '@/components/projekte/StickyCalculatorPanel';
import { UnitPreislisteTable } from '@/components/projekte/UnitPreislisteTable';
import { ProjectDMSWidget } from '@/components/projekte/ProjectDMSWidget';
import { LoadingState } from '@/components/shared/LoadingState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isDemoMode, DEMO_PROJECT, DEMO_UNITS, DEMO_CALC } from '@/components/projekte/demoProjectData';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PortfolioTab() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { contexts, defaultContext, isLoading: loadingContexts } = useDeveloperContexts();
  const [selectedContextId, setSelectedContextId] = useState<string | undefined>(undefined);
  const { portfolioRows, isLoadingPortfolio, deleteProject } = useDevProjects(selectedContextId);
  
  const [createProjectOpen, setCreateProjectOpen] = useState(searchParams.get('create') === '1');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const isLoading = loadingContexts || isLoadingPortfolio;
  const isDemo = isDemoMode(portfolioRows);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleDeleteProject = (id: string) => {
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      await deleteProject.mutateAsync(projectToDelete);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const handleProjectCreated = (projectId: string) => {
    navigate(`/portal/projekte/${projectId}`);
  };

  // Get selected project data for calculator
  const selectedProject = selectedProjectId 
    ? portfolioRows.find(p => p.id === selectedProjectId)
    : portfolioRows[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Projekt-Portfolio</h2>
          <p className="text-muted-foreground">Übersicht aller Bauträger- und Aufteiler-Projekte</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedContextId || 'all'} onValueChange={(v) => setSelectedContextId(v === 'all' ? undefined : v)}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Alle Gesellschaften" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Gesellschaften</SelectItem>
              {contexts.map((ctx) => (<SelectItem key={ctx.id} value={ctx.id}>{ctx.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <QuickIntakeUploader onSuccess={(projectId) => navigate(`/portal/projekte/${projectId}`)} />
          <Button onClick={() => setCreateProjectOpen(true)}><Plus className="mr-2 h-4 w-4" />Neues Projekt</Button>
        </div>
      </div>

      {/* Projekt-Widgets (square cards) — demo card gets col-span-2 */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {isDemo ? (
          <div className="col-span-2">
            <ProjectCard project={DEMO_PROJECT} isDemo />
          </div>
        ) : (
          portfolioRows.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isSelected={selectedProject?.id === project.id}
              onClick={(id) => setSelectedProjectId(id)}
            />
          ))
        )}
        <ProjectCardPlaceholder onClick={() => setCreateProjectOpen(true)} />
      </div>

      {/* Main Content: Unit Preisliste (left) + Sticky Calculator (right) */}
      <div className="flex gap-6">
        {/* Left: Unit Preisliste */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <LoadingState />
          ) : (
            <UnitPreislisteTable
              units={DEMO_UNITS}
              projectId={isDemo ? 'demo-project-001' : (selectedProject?.id || '')}
              isDemo={isDemo}
            />
          )}
        </div>

        {/* Right: Sticky Calculator */}
        <div className="hidden lg:block w-[280px] flex-shrink-0">
          <StickyCalculatorPanel
            totalSaleTarget={isDemo ? DEMO_PROJECT.total_sale_target || undefined : selectedProject?.total_sale_target || undefined}
            purchasePrice={isDemo ? DEMO_PROJECT.purchase_price || undefined : selectedProject?.purchase_price || undefined}
            unitsCount={isDemo ? DEMO_PROJECT.total_units_count : selectedProject?.total_units_count}
            commissionRate={isDemo ? DEMO_CALC.provision : 10}
            isDemo={isDemo || !selectedProject}
          />
        </div>
      </div>

      {/* Dokumenten-Kachel */}
      <ProjectDMSWidget
        projectName={isDemo ? DEMO_PROJECT.name : (selectedProject?.name || 'Projekt')}
        units={DEMO_UNITS}
        isDemo={isDemo}
      />

      {/* Dialogs */}
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onSuccess={handleProjectCreated}
        defaultContextId={selectedContextId || defaultContext?.id}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Projekt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle Projektdaten, 
              Einheiten und zugehörigen Dokumente werden dauerhaft entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
