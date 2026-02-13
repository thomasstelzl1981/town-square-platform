/**
 * VersionHistory — Shows published website versions with rollback
 */
import { useVersionHistory } from '@/hooks/useVersionHistory';
import { TYPOGRAPHY, CARD } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { History, RotateCcw, ExternalLink } from 'lucide-react';

interface Props {
  websiteId: string;
  websiteSlug?: string;
}

export default function VersionHistory({ websiteId, websiteSlug }: Props) {
  const { data: versions, isLoading, rollback } = useVersionHistory(websiteId);

  if (isLoading) return <p className={TYPOGRAPHY.MUTED}>Laden...</p>;
  if (!versions?.length) {
    return (
      <div className={cn(CARD.CONTENT, 'text-center py-8')}>
        <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className={TYPOGRAPHY.MUTED}>Noch keine Versionen veröffentlicht.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className={TYPOGRAPHY.CARD_TITLE}>Versionshistorie</h3>
      <div className="space-y-2">
        {versions.map((v: any, idx: number) => (
          <div key={v.id} className={cn(CARD.CONTENT, 'flex items-center justify-between gap-3')}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">v{v.version_number}</span>
                {idx === 0 && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                    Aktuell
                  </span>
                )}
              </div>
              <p className={cn(TYPOGRAPHY.HINT, 'truncate')}>
                {new Date(v.published_at || v.created_at).toLocaleString('de-DE', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {websiteSlug && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`/website/sites/${websiteSlug}`, '_blank')}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
              {idx > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => rollback.mutate(v.id)}
                  disabled={rollback.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Rollback
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
