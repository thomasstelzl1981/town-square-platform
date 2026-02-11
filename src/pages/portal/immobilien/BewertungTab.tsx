import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetHeader } from '@/components/shared/WidgetHeader';

export function BewertungTab() {
  const { activeOrganization } = useAuth();

  const { data: properties, isLoading: propsLoading } = useQuery({
    queryKey: ['valuation-properties', activeOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, code, address, city, property_type, market_value, year_built')
        .eq('tenant_id', activeOrganization!.id)
        .eq('status', 'active')
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!activeOrganization,
  });

  const { data: valuations, isLoading: valLoading } = useQuery({
    queryKey: ['property-valuations', activeOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_valuations')
        .select('*')
        .eq('tenant_id', activeOrganization!.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!activeOrganization,
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return '–';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  const completedValuations = valuations || [];

  return (
    <PageShell>
      <ModulePageHeader
        title="Bewertung"
        description="Marktwertermittlung via Sprengnetter — professionelle Gutachten für Ihre Liegenschaften. Wählen Sie ein Objekt aus, starten Sie die Bewertung und erhalten Sie Ihr Gutachten als PDF."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linkes Widget: Bewertbare Objekte */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <WidgetHeader icon={TrendingUp} title="Bewertbare Objekte" description="Objekte aus Ihrem Portfolio" />
            {propsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : properties && properties.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="text-right">Verkehrswert</TableHead>
                    <TableHead className="w-[90px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((prop) => (
                    <TableRow key={prop.id}>
                      <TableCell className="font-mono text-xs">{prop.code || '–'}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{prop.address}</p>
                        <p className="text-xs text-muted-foreground">{prop.city}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {prop.property_type || '–'}
                        {prop.year_built ? ` · ${prop.year_built}` : ''}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(prop.market_value)}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" disabled>
                          Bewerten
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Keine Objekte vorhanden</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Legen Sie zuerst Immobilien an, um Bewertungen zu starten.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rechtes Widget: Gutachten */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <WidgetHeader icon={FileText} title="Gutachten" description="Abgeschlossene Bewertungen & Reports" />
            {valLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : completedValuations.length > 0 ? (
              <div className="space-y-3">
                {completedValuations.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    {/* PDF preview placeholder */}
                    <div className="h-14 w-11 rounded-md bg-muted flex flex-col items-center justify-center shrink-0 border">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-0.5">PDF</Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium font-mono">{v.public_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.completed_at ? new Date(v.completed_at).toLocaleDateString('de-DE') : '–'}
                      </p>
                    </div>
                    <p className="text-sm font-semibold shrink-0">{formatCurrency(v.market_value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center border border-dashed rounded-lg">
                <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Noch keine Gutachten vorhanden</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Starten Sie eine Bewertung, um hier Ihr Gutachten zu erhalten.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
