/**
 * FM Einreichung — Overview of cases ready for bank submission
 * Shows widget cards of cases with status ready_for_submission or higher
 */
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { FinanceCaseCard, FinanceCaseCardPlaceholder } from '@/components/finanzierungsmanager/FinanceCaseCard';
import type { FutureRoomCase } from '@/types/finance';

interface Props {
  cases: FutureRoomCase[];
  isLoading: boolean;
}

const READY_STATUSES = ['ready_for_submission', 'ready_to_submit', 'submitted_to_bank', 'completed'];

function getRequestStatus(c: FutureRoomCase): string {
  return c.finance_mandates?.finance_requests?.status || c.status;
}

export default function FMEinreichung({ cases, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const readyCases = cases.filter(c => READY_STATUSES.includes(getRequestStatus(c)));

  return (
    <PageShell>
      <ModulePageHeader
        title="EINREICHUNG"
        description={`${readyCases.length} Finanzierungsakten bereit zur Einreichung bei Banken.`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {readyCases.map(c => (
          <FinanceCaseCard
            key={c.id}
            caseData={c}
            onClick={(requestId) => navigate(requestId)}
          />
        ))}
        {readyCases.length === 0 && (
          <FinanceCaseCardPlaceholder label="Keine Akten bereit" />
        )}
      </div>
    </PageShell>
  );
}
