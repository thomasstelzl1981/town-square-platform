/**
 * FM Archiv — Completed/Rejected finance cases (4th tile: "Fälle")
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

const ARCHIVE_STATUSES = ['completed', 'submitted_to_bank', 'rejected'];

function getRequestStatus(c: FutureRoomCase): string {
  return c.finance_mandates?.finance_requests?.status || c.status;
}

export default function FMArchiv({ cases, isLoading }: Props) {
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

  const archivedCases = cases.filter(c => ARCHIVE_STATUSES.includes(getRequestStatus(c)));

  return (
    <PageShell>
      <ModulePageHeader
        title="FÄLLE"
        description={`${archivedCases.length} abgeschlossene Finanzierungsfälle.`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {archivedCases.map(c => (
          <FinanceCaseCard
            key={c.id}
            caseData={c}
            onClick={(requestId) => navigate(`/portal/finanzierungsmanager/faelle/${requestId}`)}
          />
        ))}
        {archivedCases.length === 0 && (
          <FinanceCaseCardPlaceholder label="Keine abgeschlossenen Fälle" />
        )}
      </div>
    </PageShell>
  );
}
