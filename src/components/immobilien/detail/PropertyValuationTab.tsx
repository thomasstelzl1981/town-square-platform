/**
 * PropertyValuationTab — Bewertung tab extracted from PropertyDetailPage
 * R-15 sub-component
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, TrendingUp } from 'lucide-react';

interface Props {
  propertyId: string;
  tenantId: string;
}

export function PropertyValuationTab({ propertyId, tenantId }: Props) {
  const { data: valuations, isLoading } = useQuery({
    queryKey: ['property-valuations', propertyId, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_valuations')
        .select('*')
        .eq('property_id', propertyId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId && !!tenantId,
  });

  const fmt = (v: number | null) =>
    v ? new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v) : '–';

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (!valuations || valuations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Noch keine Bewertungen vorhanden</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Starten Sie eine Bewertung, um hier Ihr Gutachten zu erhalten.</p>
          <Button size="sm" variant="outline" className="mt-4" disabled>Bewertung starten</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {valuations.map((v) => (
        <Card key={v.id}>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="h-14 w-11 rounded-md bg-muted flex flex-col items-center justify-center shrink-0 border">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-0.5">PDF</Badge>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium font-mono">{v.public_id}</p>
              <p className="text-xs text-muted-foreground">{v.completed_at ? new Date(v.completed_at).toLocaleDateString('de-DE') : '–'}</p>
            </div>
            <p className="text-sm font-semibold shrink-0">{fmt(v.market_value)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
