import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageShell } from '@/components/shared/PageShell';
import { TermsGatePanel } from '@/components/shared/TermsGatePanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Loader2, CheckCircle2, ArrowLeft, Search, Mail, Inbox, Brain, Send } from 'lucide-react';
import { useAcqMandate, useAcceptAcqMandate } from '@/hooks/useAcqMandate';
import { MANDATE_STATUS_CONFIG, canViewClientInfo } from '@/types/acquisition';
import { AkquiseStepper } from '@/components/akquise/AkquiseStepper';
import { 
  SourcingTab, OutreachTab, InboundTab, AnalysisTab, DeliveryTab 
} from './components';

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

export default function AkquiseMandateDetail() {
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

      <AkquiseStepper currentStatus={mandate.status} hasTermsGate={needsGate} />

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

      {!needsGate && (
        <>
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
          <SectionHeader number={1} title="Sourcing & Recherche" description="Immobilienportale durchsuchen und passende Objekte identifizieren" icon={<Search className="h-5 w-5" />} />
          <SourcingTab mandateId={mandate.id} mandateCode={mandate.code} />

          <Separator />
          <SectionHeader number={2} title="Outreach" description="Kontakte anschreiben und Angebote einholen" icon={<Mail className="h-5 w-5" />} />
          <OutreachTab 
            mandateId={mandate.id} 
            mandateCode={mandate.code}
            clientName={canViewClientInfo(mandate) ? mandate.client_display_name ?? undefined : undefined}
            searchArea={(mandate.search_area as { region?: string } | null)?.region}
            assetFocus={mandate.asset_focus ?? undefined}
          />

          <Separator />
          <SectionHeader number={3} title="Objekteingang & Analyse" description="Eingegangene Angebote bewerten und analysieren" icon={<Inbox className="h-5 w-5" />} />
          <InboundTab mandateId={mandate.id} mandateCode={mandate.code} />

          <Separator />
          <SectionHeader number={4} title="Analyse & Kalkulation" description="Bestand- und Aufteiler-Kalkulationen durchführen" icon={<Brain className="h-5 w-5" />} />
          <AnalysisTab mandateId={mandate.id} mandateCode={mandate.code} />

          <Separator />
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
