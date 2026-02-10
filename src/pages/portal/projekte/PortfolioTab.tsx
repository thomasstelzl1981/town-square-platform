/**
 * Portfolio Tab - Globalobjekt-Beschreibung + Preisliste + DMS
 * MOD-13 PROJEKTE — P0 Redesign
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDevProjects } from '@/hooks/useDevProjects';
import { ProjectOverviewCard } from '@/components/projekte/ProjectOverviewCard';
import { StickyCalculatorPanel } from '@/components/projekte/StickyCalculatorPanel';
import { UnitPreislisteTable } from '@/components/projekte/UnitPreislisteTable';
import { ProjectDMSWidget } from '@/components/projekte/ProjectDMSWidget';
import { LoadingState } from '@/components/shared/LoadingState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isDemoMode, DEMO_PROJECT, DEMO_UNITS, DEMO_CALC } from '@/components/projekte/demoProjectData';
import type { DemoUnit } from '@/components/projekte/demoProjectData';
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

  // Get selected project data
  const selectedProject = selectedProjectId 
    ? portfolioRows.find(p => p.id === selectedProjectId)
    : portfolioRows[0];

  // ── Central calculator state ──────────────────────────────────────────
  const [investmentCosts, setInvestmentCosts] = useState(
    isDemo ? DEMO_PROJECT.purchase_price || 4_800_000 : (selectedProject?.purchase_price || 4_800_000)
  );
  const [provisionRate, setProvisionRate] = useState(0.10); // 10%
  const [priceAdjustment, setPriceAdjustment] = useState(0); // %
  const [unitOverrides, setUnitOverrides] = useState<Record<string, { list_price?: number }>>({});

  // Base units (demo or real)
  const baseUnits: DemoUnit[] = isDemo ? DEMO_UNITS : DEMO_UNITS; // TODO: replace with real units

  // Compute effective unit values
  const calculatedUnits: CalculatedUnit[] = useMemo(() => {
    return baseUnits.map((u) => {
      const override = unitOverrides[u.id];
      let effectivePrice: number;

      if (override?.list_price != null) {
        // Manual override — apply price adjustment on top
        effectivePrice = Math.round(override.list_price * (1 + priceAdjustment / 100));
      } else {
        // Base price with adjustment
        effectivePrice = Math.round(u.list_price * (1 + priceAdjustment / 100));
      }

      const effectiveYield = effectivePrice > 0 ? (u.annual_net_rent / effectivePrice) * 100 : 0;
      const effectivePricePerSqm = u.area_sqm > 0 ? Math.round(effectivePrice / u.area_sqm) : 0;
      const effectiveProvision = Math.round(effectivePrice * provisionRate);

      return {
        ...u,
        effective_price: effectivePrice,
        effective_yield: effectiveYield,
        effective_price_per_sqm: effectivePricePerSqm,
        effective_provision: effectiveProvision,
      };
    });
  }, [baseUnits, unitOverrides, priceAdjustment, provisionRate]);

  // Handle inline price edits from table
  const handleUnitPriceChange = useCallback((unitId: string, field: 'list_price' | 'price_per_sqm', value: number) => {
    const unit = baseUnits.find(u => u.id === unitId);
    if (!unit) return;

    let newPrice: number;
    if (field === 'price_per_sqm') {
      newPrice = Math.round(value * unit.area_sqm);
    } else {
      newPrice = Math.round(value);
    }

    // Store as override (without price adjustment applied, so adjustment can still layer on top)
    const basePrice = priceAdjustment !== 0
      ? Math.round(newPrice / (1 + priceAdjustment / 100))
      : newPrice;

    setUnitOverrides(prev => ({
      ...prev,
      [unitId]: { list_price: basePrice },
    }));
  }, [baseUnits, priceAdjustment]);

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

      {/* Globalobjekt-Beschreibung + Kalkulator nebeneinander */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ProjectOverviewCard isDemo={isDemo} />
        </div>
        <div className="lg:col-span-2">
          <StickyCalculatorPanel
            investmentCosts={investmentCosts}
            provisionRate={provisionRate}
            priceAdjustment={priceAdjustment}
            units={calculatedUnits}
            onInvestmentCostsChange={setInvestmentCosts}
            onProvisionChange={setProvisionRate}
            onPriceAdjustment={setPriceAdjustment}
            isDemo={isDemo || !selectedProject}
          />
        </div>
      </div>

      {/* Preisliste (volle Breite) */}
      {isLoading ? (
        <LoadingState />
      ) : (
        <UnitPreislisteTable
          units={calculatedUnits}
          projectId={isDemo ? 'demo-project-001' : (selectedProject?.id || '')}
          isDemo={isDemo}
          onUnitPriceChange={handleUnitPriceChange}
        />
      )}

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
