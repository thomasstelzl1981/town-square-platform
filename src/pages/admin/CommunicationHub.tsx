import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Mail, 
  Send, 
  FileText, 
  Users, 
  Plus,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Placeholder data for skeleton
const PLACEHOLDER_CAMPAIGNS = [
  { id: '1', name: 'Willkommens-Serie', status: 'active', sent: 1250, opened: 890, type: 'automation' },
  { id: '2', name: 'Newsletter Q1', status: 'draft', sent: 0, opened: 0, type: 'newsletter' },
  { id: '3', name: 'Mieterhöhung Info', status: 'completed', sent: 340, opened: 298, type: 'transactional' },
];

const PLACEHOLDER_TEMPLATES = [
  { id: '1', name: 'Willkommens-E-Mail', category: 'onboarding', lastUsed: '2026-01-15' },
  { id: '2', name: 'Mietvertrag-Bestätigung', category: 'contracts', lastUsed: '2026-01-18' },
  { id: '3', name: 'Zahlungserinnerung', category: 'payments', lastUsed: '2026-01-20' },
  { id: '4', name: 'Besichtigungseinladung', category: 'sales', lastUsed: '2026-01-10' },
];

const PLACEHOLDER_AUDIENCES = [
  { id: '1', name: 'Alle Mieter', count: 1250, type: 'dynamic' },
  { id: '2', name: 'Interessenten', count: 450, type: 'dynamic' },
  { id: '3', name: 'Partner', count: 85, type: 'static' },
  { id: '4', name: 'VIP-Kunden', count: 120, type: 'static' },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-600">Aktiv</Badge>;
    case 'draft':
      return <Badge variant="secondary">Entwurf</Badge>;
    case 'completed':
      return <Badge variant="outline">Abgeschlossen</Badge>;
    default:
      return null;
  }
}

export default function CommunicationHub() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communication Hub</h1>
          <p className="text-muted-foreground">
            Kampagnen, Templates und Zielgruppen verwalten
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesendete E-Mails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">1,590</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Öffnungsrate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">74.5%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktive Kampagnen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">3</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{PLACEHOLDER_TEMPLATES.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Kampagnen</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="audiences">Zielgruppen</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neue Kampagne
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Gesendet</TableHead>
                  <TableHead className="text-right">Geöffnet</TableHead>
                  <TableHead className="w-24">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PLACEHOLDER_CAMPAIGNS.map(campaign => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="text-right">{campaign.sent.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {campaign.sent > 0 
                        ? `${Math.round((campaign.opened / campaign.sent) * 100)}%` 
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neues Template
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDER_TEMPLATES.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.category}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Zuletzt verwendet:</span>
                    <span>{new Date(template.lastUsed).toLocaleDateString('de-DE')}</span>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Bearbeiten
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audiences" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neue Zielgruppe
            </Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead className="text-right">Kontakte</TableHead>
                  <TableHead className="w-24">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PLACEHOLDER_AUDIENCES.map(audience => (
                  <TableRow key={audience.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{audience.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={audience.type === 'dynamic' ? 'default' : 'secondary'}>
                        {audience.type === 'dynamic' ? 'Dynamisch' : 'Statisch'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{audience.count.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
