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

/** Mapping von internen MOD-XX Codes auf lesbare Modulnamen */
const MODULE_DISPLAY_NAMES: Record<string, string> = {
  'MOD-00': 'Dashboard',
  'MOD-01': 'Stammdaten',
  'MOD-02': 'Office',
  'MOD-03': 'DMS',
  'MOD-04': 'Immobilien',
  'MOD-05': 'MSV',
  'MOD-06': 'Verkauf',
  'MOD-07': 'Finanzierung',
  'MOD-08': 'Investments',
  'MOD-09': 'Vertriebspartner',
  'MOD-10': 'Leads',
  'MOD-11': 'Finanzierungsmanager',
  'MOD-12': 'Akquise',
  'MOD-13': 'Projekte',
  'MOD-14': 'Communication Pro',
  'MOD-15': 'Fortbildung',
  'MOD-16': 'Services',
  'MOD-17': 'Cars',
  'MOD-18': 'Finanzanalyse',
  'MOD-19': 'Photovoltaik',
  'MOD-20': 'Miety',
  'MOD-22': 'Pet Manager',
};

function centsToCredits(cents: number | null | undefined): string {
  if (!cents) return '—';
  const credits = cents / 25;
  if (credits < 1) return '< 1 Cr';
  return `${credits} Cr`;
}

export function AktionsKatalog() {
  const { actions, isLoading } = useArmstrongActions();
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return actions.filter(action => {
      const matchesSearch = !search || 
        action.action_code.toLowerCase().includes(search.toLowerCase()) ||
        action.title_de.toLowerCase().includes(search.toLowerCase()) ||
        action.description_de.toLowerCase().includes(search.toLowerCase());
      
      const matchesZone = zoneFilter === 'all' ||
        (zoneFilter === 'Z2_only' && action.zones.length === 1 && action.zones[0] === 'Z2') ||
        (zoneFilter === 'Z3_only' && action.zones.length === 1 && action.zones[0] === 'Z3') ||
        (zoneFilter === 'Z2_Z3' && action.zones.includes('Z2') && action.zones.includes('Z3'));
      const matchesStatus = statusFilter === 'all' || action.effective_status === statusFilter;
      
      return matchesSearch && matchesZone && matchesStatus;
    });
  }, [actions, search, zoneFilter, statusFilter]);

  return (
    <div className="space-y-4">
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
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue placeholder="Bereich" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Bereiche</SelectItem>
            <SelectItem value="Z2_only">Nur Portal</SelectItem>
            <SelectItem value="Z3_only">Nur Website</SelectItem>
            <SelectItem value="Z2_Z3">Portal + Website</SelectItem>
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
          const moduleName = action.module ? MODULE_DISPLAY_NAMES[action.module] : null;
          
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
                    <Badge key={z} variant="outline" className={`text-[10px] ${z === 'Z2' ? 'border-primary/50 text-primary' : z === 'Z3' ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400' : ''}`}>
                      {ZONE_LABELS[z] || z}
                    </Badge>
                  ))}
                  {moduleName && (
                    <Badge variant="outline" className="text-[10px]">
                      {moduleName}
                    </Badge>
                  )}
                  {action.cost_model === 'free' ? (
                    <Badge variant="secondary" className="text-[10px]">Frei</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {centsToCredits(action.cost_hint_cents)}
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
