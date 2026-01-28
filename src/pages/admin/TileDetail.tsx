import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Code2, 
  Globe, 
  Server, 
  GitBranch, 
  Clock, 
  ExternalLink,
  FileCode,
  Workflow,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MermaidDiagram } from '@/components/presentation/MermaidDiagram';

interface SubTile {
  title: string;
  route: string;
  icon_key?: string;
}

interface InternalApi {
  id: string;
  endpoint: string;
  method: string;
  purpose: string;
  auth_roles: string[];
  lifecycle_status: string;
}

interface ExternalApi {
  id: string;
  provider: string;
  endpoint: string;
  purpose: string;
  auth_method: string;
  lifecycle_status: string;
}

interface ChangelogEntry {
  id: string;
  changed_at: string;
  change_note: string;
  changed_by: string;
}

export default function TileDetail() {
  const { tileCode } = useParams<{ tileCode: string }>();
  const navigate = useNavigate();

  // Fetch tile data
  const { data: tile, isLoading: tileLoading } = useQuery({
    queryKey: ['tile-detail', tileCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tile_catalog')
        .select('*')
        .eq('tile_code', tileCode)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!tileCode
  });

  // Fetch internal APIs
  const { data: internalApis = [] } = useQuery({
    queryKey: ['tile-internal-apis', tileCode],
    queryFn: async () => {
      const { data } = await supabase
        .from('tile_api_internal')
        .select('*')
        .eq('tile_code', tileCode)
        .order('endpoint');
      return (data || []) as InternalApi[];
    },
    enabled: !!tileCode
  });

  // Fetch external APIs
  const { data: externalApis = [] } = useQuery({
    queryKey: ['tile-external-apis', tileCode],
    queryFn: async () => {
      const { data } = await supabase
        .from('tile_api_external')
        .select('*')
        .eq('tile_code', tileCode)
        .order('provider');
      return (data || []) as ExternalApi[];
    },
    enabled: !!tileCode
  });

  // Fetch changelog
  const { data: changelog = [] } = useQuery({
    queryKey: ['tile-changelog', tileCode],
    queryFn: async () => {
      const { data } = await supabase
        .from('tile_changelog')
        .select('*')
        .eq('tile_code', tileCode)
        .order('changed_at', { ascending: false })
        .limit(10);
      return (data || []) as ChangelogEntry[];
    },
    enabled: !!tileCode
  });

  if (tileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!tile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Modul nicht gefunden: {tileCode}</p>
        <Button variant="outline" onClick={() => navigate('/admin/tiles')}>
          Zurück zum Katalog
        </Button>
      </div>
    );
  }

  const subTiles = (tile.sub_tiles as unknown as SubTile[]) || [];
  const flowchartMermaid = (tile as any).flowchart_mermaid || null;

  return (
    <div className="space-y-6">
      {/* Header - Block A */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/tiles')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{tile.title}</h1>
              <Badge variant={tile.is_active ? 'default' : 'secondary'}>
                {tile.is_active ? 'AKTIV' : 'INAKTIV'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{tile.tile_code}</span>
              <span>•</span>
              <span>Zone 2</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(tile.updated_at).toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>
        </div>
        <Link to={tile.main_tile_route} target="_blank">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Modul öffnen
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Block B - Beschreibung */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Modulbeschreibung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Beschreibung</h4>
                <p>{tile.description || 'Keine Beschreibung vorhanden'}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Hauptroute</h4>
                <code className="text-sm bg-muted px-3 py-1.5 rounded">{tile.main_tile_route}</code>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Sub-Tiles ({subTiles.length})</h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {subTiles.length > 0 ? subTiles.map((st, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="font-medium text-sm">{st.title}</span>
                      <code className="text-xs text-muted-foreground">{st.route}</code>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground col-span-2">Keine Sub-Tiles definiert</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Block C - Interne APIs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Interne APIs
              </CardTitle>
              <CardDescription>
                Edge Functions, DB-Tabellen und interne Endpunkte
              </CardDescription>
            </CardHeader>
            <CardContent>
              {internalApis.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Endpoint</th>
                        <th className="text-left py-2 px-2">Methode</th>
                        <th className="text-left py-2 px-2">Zweck</th>
                        <th className="text-left py-2 px-2">Auth</th>
                        <th className="text-center py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {internalApis.map(api => (
                        <tr key={api.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2 font-mono text-xs">{api.endpoint}</td>
                          <td className="py-2 px-2">
                            <Badge variant="outline">{api.method}</Badge>
                          </td>
                          <td className="py-2 px-2">{api.purpose}</td>
                          <td className="py-2 px-2 text-xs">{api.auth_roles?.join(', ') || '—'}</td>
                          <td className="py-2 px-2 text-center">
                            {api.lifecycle_status === 'active' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-500 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Keine internen APIs dokumentiert</p>
                  <p className="text-xs mt-1">Füge API-Einträge in tile_api_internal hinzu</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Block D - Externe APIs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Externe APIs
              </CardTitle>
              <CardDescription>
                Drittanbieter-Integrationen (Banking, Portale, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {externalApis.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Provider</th>
                        <th className="text-left py-2 px-2">Endpoint</th>
                        <th className="text-left py-2 px-2">Zweck</th>
                        <th className="text-left py-2 px-2">Auth</th>
                        <th className="text-center py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {externalApis.map(api => (
                        <tr key={api.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2 font-medium">{api.provider}</td>
                          <td className="py-2 px-2 font-mono text-xs">{api.endpoint || '—'}</td>
                          <td className="py-2 px-2">{api.purpose}</td>
                          <td className="py-2 px-2 text-xs">{api.auth_method || '—'}</td>
                          <td className="py-2 px-2 text-center">
                            {api.lifecycle_status === 'active' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-500 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Keine externen APIs dokumentiert</p>
                  <p className="text-xs mt-1">Füge API-Einträge in tile_api_external hinzu</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Block E - Flowchart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Workflow className="h-5 w-5" />
                Flowchart
              </CardTitle>
              <CardDescription>
                Datenfluss und Prozessübersicht
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flowchartMermaid ? (
                <div className="bg-muted/30 rounded-lg p-4">
                  <MermaidDiagram chart={flowchartMermaid} />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Workflow className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Kein Flowchart vorhanden</p>
                  <p className="text-xs mt-1">Ergänze flowchart_mermaid in tile_catalog</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tile Code</span>
                <span className="font-mono">{tile.tile_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Icon</span>
                <span className="font-mono">{tile.icon_key}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Display Order</span>
                <span>{tile.display_order}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Erstellt</span>
                <span>{new Date(tile.created_at).toLocaleDateString('de-DE')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aktualisiert</span>
                <span>{new Date(tile.updated_at).toLocaleDateString('de-DE')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Block F - Changelog */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="h-4 w-4" />
                Changelog
              </CardTitle>
            </CardHeader>
            <CardContent>
              {changelog.length > 0 ? (
                <div className="space-y-3">
                  {changelog.map(entry => (
                    <div key={entry.id} className="text-sm border-l-2 border-muted pl-3">
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.changed_at).toLocaleDateString('de-DE')}
                      </p>
                      <p>{entry.change_note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">Kein Changelog vorhanden</p>
                  <p className="text-xs mt-1">Änderungen werden in tile_changelog erfasst</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dokumentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Interne APIs</span>
                <Badge variant={internalApis.length > 0 ? 'default' : 'secondary'}>
                  {internalApis.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Externe APIs</span>
                <Badge variant={externalApis.length > 0 ? 'default' : 'secondary'}>
                  {externalApis.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Flowchart</span>
                <Badge variant={flowchartMermaid ? 'default' : 'secondary'}>
                  {flowchartMermaid ? '✓' : '—'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Changelog</span>
                <Badge variant={changelog.length > 0 ? 'default' : 'secondary'}>
                  {changelog.length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}