import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { 
  Plug, 
  Mail, 
  CreditCard, 
  Cloud, 
  FileText,
  MessageSquare,
  Calendar,
  Database,
  Lock,
  Settings,
  Zap,
  Building2,
  Send,
  MapPin,
  Phone,
  BarChart3,
  Bot
} from 'lucide-react';

// Icon mapping based on integration code
const ICON_MAP: Record<string, React.ElementType> = {
  RESEND: Mail,
  resend: Mail,
  STRIPE: CreditCard,
  CAYA: FileText,
  LOVABLE_AI: Bot,
  GMAIL_OAUTH: Mail,
  MICROSOFT_OAUTH: Calendar,
  GOOGLE_MAPS: MapPin,
  GOOGLE_PLACES: MapPin,
  FUTURE_ROOM: Building2,
  future_room: Building2,
  SCOUT24: Building2,
  scout24: Building2,
  BRIEFDIENST: Send,
  SIMPLEFAX: Phone,
  SPRENGNETTER: BarChart3,
  UNSTRUCTURED: FileText,
  FINAPI: CreditCard,
  meta_ads: Zap,
  apify: Database,
};

const CATEGORY_LABELS: Record<string, string> = {
  integration: 'Integration',
  connector: 'Connector',
  edge_function: 'Edge Function',
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-600">Aktiv</Badge>;
    case 'pending_setup':
      return <Badge variant="outline">Einrichtung ausstehend</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inaktiv</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function Integrations() {
  const { data: integrations, isLoading, error } = useQuery({
    queryKey: ['integration-registry'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any;
      const { data, error } = await client
        .from('integration_registry')
        .select('id, code, name, type, status, description')
        .order('type', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        <p>Fehler beim Laden der Integrationen</p>
      </div>
    );
  }

  // Group integrations by type
  const grouped = (integrations || []).reduce((acc: Record<string, typeof integrations>, item: { type: string }) => {
    const type = item.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, typeof integrations>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrationen & APIs</h1>
        <p className="text-muted-foreground">
          Externe Dienste verbinden und konfigurieren (DB-gestützt)
        </p>
      </div>

      {/* API Keys Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>API-Schlüssel</CardTitle>
          </div>
          <CardDescription>
            Verwaltung von API-Keys für externe Dienste
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Production API Key</p>
                <p className="text-sm text-muted-foreground">
                  Für Live-Umgebung
                </p>
              </div>
              <Badge variant="outline">••••••••••••••••</Badge>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Development API Key</p>
                <p className="text-sm text-muted-foreground">
                  Für Testumgebung
                </p>
              </div>
              <Badge variant="outline">••••••••••••••••</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations by Type */}
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="space-y-4">
          <h2 className="text-lg font-semibold">
            {CATEGORY_LABELS[type] || type}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(items as Array<{ id: string; code: string; name: string; status: string; description: string | null; type: string }>).map((integration) => {
              const Icon = ICON_MAP[integration.code] || Plug;
              return (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription className="text-xs font-mono">
                            {integration.code}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(integration.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {integration.description || 'Keine Beschreibung verfügbar'}
                    </p>
                    <div className="flex items-center justify-between">
                      {integration.status === 'active' ? (
                        <>
                          <Switch checked={true} />
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Konfigurieren
                          </Button>
                        </>
                      ) : integration.status === 'pending_setup' ? (
                        <Button className="w-full">
                          <Plug className="h-4 w-4 mr-2" />
                          Einrichten
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          Inaktiv
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Webhooks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Webhooks</CardTitle>
          </div>
          <CardDescription>
            Eingehende und ausgehende Webhook-Konfiguration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Keine Webhooks konfiguriert</p>
            <Button variant="outline" className="mt-4">
              Webhook hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
