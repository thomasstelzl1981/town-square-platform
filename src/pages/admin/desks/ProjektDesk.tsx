/**
 * Projekt Desk — Zone 1 Operative Desk for MOD-13 (Projektmanager)
 * Consolidates Projekt-Intake, Listing-Aktivierung, Landing-Page-Governance
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, FileCheck, Globe, BarChart3 } from 'lucide-react';

const KPI_CARDS = [
  { label: 'Aktive Projekte', value: '—', icon: Building2, color: 'text-blue-500' },
  { label: 'Listings', value: '—', icon: FileCheck, color: 'text-green-500' },
  { label: 'Landing Pages', value: '—', icon: Globe, color: 'text-purple-500' },
  { label: 'Einheiten verfügbar', value: '—', icon: BarChart3, color: 'text-amber-500' },
];

export default function ProjektDesk() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projekt Desk</h1>
          <p className="text-muted-foreground text-sm">
            Projekt-Intake · Listing-Aktivierung · Landing-Page-Governance
          </p>
        </div>
        <Badge variant="outline">MOD-13</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projekt-Governance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Projekt-Intake, Listing-Aktivierung und Landing-Page-Verwaltung werden hier konsolidiert.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
