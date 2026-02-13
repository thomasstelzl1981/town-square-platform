import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { PageShell } from '@/components/shared/PageShell';
import { WidgetGrid } from '@/components/shared/WidgetGrid';
import { WidgetCell } from '@/components/shared/WidgetCell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Loader2, Plus, Inbox, User, Phone, Mail, MapPin, Pencil, Target, TrendingUp, BarChart3, Users, Building2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DESIGN } from '@/config/designManifest';
import { 
  useAcqMandatesPending, 
  useAcqMandatesActive, 
} from '@/hooks/useAcqMandate';
import { MandateCaseCard, MandateCaseCardPlaceholder } from '@/components/akquise/MandateCaseCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

interface EditableProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone_mobile: string;
  phone_landline: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  letterhead_company_line: string;
  letterhead_website: string;
}

function EditRow({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-0.5 md:grid md:grid-cols-[180px_1fr] md:items-center', DESIGN.TABULAR_FORM.ROW_BORDER, 'py-1.5 px-1')}>
      <Label className={DESIGN.TYPOGRAPHY.LABEL}>{label}</Label>
      <Input className={DESIGN.TABULAR_FORM.INPUT} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export default function AkquiseDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: pendingMandates, isLoading: loadingPending } = useAcqMandatesPending();
  const { data: activeMandates, isLoading: loadingActive } = useAcqMandatesActive();

  const [editOpen, setEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<EditableProfile>({
    first_name: '', last_name: '', email: '', phone_mobile: '', phone_landline: '',
    street: '', house_number: '', postal_code: '', city: '',
    letterhead_company_line: '', letterhead_website: '',
  });

  const openEditSheet = () => {
    if (profile) {
      setEditData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone_mobile: profile.phone_mobile || '',
        phone_landline: profile.phone_landline || '',
        street: profile.street || '',
        house_number: profile.house_number || '',
        postal_code: profile.postal_code || '',
        city: profile.city || '',
        letterhead_company_line: profile.letterhead_company_line || '',
        letterhead_website: profile.letterhead_website || '',
      });
    }
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        first_name: editData.first_name || null,
        last_name: editData.last_name || null,
        email: editData.email || null,
        phone_mobile: editData.phone_mobile || null,
        phone_landline: editData.phone_landline || null,
        street: editData.street || null,
        house_number: editData.house_number || null,
        postal_code: editData.postal_code || null,
        city: editData.city || null,
        letterhead_company_line: editData.letterhead_company_line || null,
        letterhead_website: editData.letterhead_website || null,
      } as any).eq('id', user.id);
      if (error) throw error;
      toast.success('Profil gespeichert');
      setEditOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof EditableProfile) => (value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

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
      <div className={DESIGN.DASHBOARD_HEADER.GRID}>
        {/* Visitenkarte */}
        <Card className={cn("overflow-hidden border-0 shadow-card", DESIGN.DASHBOARD_HEADER.CARD_HEIGHT)}>
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
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openEditSheet}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
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
        <Card className={cn("overflow-hidden border-0 shadow-card", DESIGN.DASHBOARD_HEADER.CARD_HEIGHT)}>
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

      {/* Edit Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Profil bearbeiten</SheetTitle>
            <SheetDescription>Kontaktdaten für Ihre Akquise-Visitenkarte</SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
            <div>
              <h4 className={cn(DESIGN.TYPOGRAPHY.SECTION_TITLE, 'text-muted-foreground mb-2')}>Kontaktdaten</h4>
              <div className="border rounded-lg">
                <EditRow label="Vorname" value={editData.first_name} onChange={handleFieldChange('first_name')} />
                <EditRow label="Nachname" value={editData.last_name} onChange={handleFieldChange('last_name')} />
                <EditRow label="E-Mail" value={editData.email} onChange={handleFieldChange('email')} />
                <EditRow label="Mobil" value={editData.phone_mobile} onChange={handleFieldChange('phone_mobile')} placeholder="+49 ..." />
                <EditRow label="Festnetz" value={editData.phone_landline} onChange={handleFieldChange('phone_landline')} placeholder="+49 ..." />
                <EditRow label="Straße" value={editData.street} onChange={handleFieldChange('street')} />
                <EditRow label="Hausnummer" value={editData.house_number} onChange={handleFieldChange('house_number')} />
                <EditRow label="PLZ" value={editData.postal_code} onChange={handleFieldChange('postal_code')} />
                <EditRow label="Ort" value={editData.city} onChange={handleFieldChange('city')} />
                <EditRow label="Firma" value={editData.letterhead_company_line} onChange={handleFieldChange('letterhead_company_line')} />
                <EditRow label="Website" value={editData.letterhead_website} onChange={handleFieldChange('letterhead_website')} placeholder="https://..." />
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Speichern
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Sektion A: Aktive Mandate ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Aktive Mandate
        </h3>
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
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Neue Aufträge
        </h3>
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
