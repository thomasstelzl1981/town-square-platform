/**
 * R-3: KPI Stats Grid extracted from Inbox.tsx
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DESIGN } from '@/config/designManifest';
import { Clock, CheckCircle, Filter, ClipboardList } from 'lucide-react';

interface InboxStatsGridProps {
  pendingCount: number;
  assignedCount: number;
  activeRulesCount: number;
  openMandates: number;
}

export default function InboxStatsGrid({ pendingCount, assignedCount, activeRulesCount, openMandates }: InboxStatsGridProps) {
  return (
    <div className={DESIGN.KPI_GRID.FULL}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Offen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-2xl font-bold">{pendingCount}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Zugestellt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-2xl font-bold">{assignedCount}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Routing-Regeln</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">{activeRulesCount}</span>
            <span className="text-muted-foreground text-sm">aktiv</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Offene Aufträge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <span className="text-2xl font-bold">{openMandates}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
