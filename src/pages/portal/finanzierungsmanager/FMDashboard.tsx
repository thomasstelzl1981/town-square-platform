/**
 * FM Dashboard — (A) Fälle in Bearbeitung, (B) Finanzierungsmandate, (C) Manager-Visitenkarte mit §34i
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Check, X, Inbox, User, Phone, Mail, MapPin, Globe, Shield, Pencil, Building2, Landmark, ExternalLink } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { FinanceCaseCard, FinanceCaseCardPlaceholder } from '@/components/finanzierungsmanager/FinanceCaseCard';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAcceptMandate, useUpdateMandateStatus, useFinanceMandates } from '@/hooks/useFinanceMandate';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';

import { toast } from 'sonner';
import type { FutureRoomCase } from '@/types/finance';

interface Props {
  cases: FutureRoomCase[];
  isLoading: boolean;
}

const eurFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function getRequestStatus(c: FutureRoomCase): string {
  return c.finance_mandates?.finance_requests?.status || c.status;
}

function getApplicantName(c: FutureRoomCase): string {
  const ap = c.finance_mandates?.finance_requests?.applicant_profiles?.[0];
  if (ap?.first_name && ap?.last_name) return `${ap.first_name} ${ap.last_name}`;
  return c.finance_mandates?.public_id || 'Unbekannt';
}

function getLoanAmount(c: FutureRoomCase): number | null {
  return c.finance_mandates?.finance_requests?.applicant_profiles?.[0]?.loan_amount_requested || null;
}

// Editable profile fields for the business card
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
  reg_34i_number: string;
  reg_34i_ihk: string;
  reg_34i_authority: string;
  reg_vermittler_id: string;
  insurance_provider: string;
  insurance_policy_no: string;
}

function EditRow({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-center border-b py-1.5 px-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input className="h-8 text-sm" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export default function FMDashboard({ cases, isLoading }: Props) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const acceptMandate = useAcceptMandate();
  const updateStatus = useUpdateMandateStatus();
  const [editOpen, setEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editData, setEditData] = useState<EditableProfile>({
    first_name: '', last_name: '', email: '', phone_mobile: '', phone_landline: '',
    street: '', house_number: '', postal_code: '', city: '',
    letterhead_company_line: '', letterhead_website: '',
    reg_34i_number: '', reg_34i_ihk: '', reg_34i_authority: '',
    reg_vermittler_id: '', insurance_provider: '', insurance_policy_no: '',
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
        reg_34i_number: (profile as any).reg_34i_number || '',
        reg_34i_ihk: (profile as any).reg_34i_ihk || '',
        reg_34i_authority: (profile as any).reg_34i_authority || '',
        reg_vermittler_id: (profile as any).reg_vermittler_id || '',
        insurance_provider: (profile as any).insurance_provider || '',
        insurance_policy_no: (profile as any).insurance_policy_no || '',
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
        reg_34i_number: editData.reg_34i_number || null,
        reg_34i_ihk: editData.reg_34i_ihk || null,
        reg_34i_authority: editData.reg_34i_authority || null,
        reg_vermittler_id: editData.reg_vermittler_id || null,
        insurance_provider: editData.insurance_provider || null,
        insurance_policy_no: editData.insurance_policy_no || null,
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

  // Filter: only cases NOT yet submitted
  const SUBMITTED_STATUSES = ['submitted_to_bank', 'completed', 'rejected', 'archived'];
  const activeCases = cases.filter(c => !SUBMITTED_STATUSES.includes(getRequestStatus(c)));

  // Fetch pending mandates assigned to this manager
  const { data: allMandates = [], isLoading: loadingMandates } = useFinanceMandates();
  const pendingMandates = (allMandates as any[]).filter(
    (m) => (m.status === 'delegated' || m.status === 'assigned') && m.assigned_manager_id === user?.id
  );

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const handleCaseClick = (requestId: string) => {
    navigate(`faelle/${requestId}`);
  };

  const handleAcceptMandate = async (mandateId: string) => {
    try {
      await acceptMandate.mutateAsync(mandateId);
    } catch {
      // Error handled in hook
    }
  };

  const handleDeclineMandate = async (mandateId: string) => {
    try {
      await updateStatus.mutateAsync({ mandateId, status: 'rejected' as any });
      toast.success('Mandat abgelehnt');
    } catch {
      // Error handled in hook
    }
  };

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.display_name || '—';
  const address = [profile?.street, profile?.house_number].filter(Boolean).join(' ');
  const cityLine = [profile?.postal_code, profile?.city].filter(Boolean).join(' ');
  const fullAddress = [address, cityLine].filter(Boolean).join(', ');
  const reg34i = (profile as any)?.reg_34i_number;
  const regIhk = (profile as any)?.reg_34i_ihk;
  const insProvider = (profile as any)?.insurance_provider;

  return (
    <PageShell>
      <ModulePageHeader
        title="FINANZIERUNGSMANAGER"
        description={`${activeCases.length} Fälle in Bearbeitung — noch nicht eingereicht.`}
        actions={
          <Button onClick={() => navigate('/portal/finanzierungsmanager/finanzierungsakte')} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Neuer Fall
          </Button>
        }
      />

      {/* Manager Visitenkarte + FutureRoom Tile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visitenkarte */}
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={fullName} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{fullName}</h3>
                    <p className="text-xs text-muted-foreground">Finanzierungsmanager</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{activeCases.length} aktive Fälle</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openEditSheet}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  {profile?.email && (
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                  {profile?.phone_mobile && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{profile.phone_mobile}</span>
                    </div>
                  )}
                  {fullAddress && (
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{fullAddress}</span>
                    </div>
                  )}
                  {profile?.letterhead_company_line && (
                    <div className="flex items-center gap-2 text-xs">
                      <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{profile.letterhead_company_line}</span>
                    </div>
                  )}
                </div>

                {(reg34i || regIhk || insProvider) && (
                  <>
                    <Separator className="my-1" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                      {reg34i && (
                        <div className="flex items-center gap-2 text-xs">
                          <Shield className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>§34i: {reg34i}</span>
                        </div>
                      )}
                      {regIhk && (
                        <div className="text-xs text-muted-foreground">IHK: {regIhk}</div>
                      )}
                      {insProvider && (
                        <div className="text-xs text-muted-foreground">VSH: {insProvider}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FutureRoom Branding Tile */}
        <Card className="overflow-hidden border-0 shadow-card">
          <CardContent className="p-0 h-full">
            <div className="h-full bg-gradient-to-br from-[hsl(165,70%,36%)] to-[hsl(158,64%,52%)] p-6 flex flex-col justify-between text-white">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Landmark className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">
                      Future<span className="font-light">Room</span>
                    </h3>
                    <p className="text-[11px] text-white/70 uppercase tracking-wider">Digitale Finanzierungsorchesterierung</p>
                  </div>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">
                  Ihre Plattform für KI-gestützte Finanzierungsaufbereitung und digitale Bankeinreichung.
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Badge className="bg-white/20 text-white border-white/30 text-[10px] hover:bg-white/30">
                  Über 400 Bankpartner
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-xs"
                  onClick={() => window.open('/website/futureroom', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Zur Website
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Profil bearbeiten</SheetTitle>
            <SheetDescription>Kontaktdaten und §34i-Pflichtangaben</SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Kontaktdaten</h4>
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

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">§34i Gewerbeerlaubnis</h4>
              <div className="border rounded-lg">
                <EditRow label="Registrierungsnr." value={editData.reg_34i_number} onChange={handleFieldChange('reg_34i_number')} placeholder="D-F-XXX-XXXX-XX" />
                <EditRow label="Zuständige IHK" value={editData.reg_34i_ihk} onChange={handleFieldChange('reg_34i_ihk')} placeholder="z.B. IHK München" />
                <EditRow label="Erlaubnisbehörde" value={editData.reg_34i_authority} onChange={handleFieldChange('reg_34i_authority')} placeholder="z.B. Gewerbeamt München" />
                <EditRow label="Vermittlerregister-Nr." value={editData.reg_vermittler_id} onChange={handleFieldChange('reg_vermittler_id')} placeholder="D-W-XXX-XXXX-XX" />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Berufshaftpflicht</h4>
              <div className="border rounded-lg">
                <EditRow label="Versicherer" value={editData.insurance_provider} onChange={handleFieldChange('insurance_provider')} placeholder="z.B. HDI Versicherung" />
                <EditRow label="Policen-Nr." value={editData.insurance_policy_no} onChange={handleFieldChange('insurance_policy_no')} />
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

      {/* Section A: Fälle in Bearbeitung */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Fälle in Bearbeitung
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {activeCases.map(c => (
            <FinanceCaseCard
              key={c.id}
              caseData={c}
              onClick={handleCaseClick}
            />
          ))}
          {activeCases.length === 0 && (
            <FinanceCaseCardPlaceholder />
          )}
        </div>
      </div>

      {/* Section B: Finanzierungsmandate */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Finanzierungsmandate
        </h3>
        {loadingMandates ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingMandates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Inbox className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Keine neuen Mandate vorhanden.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingMandates.map((m: any) => {
              const req = m.finance_requests;
              const ap = req?.applicant_profiles?.[0];
              const name = ap?.first_name && ap?.last_name
                ? `${ap.first_name} ${ap.last_name}`
                : 'Unbekannt';
              const loan = ap?.loan_amount_requested;
              return (
                <Card key={m.id} className="border-primary/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">{m.public_id || m.id.slice(0, 8)}</span>
                      <Badge variant="outline">{m.status === 'delegated' ? 'Zugewiesen' : 'Angefragt'}</Badge>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{name}</p>
                      {loan && <p className="text-xs text-muted-foreground">{eurFormat.format(loan)}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAcceptMandate(m.id)}
                        disabled={acceptMandate.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Annehmen
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDeclineMandate(m.id)}
                        disabled={updateStatus.isPending}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Ablehnen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
