/**
 * Portfolio Tab - Globalobjekt-Beschreibung + Preisliste + DMS
 * MOD-13 PROJEKTE — P0 Redesign
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { DESIGN, getActiveWidgetGlow } from '@/config/designManifest';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDevProjects } from '@/hooks/useDevProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectOverviewCard } from '@/components/projekte/ProjectOverviewCard';
import { StickyCalculatorPanel } from '@/components/projekte/StickyCalculatorPanel';
import { UnitPreislisteTable } from '@/components/projekte/UnitPreislisteTable';
import { ProjectDMSWidget } from '@/components/projekte/ProjectDMSWidget';
import { ProjectCard } from '@/components/projekte/ProjectCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { isDemoId } from '@/engines/demoData/engine';
import type { DemoUnit } from '@/components/projekte/demoProjectData';
import { SalesStatusReportWidget } from '@/components/projekte/SalesStatusReportWidget';
import { DEMO_DEVELOPER_CONTEXT, type DeveloperContext as DemoDeveloperContext } from '@/components/projekte/demoProjectData';
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

// Extended unit type with calculated effective values
interface CalculatedUnit extends DemoUnit {
  effective_price: number;
  effective_yield: number;
  effective_price_per_sqm: number;
  effective_provision: number;
}

export default function PortfolioTab() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { portfolioRows, isLoadingPortfolio, deleteProject, projects } = useDevProjects();
  
  // Default to first project
  const [selectedProjectId, setSelectedProjectId] = useState<string>(portfolioRows[0]?.id || '');

  // BUG 1 FIX: Sync selectedProjectId when portfolioRows load async
  useEffect(() => {
    if (portfolioRows.length > 0 && !selectedProjectId) {
      setSelectedProjectId(portfolioRows[0].id);
    }
  }, [portfolioRows, selectedProjectId]);

  const isLoading = isLoadingPortfolio;
  const isSelectedDemo = isDemoId(selectedProjectId);

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

  // Get selected project data
  const selectedProject = portfolioRows.find(p => p.id === selectedProjectId) || portfolioRows[0] || null;

  // ── Fetch real units from dev_project_units ────────────────────────────
  const { data: realUnits } = useQuery({
    queryKey: ['dev_project_units', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return null;
      const { data, error } = await supabase
        .from('dev_project_units')
        .select('*')
        .eq('project_id', selectedProjectId)
        .order('unit_number');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProjectId,
  });

  // ── Central calculator state ──────────────────────────────────────────
  const [investmentCosts, setInvestmentCosts] = useState(
    selectedProject?.purchase_price || 4_800_000
  );
  const [totalSaleTarget, setTotalSaleTarget] = useState(
    selectedProject?.total_sale_target || 0
  );
  const [provisionRate, setProvisionRate] = useState(0.10);
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [targetYield, setTargetYield] = useState(0.04);
  const [unitOverrides, setUnitOverrides] = useState<Record<string, { list_price?: number; parking_price?: number }>>({});
  const [unitStatusOverrides, setUnitStatusOverrides] = useState<Record<string, string>>({});

  // BUG 2 FIX: Sync calculator values when selectedProject changes
  useEffect(() => {
    if (selectedProject) {
      setInvestmentCosts(selectedProject.purchase_price || 0);
      setTotalSaleTarget(selectedProject.total_sale_target || 0);
    }
  }, [selectedProject?.id]);

  // Base units mapped to DemoUnit interface
  const baseUnits: DemoUnit[] = useMemo(() => {
    if (!realUnits || realUnits.length === 0) return [];

    return realUnits.map((u) => {
      const listPrice = u.list_price ?? 0;
      const areaSqm = u.area_sqm ?? 1;
      const rentNet = u.rent_net ?? u.current_rent ?? 0;
      const rentNk = u.rent_nk ?? 0;
      const annualNetRent = rentNet * 12;

      return {
        id: u.id,
        public_id: u.public_id || u.id.substring(0, 8),
        unit_number: u.unit_number || '—',
        rooms: u.rooms_count ?? 0,
        floor: u.floor ?? 0,
        area_sqm: areaSqm,
        list_price: listPrice,
        rent_monthly: rentNet,
        annual_net_rent: annualNetRent,
        non_recoverable_costs: rentNk,
        yield_percent: listPrice > 0 ? (annualNetRent / listPrice) * 100 : 0,
        price_per_sqm: areaSqm > 0 ? Math.round(listPrice / areaSqm) : 0,
        provision_eur: u.commission_amount ?? Math.round(listPrice * 0.10),
        parking_price: 0,
        status: (u.status === 'verkauft' ? 'sold' : u.status === 'reserviert' ? 'reserved' : 'available') as DemoUnit['status'],
      };
    });
  }, [realUnits]);

  // Compute effective unit values
  const calculatedUnits: CalculatedUnit[] = useMemo(() => {
    return baseUnits.map((u) => {
      const override = unitOverrides[u.id];
      const statusOverride = unitStatusOverrides[u.id];
      let effectivePrice: number;

      if (override?.list_price != null) {
        effectivePrice = Math.round(override.list_price);
      } else {
        const basePrice = targetYield > 0 ? u.annual_net_rent / targetYield : 0;
        effectivePrice = Math.round(basePrice * (1 + priceAdjustment / 100));
      }

      const effectiveYield = effectivePrice > 0 ? (u.annual_net_rent / effectivePrice) * 100 : 0;
      const effectivePricePerSqm = u.area_sqm > 0 ? Math.round(effectivePrice / u.area_sqm) : 0;
      const effectiveProvision = Math.round(effectivePrice * provisionRate);
      const parkingPrice = override?.parking_price ?? u.parking_price;

      return {
        ...u,
        effective_price: effectivePrice,
        effective_yield: effectiveYield,
        effective_price_per_sqm: effectivePricePerSqm,
        effective_provision: effectiveProvision,
        parking_price: parkingPrice,
        status: (statusOverride || u.status) as DemoUnit['status'],
      };
    });
  }, [baseUnits, unitOverrides, unitStatusOverrides, priceAdjustment, provisionRate, targetYield]);

  // Handle inline price edits
  const handleUnitPriceChange = useCallback((unitId: string, field: 'list_price' | 'price_per_sqm' | 'parking_price', value: number) => {
    const unit = baseUnits.find(u => u.id === unitId);
    if (!unit) return;

    if (field === 'parking_price') {
      setUnitOverrides(prev => ({
        ...prev,
        [unitId]: { ...prev[unitId], parking_price: Math.round(value) },
      }));
      return;
    }

    let newPrice: number;
    if (field === 'price_per_sqm') {
      newPrice = Math.round(value * unit.area_sqm);
    } else {
      newPrice = Math.round(value);
    }

    setUnitOverrides(prev => ({
      ...prev,
      [unitId]: { ...prev[unitId], list_price: newPrice },
    }));
  }, [baseUnits]);

  // Handle status changes
  const handleStatusChange = useCallback((unitId: string, status: string) => {
    setUnitStatusOverrides(prev => ({ ...prev, [unitId]: status }));
  }, []);

  return (
    <PageShell>
      <ModulePageHeader title="Projekt-Portfolio" description="Übersicht aller Bauträger- und Aufteiler-Projekte" />

      {/* Project Switcher — Horizontal Tile Row */}
      <WidgetGrid>
        {portfolioRows.map((p) => (
          <WidgetCell key={p.id}>
            <ProjectCard
              project={p}
              isDemo={isDemoId(p.id)}
              isSelected={p.id === selectedProjectId}
              onClick={(id) => setSelectedProjectId(id)}
            />
          </WidgetCell>
        ))}
      </WidgetGrid>

      {/* Globalobjekt-Beschreibung — only if a project is actually selected */}
      {selectedProject && (
        <>
          <ProjectOverviewCard
            isDemo={isSelectedDemo}
            selectedProject={selectedProject}
            unitCount={calculatedUnits.length}
            fullProject={projects.find(p => p.id === selectedProjectId)}
          />

          {/* Preisliste */}
          {isLoading ? (
            <LoadingState />
          ) : (
            <UnitPreislisteTable
              units={calculatedUnits}
              projectId={selectedProject?.id || ''}
              isDemo={isSelectedDemo}
              onUnitPriceChange={handleUnitPriceChange}
              onStatusChange={handleStatusChange}
            />
          )}

          {/* Kalkulator-Zeile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <StickyCalculatorPanel
                investmentCosts={investmentCosts}
                totalSaleTarget={totalSaleTarget}
                provisionRate={provisionRate}
                priceAdjustment={priceAdjustment}
                targetYield={targetYield}
                units={calculatedUnits}
                onInvestmentCostsChange={setInvestmentCosts}
                onTotalSaleTargetChange={setTotalSaleTarget}
                onProvisionChange={setProvisionRate}
                onPriceAdjustment={setPriceAdjustment}
                onTargetYieldChange={setTargetYield}
                isDemo={isSelectedDemo || !selectedProject}
                projectId={selectedProject?.id || ''}
              />
            </div>
            <div className="lg:col-span-2">
              <SalesStatusReportWidget
                units={calculatedUnits}
                projectName={selectedProject?.name || 'Projekt'}
                investmentCosts={investmentCosts}
                totalSaleTarget={totalSaleTarget}
                provisionRate={provisionRate}
                targetYield={targetYield}
                developerContext={(() => {
                  const fullProj = projects.find(p => p.id === selectedProjectId);
                  if (fullProj?.developer_context) {
                    const dc = fullProj.developer_context;
                    return {
                      name: dc.name,
                      legal_form: dc.legal_form || '',
                      hrb_number: dc.hrb_number || '',
                      ust_id: dc.ust_id || '',
                      managing_director: dc.managing_director || '',
                      street: dc.street || '',
                      house_number: dc.house_number || '',
                      postal_code: dc.postal_code || '',
                      city: dc.city || '',
                    };
                  }
                  return isSelectedDemo ? DEMO_DEVELOPER_CONTEXT : {
                    name: '—', legal_form: '', hrb_number: '', ust_id: '',
                    managing_director: '', street: '', house_number: '', postal_code: '', city: '',
                  };
                })()}
                isDemo={isSelectedDemo}
                projectData={projects.find(p => p.id === selectedProjectId) ?? null}
              />
            </div>
          </div>

          {/* Dokumenten-Kachel */}
          <ProjectDMSWidget
            projectId={selectedProject?.id}
            projectName={selectedProject?.name || 'Projekt'}
            units={baseUnits}
            isDemo={isSelectedDemo}
          />
        </>
      )}

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
    </PageShell>
  );
}
