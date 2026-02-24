import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PartnerContractsRegistry from '@/components/admin/integrations/PartnerContractsRegistry';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { DESIGN } from '@/config/designManifest';
import { VOICE_ENABLED_FIELDS } from '@/config/voiceIntegrationManifest';
import { 
  Plug, 
  Mail, 
  CreditCard, 
  FileText,
  MapPin,
  Building2,
  Send,
  Phone,
  BarChart3,
  Bot,
  Zap,
  Database,
  Lock,
  Settings,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Secret keys that indicate an integration is active
const SECRET_TO_INTEGRATION: Record<string, string[]> = {
  'RESEND_API_KEY': ['RESEND', 'resend'],
  'GOOGLE_MAPS_API_KEY': ['GOOGLE_MAPS', 'GOOGLE_PLACES'],
  'LOVABLE_API_KEY': ['LOVABLE_AI'],
  'OPENAI_API_KEY': ['LOVABLE_AI'], // Fallback
};

// Icon mapping based on integration code
const ICON_MAP: Record<string, React.ElementType> = {
  RESEND: Mail,
  resend: Mail,
  STRIPE: CreditCard,
  CAYA: FileText,
  LOVABLE_AI: Bot,
  GMAIL_OAUTH: Mail,
  MICROSOFT_OAUTH: Mail,
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

// Determine if integration has a configured secret
function isIntegrationActive(code: string, configuredSecrets: string[]): boolean {
  for (const [secret, codes] of Object.entries(SECRET_TO_INTEGRATION)) {
    if (codes.includes(code) && configuredSecrets.includes(secret)) {
      return true;
    }
  }
  return false;
}

function getStatusBadge(status: string, hasSecret: boolean) {
  if (hasSecret) {
    return (
      <Badge className="bg-green-600 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Aktiv
      </Badge>
    );
  }
  
  switch (status) {
    case 'active':
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Secret fehlt
        </Badge>
      );
    case 'pending_setup':
      return <Badge variant="outline">Einrichtung ausstehend</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inaktiv</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function Integrations() {
  // Dynamisch: Secrets aus integration_registry ableiten + bekannte Cloud-Secrets
  const { data: registrySecrets } = useQuery({
    queryKey: ['integration-secrets-status'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any;
      const { data, error } = await client
        .from('integration_registry')
        .select('code, status')
        .eq('status', 'active');
      if (error) throw error;
      // Map active integrations to their known secret keys
      const SECRET_MAP: Record<string, string[]> = {
        RESEND: ['RESEND_API_KEY'],
        LOVABLE_AI: ['LOVABLE_API_KEY'],
        GOOGLE_MAPS: ['GOOGLE_MAPS_API_KEY', 'VITE_GOOGLE_MAPS_API_KEY'],
        GOOGLE_PLACES: ['GOOGLE_MAPS_API_KEY'],
        ELEVENLABS: ['ELEVENLABS_API_KEY'],
        APIFY: ['APIFY_API_KEY'],
        FIRECRAWL: ['FIRECRAWL_API_KEY'],
        LIVEKIT: ['LIVEKIT_API_KEY'],
      };
      const secrets = new Set<string>();
      for (const item of (data || [])) {
        const keys = SECRET_MAP[item.code];
        if (keys) keys.forEach(k => secrets.add(k));
      }
      // Always include known Cloud-configured secrets
      ['LOVABLE_API_KEY', 'RESEND_API_KEY', 'GOOGLE_MAPS_API_KEY', 'ELEVENLABS_API_KEY', 'OPENAI_API_KEY'].forEach(k => secrets.add(k));
      return Array.from(secrets);
    },
    staleTime: 60000,
  });
  const configuredSecrets = registrySecrets || [];

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
        <h1 className={DESIGN.TYPOGRAPHY.PAGE_TITLE}>Integrationen & APIs</h1>
        <p className={DESIGN.TYPOGRAPHY.MUTED}>
          Externe Dienste verbinden und konfigurieren (DB-gestützt)
        </p>
      </div>

      {/* Voice Integration Documentation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <CardTitle>Spracheingabe (Voice)</CardTitle>
          </div>
          <CardDescription>
            ElevenLabs Scribe v2 Realtime — Diktat-zu-Text in allen Freitext-Feldern
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-green-600/10 border border-green-600/20">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Primär: ElevenLabs Scribe v2
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Realtime STT via WebSocket · VAD-Commit · Deutsch
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Fallback: Browser Speech API
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                webkitSpeechRecognition · de-DE · Automatisch bei Fehler
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Voice-fähige Felder</p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Komponente</th>
                    <th className="text-left p-2 font-medium">Feld</th>
                    <th className="text-left p-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                {VOICE_ENABLED_FIELDS.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-mono text-xs">{row.component}</td>
                      <td className="p-2">{row.field}</td>
                      <td className="p-2">
                        <Badge className="bg-green-600 text-xs">{row.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Konfigurierte Secrets</CardTitle>
          </div>
          <CardDescription>
            API-Schlüssel, die in Lovable Cloud hinterlegt sind
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[...configuredSecrets, 'ELEVENLABS_API_KEY'].map(secret => (
              <Badge key={secret} variant="outline" className="flex items-center gap-1.5 py-1.5">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {secret}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integrations by Type */}
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="space-y-4">
          <h2 className="text-lg font-semibold">
            {CATEGORY_LABELS[type] || type}
          </h2>
          <div className={DESIGN.WIDGET_GRID.FULL}>
            {(items as Array<{ id: string; code: string; name: string; status: string; description: string | null; type: string }>).map((integration) => {
              const Icon = ICON_MAP[integration.code] || Plug;
              const hasSecret = isIntegrationActive(integration.code, configuredSecrets);
              return (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${hasSecret ? 'bg-green-600/10' : 'bg-primary/10'}`}>
                          <Icon className={`h-5 w-5 ${hasSecret ? 'text-green-600' : ''}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription className="text-xs font-mono">
                            {integration.code}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(integration.status, hasSecret)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {integration.description || 'Keine Beschreibung verfügbar'}
                    </p>
                    <div className="flex items-center justify-between">
                      {hasSecret ? (
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
                          Secret konfigurieren
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

      {/* Partner & Affiliate Contracts Registry */}
      <PartnerContractsRegistry />
    </div>
  );
}
