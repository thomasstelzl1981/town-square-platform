/**
 * Akquise-Manager Page (MOD-12)
 * AkquiseManager Workbench with Gate, Sourcing, Outreach, Analysis
 */

import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ModuleHowItWorks, moduleContents } from '@/components/portal/HowItWorks';
import { ModuleTilePage } from '@/components/shared/ModuleTilePage';
import { WorkflowSubbar } from '@/components/shared/WorkflowSubbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Users, FileText, Wrench, Plus, Loader2, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useAcqMandatesPending, useAcqMandatesActive, useAcqMandate, useAcceptAcqMandate } from '@/hooks/useAcqMandate';
import { MANDATE_STATUS_CONFIG, canViewClientInfo } from '@/types/acquisition';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

// Workflow steps for mandate detail
export const AKQUISE_MANAGER_WORKFLOW_STEPS = [
  { id: 'gate', label: 'Annahme', path: 'dashboard' },
  { id: 'sourcing', label: 'Sourcing', path: 'kunden' },
  { id: 'outreach', label: 'Outreach', path: 'mandate' },
  { id: 'delivery', label: 'Delivery', path: 'tools' },
];

// Dashboard with Pending + Active Mandates
function AkquiseDashboard() {
  const navigate = useNavigate();
  const { data: pendingMandates, isLoading: loadingPending } = useAcqMandatesPending();
  const { data: activeMandates, isLoading: loadingActive } = useAcqMandatesActive();

  if (loadingPending || loadingActive) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasMandates = (pendingMandates?.length || 0) + (activeMandates?.length || 0) > 0;

  if (!hasMandates) {
    return (
      <ModuleTilePage
        title="Dashboard"
        description="Übersicht Ihrer aktuellen Akquise-Aktivitäten"
        icon={Briefcase}
        moduleBase="akquise-manager"
        status="empty"
        emptyTitle="Keine aktiven Mandate"
        emptyDescription="Warten Sie auf Mandatszuweisungen von Zone-1 Acquiary."
        emptyIcon={Briefcase}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Ihre Akquise-Mandate im Überblick</p>
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
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Aktive Mandate ({activeMandates?.length})
          </h3>
          {activeMandates?.map((mandate) => (
            <Card key={mandate.id} className="border-green-200 cursor-pointer hover:border-primary/50"
              onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-green-600" />
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
    </div>
  );
}

// Mandate Detail with Gate Panel
function AkquiseMandateDetail() {
  const { mandateId } = useParams();
  const navigate = useNavigate();
  const { data: mandate, isLoading } = useAcqMandate(mandateId);
  const acceptMandate = useAcceptAcqMandate();

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/akquise-manager/dashboard')}>←</Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-mono">{mandate.code}</h1>
            <Badge variant={MANDATE_STATUS_CONFIG[mandate.status].variant as any}>
              {MANDATE_STATUS_CONFIG[mandate.status].label}
            </Badge>
          </div>
          {canViewClientInfo(mandate) && mandate.client_display_name && (
            <p className="text-muted-foreground">{mandate.client_display_name}</p>
          )}
        </div>
      </div>

      {/* Gate Panel */}
      {needsGate && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle>Split-Bestätigung erforderlich</CardTitle>
            <CardDescription>
              Bestätigen Sie die Provisionsvereinbarung, um das Mandat zu aktivieren und 
              die Mandantendaten einzusehen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-lg border">
              <p className="text-sm">Nach Bestätigung erhalten Sie Zugriff auf die vollständigen Mandantendaten und können mit der Akquise beginnen.</p>
            </div>
            <Button onClick={() => acceptMandate.mutate(mandate.id)} disabled={acceptMandate.isPending}>
              {acceptMandate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Split bestätigen & Mandat annehmen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Mandate Workbench */}
      {!needsGate && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle>Sourcing</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground text-sm">Kontaktrecherche via Apollo/Apify (Placeholder)</CardContent></Card>
          <Card><CardHeader><CardTitle>Outreach</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground text-sm">System-E-Mail versenden (Placeholder)</CardContent></Card>
          <Card><CardHeader><CardTitle>Inbound</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground text-sm">Eingegangene Nachrichten (Placeholder)</CardContent></Card>
          <Card><CardHeader><CardTitle>Analyse</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground text-sm">KI Research + GeoMap + Rechner (Placeholder)</CardContent></Card>
        </div>
      )}
    </div>
  );
}

// Simple placeholder tiles
function AkquiseKunden() {
  return <ModuleTilePage title="Kunden" description="Kontaktverwaltung" icon={Users} moduleBase="akquise-manager" status="empty" emptyTitle="Keine Kontakte" emptyDescription="Fügen Sie Kontakte über Sourcing hinzu." emptyIcon={Users} />;
}

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
  return <ModuleTilePage title="Tools" description="Akquise-Werkzeuge" icon={Wrench} moduleBase="akquise-manager" status="empty" emptyTitle="Tools entdecken" emptyDescription="Rechner und Hilfsmittel." emptyIcon={Wrench} />;
}

export default function AkquiseManagerPage() {
  const content = moduleContents['MOD-12'];

  return (
    <div className="flex flex-col h-full">
      <WorkflowSubbar steps={AKQUISE_MANAGER_WORKFLOW_STEPS} moduleBase="akquise-manager" />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<ModuleHowItWorks content={content} />} />
          <Route path="dashboard" element={<AkquiseDashboard />} />
          <Route path="kunden" element={<AkquiseKunden />} />
          <Route path="mandate" element={<AkquiseMandate />} />
          <Route path="mandate/:mandateId" element={<AkquiseMandateDetail />} />
          <Route path="tools" element={<AkquiseTools />} />
          <Route path="*" element={<Navigate to="/portal/akquise-manager" replace />} />
        </Routes>
      </div>
    </div>
  );
}
