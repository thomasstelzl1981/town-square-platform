/**
 * AdminLandingPages — Zone 1 Landing Page Management
 * Overview table with status, countdown, quick actions
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ExternalLink, Eye, Lock, Unlock, Loader2 } from 'lucide-react';
import { useLandingPages, useToggleLandingPageLock, type LandingPage } from '@/hooks/useLandingPage';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Entwurf', variant: 'outline' },
  preview: { label: 'Vorschau', variant: 'secondary' },
  active: { label: 'Aktiv', variant: 'default' },
  locked: { label: 'Gesperrt', variant: 'destructive' },
};

function getTimeRemaining(expiresAt: string | null): string {
  if (!expiresAt) return '–';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Abgelaufen';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}min`;
}

export default function AdminLandingPages() {
  const { data: pages, isLoading } = useLandingPages();
  const toggleLock = useToggleLandingPageLock();

  const handleToggleLock = (page: LandingPage) => {
    const shouldLock = page.status !== 'locked';
    toggleLock.mutate({ id: page.id, lock: shouldLock });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Landing Pages</h1>
        <p className="text-muted-foreground">Verwaltung aller Projekt-Websites</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Alle Landing Pages ({pages?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !pages?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Noch keine Landing Pages erstellt.
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Slug</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Läuft ab in</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Erstellt</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pages.map((page) => {
                    const statusConfig = STATUS_MAP[page.status] || STATUS_MAP.draft;
                    const isLocked = page.status === 'locked';

                    return (
                      <tr key={page.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">{page.slug}.kaufy.app</td>
                        <td className="px-4 py-3">
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {page.status === 'preview' ? getTimeRemaining(page.preview_expires_at) : '–'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(page.created_at).toLocaleDateString('de-DE')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/projekt/${page.slug}`, '_blank')}
                              className="gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Öffnen
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleLock(page)}
                              disabled={toggleLock.isPending}
                              className="gap-1"
                            >
                              {toggleLock.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : isLocked ? (
                                <Unlock className="h-3 w-3" />
                              ) : (
                                <Lock className="h-3 w-3" />
                              )}
                              {isLocked ? 'Entsperren' : 'Sperren'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
