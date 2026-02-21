/**
 * IntakeChecklistGrid — Shows required documents per module with live progress.
 * Queries actual document presence from the database.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, ClipboardCheck } from 'lucide-react';
import { useIntakeChecklistProgress } from '@/hooks/useIntakeChecklistProgress';

interface IntakeChecklistGridProps {
  refreshKey?: number;
}

export function IntakeChecklistGrid({ refreshKey = 0 }: IntakeChecklistGridProps) {
  const { progress, isLoading } = useIntakeChecklistProgress(refreshKey);

  if (progress.length === 0 && !isLoading) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Benötigte Unterlagen
        </h3>
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {progress.map((item) => {
          const percent = item.totalCount > 0 ? Math.round((item.foundCount / item.totalCount) * 100) : 0;
          return (
            <Card key={item.module.module_code} className="border-border/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{item.module.root_name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {item.foundCount}/{item.totalCount}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {item.module.required_docs.map((doc) => {
                  const isFound = item.foundDocs.has(doc.name);
                  return (
                    <div key={doc.name} className="flex items-center gap-2 text-xs">
                      {isFound ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                      )}
                      <span className={isFound ? 'text-foreground' : 'text-muted-foreground'}>
                        {doc.name}
                      </span>
                    </div>
                  );
                })}
                <div className="pt-1">
                  <Progress value={percent} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {item.foundCount} von {item.totalCount} vorhanden
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
