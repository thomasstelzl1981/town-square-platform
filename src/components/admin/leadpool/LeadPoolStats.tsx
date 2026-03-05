/**
 * LeadPoolStats — KPI cards
 * R-22 sub-component
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, UserPlus, Users, CheckCircle } from 'lucide-react';

interface Props {
  totalPool: number;
  assigned: number;
  pending: number;
  converted: number;
}

export function LeadPoolStats({ totalPool, assigned, pending, converted }: Props) {
  const items = [
    { label: 'Pool Gesamt', value: totalPool, icon: Target },
    { label: 'Zugewiesen', value: assigned, icon: UserPlus },
    { label: 'Offen', value: pending, icon: Users },
    { label: 'Konvertiert', value: converted, icon: CheckCircle },
  ];
  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><span className="text-2xl font-bold">{value}</span></div></CardContent>
        </Card>
      ))}
    </div>
  );
}
