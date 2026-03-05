/**
 * OrgModulesTab — Active module tiles
 * R-19 sub-component
 */
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

interface TileActivation {
  tile_code: string;
  tile_name: string;
  status: string;
  activated_at: string;
}

interface Props {
  tileActivations: TileActivation[];
  activeModuleCount: number;
}

export function OrgModulesTab({ tileActivations, activeModuleCount }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle>Aktive Module</CardTitle><CardDescription>{activeModuleCount} von {tileActivations.length} Modulen aktiv</CardDescription></div>
          <Button variant="outline" size="sm" asChild><Link to="/admin/tiles"><ExternalLink className="h-4 w-4 mr-2" />Modul-Katalog</Link></Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">Module werden automatisch über Rollen zugewiesen (sync_tiles_for_user). Änderungen erfolgen über den Modul-Katalog.</p>
        {tileActivations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Keine Module aktiviert</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tileActivations.map(t => (
              <div key={t.tile_code} className={`flex items-center gap-2 p-2.5 rounded-lg border ${t.status === 'active' ? 'bg-muted/30' : 'opacity-50'}`}>
                {t.status === 'active' ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                <div className="min-w-0"><p className="text-sm font-medium truncate">{t.tile_name}</p><p className="text-xs text-muted-foreground">{t.tile_code}</p></div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
