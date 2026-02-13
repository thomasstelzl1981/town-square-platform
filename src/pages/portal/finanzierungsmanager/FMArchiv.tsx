/**
 * FM Archiv — Completed/Rejected finance cases (4th tile: "Fälle")
 */
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
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

      <WidgetGrid>
        {archivedCases.map(c => (
          <WidgetCell key={c.id}>
            <FinanceCaseCard
              caseData={c}
              onClick={(requestId) => navigate(`/portal/finanzierungsmanager/faelle/${requestId}`)}
            />
          </WidgetCell>
        ))}
        {archivedCases.length === 0 && (
          <WidgetCell>
            <FinanceCaseCardPlaceholder label="Keine abgeschlossenen Fälle" />
          </WidgetCell>
        )}
      </WidgetGrid>
    </PageShell>
  );
}
