/**
 * SanierungTab — Dashboard + Sub-routing for renovation workflow
 * Pattern: Dashboard with widget cards → Detail Akte → Vergabe
 */
import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, HardHat } from 'lucide-react';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
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
        actions={
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Sanierung starten
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square rounded-lg" />)}
        </div>
      ) : activeCases.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <HardHat className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Erste Sanierung starten</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Beschreiben Sie Ihr Vorhaben in wenigen Worten — die KI erstellt daraus ein 
              strukturiertes Leistungsverzeichnis und Sie finden passende Dienstleister.
            </p>
            <Button size="lg" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Sanierung starten
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {activeCases.map(sc => (
            <ServiceCaseCard
              key={sc.id}
              serviceCase={sc}
              onClick={() => navigate(`/portal/immobilien/sanierung/${sc.id}`)}
            />
          ))}
        </div>
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
