import { useNavigate } from 'react-router-dom';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Loader2, Clock, ArrowRight, Plus } from 'lucide-react';
import { InfoBanner } from '@/components/shared/InfoBanner';
import { DESIGN } from '@/config/designManifest';
import { 
  useAcqMandatesPending, 
  useAcqMandatesActive, 
  useMyAcqMandates,
} from '@/hooks/useAcqMandate';
import { MandateCaseCard } from '@/components/akquise/MandateCaseCard';

export default function AkquiseDashboard() {
  const navigate = useNavigate();
  const { data: pendingMandates, isLoading: loadingPending } = useAcqMandatesPending();
  const { data: activeMandates, isLoading: loadingActive } = useAcqMandatesActive();
  const { data: myMandates, isLoading: loadingMy } = useMyAcqMandates();

  const selfCreatedMandates = myMandates?.filter(m => 
    m.status === 'draft' || m.status === 'submitted_to_zone1'
  ) || [];

  if (loadingPending || loadingActive || loadingMy) {
    return <PageShell><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  }

  const hasMandates = (pendingMandates?.length || 0) + (activeMandates?.length || 0) + selfCreatedMandates.length > 0;

  return (
    <PageShell>
      <ModulePageHeader 
        title="AKQUISE-MANAGER" 
        description="Ihre Akquise-Mandate im Überblick"
        actions={
          <Button onClick={() => navigate('/portal/akquise-manager/mandate/neu')} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Neues Mandat
          </Button>
        }
      />

      {(pendingMandates?.length || 0) > 0 && (
        <InfoBanner
          variant="warning"
          icon={Clock}
          title={`${pendingMandates?.length} Mandate warten auf Ihre Annahme`}
          action={
            <Button size="sm" variant="outline" onClick={() => {
              if (pendingMandates?.[0]) navigate(`/portal/akquise-manager/mandate/${pendingMandates[0].id}`);
            }}>
              Ansehen <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          }
        />
      )}

      {hasMandates ? (
        <div className={DESIGN.KPI_GRID.FULL}>
          {activeMandates?.map(mandate => (
            <MandateCaseCard key={mandate.id} mandate={mandate} onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)} />
          ))}
          {pendingMandates?.map(mandate => (
            <MandateCaseCard key={mandate.id} mandate={mandate} onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)} />
          ))}
          {selfCreatedMandates.map(mandate => (
            <MandateCaseCard key={mandate.id} mandate={mandate} onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Keine aktiven Mandate</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Erstellen Sie ein eigenes Mandat oder warten Sie auf Zuweisungen.
            </p>
            <Button size="lg" onClick={() => navigate('/portal/akquise-manager/mandate/neu')}>
              <Plus className="mr-2 h-5 w-5" />
              Erstes Mandat erstellen
            </Button>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
