import { Link2, Download, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

function getMetaField(meta: Json | null, field: string): string | null {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
  const val = (meta as Record<string, unknown>)[field];
  return typeof val === 'string' ? val : null;
}

function getMetaNumber(meta: Json | null, field: string): number | null {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
  const val = (meta as Record<string, unknown>)[field];
  return typeof val === 'number' ? val : null;
}

const KiBrowserQuellen = () => {
  const { data: artifacts, isLoading } = useQuery({
    queryKey: ['ki-browser-artifacts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('ki_browser_artifacts')
        .select('id, artifact_type, content_hash, meta_json, storage_ref, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quellen & Belege</h1>
          <p className="text-muted-foreground mt-1">
            Automatisch generierte Zitatliste mit URL, Timestamp und Content-Hash.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            PDF Export
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Markdown
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Zitatliste
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Laden...
            </div>
          ) : !artifacts?.length ? (
            <p className="text-sm text-muted-foreground">
              Keine Quellen vorhanden. Führen Sie eine Browser-Session durch, um Quellen zu sammeln.
            </p>
          ) : (
            <div className="space-y-2">
              {artifacts.map((a, i) => {
                const title = getMetaField(a.meta_json, 'title');
                const url = getMetaField(a.meta_json, 'url');
                const byteSize = getMetaNumber(a.meta_json, 'byte_size');
                return (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50 text-sm">
                    <span className="text-muted-foreground font-mono w-6 text-right shrink-0">[{i + 1}]</span>
                    <Badge variant="outline" className="text-xs shrink-0">{a.artifact_type}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-foreground">{title || url || 'Ohne Titel'}</p>
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          {url}
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0 text-right">
                      <div>{new Date(a.created_at).toLocaleString('de-DE')}</div>
                      {byteSize && <div>{(byteSize / 1024).toFixed(1)} KB</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default KiBrowserQuellen;
