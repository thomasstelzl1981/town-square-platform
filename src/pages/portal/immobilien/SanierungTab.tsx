/**
 * SanierungTab — Dashboard + Sub-routing for renovation workflow
 * Pattern: Dashboard with widget cards → Detail Akte → Vergabe
 */
import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { WidgetHeader } from '@/components/shared/WidgetHeader';
import { ServiceCaseCard, ServiceCaseCardPlaceholder } from '@/components/sanierung/ServiceCaseCard';
import { ServiceCaseCreateDialog } from '@/components/portal/immobilien/sanierung/ServiceCaseCreateDialog';
import { SanierungDetail } from '@/components/sanierung/SanierungDetail';
import { SanierungVergabe } from '@/components/sanierung/SanierungVergabe';
import { useServiceCases } from '@/hooks/useServiceCases';

// Dashboard view with widget tiles
function SanierungDashboard() {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: cases, isLoading } = useServiceCases();

  const activeCases = cases?.filter(c => !['completed', 'cancelled'].includes(c.status)) || [];

  return (
    <PageShell>
      <ModulePageHeader
        title="Sanierung"
        description={`${activeCases.length} aktive Vorgänge — Ausschreibungen, Angebote und Dokumentation.`}
      />

      {isLoading ? (
        <WidgetGrid>
          {[1, 2, 3].map(i => <WidgetCell key={i}><Skeleton className="h-full w-full rounded-lg" /></WidgetCell>)}
        </WidgetGrid>
      ) : (
        <WidgetGrid>
          <WidgetCell>
            <Card
              className="h-full cursor-pointer border-dashed hover:border-primary/50 transition-colors flex flex-col"
              onClick={() => setCreateDialogOpen(true)}
            >
              <CardContent className="flex flex-col items-center justify-center flex-1 gap-3 p-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-center">Neue Sanierung starten</p>
                <p className="text-xs text-muted-foreground text-center">
                  Vorhaben beschreiben — KI erstellt Leistungsverzeichnis
                </p>
              </CardContent>
            </Card>
          </WidgetCell>
          {activeCases.map(sc => (
            <ServiceCaseCard
              key={sc.id}
              serviceCase={sc}
              onClick={() => navigate(`/portal/immobilien/sanierung/${sc.id}`)}
            />
          ))}
        </WidgetGrid>
      )}

      <ServiceCaseCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={(caseId) => {
          navigate(`/portal/immobilien/sanierung/${caseId}`);
        }}
      />
    </PageShell>
  );
}

export function SanierungTab() {
  return (
    <Routes>
      <Route index element={<SanierungDashboard />} />
      <Route path=":caseId" element={<SanierungDetail />} />
      <Route path="vergabe" element={<SanierungVergabe />} />
    </Routes>
  );
}
