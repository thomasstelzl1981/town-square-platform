/**
 * Sourcing Tab — Apollo, Apify, Firecrawl, Manual Entry
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, Globe, Database, UserPlus, Loader2, CheckCircle2, 
  XCircle, ExternalLink, Wand2, Upload, Building2, Mail, Phone, MapPin
} from 'lucide-react';
import { 
  useContactStaging, 
  useCreateStagingContact, 
  useApproveContact, 
  useRejectContact,
  useEnrichContact,
  useBulkCreateStagingContacts,
  type ContactStaging 
} from '@/hooks/useAcqContacts';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SourcingTabProps {
  mandateId: string;
  mandateCode: string;
}

const SOURCE_CONFIG = {
  manual: { label: 'Manuell', icon: UserPlus, color: 'bg-gray-100 text-gray-700' },
  apollo: { label: 'Apollo', icon: Database, color: 'bg-blue-100 text-blue-700' },
  apify: { label: 'Apify', icon: Globe, color: 'bg-purple-100 text-purple-700' },
  firecrawl: { label: 'Firecrawl', icon: Search, color: 'bg-orange-100 text-orange-700' },
  geomap: { label: 'GeoMap', icon: MapPin, color: 'bg-green-100 text-green-700' },
} as const;

const STATUS_CONFIG = {
  pending: { label: 'Ausstehend', variant: 'secondary' as const },
  approved: { label: 'Übernommen', variant: 'default' as const },
  rejected: { label: 'Abgelehnt', variant: 'destructive' as const },
  merged: { label: 'Zusammengeführt', variant: 'outline' as const },
} as const;

export function SourcingTab({ mandateId, mandateCode }: SourcingTabProps) {
  const { data: contacts = [], isLoading } = useContactStaging(mandateId);
  const createContact = useCreateStagingContact();
  const approveContact = useApproveContact();
  const rejectContact = useRejectContact();
  const enrichContact = useEnrichContact();
  const bulkCreate = useBulkCreateStagingContacts();
  
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showApolloDialog, setShowApolloDialog] = React.useState(false);
  const [showApifyDialog, setShowApifyDialog] = React.useState(false);
  const [apolloLoading, setApolloLoading] = React.useState(false);
  const [apifyLoading, setApifyLoading] = React.useState(false);
  
  // Manual entry form
  const [manualForm, setManualForm] = React.useState({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    website_url: '',
    role_guess: '',
    service_area: '',
  });

  // Apollo search form
  const [apolloForm, setApolloForm] = React.useState({
    jobTitles: 'Makler, Immobilienmakler, Geschäftsführer',
    locations: '',
    industries: 'Real Estate',
    limit: 25,
  });

  // Apify search form
  const [apifyForm, setApifyForm] = React.useState({
    portalUrl: '',
    searchType: 'brokers',
    limit: 50,
  });

  const pendingContacts = contacts.filter(c => c.status === 'pending');
  const processedContacts = contacts.filter(c => c.status !== 'pending');

  const handleManualSubmit = async () => {
    await createContact.mutateAsync({
      mandate_id: mandateId,
      source: 'manual',
      ...manualForm,
    });
    setManualForm({ company_name: '', first_name: '', last_name: '', email: '', phone: '', website_url: '', role_guess: '', service_area: '' });
    setShowAddDialog(false);
  };

  const handleApolloSearch = async () => {
    setApolloLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-apollo-search', {
        body: {
          mandateId,
          jobTitles: apolloForm.jobTitles.split(',').map(s => s.trim()),
          locations: apolloForm.locations.split(',').map(s => s.trim()).filter(Boolean),
          industries: apolloForm.industries.split(',').map(s => s.trim()),
          limit: apolloForm.limit,
        },
      });
      
      if (error) throw error;
      
      if (data?.contacts?.length) {
        await bulkCreate.mutateAsync({
          mandateId,
          contacts: data.contacts.map((c: any) => ({
            source: 'apollo' as const,
            source_id: c.id,
            company_name: c.company,
            first_name: c.firstName,
            last_name: c.lastName,
            email: c.email,
            phone: c.phone,
            role_guess: c.title,
            service_area: c.location,
            quality_score: c.score || 50,
          })),
        });
      }
      
      setShowApolloDialog(false);
    } catch (err) {
      toast.error('Apollo-Suche fehlgeschlagen: ' + (err as Error).message);
    } finally {
      setApolloLoading(false);
    }
  };

  const handleApifySearch = async () => {
    setApifyLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-apify-portal-job', {
        body: {
          mandateId,
          portalUrl: apifyForm.portalUrl,
          searchType: apifyForm.searchType,
          limit: apifyForm.limit,
        },
      });
      
      if (error) throw error;
      toast.success('Apify-Job gestartet. Ergebnisse erscheinen in Kürze.');
      setShowApifyDialog(false);
    } catch (err) {
      toast.error('Apify-Job fehlgeschlagen: ' + (err as Error).message);
    } finally {
      setApifyLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Sourcing</h2>
          <p className="text-sm text-muted-foreground">
            Kontakte für {mandateCode} recherchieren und qualifizieren
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowApolloDialog(true)}>
            <Database className="h-4 w-4 mr-2" />
            Apollo
          </Button>
          <Button variant="outline" onClick={() => setShowApifyDialog(true)}>
            <Globe className="h-4 w-4 mr-2" />
            Portal Scraper
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Manuell
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{contacts.length}</div>
            <div className="text-sm text-muted-foreground">Gesamt</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{pendingContacts.length}</div>
            <div className="text-sm text-muted-foreground">Ausstehend</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {contacts.filter(c => c.status === 'approved').length}
            </div>
            <div className="text-sm text-muted-foreground">Übernommen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {contacts.filter(c => c.status === 'rejected').length}
            </div>
            <div className="text-sm text-muted-foreground">Abgelehnt</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Contacts */}
      {pendingContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-orange-500" />
              Zu prüfende Kontakte ({pendingContacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {pendingContacts.map(contact => (
                <StagingContactRow
                  key={contact.id}
                  contact={contact}
                  mandateId={mandateId}
                  onApprove={() => approveContact.mutate({ stagingId: contact.id, mandateId })}
                  onReject={() => rejectContact.mutate(contact.id)}
                  onEnrich={() => enrichContact.mutate(contact.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Contacts */}
      {processedContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bearbeitete Kontakte ({processedContacts.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-96 overflow-y-auto">
              {processedContacts.map(contact => (
                <div key={contact.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${SOURCE_CONFIG[contact.source].color}`}>
                      {React.createElement(SOURCE_CONFIG[contact.source].icon, { className: 'h-5 w-5' })}
                    </div>
                    <div>
                      <div className="font-medium">
                        {contact.first_name} {contact.last_name}
                        {contact.company_name && <span className="text-muted-foreground"> • {contact.company_name}</span>}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</span>}
                        {contact.role_guess && <span>{contact.role_guess}</span>}
                      </div>
                    </div>
                  </div>
                  <Badge variant={STATUS_CONFIG[contact.status].variant}>
                    {STATUS_CONFIG[contact.status].label}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {contacts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Keine Kontakte</h3>
            <p className="text-muted-foreground mt-2">
              Starten Sie mit Apollo, Portal Scraping oder manueller Eingabe.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Manual Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kontakt manuell hinzufügen</DialogTitle>
            <DialogDescription>Fügen Sie einen neuen Kontakt zum Staging hinzu.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vorname</Label>
                <Input value={manualForm.first_name} onChange={e => setManualForm(f => ({ ...f, first_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Nachname</Label>
                <Input value={manualForm.last_name} onChange={e => setManualForm(f => ({ ...f, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Firma</Label>
              <Input value={manualForm.company_name} onChange={e => setManualForm(f => ({ ...f, company_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-Mail</Label>
                <Input type="email" value={manualForm.email} onChange={e => setManualForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input type="tel" value={manualForm.phone} onChange={e => setManualForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rolle (geschätzt)</Label>
                <Select value={manualForm.role_guess} onValueChange={v => setManualForm(f => ({ ...f, role_guess: v }))}>
                  <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Makler">Makler</SelectItem>
                    <SelectItem value="Eigentümer">Eigentümer</SelectItem>
                    <SelectItem value="Verwalter">Verwalter</SelectItem>
                    <SelectItem value="Bauträger">Bauträger</SelectItem>
                    <SelectItem value="Investor">Investor</SelectItem>
                    <SelectItem value="Sonstiges">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Region</Label>
                <Input value={manualForm.service_area} onChange={e => setManualForm(f => ({ ...f, service_area: e.target.value }))} placeholder="z.B. Berlin, Brandenburg" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input type="url" value={manualForm.website_url} onChange={e => setManualForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Abbrechen</Button>
            <Button onClick={handleManualSubmit} disabled={createContact.isPending}>
              {createContact.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apollo Search Dialog */}
      <Dialog open={showApolloDialog} onOpenChange={setShowApolloDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Apollo Kontaktsuche
            </DialogTitle>
            <DialogDescription>Suchen Sie nach Immobilien-Profis in Ihrer Zielregion.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Job-Titel (kommagetrennt)</Label>
              <Input 
                value={apolloForm.jobTitles} 
                onChange={e => setApolloForm(f => ({ ...f, jobTitles: e.target.value }))}
                placeholder="Makler, Immobilienmakler, Geschäftsführer"
              />
            </div>
            <div className="space-y-2">
              <Label>Standorte (kommagetrennt)</Label>
              <Input 
                value={apolloForm.locations} 
                onChange={e => setApolloForm(f => ({ ...f, locations: e.target.value }))}
                placeholder="Berlin, Hamburg, München"
              />
            </div>
            <div className="space-y-2">
              <Label>Branchen (kommagetrennt)</Label>
              <Input 
                value={apolloForm.industries} 
                onChange={e => setApolloForm(f => ({ ...f, industries: e.target.value }))}
                placeholder="Real Estate, Property Management"
              />
            </div>
            <div className="space-y-2">
              <Label>Max. Ergebnisse</Label>
              <Select value={String(apolloForm.limit)} onValueChange={v => setApolloForm(f => ({ ...f, limit: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApolloDialog(false)}>Abbrechen</Button>
            <Button onClick={handleApolloSearch} disabled={apolloLoading}>
              {apolloLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Suchen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apify Portal Scraper Dialog */}
      <Dialog open={showApifyDialog} onOpenChange={setShowApifyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Portal Scraper (Apify)
            </DialogTitle>
            <DialogDescription>Extrahieren Sie Makler- oder Objektdaten von Immobilienportalen.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Portal-URL oder Suche</Label>
              <Input 
                value={apifyForm.portalUrl} 
                onChange={e => setApifyForm(f => ({ ...f, portalUrl: e.target.value }))}
                placeholder="https://immobilienscout24.de/Suche/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Such-Typ</Label>
              <Select value={apifyForm.searchType} onValueChange={v => setApifyForm(f => ({ ...f, searchType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brokers">Makler-Kontakte</SelectItem>
                  <SelectItem value="listings">Objekt-Listings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max. Ergebnisse</Label>
              <Select value={String(apifyForm.limit)} onValueChange={v => setApifyForm(f => ({ ...f, limit: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApifyDialog(false)}>Abbrechen</Button>
            <Button onClick={handleApifySearch} disabled={apifyLoading}>
              {apifyLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Job starten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Individual staging contact row
function StagingContactRow({ 
  contact, 
  mandateId,
  onApprove, 
  onReject, 
  onEnrich 
}: { 
  contact: ContactStaging; 
  mandateId: string;
  onApprove: () => void; 
  onReject: () => void; 
  onEnrich: () => void;
}) {
  const sourceConfig = SOURCE_CONFIG[contact.source];
  const hasEnrichment = contact.enrichment_data && Object.keys(contact.enrichment_data).length > 0;

  return (
    <div className="p-4 hover:bg-muted/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${sourceConfig.color}`}>
            {React.createElement(sourceConfig.icon, { className: 'h-5 w-5' })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">
                {contact.first_name || contact.last_name 
                  ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                  : contact.company_name || 'Unbekannt'}
              </span>
              {contact.company_name && contact.first_name && (
                <span className="text-muted-foreground">• {contact.company_name}</span>
              )}
              <Badge variant="outline" className="text-xs">{sourceConfig.label}</Badge>
              {contact.quality_score > 0 && (
                <Badge variant={contact.quality_score > 70 ? 'default' : 'secondary'} className="text-xs">
                  Score: {contact.quality_score}
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-3 mt-1">
              {contact.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {contact.email}
                </span>
              )}
              {contact.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {contact.phone}
                </span>
              )}
              {contact.role_guess && <span>{contact.role_guess}</span>}
              {contact.service_area && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {contact.service_area}
                </span>
              )}
            </div>
            {contact.website_url && (
              <a 
                href={contact.website_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 mt-1 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {new URL(contact.website_url).hostname}
              </a>
            )}
            {hasEnrichment && (
              <div className="mt-2 p-2 bg-primary/5 rounded text-xs">
                <strong>KI-Anreicherung:</strong>{' '}
                {(contact.enrichment_data as any).summary || JSON.stringify(contact.enrichment_data).slice(0, 100)}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!hasEnrichment && contact.website_url && (
            <Button variant="ghost" size="sm" onClick={onEnrich} title="KI-Anreicherung">
              <Wand2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onReject} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <XCircle className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={onApprove}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Übernehmen
          </Button>
        </div>
      </div>
    </div>
  );
}
