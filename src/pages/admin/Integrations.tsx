import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
  Settings
} from 'lucide-react';

const INTEGRATIONS = [
  {
    id: 'resend',
    name: 'Resend',
    description: 'Transaktionale E-Mails und Newsletter',
    icon: Mail,
    category: 'communication',
    status: 'available',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Zahlungsabwicklung und Abonnements',
    icon: CreditCard,
    category: 'payments',
    status: 'coming_soon',
  },
  {
    id: 'caya',
    name: 'Caya',
    description: 'Digitale Post und Dokumenteneingang',
    icon: FileText,
    category: 'documents',
    status: 'available',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'KI-gestützte Funktionen und Assistenten',
    icon: MessageSquare,
    category: 'ai',
    status: 'available',
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    description: 'Kalender-Synchronisation',
    icon: Calendar,
    category: 'productivity',
    status: 'coming_soon',
  },
  {
    id: 'storage',
    name: 'Cloud Storage',
    description: 'Dokumentenspeicher und Backup',
    icon: Cloud,
    category: 'storage',
    status: 'active',
  },
];

const CATEGORIES = {
  communication: 'Kommunikation',
  payments: 'Zahlungen',
  documents: 'Dokumente',
  ai: 'KI & Automation',
  productivity: 'Produktivität',
  storage: 'Speicher',
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-600">Aktiv</Badge>;
    case 'available':
      return <Badge variant="outline">Verfügbar</Badge>;
    case 'coming_soon':
      return <Badge variant="secondary">Bald verfügbar</Badge>;
    default:
      return null;
  }
}

export default function Integrations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrationen & APIs</h1>
        <p className="text-muted-foreground">
          Externe Dienste verbinden und konfigurieren
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

      {/* Integrations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map(integration => {
          const Icon = integration.icon;
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
                      <CardDescription className="text-xs">
                        {CATEGORIES[integration.category as keyof typeof CATEGORIES]}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(integration.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {integration.description}
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
                  ) : integration.status === 'available' ? (
                    <Button className="w-full">
                      <Plug className="h-4 w-4 mr-2" />
                      Verbinden
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" disabled>
                      Bald verfügbar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
