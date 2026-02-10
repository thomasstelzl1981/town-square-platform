import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowRight, Coins, TrendingUp, FileText, AlertCircle, 
  CheckCircle, Clock, XCircle, Loader2, ExternalLink
} from 'lucide-react';

const WORKFLOW_STEPS = [
  { id: 'check', label: 'Daten prüfen' },
  { id: 'consent', label: 'Kosten bestätigen' },
  { id: 'process', label: 'Bewertung' },
  { id: 'report', label: 'Report' },
];

export function BewertungTab() {
  const { activeOrganization } = useAuth();

  // Fetch properties for valuation
  const { data: properties, isLoading: propsLoading } = useQuery({
    queryKey: ['valuation-properties', activeOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, code, address, city, property_type, market_value')
        .eq('tenant_id', activeOrganization!.id)
        .eq('status', 'active')
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeOrganization,
  });

  // Fetch existing valuations
  const { data: valuations, isLoading: valLoading } = useQuery({
    queryKey: ['property-valuations', activeOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_valuations')
        .select('*')
        .eq('tenant_id', activeOrganization!.id)
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

  const completedValuations = valuations?.filter(v => v.status === 'completed') || [];
  const pendingValuations = valuations?.filter(v => v.status === 'pending' || v.status === 'processing') || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 space-y-6">
      {/* Workflow Visualisierung */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Workflow: Input-Mapping → Consent → Job → Ergebnis + Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex-1 py-2 px-3 text-center text-sm rounded-md border bg-muted/50 text-muted-foreground border-muted">
                  {step.label}
                </div>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 mx-1 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Credits Übersicht */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Credits</CardTitle>
                <CardDescription>Für automatisierte Bewertungen</CardDescription>
              </div>
            </div>
            <Button variant="outline" disabled>
              Credits kaufen
              <Badge variant="secondary" className="ml-2 text-xs">
                in Entwicklung
              </Badge>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-background">
              <p className="text-sm text-muted-foreground">Verfügbare Credits</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <div className="p-4 rounded-lg bg-background">
              <p className="text-sm text-muted-foreground">Verbraucht</p>
              <p className="text-3xl font-bold text-muted-foreground">0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bewertbare Objekte */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Bewertbare Objekte
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objekt</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Daten-Status</TableHead>
                <TableHead>Letzte Bewertung</TableHead>
                <TableHead className="text-right">Akt. Verkehrswert</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : properties && properties.length > 0 ? (
                properties.map((prop) => (
                  <TableRow key={prop.id}>
                    <TableCell className="font-mono text-sm">{prop.code || '–'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{prop.address}</p>
                        <p className="text-sm text-muted-foreground">{prop.city}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Vollständig
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">–</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(prop.market_value)}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" disabled>
                        Bewerten
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  <TableRow>
                    <TableCell className="text-muted-foreground">–</TableCell>
                    <TableCell className="text-muted-foreground">–</TableCell>
                    <TableCell className="text-muted-foreground">–</TableCell>
                    <TableCell className="text-muted-foreground">–</TableCell>
                    <TableCell className="text-right text-muted-foreground">–</TableCell>
                    <TableCell className="text-muted-foreground">–</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground">Keine Objekte vorhanden</p>
                        <p className="text-sm text-muted-foreground/70">
                          Legen Sie zuerst Immobilien an, um Bewertungen zu starten.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Laufende Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Laufende Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingValuations.length > 0 ? (
            <div className="space-y-2">
              {pendingValuations.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="font-mono text-sm">{v.public_id}</span>
                  </div>
                  <Badge variant="secondary">{v.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 text-center border border-dashed rounded-lg">
              <Clock className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Keine laufenden Bewertungsjobs</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Abgeschlossene Bewertungen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Abgeschlossene Bewertungen
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">VAL-ID</TableHead>
                <TableHead>Objekt</TableHead>
                <TableHead className="text-right">Verkehrswert</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedValuations.length > 0 ? (
                completedValuations.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-sm">{v.public_id}</TableCell>
                    <TableCell>–</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(v.market_value)}
                    </TableCell>
                    <TableCell>
                      {v.completed_at ? new Date(v.completed_at).toLocaleDateString('de-DE') : '–'}
                    </TableCell>
                    <TableCell>
                      {v.report_document_id ? (
                        <Button size="sm" variant="ghost">
                          <FileText className="h-4 w-4" />
                        </Button>
                      ) : (
                        '–'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <>
                  <TableRow>
                    <TableCell className="text-muted-foreground">–</TableCell>
                    <TableCell className="text-muted-foreground">–</TableCell>
                    <TableCell className="text-right text-muted-foreground">–</TableCell>
                    <TableCell className="text-muted-foreground">–</TableCell>
                    <TableCell className="text-muted-foreground">–</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      <p className="text-sm text-muted-foreground">Keine abgeschlossenen Bewertungen</p>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sprengnetter Integration Info */}
      <Card className="bg-muted/50 border-muted">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Sprengnetter-Integration</p>
            <p className="text-sm text-muted-foreground">
              Die API-Anbindung an Sprengnetter für automatisierte Immobilienbewertungen 
              befindet sich in Entwicklung. Die Ergebnisse werden automatisch in Ihr Exposé 
              und die Portfolio-Liste übernommen.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                Benötigt: SEC-SPRENGNETTER API-Credentials
              </Badge>
              <span>•</span>
              <span>Zone 1 Integration</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
