import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, ShieldOff, Shield, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import SSOT files
import freezeConfig from '../../../spec/current/00_frozen/modules_freeze.json';
import zone2Modules from '../../../artifacts/audit/zone2_modules.json';

interface FreezeEntry {
  frozen: boolean;
  frozen_at?: string;
  reason?: string;
}

interface ModuleInfo {
  code: string;
  name: string;
  base: string;
  tile_count: number;
}

export function ModuleFreezePanel() {
  const modules: ModuleInfo[] = zone2Modules.modules.map(m => ({
    code: m.code,
    name: m.name,
    base: m.base,
    tile_count: m.tile_count,
  }));

  const freezeMap = freezeConfig.modules as Record<string, FreezeEntry>;
  const frozenCount = modules.filter(m => freezeMap[m.code]?.frozen).length;

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>SSOT: <code>spec/current/00_frozen/modules_freeze.json</code></strong><br />
          Freeze-Status wird ausschließlich über die JSON-Datei gesteuert. 
          Änderungen per Chat-Befehl: <code>"Freeze MOD-XX"</code> oder <code>"UNFREEZE MOD-XX"</code>.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Module Freeze
              </CardTitle>
              <CardDescription>
                Code-Änderungen an eingefrorenen Modulen sind gesperrt. Runtime &amp; Daten bleiben unberührt.
              </CardDescription>
            </div>
            <Badge variant={frozenCount > 0 ? 'destructive' : 'secondary'} className="text-sm">
              {frozenCount} / {modules.length} eingefroren
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-3">
            Stand: {new Date(freezeConfig.updated_at).toLocaleDateString('de-DE', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Modul</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Route-Base</TableHead>
                <TableHead className="w-16 text-center">Tiles</TableHead>
                <TableHead className="w-48">Grund</TableHead>
                <TableHead className="w-36">Eingefroren am</TableHead>
                <TableHead className="w-24 text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map(mod => {
                const entry = freezeMap[mod.code];
                const isFrozen = entry?.frozen ?? false;
                return (
                  <TableRow key={mod.code} className={isFrozen ? 'bg-destructive/5' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isFrozen ? (
                          <Lock className="h-4 w-4 text-destructive" />
                        ) : (
                          <ShieldOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <code className="text-xs">{mod.code}</code>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{mod.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">/portal/{mod.base}</code>
                    </TableCell>
                    <TableCell className="text-center text-xs">{mod.tile_count}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {isFrozen ? (entry?.reason || '—') : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry?.frozen_at
                        ? new Date(entry.frozen_at).toLocaleDateString('de-DE', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      {isFrozen ? (
                        <Badge variant="destructive" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Frozen
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                          <ShieldOff className="h-3 w-3 mr-1" />
                          Offen
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
