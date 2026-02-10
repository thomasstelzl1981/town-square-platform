/**
 * Akquise-Manager Page (MOD-12)
 * AkquiseManager Workbench with Gate, Sourcing, Outreach, Analysis, Delivery
 * 
 * 4 Tiles: Dashboard, Mandate, Objekteingang, Tools
 */

import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';

import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { TermsGatePanel } from '@/components/shared/TermsGatePanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, Users, FileText, Wrench, Loader2, CheckCircle2, 
  Clock, ArrowRight, Search, Mail, Inbox, Brain, Send, Plus, Edit, Building2
} from 'lucide-react';
import { 
  useAcqMandatesPending, 
  useAcqMandatesActive, 
  useAcqMandate, 
  useAcceptAcqMandate,
  useMyAcqMandates,
  useCreateAcqMandate,
  useSubmitAcqMandate
} from '@/hooks/useAcqMandate';
import { MANDATE_STATUS_CONFIG, canViewClientInfo } from '@/types/acquisition';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  SourcingTab, 
  OutreachTab, 
  InboundTab, 
  AnalysisTab, 
  DeliveryTab,
  ExposeDragDropUploader,
  StandaloneCalculatorPanel,
  PortalSearchTool,
  PropertyResearchTool,
  QuickCalcTool
} from './akquise-manager/components';
import { ObjekteingangList } from './akquise-manager/ObjekteingangList';
import { ObjekteingangDetail } from './akquise-manager/ObjekteingangDetail';

// Navigation via sidebar only (WorkflowSubbar removed to avoid duplication)

// Dashboard with Pending + Active + Self-created Mandates
function AkquiseDashboard() {
  const navigate = useNavigate();
  const { data: pendingMandates, isLoading: loadingPending } = useAcqMandatesPending();
  const { data: activeMandates, isLoading: loadingActive } = useAcqMandatesActive();
  const { data: myMandates, isLoading: loadingMy } = useMyAcqMandates();
  const submitMandate = useSubmitAcqMandate();

  // Filter self-created mandates (draft or submitted_to_zone1)
  const selfCreatedMandates = myMandates?.filter(m => 
    m.status === 'draft' || m.status === 'submitted_to_zone1'
  ) || [];

  if (loadingPending || loadingActive || loadingMy) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasMandates = (pendingMandates?.length || 0) + (activeMandates?.length || 0) + selfCreatedMandates.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Ihre Akquise-Mandate im Überblick</p>
      </div>

      {/* Create New Mandate Tile */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card 
          className="border-dashed border-2 border-primary/30 bg-primary/5 cursor-pointer hover:border-primary/50 hover:bg-primary/10 transition-colors"
          onClick={() => navigate('/portal/akquise-manager/mandate/neu')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Neues Mandat erstellen</h3>
              <p className="text-sm text-muted-foreground">
                Eigene Kundenakquise starten
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Summary */}
        {(pendingMandates?.length || 0) > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">{pendingMandates?.length} Mandate warten</h3>
                <p className="text-sm text-muted-foreground">
                  Auf Ihre Annahme
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending Acceptance */}
      {(pendingMandates?.length || 0) > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Warten auf Annahme ({pendingMandates?.length})
          </h3>
          {pendingMandates?.map((mandate) => (
            <Card key={mandate.id} className="border-orange-200 cursor-pointer hover:border-primary/50"
              onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <span className="font-mono font-medium">{mandate.code}</span>
                    <p className="text-sm text-muted-foreground">
                      Zugewiesen {formatDistanceToNow(new Date(mandate.assigned_at!), { locale: de, addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Button size="sm">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Annehmen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Active Mandates */}
      {(activeMandates?.length || 0) > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Aktive Mandate ({activeMandates?.length})
          </h3>
          {activeMandates?.map((mandate) => (
            <Card key={mandate.id} className="border-primary/30 cursor-pointer hover:border-primary/50"
              onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{mandate.code}</span>
                      {canViewClientInfo(mandate) && mandate.client_display_name && (
                        <span className="text-sm">• {mandate.client_display_name}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Aktiv seit {formatDistanceToNow(new Date(mandate.split_terms_confirmed_at!), { locale: de, addSuffix: true })}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Self-created Mandates */}
      {selfCreatedMandates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-500" />
            Meine selbst erstellten Mandate ({selfCreatedMandates.length})
          </h3>
          {selfCreatedMandates.map((mandate) => (
            <Card key={mandate.id} className="border-blue-200 cursor-pointer hover:border-primary/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{mandate.code}</span>
                      <Badge variant={mandate.status === 'draft' ? 'secondary' : 'outline'}>
                        {mandate.status === 'draft' ? 'Entwurf' : 'Eingereicht'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Erstellt {formatDistanceToNow(new Date(mandate.created_at), { locale: de, addSuffix: true })}
                    </p>
                  </div>
                </div>
                {mandate.status === 'draft' && (
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      submitMandate.mutate(mandate.id);
                    }}
                    disabled={submitMandate.isPending}
                  >
                    {submitMandate.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Einreichen
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!hasMandates && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Keine aktiven Mandate</h3>
            <p className="text-muted-foreground mb-4">
              Erstellen Sie ein eigenes Mandat oder warten Sie auf Zuweisungen.
            </p>
            <Button onClick={() => navigate('/portal/akquise-manager/mandate/neu')}>
              <Plus className="h-4 w-4 mr-2" />
              Erstes Mandat erstellen
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Mandate Detail with Gate Panel + Workbench Tabs
function AkquiseMandateDetail() {
  const { mandateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: mandate, isLoading } = useAcqMandate(mandateId);
  const acceptMandate = useAcceptAcqMandate();

  // Determine active tab from URL hash
  const getActiveTab = () => {
    const hash = location.hash.replace('#', '');
    if (['sourcing', 'outreach', 'inbound', 'analysis', 'delivery'].includes(hash)) {
      return hash;
    }
    return 'sourcing';
  };
  
  const activeTab = getActiveTab();

  const setActiveTab = (tab: string) => {
    navigate(`${location.pathname}#${tab}`, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!mandate) {
    return (
      <div className="p-6">
        <Card><CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Mandat nicht gefunden</h3>
          <Button className="mt-4" onClick={() => navigate('/portal/akquise-manager/dashboard')}>Zurück</Button>
        </CardContent></Card>
      </div>
    );
  }

  const needsGate = mandate.status === 'assigned' && !mandate.split_terms_confirmed_at;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/akquise-manager/dashboard')}>←</Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-mono">{mandate.code}</h1>
            <Badge variant={MANDATE_STATUS_CONFIG[mandate.status].variant as 'default' | 'secondary' | 'destructive' | 'outline'}>
              {MANDATE_STATUS_CONFIG[mandate.status].label}
            </Badge>
          </div>
          {canViewClientInfo(mandate) && mandate.client_display_name && (
            <p className="text-muted-foreground">{mandate.client_display_name}</p>
          )}
        </div>
        
        {/* Search criteria summary */}
        <div className="text-right text-sm">
          {mandate.asset_focus && mandate.asset_focus.length > 0 && (
            <div className="text-muted-foreground">
              {mandate.asset_focus.join(', ')}
            </div>
          )}
          {(mandate.price_min || mandate.price_max) && (
            <div className="text-muted-foreground">
              {mandate.price_min && `ab ${(mandate.price_min / 1000000).toFixed(1)}M €`}
              {mandate.price_min && mandate.price_max && ' – '}
              {mandate.price_max && `bis ${(mandate.price_max / 1000000).toFixed(1)}M €`}
            </div>
          )}
        </div>
      </div>

      {/* Gate Panel — TermsGatePanel */}
      {needsGate && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Split-Bestätigung erforderlich</CardTitle>
            <CardDescription>
              Bestätigen Sie die Provisionsvereinbarung, um das Mandat zu aktivieren und 
              die Mandantendaten einzusehen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TermsGatePanel
              templateCode="ACQ_MANDATE_ACCEPTANCE_V1"
              templateVariables={{
                partner_name: mandate.assigned_manager_user_id || '',
                partner_email: '',
                investor_name: mandate.client_display_name || 'Investor',
                search_criteria: mandate.asset_focus?.join(', ') || 'Nicht spezifiziert',
                mandate_id: mandate.code,
              }}
              referenceId={mandate.id}
              referenceType="acq_mandate"
              liableUserId={mandate.assigned_manager_user_id || ''}
              liableRole="akquise_manager"
              grossCommission={0}
              grossCommissionPct={0}
              commissionType="acquisition"
              tenantId={mandate.tenant_id}
              onAccept={async () => {
                await acceptMandate.mutateAsync(mandate.id);
              }}
              isPending={acceptMandate.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Active Mandate Workbench */}
      {!needsGate && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sourcing" className="gap-2">
              <Search className="h-4 w-4" />
              Sourcing
            </TabsTrigger>
            <TabsTrigger value="outreach" className="gap-2">
              <Mail className="h-4 w-4" />
              Outreach
            </TabsTrigger>
            <TabsTrigger value="inbound" className="gap-2">
              <Inbox className="h-4 w-4" />
              Eingang
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <Brain className="h-4 w-4" />
              Analyse
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-2">
              <Send className="h-4 w-4" />
              Delivery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sourcing" className="mt-6">
            <SourcingTab mandateId={mandate.id} mandateCode={mandate.code} />
          </TabsContent>

          <TabsContent value="outreach" className="mt-6">
            <OutreachTab 
              mandateId={mandate.id} 
              mandateCode={mandate.code}
              clientName={canViewClientInfo(mandate) ? mandate.client_display_name ?? undefined : undefined}
              searchArea={(mandate.search_area as { region?: string } | null)?.region}
              assetFocus={mandate.asset_focus ?? undefined}
            />
          </TabsContent>

          <TabsContent value="inbound" className="mt-6">
            <InboundTab mandateId={mandate.id} mandateCode={mandate.code} />
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <AnalysisTab mandateId={mandate.id} mandateCode={mandate.code} />
          </TabsContent>

          <TabsContent value="delivery" className="mt-6">
            <DeliveryTab 
              mandateId={mandate.id} 
              mandateCode={mandate.code}
              clientName={canViewClientInfo(mandate) ? mandate.client_display_name ?? undefined : undefined}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Kunden tile removed - contacts managed in MOD-02

function AkquiseMandate() {
  const navigate = useNavigate();
  const { data: mandates, isLoading } = useAcqMandatesActive();
  if (isLoading) return <div className="p-6 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!mandates?.length) return <ModuleTilePage title="Mandate" description="Mandatsübersicht" icon={FileText} moduleBase="akquise-manager" status="empty" emptyTitle="Keine Mandate" emptyDescription="Mandate erscheinen nach Zuweisung." emptyIcon={FileText} />;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Mandate</h1>
      {mandates.map(m => (
        <Card key={m.id} className="cursor-pointer hover:border-primary/50" onClick={() => navigate(`/portal/akquise-manager/mandate/${m.id}`)}>
          <CardContent className="p-4 flex justify-between items-center">
            <span className="font-mono">{m.code}</span>
            <Badge>{MANDATE_STATUS_CONFIG[m.status].label}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AkquiseTools() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Akquise-Tools</h1>
        <p className="text-muted-foreground">
          Werkzeuge für Recherche, Bewertung und Kalkulation
        </p>
      </div>

      {/* 7.1 Exposé Upload & Analyse */}
      <ExposeDragDropUploader />

      {/* 7.2 Standalone Calculators with Drag-Drop */}
      <StandaloneCalculatorPanel />

      {/* 7.3 Portal Search */}
      <PortalSearchTool />

      {/* 7.4 Property Research */}
      <PropertyResearchTool />
    </div>
  );
}

export default function AkquiseManagerPage() {

  return (
    <div className="h-full overflow-auto">
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AkquiseDashboard />} />
        <Route path="mandate" element={<AkquiseMandate />} />
        <Route path="mandate/neu" element={<MandatCreateWizardManager />} />
        <Route path="mandate/:mandateId" element={<AkquiseMandateDetail />} />
        <Route path="objekteingang" element={<ObjekteingangList />} />
        <Route path="objekteingang/:offerId" element={<ObjekteingangDetail />} />
        <Route path="tools" element={<AkquiseTools />} />
        <Route path="*" element={<Navigate to="/portal/akquise-manager" replace />} />
      </Routes>
    </div>
  );
}

// Placeholder for mandate creation wizard (to be implemented)
function MandatCreateWizardManager() {
  const navigate = useNavigate();
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/akquise-manager/mandate')}>←</Button>
        <div>
          <h1 className="text-2xl font-bold">Neues Mandat erstellen</h1>
          <p className="text-muted-foreground">Kontakt-First Workflow</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Schritt 1: Kontakt auswählen oder anlegen</CardTitle>
          <CardDescription>
            Wählen Sie einen bestehenden Kontakt aus MOD-02 oder legen Sie einen neuen an.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Der Kontakt-First Wizard wird in Phase 2 implementiert.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/portal/akquise-manager/mandate')}>
            Zurück
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
