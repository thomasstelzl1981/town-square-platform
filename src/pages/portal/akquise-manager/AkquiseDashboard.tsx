import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Loader2, Plus, Inbox, User, Phone, Mail, MapPin, Pencil, Target, TrendingUp, BarChart3, Users } from 'lucide-react';
import { 
  useAcqMandatesPending, 
  useAcqMandatesActive, 
} from '@/hooks/useAcqMandate';
import { MandateCaseCard, MandateCaseCardPlaceholder } from '@/components/akquise/MandateCaseCard';
import { useAuth } from '@/contexts/AuthContext';

export default function AkquiseDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: pendingMandates, isLoading: loadingPending } = useAcqMandatesPending();
  const { data: activeMandates, isLoading: loadingActive } = useAcqMandatesActive();

  if (loadingPending || loadingActive) {
    return <PageShell><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.display_name || '—';
  const address = [profile?.street, profile?.house_number].filter(Boolean).join(' ');
  const cityLine = [profile?.postal_code, profile?.city].filter(Boolean).join(' ');
  const fullAddress = [address, cityLine].filter(Boolean).join(', ');
  const activeCount = activeMandates?.length || 0;
  const pendingCount = pendingMandates?.length || 0;

  return (
    <PageShell>
      <ModulePageHeader 
        title="AKQUISE-MANAGER" 
        description="Ihre Akquise-Mandate im Überblick"
        actions={
          <Button onClick={() => navigate('/portal/akquise-manager/mandate')} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Neues Mandat
          </Button>
        }
      />

      {/* ── Visitenkarte + KPI-Ticker ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visitenkarte */}
        <Card className="overflow-hidden border-0 shadow-card">
          <div className="h-2 bg-gradient-to-r from-[hsl(160,60%,40%)] to-[hsl(180,50%,45%)]" />
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[hsl(160,60%,40%)] to-[hsl(180,50%,45%)] flex items-center justify-center shrink-0 shadow-md">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={fullName} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold">{fullName}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Akquise-Manager</p>
                  </div>
                </div>

                <div className="space-y-0.5">
                  {profile?.email && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                  {profile?.phone_mobile && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{profile.phone_mobile}</span>
                    </div>
                  )}
                  {fullAddress && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{fullAddress}</span>
                    </div>
                  )}
                </div>

                <div className="pt-1 flex gap-1.5">
                  <Badge variant="outline" className="text-[10px]">{activeCount} aktive Mandate</Badge>
                  {pendingCount > 0 && <Badge variant="secondary" className="text-[10px]">{pendingCount} neu</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI-Widget */}
        <Card className="overflow-hidden border-0 shadow-card">
          <div className="h-2 bg-gradient-to-r from-[hsl(35,90%,55%)] to-[hsl(25,85%,50%)]" />
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(35,90%,55%)] to-[hsl(25,85%,50%)] flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Akquise-Kennzahlen</h3>
                <p className="text-[10px] text-muted-foreground">Übersicht Ihrer Pipeline</p>
              </div>
            </div>

            <div className="space-y-1">
              {[
                { label: 'Aktive Mandate', value: String(activeCount), icon: Target },
                { label: 'Neue Aufträge', value: String(pendingCount), icon: Inbox },
                { label: 'Kontakte gesamt', value: '—', icon: Users },
                { label: 'Objekte in Pipeline', value: '—', icon: Briefcase },
              ].map((kpi) => (
                <div key={kpi.label} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <kpi.icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">{kpi.label}</span>
                  </div>
                  <span className="text-xs font-semibold font-mono">{kpi.value}</span>
                </div>
              ))}
            </div>

            <p className="text-[9px] text-muted-foreground text-right">Stand: {new Date().toLocaleDateString('de-DE')}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Sektion A: Aktive Mandate ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Aktive Mandate
        </h2>
        {activeMandates && activeMandates.length > 0 ? (
          <WidgetGrid>
            {activeMandates.map(mandate => (
              <WidgetCell key={mandate.id}>
                <MandateCaseCard
                  mandate={mandate}
                  onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)}
                />
              </WidgetCell>
            ))}
          </WidgetGrid>
        ) : (
          <WidgetGrid>
            <WidgetCell>
              <Card className="glass-card border-dashed border-2 h-full flex flex-col items-center justify-center opacity-50">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Keine aktiven Mandate</p>
                  <p className="text-[10px] text-muted-foreground">Erstellen Sie ein Mandat oder warten Sie auf Zuweisungen</p>
                </CardContent>
              </Card>
            </WidgetCell>
          </WidgetGrid>
        )}
      </div>

      {/* ── Sektion B: Neue Aufträge (Pending) ── */}
      <div className="space-y-3 mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Neue Aufträge
        </h2>
        {pendingMandates && pendingMandates.length > 0 ? (
          <WidgetGrid>
            {pendingMandates.map(mandate => (
              <WidgetCell key={mandate.id}>
                <MandateCaseCard
                  mandate={mandate}
                  onClick={() => navigate(`/portal/akquise-manager/mandate/${mandate.id}`)}
                />
              </WidgetCell>
            ))}
          </WidgetGrid>
        ) : (
          <WidgetGrid>
            <WidgetCell>
              <Card className="glass-card border-dashed border-2 h-full flex flex-col items-center justify-center opacity-50">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Inbox className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Keine neuen Aufträge</p>
                  <p className="text-[10px] text-muted-foreground">Neue Mandate erscheinen hier nach Zuweisung</p>
                </CardContent>
              </Card>
            </WidgetCell>
          </WidgetGrid>
        )}
      </div>
    </PageShell>
  );
}
