/**
 * SanierungVergabe — Award/Vergabe view for renovation cases
 * Analog to FM Einreichung: Shows cases in review/awarded status as widget tiles
 */
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardHat, Award, CheckCircle2 } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { ServiceCaseCard } from './ServiceCaseCard';
import { useServiceCases } from '@/hooks/useServiceCases';
import { Skeleton } from '@/components/ui/skeleton';

const VERGABE_STATUSES = ['under_review', 'awarded', 'in_progress', 'completed'];

export function SanierungVergabe() {
  const navigate = useNavigate();
  const { data: cases, isLoading } = useServiceCases();

  const vergabeCases = cases?.filter(c => VERGABE_STATUSES.includes(c.status)) || [];
  const completedCount = vergabeCases.filter(c => c.status === 'completed').length;

  if (isLoading) {
    return (
      <PageShell>
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square" />)}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        title="Vergabe"
        description={`${vergabeCases.length} Vorgänge in der Vergabe — ${completedCount} abgeschlossen.`}
      />

      {vergabeCases.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Keine Vorgänge zur Vergabe</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Vorgänge erscheinen hier, sobald Angebote eingegangen sind und zur Vergabe bereit sind.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {vergabeCases.map(sc => (
            <ServiceCaseCard
              key={sc.id}
              serviceCase={sc}
              onClick={() => navigate(`/portal/immobilien/sanierung/${sc.id}`)}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
