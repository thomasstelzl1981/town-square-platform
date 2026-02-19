/**
 * Tab 5: TermsGate Bundles
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, CheckCircle2 } from 'lucide-react';
import { LoadingState } from '@/components/shared';
import { useComplianceBundles } from './useComplianceBundles';
import { useComplianceDocuments } from './useComplianceDocuments';

export function ComplianceBundles() {
  const { bundles, bundleItems, isLoading, activateBundle } = useComplianceBundles();
  const { documents } = useComplianceDocuments();

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-4 mt-4">
      {bundles.map(bundle => {
        const items = bundleItems.filter(i => i.bundle_id === bundle.id);
        return (
          <Card key={bundle.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-4 w-4" />
                  {bundle.title}
                  <Badge variant="outline" className="font-mono text-xs">{bundle.bundle_key}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={bundle.status === 'active' ? 'default' : 'secondary'}>{bundle.status}</Badge>
                  {bundle.status !== 'active' && (
                    <Button size="sm" onClick={() => activateBundle.mutate(bundle.id)}>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Aktivieren
                    </Button>
                  )}
                </div>
              </div>
              {bundle.description && <p className="text-sm text-muted-foreground">{bundle.description}</p>}
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="space-y-2">
                  {items.map(item => {
                    const doc = documents.find(d => d.id === item.document_id);
                    return (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">#{item.sort_order}</span>
                          <span>{doc?.title || 'Unbekannt'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.required && <Badge variant="outline" className="text-xs">Pflicht</Badge>}
                          <span className="text-xs text-muted-foreground">min. v{item.required_version || '—'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Keine Dokumente zugeordnet.</p>
              )}
            </CardContent>
          </Card>
        );
      })}
      {bundles.length === 0 && (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Keine Bundles vorhanden.</CardContent></Card>
      )}
    </div>
  );
}
