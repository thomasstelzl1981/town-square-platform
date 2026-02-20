/**
 * DemoDatenTab — Golden Path Interaction Standard Management
 * 
 * Zeigt alle registrierten Prozesse mit Toggle-Steuerung.
 * Gemäß Design Manifest V4.0: PageShell + ModulePageHeader + TABLE Standards.
 */

import { GOLDEN_PATH_PROCESSES } from '@/manifests/goldenPathProcesses';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { TABLE, CARD, TYPOGRAPHY, INFO_BANNER } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

function ComplianceBadge({ compliance }: { compliance: import('@/manifests/goldenPathProcesses').GoldenPathCompliance }) {
  const values = Object.values(compliance);
  const total = values.length;
  const passed = values.filter(Boolean).length;

  if (passed === total) {
    return (
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Konform
      </Badge>
    );
  }
  if (passed >= total - 2) {
    return (
      <Badge variant="outline" className="bg-accent/50 text-accent-foreground border-accent gap-1">
        <AlertTriangle className="h-3 w-3" />
        Teilweise
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
      <XCircle className="h-3 w-3" />
      Offen
    </Badge>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  if (phase === 'done') {
    return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Fertig</Badge>;
  }
  return <Badge variant="outline" className="text-muted-foreground">Phase {phase}</Badge>;
}

export function DemoDatenTab() {
  const { isEnabled, toggle, toggleAll, allEnabled, isSeedingOrCleaning, pendingAction } = useDemoToggles();

  return (
    <PageShell>
      <ModulePageHeader
        title="Golden Path Interaction Standard"
        description="Demo-Daten für alle Prozessmodule aktivieren oder deaktivieren. Jeder Prozess folgt dem einheitlichen Layout gemäß Design Manifest V4.0."
      />

      {/* Global Toggle */}
      <div className={cn(INFO_BANNER.BASE, INFO_BANNER.PREMIUM, 'flex items-center justify-between')}>
        <div>
          <p className={TYPOGRAPHY.CARD_TITLE}>Alle Demo-Daten</p>
          <p className={TYPOGRAPHY.HINT}>
            {isSeedingOrCleaning 
              ? (pendingAction === 'seeding' ? 'Demo-Daten werden eingespielt…' : 'Demo-Daten werden entfernt…')
              : 'Globaler Toggle für alle Prozesse gleichzeitig'
            }
          </p>
        </div>
        <Switch
          checked={allEnabled}
          disabled={isSeedingOrCleaning}
          onCheckedChange={(checked) => toggleAll(checked)}
        />
      </div>

      {/* Process Table */}
      <div className={TABLE.WRAPPER}>
        <table className="w-full">
          <thead>
            <tr className={TABLE.HEADER_BG}>
              <th className={cn(TABLE.HEADER_CELL, 'text-left')}>Prozess</th>
              <th className={cn(TABLE.HEADER_CELL, 'text-left hidden md:table-cell')}>Modul</th>
              <th className={cn(TABLE.HEADER_CELL, 'text-center hidden md:table-cell')}>MP</th>
              <th className={cn(TABLE.HEADER_CELL, 'text-center hidden lg:table-cell')}>Compliance</th>
              <th className={cn(TABLE.HEADER_CELL, 'text-center hidden lg:table-cell')}>Phase</th>
              <th className={cn(TABLE.HEADER_CELL, 'text-right')}>Demo</th>
            </tr>
          </thead>
          <tbody>
            {GOLDEN_PATH_PROCESSES.map((process) => (
              <tr key={process.id} className={cn(TABLE.ROW_BORDER, TABLE.ROW_HOVER)}>
                <td className={TABLE.BODY_CELL}>
                  <div>
                    <span className={TYPOGRAPHY.CARD_TITLE}>{process.processName}</span>
                    <p className={cn(TYPOGRAPHY.HINT, 'mt-0.5 hidden md:block')}>{process.description}</p>
                    {/* Mobile: show module inline */}
                    <p className={cn(TYPOGRAPHY.HINT, 'mt-0.5 md:hidden')}>{process.moduleCode} · {process.menuPoints} MP</p>
                  </div>
                </td>
                <td className={cn(TABLE.BODY_CELL, 'hidden md:table-cell')}>
                  <span className={TYPOGRAPHY.BODY}>{process.moduleCode}</span>
                  <p className={TYPOGRAPHY.HINT}>{process.moduleName}</p>
                </td>
                <td className={cn(TABLE.BODY_CELL, 'text-center hidden md:table-cell')}>
                  <Badge variant="outline" className="text-xs">
                    {process.menuPoints}
                  </Badge>
                </td>
                <td className={cn(TABLE.BODY_CELL, 'text-center hidden lg:table-cell')}>
                  <ComplianceBadge compliance={process.compliance} />
                </td>
                <td className={cn(TABLE.BODY_CELL, 'text-center hidden lg:table-cell')}>
                  <PhaseBadge phase={process.phase} />
                </td>
                <td className={cn(TABLE.BODY_CELL, 'text-right')}>
                  <Switch
                    checked={isEnabled(process.id)}
                    onCheckedChange={() => toggle(process.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className={cn(INFO_BANNER.BASE, INFO_BANNER.HINT)}>
        <p className={TYPOGRAPHY.HINT}>
          {GOLDEN_PATH_PROCESSES.length} Prozesse registriert · {GOLDEN_PATH_PROCESSES.filter(p => Object.values(p.compliance).every(Boolean)).length} konform · {GOLDEN_PATH_PROCESSES.filter(p => p.phase === 'done').length} fertig implementiert
        </p>
      </div>
    </PageShell>
  );
}
