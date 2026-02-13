import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlaskConical, Trash2 } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';

interface Props {
  createTestEvent: UseMutationResult<void, Error, void>;
  deleteTestEvents: UseMutationResult<void, Error, void>;
  hasTestData: boolean;
}

export function TestPreviewCard({ createTestEvent, deleteTestEvents, hasTestData }: Props) {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4 text-primary" />
          Test &amp; Vorschau
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button
          onClick={() => createTestEvent.mutate()}
          disabled={createTestEvent.isPending}
        >
          <FlaskConical className="h-4 w-4 mr-2" />
          Test-Anrufereignis erzeugen
        </Button>
        {hasTestData && (
          <Button
            variant="outline"
            onClick={() => deleteTestEvents.mutate()}
            disabled={deleteTestEvents.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Testdaten löschen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
