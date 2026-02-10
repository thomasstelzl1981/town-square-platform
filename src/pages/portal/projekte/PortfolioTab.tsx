/**
 * Portfolio Tab - Globalobjekt-Beschreibung + Preisliste + DMS
 * MOD-13 PROJEKTE — P0 Redesign
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDevProjects } from '@/hooks/useDevProjects';
import { ProjectOverviewCard } from '@/components/projekte/ProjectOverviewCard';
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
  const { portfolioRows, isLoadingPortfolio, deleteProject } = useDevProjects();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const isLoading = isLoadingPortfolio;
  const isDemo = isDemoMode(portfolioRows);

  // Auto-select first project when data loads
  useEffect(() => {
    if (!selectedProjectId && portfolioRows.length > 0) {
      setSelectedProjectId(portfolioRows[0].id);
    }
  }, [portfolioRows, selectedProjectId]);

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
          <Select value={selectedProjectId || 'demo'} onValueChange={(v) => setSelectedProjectId(v === 'demo' ? null : v)}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Projekt wählen" /></SelectTrigger>
            <SelectContent>
              {isDemo && <SelectItem value="demo">Residenz am Stadtpark (Demo)</SelectItem>}
              {portfolioRows.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Globalobjekt-Beschreibung (ImmoScout24-Stil) */}
      <ProjectOverviewCard isDemo={isDemo} />

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

      {/* Delete Dialog */}
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
