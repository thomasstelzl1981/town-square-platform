/**
 * AutomationPanel — Toggle für Discovery Scheduler + Status + letzte Läufe
 */
import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DESIGN } from '@/config/designManifest';
import { useSchedulerStatus, useSchedulerToggle } from '@/hooks/useSchedulerControl';
import { DAILY_TARGET, DISCOVERY_COST_LIMITS, CREDIT_VALUE_EUR } from '@/engines/marketDirectory/spec';
import {
  Zap, Clock, Target, Coins, MapPin, Loader2, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export const AutomationPanel = memo(function AutomationPanel() {
  const { data, isLoading } = useSchedulerStatus();
  const toggle = useSchedulerToggle();

  const settings = data?.settings;
  const isActive = settings?.active ?? false;

  const handleToggle = (checked: boolean) => {
    toggle.mutate(
      { action: checked ? 'activate' : 'deactivate' },
      {
        onSuccess: () => toast.success(checked ? 'Automatisierung aktiviert' : 'Automatisierung deaktiviert'),
        onError: (e) => toast.error(e.message || 'Fehler beim Umschalten'),
      },
    );
  };

  return (
    <Card className={DESIGN.CARD.SECTION}>
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <h3 className={DESIGN.TYPOGRAPHY.SECTION_TITLE}>Automatisierung</h3>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={isActive
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-muted text-muted-foreground'
          }>
            {isActive ? 'AKTIV' : 'INAKTIV'}
          </Badge>
          <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={toggle.isPending || isLoading}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" /> Lade Status...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Config Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Zeitplan:</span>
              <span className="font-medium">{settings?.cron_schedule || '06:00 UTC'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Ziel:</span>
              <span className="font-medium">{settings?.target_per_day || DAILY_TARGET.approvedTarget}/Tag</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Coins className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-medium">max {settings?.max_credits_per_day || DISCOVERY_COST_LIMITS.maxCreditsPerDay} Cr ({((settings?.max_credits_per_day || DISCOVERY_COST_LIMITS.maxCreditsPerDay) * CREDIT_VALUE_EUR).toFixed(0)} €)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Split:</span>
              <span className="font-medium">{(DAILY_TARGET.topRegionsPct * 100).toFixed(0)}% Top / {(DAILY_TARGET.explorationPct * 100).toFixed(0)}% Exploration</span>
            </div>
          </div>

          {/* Today's cost */}
          {data && (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border/30">
              <div className="text-sm">
                <span className="text-muted-foreground">Kosten heute: </span>
                <span className="font-bold text-foreground">{(data.todayCost || 0).toFixed(2)} € ({data.todayCredits || 0} Credits)</span>
              </div>
              {data.todayCredits > (settings?.max_credits_per_day || 200) * 0.75 && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Budget &gt;75%
                </Badge>
              )}
            </div>
          )}

          {/* Recent Runs */}
          {data?.recentRuns && data.recentRuns.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Letzte Läufe</span>
              <div className="space-y-1.5">
                {data.recentRuns.map((run: any) => (
                  <div key={run.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/20 border border-border/20">
                    <span className="text-muted-foreground">{new Date(run.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{run.region_name || '—'} · {run.category_code || '—'}</span>
                    <span className="font-medium">{run.raw_found || 0} gefunden</span>
                    <span>{run.approved_count || 0} approved</span>
                    <span className="text-muted-foreground">{(run.cost_eur || 0).toFixed(2)} €</span>
                    {run.error_message && (
                      <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">Fehler</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
});
