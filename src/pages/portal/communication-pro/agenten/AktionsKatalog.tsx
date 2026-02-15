/**
 * Aktions-Katalog — Card-Grid aller Armstrong-Aktionen
 * Datenquelle: armstrongManifest.ts (statisch) + armstrong_action_overrides (DB)
 */
import { useState, useMemo } from 'react';
import { DESIGN } from '@/config/designManifest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Zap, Shield, Eye, AlertTriangle } from 'lucide-react';
import { useArmstrongActions } from '@/hooks/useArmstrongActions';

const EXECUTION_MODE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof Zap }> = {
  execute: { label: 'Sofort', variant: 'default', icon: Zap },
  execute_with_confirmation: { label: 'Mit Bestätigung', variant: 'secondary', icon: Shield },
  readonly: { label: 'Nur lesen', variant: 'outline', icon: Eye },
  draft_only: { label: 'Entwurf', variant: 'outline', icon: AlertTriangle },
};

const ZONE_LABELS: Record<string, string> = {
  Z1: 'Admin',
  Z2: 'Portal',
  Z3: 'Website',
};

export function AktionsKatalog() {
  const { actions, stats, isLoading } = useArmstrongActions();
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return actions.filter(action => {
      const matchesSearch = !search || 
        action.action_code.toLowerCase().includes(search.toLowerCase()) ||
        action.title_de.toLowerCase().includes(search.toLowerCase()) ||
        action.description_de.toLowerCase().includes(search.toLowerCase());
      
      const matchesZone = zoneFilter === 'all' || action.zones.includes(zoneFilter as any);
      const matchesStatus = statusFilter === 'all' || action.effective_status === statusFilter;
      
      return matchesSearch && matchesZone && matchesStatus;
    });
  }, [actions, search, zoneFilter, statusFilter]);

  const totalActions = stats.total;
  const activeActions = stats.active;

  return (
    <div className="space-y-4">
      {/* KPI Summary */}
      <div className={DESIGN.KPI_GRID.FULL}>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{totalActions}</p>
            <p className="text-xs text-muted-foreground">Aktionen gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{activeActions}</p>
            <p className="text-xs text-muted-foreground">Aktiv</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-500">{stats.restricted}</p>
            <p className="text-xs text-muted-foreground">Eingeschränkt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.disabled}</p>
            <p className="text-xs text-muted-foreground">Deaktiviert</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Aktion suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={zoneFilter} onValueChange={setZoneFilter}>
          <SelectTrigger className="w-[120px] h-8 text-sm">
            <SelectValue placeholder="Zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Zonen</SelectItem>
            <SelectItem value="Z2">Portal (Z2)</SelectItem>
            <SelectItem value="Z3">Website (Z3)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="restricted">Eingeschränkt</SelectItem>
            <SelectItem value="disabled">Deaktiviert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Action Cards */}
      <div className={DESIGN.WIDGET_GRID.FULL}>
        {filtered.map(action => {
          const mode = EXECUTION_MODE_LABELS[action.execution_mode] || EXECUTION_MODE_LABELS.readonly;
          const ModeIcon = mode.icon;
          
          return (
            <Card key={action.action_code} className={`hover:border-primary/30 transition-colors ${action.effective_status === 'disabled' ? 'opacity-50' : ''}`}>
              <CardHeader className="p-3 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium leading-tight">
                    {action.title_de}
                  </CardTitle>
                  <Badge 
                    variant={action.effective_status === 'active' ? 'default' : action.effective_status === 'restricted' ? 'secondary' : 'outline'} 
                    className="text-[10px] shrink-0"
                  >
                    {action.effective_status === 'active' ? 'Aktiv' : action.effective_status === 'restricted' ? 'Eingeschränkt' : 'Deaktiviert'}
                  </Badge>
                </div>
                <code className="text-[10px] text-muted-foreground font-mono">
                  {action.action_code}
                </code>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {action.description_de}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant={mode.variant} className="text-[10px] gap-0.5">
                    <ModeIcon className="h-2.5 w-2.5" />
                    {mode.label}
                  </Badge>
                  {action.zones.map(z => (
                    <Badge key={z} variant="outline" className="text-[10px]">
                      {ZONE_LABELS[z] || z}
                    </Badge>
                  ))}
                  {action.module && (
                    <Badge variant="outline" className="text-[10px]">
                      {action.module}
                    </Badge>
                  )}
                  {action.cost_model !== 'free' && (
                    <Badge variant="destructive" className="text-[10px]">
                      💰 {action.cost_model}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Keine Aktionen gefunden.
        </div>
      )}
    </div>
  );
}
