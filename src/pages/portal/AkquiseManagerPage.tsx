/**
 * Akquise-Manager Page (MOD-12) — Redesigned with FM pattern
 * Dashboard with widget cards, Mandate detail with stepper + vertical flow
 */

import { Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { TermsGatePanel } from '@/components/shared/TermsGatePanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Briefcase, FileText, Loader2, CheckCircle2, 
  Clock, ArrowRight, ArrowLeft, Plus, Edit, Building2, Send,
  Search, Mail, Inbox, Brain
} from 'lucide-react';
import { 
  useAcqMandatesPending, 
  useAcqMandatesActive, 
  useAcqMandate, 
  useAcceptAcqMandate,
  useMyAcqMandates,
  useSubmitAcqMandate
} from '@/hooks/useAcqMandate';
import { MANDATE_STATUS_CONFIG, canViewClientInfo } from '@/types/acquisition';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { MandateCaseCard, MandateCaseCardPlaceholder } from '@/components/akquise/MandateCaseCard';
import { AkquiseStepper } from '@/components/akquise/AkquiseStepper';
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
} from './akquise-manager/components';
import { ObjekteingangList } from './akquise-manager/ObjekteingangList';
import { ObjekteingangDetail } from './akquise-manager/ObjekteingangDetail';

// ============================================================================
// Dashboard — Widget tiles for active mandates
// ============================================================================
function AkquiseDashboard() {
  const navigate = useNavigate();
  const { data: pendingMandates, isLoading: loadingPending } = useAcqMandatesPending();
  const { data: activeMandates, isLoading: loadingActive } = useAcqMandatesActive();
  const { data: myMandates, isLoading: loadingMy } = useMyAcqMandates();
  const submitMandate = useSubmitAcqMandate();

  const selfCreatedMandates = myMandates?.filter(m => 
    m.status === 'draft' || m.status === 'submitted_to_zone1'
  ) || [];

  if (loadingPending || loadingActive || loadingMy) {
    return <PageShell><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  }

  const hasMandates = (pendingMandates?.length || 0) + (activeMandates?.length || 0) + selfCreatedMandates.length > 0;

  return (
    <PageShell>
      <ModulePageHeader 
        title="AKQUISE-MANAGER" 
        description="Ihre Akquise-Mandate im Überblick"
        actions={
          <Button onClick={() => navigate('/portal/akquise-manager/mandate/neu')} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Neues Mandat
          </Button>
        }
      />

      {/* Pending Acceptance Banner */}
      {(pendingMandates?.length || 0) > 0 && (
        <Card className="border-orange-500/30 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="font-medium">{pendingMandates?.length} Mandate warten auf Ihre Annahme</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => {
              if (pendingMandates?.[0]) navigate(`/portal/akquise-manager/mandate/${pendingMandates[0].id}`);
            }}>
              Ansehen <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Widget Tiles — Active Mandates */}
      {hasMandates ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Active mandates */}
          {activeMandates?.map(mandate => (
            <MandateCaseCard
              key={mandate.id}
              mandate={mandate}
              onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)}
            />
          ))}
          
          {/* Pending mandates */}
          {pendingMandates?.map(mandate => (
            <MandateCaseCard
              key={mandate.id}
              mandate={mandate}
              onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)}
            />
          ))}

          {/* Self-created drafts */}
          {selfCreatedMandates.map(mandate => (
            <MandateCaseCard
              key={mandate.id}
              mandate={mandate}
              onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Keine aktiven Mandate</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Erstellen Sie ein eigenes Mandat oder warten Sie auf Zuweisungen.
            </p>
            <Button size="lg" onClick={() => navigate('/portal/akquise-manager/mandate/neu')}>
              <Plus className="mr-2 h-5 w-5" />
              Erstes Mandat erstellen
            </Button>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}

// ============================================================================
// Mandate Detail — Stepper + continuous vertical flow (no tabs)
// ============================================================================
function AkquiseMandateDetail() {
  const { mandateId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: mandate, isLoading } = useAcqMandate(mandateId);
  const acceptMandate = useAcceptAcqMandate();

  if (isLoading) {
    return <PageShell><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  }

  if (!mandate) {
    return (
      <PageShell>
        <Card><CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Mandat nicht gefunden</h3>
          <Button className="mt-4" onClick={() => navigate('/portal/akquise-manager/dashboard')}>Zurück</Button>
        </CardContent></Card>
      </PageShell>
    );
  }

  const needsGate = mandate.status === 'assigned' && !mandate.split_terms_confirmed_at;

  return (
    <PageShell>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/akquise-manager/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono">{mandate.code}</h1>
            <Badge variant={MANDATE_STATUS_CONFIG[mandate.status].variant as 'default' | 'secondary' | 'destructive' | 'outline'}>
              {MANDATE_STATUS_CONFIG[mandate.status].label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {canViewClientInfo(mandate) && mandate.client_display_name && (
              <span>{mandate.client_display_name} •</span>
            )}
            {mandate.asset_focus && mandate.asset_focus.length > 0 && (
              <span>{mandate.asset_focus.join(', ')}</span>
            )}
            {(mandate.price_min || mandate.price_max) && (
              <span className="ml-1">
                • {mandate.price_min && `ab ${(mandate.price_min / 1000000).toFixed(1)}M €`}
                {mandate.price_min && mandate.price_max && ' – '}
                {mandate.price_max && `bis ${(mandate.price_max / 1000000).toFixed(1)}M €`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stepper */}
      <AkquiseStepper currentStatus={mandate.status} hasTermsGate={needsGate} />

      {/* Gate Panel */}
      {needsGate && (
        <>
          <SectionHeader number={1} title="Split-Bestätigung" description="Bestätigen Sie die Provisionsvereinbarung, um das Mandat zu aktivieren." icon={<CheckCircle2 className="h-5 w-5" />} />
          <Card className="border-primary/30">
            <CardContent className="p-6">
              <TermsGatePanel
                templateCode="ACQ_MANDATE_ACCEPTANCE_V1"
                templateVariables={{
                  partner_name: profile?.display_name || user?.email || 'Akquise-Manager',
                  partner_email: user?.email || '',
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
        </>
      )}

      {/* Active Mandate — Continuous Akte */}
      {!needsGate && (
        <>
          {/* Suchprofil Summary (Bank table) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Suchprofil</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                <TableRow label="Mandat" value={mandate.code} />
                {canViewClientInfo(mandate) && mandate.client_display_name && (
                  <TableRow label="Mandant" value={mandate.client_display_name} />
                )}
                <TableRow label="Asset-Fokus" value={mandate.asset_focus?.join(', ') || '–'} />
                <TableRow label="Preisspanne" value={
                  mandate.price_min || mandate.price_max
                    ? [
                        mandate.price_min ? `ab ${(mandate.price_min / 1000000).toFixed(1)}M €` : '',
                        mandate.price_max ? `bis ${(mandate.price_max / 1000000).toFixed(1)}M €` : '',
                      ].filter(Boolean).join(' – ')
                    : '–'
                } />
                <TableRow label="Zielrendite" value={mandate.yield_target ? `${mandate.yield_target}%` : '–'} />
                {mandate.profile_text_long && (
                  <TableRow label="Profil" value={mandate.profile_text_long} />
                )}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Section 1: Sourcing */}
          <SectionHeader number={1} title="Sourcing & Recherche" description="Immobilienportale durchsuchen und passende Objekte identifizieren" icon={<Search className="h-5 w-5" />} />
          <SourcingTab mandateId={mandate.id} mandateCode={mandate.code} />

          <Separator />

          {/* Section 2: Outreach */}
          <SectionHeader number={2} title="Outreach" description="Kontakte anschreiben und Angebote einholen" icon={<Mail className="h-5 w-5" />} />
          <OutreachTab 
            mandateId={mandate.id} 
            mandateCode={mandate.code}
            clientName={canViewClientInfo(mandate) ? mandate.client_display_name ?? undefined : undefined}
            searchArea={(mandate.search_area as { region?: string } | null)?.region}
            assetFocus={mandate.asset_focus ?? undefined}
          />

          <Separator />

          {/* Section 3: Objekteingang */}
          <SectionHeader number={3} title="Objekteingang & Analyse" description="Eingegangene Angebote bewerten und analysieren" icon={<Inbox className="h-5 w-5" />} />
          <InboundTab mandateId={mandate.id} mandateCode={mandate.code} />

          <Separator />

          {/* Section 4: Analyse */}
          <SectionHeader number={4} title="Analyse & Kalkulation" description="Bestand- und Aufteiler-Kalkulationen durchführen" icon={<Brain className="h-5 w-5" />} />
          <AnalysisTab mandateId={mandate.id} mandateCode={mandate.code} />

          <Separator />

          {/* Section 5: Delivery */}
          <SectionHeader number={5} title="Delivery & Präsentation" description="Objekte dem Mandanten präsentieren" icon={<Send className="h-5 w-5" />} />
          <DeliveryTab 
            mandateId={mandate.id} 
            mandateCode={mandate.code}
            clientName={canViewClientInfo(mandate) ? mandate.client_display_name ?? undefined : undefined}
          />
        </>
      )}
    </PageShell>
  );
}

// ============================================================================
// Helpers
// ============================================================================
function SectionHeader({ number, title, description, icon }: { number: number; title: string; description: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 pt-2">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
        {number}
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[180px_1fr] px-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ============================================================================
// Tools page (unchanged)
// ============================================================================
function AkquiseTools() {
  return (
    <PageShell>
      <ModulePageHeader title="AKQUISE-TOOLS" description="Werkzeuge für Recherche, Bewertung und Kalkulation" />
      <ExposeDragDropUploader />
      <StandaloneCalculatorPanel />
      <PortalSearchTool />
      <PropertyResearchTool />
    </PageShell>
  );
}

// ============================================================================
// Mandate Create Wizard (placeholder, unchanged)
// ============================================================================
function MandatCreateWizardManager() {
  const navigate = useNavigate();
  return (
    <PageShell>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/akquise-manager/mandate')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">Neues Mandat erstellen</h1>
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
    </PageShell>
  );
}

// ============================================================================
// Router
// ============================================================================
export default function AkquiseManagerPage() {
  return (
    <div className="h-full overflow-auto">
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AkquiseDashboard />} />
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
