/**
 * OversightStats — 6 KPI cards
 * R-24 sub-component
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Building, LayoutGrid, Banknote, Globe } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';

interface Stats {
  organizations: number;
  profiles: number;
  properties: number;
  activeTiles: number;
  financePackages: number;
  publicListings: number;
}

export function OversightStats({ stats }: { stats: Stats }) {
  const items = [
    { label: 'Organisationen', value: stats.organizations, icon: Building2 },
    { label: 'Benutzer', value: stats.profiles, icon: Users },
    { label: 'Immobilien', value: stats.properties, icon: Building },
    { label: 'Aktive Module', value: stats.activeTiles, icon: LayoutGrid },
    { label: 'Finance Pakete', value: stats.financePackages, icon: Banknote },
    { label: 'Öffentliche Inserate', value: stats.publicListings, icon: Globe },
  ];
  return (
    <div className={DESIGN.KPI_GRID.FULL}>
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><span className="text-2xl font-bold">{value}</span></div></CardContent>
        </Card>
      ))}
    </div>
  );
}
