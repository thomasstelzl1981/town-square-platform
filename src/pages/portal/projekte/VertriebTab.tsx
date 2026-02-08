/**
 * Vertrieb Tab - Reservations & Sales Management
 * MOD-13 PROJEKTE
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CalendarCheck, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { useDevProjects } from '@/hooks/useDevProjects';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';

export default function VertriebTab() {
  const { portfolioRows, isLoadingPortfolio } = useDevProjects();

  if (isLoadingPortfolio) {
    return <LoadingState />;
  }

  // Aggregate stats across all projects
  const totalUnits = portfolioRows.reduce((sum, r) => sum + r.total_units_count, 0);
  const totalSold = portfolioRows.reduce((sum, r) => sum + r.units_sold, 0);
  const totalReserved = portfolioRows.reduce((sum, r) => sum + r.units_reserved, 0);
  const totalAvailable = portfolioRows.reduce((sum, r) => sum + r.units_available, 0);
  const totalValue = portfolioRows.reduce((sum, r) => sum + (r.total_sale_target || 0), 0);
  const soldValue = portfolioRows.reduce((sum, r) => {
    const unitValue = r.total_sale_target && r.total_units_count 
      ? r.total_sale_target / r.total_units_count 
      : 0;
    return sum + (unitValue * r.units_sold);
  }, 0);

  if (portfolioRows.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="Keine Projekte vorhanden"
          description="Erstellen Sie ein Projekt im Portfolio-Tab, um den Vertrieb zu starten."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Vertrieb & Reservierungen</h2>
        <p className="text-muted-foreground">
          Übersicht über Reservierungen und Partner-Performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Einheiten gesamt</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <p className="text-xs text-muted-foreground">
              in {portfolioRows.length} Projekten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verkauft</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalSold}</div>
            <p className="text-xs text-muted-foreground">
              {totalUnits > 0 ? Math.round((totalSold / totalUnits) * 100) : 0}% des Bestands
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserviert</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalReserved}</div>
            <p className="text-xs text-muted-foreground">
              {totalAvailable} noch verfügbar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verkaufswert</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('de-DE', { 
                style: 'currency', 
                currency: 'EUR',
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(soldValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              von {new Intl.NumberFormat('de-DE', { 
                style: 'currency', 
                currency: 'EUR',
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(totalValue)} Ziel
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Projekt-Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portfolioRows.map((project) => {
              const progress = project.total_units_count > 0 
                ? Math.round((project.units_sold / project.total_units_count) * 100) 
                : 0;
              
              return (
                <div key={project.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{project.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {project.units_sold}/{project.total_units_count} verkauft
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {project.units_available} frei
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {project.units_reserved} res.
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Partner Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Partner-Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Partner-Zuordnungen werden nach der ersten Reservierung angezeigt.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
