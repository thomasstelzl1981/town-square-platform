import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Lock, Unlock, Download, Shield, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

interface TileRow {
  id: string;
  tile_code: string;
  title: string;
  main_tile_route: string;
  freeze_enabled: boolean;
  frozen_at: string | null;
  frozen_by: string | null;
  freeze_reason: string | null;
}

interface ModuleFreezePanelProps {
  tiles: TileRow[];
  onRefresh: () => void;
}

export function ModuleFreezePanel({ tiles, onRefresh }: ModuleFreezePanelProps) {
  const { user } = useAuth();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [toggling, setToggling] = useState<string | null>(null);

  const frozenCount = tiles.filter(t => t.freeze_enabled).length;

  async function toggleFreeze(tile: TileRow) {
    const newState = !tile.freeze_enabled;
    setToggling(tile.tile_code);
    try {
      const { error } = await supabase
        .from('tile_catalog')
        .update({
          freeze_enabled: newState,
          frozen_at: newState ? new Date().toISOString() : null,
          frozen_by: newState ? user?.id : null,
          freeze_reason: newState ? (reasons[tile.tile_code] || null) : null,
        })
        .eq('tile_code', tile.tile_code);

      if (error) throw error;

      // Ledger event
      await supabase.rpc('log_data_event', {
        p_tenant_id: null,
        p_zone: 'Z1',
        p_event_type: newState ? 'module.freeze.enabled' : 'module.freeze.disabled',
        p_direction: 'mutate',
        p_source: 'admin_ui',
        p_entity_type: 'tile_catalog',
        p_entity_id: tile.id,
        p_payload: {
          module_code: tile.tile_code,
          new_state: newState,
          reason: reasons[tile.tile_code] || null,
          actor_user_id: user?.id,
        },
      });

      toast.success(`${tile.title} ${newState ? 'eingefroren' : 'freigegeben'}`);
      setReasons(prev => ({ ...prev, [tile.tile_code]: '' }));
      onRefresh();
    } catch (err) {
      console.error('Freeze toggle error:', err);
      toast.error(err instanceof Error ? err.message : 'Fehler beim Umschalten');
    } finally {
      setToggling(null);
    }
  }

  async function bulkFreeze(freeze: boolean) {
    try {
      const { error } = await supabase
        .from('tile_catalog')
        .update({
          freeze_enabled: freeze,
          frozen_at: freeze ? new Date().toISOString() : null,
          frozen_by: freeze ? user?.id : null,
          freeze_reason: freeze ? 'Bulk freeze' : null,
        })
        .neq('tile_code', '__never__'); // update all

      if (error) throw error;

      // Log one aggregate event
      await supabase.rpc('log_data_event', {
        p_tenant_id: null,
        p_zone: 'Z1',
        p_event_type: freeze ? 'module.freeze.enabled' : 'module.freeze.disabled',
        p_direction: 'mutate',
        p_source: 'admin_ui',
        p_entity_type: 'tile_catalog',
        p_entity_id: null,
        p_payload: {
          module_code: 'ALL',
          new_state: freeze,
          reason: 'Bulk action',
          actor_user_id: user?.id,
        },
      });

      toast.success(freeze ? 'Alle Module eingefroren' : 'Alle Module freigegeben');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler');
    }
  }

  function exportFreezeConfig() {
    const config = {
      version: '1.0',
      updated_at: new Date().toISOString(),
      modules: Object.fromEntries(
        tiles.map(t => [t.tile_code, {
          frozen: t.freeze_enabled,
          frozen_at: t.frozen_at,
          reason: t.freeze_reason,
        }])
      ),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modules_freeze.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Freeze-Config exportiert');
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Module Freeze
              </CardTitle>
              <CardDescription>
                Code-Änderungen an eingefrorenen Modulen sind gesperrt. Runtime & Daten bleiben unberührt.
              </CardDescription>
            </div>
            <Badge variant={frozenCount > 0 ? 'destructive' : 'secondary'} className="text-sm">
              {frozenCount} / {tiles.length} eingefroren
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Lock className="h-4 w-4 mr-2" />
                  Alle einfrieren
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Alle Module einfrieren?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Code-Änderungen an allen 21 Modulen werden blockiert. Runtime bleibt unberührt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={() => bulkFreeze(true)}>
                    Alle einfrieren
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Unlock className="h-4 w-4 mr-2" />
                  Alle freigeben
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Alle Module freigeben?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Code-Änderungen an allen Modulen werden wieder erlaubt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={() => bulkFreeze(false)}>
                    Alle freigeben
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" size="sm" onClick={exportFreezeConfig}>
              <Download className="h-4 w-4 mr-2" />
              Export Freeze Config
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Modul</TableHead>
                <TableHead>Titel</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="w-48">Grund</TableHead>
                <TableHead className="w-36">Eingefroren am</TableHead>
                <TableHead className="w-20 text-center">Freeze</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiles.map(tile => (
                <TableRow key={tile.id} className={tile.freeze_enabled ? 'bg-destructive/5' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tile.freeze_enabled ? (
                        <Lock className="h-4 w-4 text-destructive" />
                      ) : (
                        <ShieldOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <code className="text-xs">{tile.tile_code}</code>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{tile.title}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{tile.main_tile_route}</code>
                  </TableCell>
                  <TableCell>
                    {tile.freeze_enabled ? (
                      <span className="text-xs text-muted-foreground">{tile.freeze_reason || '—'}</span>
                    ) : (
                      <Input
                        placeholder="Grund (optional)"
                        className="h-7 text-xs"
                        value={reasons[tile.tile_code] || ''}
                        onChange={e => setReasons(prev => ({ ...prev, [tile.tile_code]: e.target.value }))}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tile.frozen_at
                      ? new Date(tile.frozen_at).toLocaleDateString('de-DE', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={tile.freeze_enabled}
                      disabled={toggling === tile.tile_code}
                      onCheckedChange={() => toggleFreeze(tile)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
