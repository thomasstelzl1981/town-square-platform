import { useNavigate } from 'react-router-dom';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Loader2, Plus, Inbox } from 'lucide-react';
import { 
  useAcqMandatesPending, 
  useAcqMandatesActive, 
} from '@/hooks/useAcqMandate';
import { MandateCaseCard, MandateCaseCardPlaceholder } from '@/components/akquise/MandateCaseCard';

export default function AkquiseDashboard() {
  const navigate = useNavigate();
  const { data: pendingMandates, isLoading: loadingPending } = useAcqMandatesPending();
  const { data: activeMandates, isLoading: loadingActive } = useAcqMandatesActive();

  if (loadingPending || loadingActive) {
    return <PageShell><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  }

  return (
    <PageShell>
      <ModulePageHeader 
        title="AKQUISE-MANAGER" 
        description="Ihre Akquise-Mandate im Überblick"
        actions={
          <Button onClick={() => navigate('/portal/akquise-manager/mandate')} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Neues Mandat
          </Button>
        }
      />

      {/* ── Sektion A: Aktive Mandate ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Aktive Mandate
        </h2>
        {activeMandates && activeMandates.length > 0 ? (
          <WidgetGrid>
            {activeMandates.map(mandate => (
              <WidgetCell key={mandate.id}>
                <MandateCaseCard
                  mandate={mandate}
                  onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)}
                />
              </WidgetCell>
            ))}
          </WidgetGrid>
        ) : (
          <WidgetGrid>
            <WidgetCell>
              <Card className="glass-card border-dashed border-2 h-full flex flex-col items-center justify-center opacity-50">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Keine aktiven Mandate</p>
                  <p className="text-[10px] text-muted-foreground">Erstellen Sie ein Mandat oder warten Sie auf Zuweisungen</p>
                </CardContent>
              </Card>
            </WidgetCell>
          </WidgetGrid>
        )}
      </div>

      {/* ── Sektion B: Neue Aufträge (Pending) ── */}
      <div className="space-y-3 mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Neue Aufträge
        </h2>
        {pendingMandates && pendingMandates.length > 0 ? (
          <WidgetGrid>
            {pendingMandates.map(mandate => (
              <WidgetCell key={mandate.id}>
                <MandateCaseCard
                  mandate={mandate}
                  onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)}
                />
              </WidgetCell>
            ))}
          </WidgetGrid>
        ) : (
          <WidgetGrid>
            <WidgetCell>
              <Card className="glass-card border-dashed border-2 h-full flex flex-col items-center justify-center opacity-50">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Inbox className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Keine neuen Aufträge</p>
                  <p className="text-[10px] text-muted-foreground">Neue Mandate erscheinen hier nach Zuweisung</p>
                </CardContent>
              </Card>
            </WidgetCell>
          </WidgetGrid>
        )}
      </div>
    </PageShell>
  );
}
