/**
 * MOD-07: Finance Request Detail Page
 * Shows the AnfrageFormV2 for editing request details
 */

import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AnfrageFormV2 from '@/components/finanzierung/AnfrageFormV2';
import { PageShell } from '@/components/shared/PageShell';

export default function AnfrageDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();

  if (!requestId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Keine Anfrage-ID angegeben</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/portal/finanzierung/anfrage">Zurück zur Übersicht</Link>
        </Button>
      </div>
    );
  }

  return (
    <PageShell>
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/portal/finanzierung/anfrage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">
          Zurück zur Anfrageübersicht
        </span>
      </div>

      {/* The Form */}
      <AnfrageFormV2 requestId={requestId} />
    </PageShell>
  );
}
