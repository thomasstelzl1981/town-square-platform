/**
 * Lead Desk — Zone 1 Operative Desk for MOD-10 (Leadmanager)
 * Consolidates Lead-Pool-Governance, Kampagnen-Monitoring, Provisions-Abrechnung
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Users, CreditCard } from 'lucide-react';

const KPI_CARDS = [
  { label: 'Offene Leads', value: '—', icon: Target, color: 'text-blue-500' },
  { label: 'Konversionsrate', value: '—', icon: TrendingUp, color: 'text-green-500' },
  { label: 'Aktive Kampagnen', value: '—', icon: Users, color: 'text-purple-500' },
  { label: 'Offene Abrechnungen', value: '—', icon: CreditCard, color: 'text-amber-500' },
];

export default function LeadDesk() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead Desk</h1>
          <p className="text-muted-foreground text-sm">
            Lead-Pool-Governance · Kampagnen-Monitoring · Abrechnung
          </p>
        </div>
        <Badge variant="outline">MOD-10</Badge>
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
          <CardTitle className="text-lg">Lead-Pool</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Lead-Governance-Funktionen werden hier konsolidiert. Bestehende LeadPool- und Provisions-Daten werden in diesem Desk zusammengeführt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
