/**
 * AkquiseMandateDetail — Workbench-Ansicht (Sektionen 5-7)
 * 
 * Mandat-Widgets oben zum Switchen, dann Objekteingang, Analyse, Delivery.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { MandateCaseCard } from '@/components/akquise/MandateCaseCard';
import { TermsGatePanel } from '@/components/shared/TermsGatePanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Loader2, CheckCircle2, ArrowLeft, Inbox, Brain, Send } from 'lucide-react';
import { useAcqMandate, useAcceptAcqMandate, useAcqMandatesForManager } from '@/hooks/useAcqMandate';
import { MANDATE_STATUS_CONFIG, canViewClientInfo } from '@/types/acquisition';
import { AkquiseStepper } from '@/components/akquise/AkquiseStepper';
import { AcqSectionHeader as SectionHeader } from '@/components/akquise/AcqSectionHeader';
import { DESIGN, getActiveWidgetGlow } from '@/config/designManifest';
import { InboundTab, AnalysisTab, DeliveryTab } from './components';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import { isDemoId } from '@/engines/demoData/engine';

function TableRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[180px_1fr] px-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function AkquiseMandateDetail() {
  const { mandateId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: mandate, isLoading } = useAcqMandate(mandateId);
  const { data: allMandates = [] } = useAcqMandatesForManager();
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-AKQUISE-MANDAT');
  const acceptMandate = useAcceptAcqMandate();

  // Guard: redirect if demo mandate and toggle is off
  const isDemoMandate = mandateId ? isDemoId(mandateId) : false;

  if (isLoading) {
    return <PageShell><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  }

  if (!mandate || (isDemoMandate && !demoEnabled)) {
    return (
      <PageShell>
        <Card><CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">{isDemoMandate && !demoEnabled ? 'Demo-Mandat deaktiviert' : 'Mandat nicht gefunden'}</h3>
          <Button className="mt-4" onClick={() => navigate('/portal/akquise-manager/mandate')}>Zurück</Button>
        </CardContent></Card>
      </PageShell>
    );
  }

  const needsGate = mandate.status === 'assigned' && !mandate.split_terms_confirmed_at;

  return (
    <PageShell>
      {/* ═══ Header ═══ */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/portal/akquise-manager/mandate')}>
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

      {/* ═══ Mandat-Widgets zum Switchen ═══ */}
      {allMandates.filter(m => demoEnabled || !isDemoId(m.id)).length > 1 && (
        <WidgetGrid>
          {allMandates.filter(m => demoEnabled || !isDemoId(m.id)).map(m => (
            <WidgetCell key={m.id}>
              <div className={m.id === mandateId ? 'ring-2 ring-primary rounded-xl' : ''}>
                <MandateCaseCard
                  mandate={m}
                  onClick={() => navigate(`/portal/akquise-manager/mandate/${m.id}`)}
                />
              </div>
            </WidgetCell>
          ))}
        </WidgetGrid>
      )}

      <AkquiseStepper currentStatus={mandate.status} hasTermsGate={needsGate} />

      {/* ═══ Terms Gate ═══ */}
      {needsGate && (
        <>
          <SectionHeader number={1} title="Split-Bestätigung" description="Bestätige die Provisionsvereinbarung." icon={<CheckCircle2 className="h-5 w-5" />} />
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
                onAccept={async () => { await acceptMandate.mutateAsync(mandate.id); }}
                isPending={acceptMandate.isPending}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══ Workbench: Sektionen 5-7 ═══ */}
      {!needsGate && (
        <>
          {/* Suchprofil-Zusammenfassung */}
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
              </div>
            </CardContent>
          </Card>

          <Separator />
          <SectionHeader number={5} title="Objekteingang & Analyse" description="Eingegangene Angebote bewerten und analysieren" icon={<Inbox className="h-5 w-5" />} />
          <InboundTab mandateId={mandate.id} mandateCode={mandate.code} />

          <Separator />
          <SectionHeader number={6} title="Analyse & Kalkulation" description="Bestand- und Aufteiler-Kalkulationen durchführen" icon={<Brain className="h-5 w-5" />} />
          <AnalysisTab mandateId={mandate.id} mandateCode={mandate.code} />

          <Separator />
          <SectionHeader number={7} title="Delivery & Präsentation" description="Objekte dem Mandanten präsentieren" icon={<Send className="h-5 w-5" />} />
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
