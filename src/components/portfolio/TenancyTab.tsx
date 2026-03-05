/**
 * TenancyTab — Orchestrator for lease management within a property unit.
 * Delegates UI to sub-components in ./tenancy/
 * 
 * R-11 Refactoring: 904 → ~180 lines
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, UserPlus, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLeaseLifecycle } from '@/hooks/useLeaseLifecycle';
import { useTenancyDeadlines } from '@/hooks/useTenancyDeadlines';
import { useMeterReadings } from '@/hooks/useMeterReadings';
import {
  TenancyLeaseCard,
  TenancyNewLeaseCard, EMPTY_NEW_LEASE,
  TenancyHistoricalLeases,
  TenancyTLCSections,
} from './tenancy';
import type {
  LeaseWithContact, Contact, LeaseEdits, LetterType,
} from './tenancy/tenancyTypes';
import { formatCurrency } from './tenancy/tenancyTypes';
import type { NewLeaseState } from './tenancy/TenancyNewLeaseCard';

interface TenancyTabProps {
  propertyId: string;
  tenantId: string;
  unitId: string;
}

export function TenancyTab({ propertyId, tenantId, unitId }: TenancyTabProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allLeases, setAllLeases] = useState<LeaseWithContact[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState<LeaseEdits>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newLease, setNewLease] = useState<NewLeaseState>(EMPTY_NEW_LEASE);
  const [deletingLeaseId, setDeletingLeaseId] = useState<string | null>(null);

  // Context data
  const [orgName, setOrgName] = useState('');
  const [propertyAddress, setPropertyAddress] = useState('');
  const [unitDescription, setUnitDescription] = useState('');
  const [unitAreaSqm, setUnitAreaSqm] = useState(0);
  const [unitRooms, setUnitRooms] = useState(0);
  const [propertyPostalCode, setPropertyPostalCode] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [propertyYearBuilt, setPropertyYearBuilt] = useState<number | undefined>();

  // TLC Hooks
  const { events, tasks, resolveEvent, updateTaskStatus } = useLeaseLifecycle();
  const { deadlines, completeDeadline, dismissDeadline } = useTenancyDeadlines(undefined, propertyId);
  const { readings, loading: metersLoading, fetchReadings } = useMeterReadings(unitId);

  const fetchData = useCallback(async () => {
    if (!unitId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [leasesRes, contactsRes, orgRes, propRes, unitRes] = await Promise.all([
        supabase.from('leases').select(`*, tenant_contact:contacts!leases_contact_fk(id, first_name, last_name, email)`).eq('unit_id', unitId).eq('tenant_id', tenantId).order('start_date', { ascending: false }),
        supabase.from('contacts').select('id, first_name, last_name, email').eq('tenant_id', tenantId).order('last_name'),
        supabase.from('organizations').select('name').eq('id', tenantId).single(),
        supabase.from('properties').select('address, address_house_no, city, postal_code, year_built').eq('id', propertyId).single(),
        supabase.from('units').select('unit_number, area_sqm, rooms').eq('id', unitId).single(),
      ]);

      const mappedLeases = (leasesRes.data || []).map(l => ({
        ...l,
        tenant_contact: Array.isArray(l.tenant_contact) ? l.tenant_contact[0] : l.tenant_contact,
      }));
      setAllLeases(mappedLeases);
      setContacts(contactsRes.data || []);
      if (orgRes.data?.name) setOrgName(orgRes.data.name);
      if (propRes.data) {
        const addr = [propRes.data.address, propRes.data.address_house_no].filter(Boolean).join(' ');
        setPropertyAddress([addr, propRes.data.postal_code, propRes.data.city].filter(Boolean).join(', '));
        setPropertyPostalCode(propRes.data.postal_code || '');
        setPropertyCity(propRes.data.city || '');
        if (propRes.data.year_built) setPropertyYearBuilt(propRes.data.year_built);
      }
      if (unitRes.data) {
        setUnitDescription(unitRes.data.unit_number || '');
        setUnitAreaSqm(unitRes.data.area_sqm || 0);
        setUnitRooms(unitRes.data.rooms || 0);
      }
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Fehler beim Laden');
    }
    setLoading(false);
  }, [unitId, tenantId, propertyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeLeases = allLeases.filter(l => ['active', 'notice_given', 'draft'].includes(l.status));
  const historicalLeases = allLeases.filter(l => ['terminated', 'ended'].includes(l.status));
  const isDirty = Object.keys(edits).length > 0;

  const updateLeaseField = (leaseId: string, field: string, value: string) => {
    setEdits(prev => ({ ...prev, [leaseId]: { ...prev[leaseId], [field]: value } }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const [leaseId, changes] of Object.entries(edits)) {
        const updateData: any = {};
        const numFields = ['rent_cold_eur', 'nk_advance_eur', 'heating_advance_eur', 'deposit_amount_eur'];
        for (const [k, v] of Object.entries(changes)) {
          if (numFields.includes(k)) updateData[k] = parseFloat(v as string) || null;
          else if (k === 'payment_due_day') updateData[k] = parseInt(v as string) || 1;
          else if (k === 'end_date' || k === 'next_rent_adjustment_date') updateData[k] = (v as string) || null;
          else updateData[k] = v;
        }
        if (changes.rent_cold_eur !== undefined || changes.nk_advance_eur !== undefined || changes.heating_advance_eur !== undefined) {
          const lease = allLeases.find(l => l.id === leaseId);
          updateData.monthly_rent = (updateData.rent_cold_eur ?? lease?.rent_cold_eur ?? 0) + (updateData.nk_advance_eur ?? lease?.nk_advance_eur ?? 0) + (updateData.heating_advance_eur ?? lease?.heating_advance_eur ?? 0);
        }
        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase.from('leases').update(updateData).eq('id', leaseId);
          if (error) throw error;
        }
      }
      setEdits({});
      toast.success('Mietverträge gespeichert');
      await fetchData();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || 'Fehler beim Speichern');
    }
    setSaving(false);
  };

  const handleCreateLease = async () => {
    if (!newLease.tenant_contact_id || !newLease.rent_cold_eur || !newLease.start_date) {
      toast.error('Bitte alle Pflichtfelder ausfüllen'); return;
    }
    setSaving(true);
    try {
      const rentCold = parseFloat(newLease.rent_cold_eur) || 0;
      const nkAdv = parseFloat(newLease.nk_advance_eur) || 0;
      const heatAdv = parseFloat(newLease.heating_advance_eur) || 0;
      const { error } = await supabase.from('leases').insert({
        tenant_id: tenantId, unit_id: unitId, tenant_contact_id: newLease.tenant_contact_id,
        monthly_rent: rentCold + nkAdv + heatAdv, start_date: newLease.start_date,
        end_date: newLease.end_date || null, lease_type: newLease.lease_type,
        rent_cold_eur: rentCold, nk_advance_eur: nkAdv, heating_advance_eur: heatAdv,
        deposit_amount_eur: parseFloat(newLease.deposit_amount_eur) || null,
        deposit_status: newLease.deposit_status, payment_due_day: parseInt(newLease.payment_due_day) || 1,
        rent_model: newLease.rent_model, next_rent_adjustment_date: newLease.next_rent_adjustment_date || null,
        status: 'draft',
      });
      if (error) throw error;
      toast.success('Mietvertrag erstellt');
      setIsCreating(false);
      setNewLease(EMPTY_NEW_LEASE);
      await fetchData();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || 'Fehler beim Erstellen');
    }
    setSaving(false);
  };

  const handleDeleteLease = async (leaseId: string) => {
    setDeletingLeaseId(leaseId);
    try {
      const { error } = await supabase.from('leases').delete().eq('id', leaseId);
      if (error) throw error;
      toast.success('Mietvertrag gelöscht');
      await fetchData();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || 'Fehler beim Löschen');
    }
    setDeletingLeaseId(null);
  };

  const handleActivateLease = async (leaseId: string) => {
    try {
      const { error } = await supabase.from('leases').update({ status: 'active' }).eq('id', leaseId);
      if (error) throw error;
      toast.success('Mietvertrag aktiviert');
      await fetchData();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || 'Fehler beim Aktivieren');
    }
  };

  const handleOpenLetterGenerator = (lease: LeaseWithContact, letterType: LetterType) => {
    if (!lease.tenant_contact) { toast.error('Kein Kontakt hinterlegt'); return; }
    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('de-DE') : '–';
    const templates: Record<LetterType, { subject: string; prompt: string }> = {
      kuendigung: { subject: 'Kündigung Ihres Mietvertrages', prompt: `Erstelle eine formelle Kündigung des Mietvertrages für ${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}. Der Mietvertrag begann am ${formatDate(lease.start_date)}. Die aktuelle Warmmiete beträgt ${formatCurrency(lease.monthly_rent)}.` },
      mieterhoehung: { subject: 'Mieterhöhungsverlangen', prompt: `Erstelle ein Mieterhöhungsverlangen für ${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}. Die aktuelle Kaltmiete beträgt ${formatCurrency(lease.rent_cold_eur || 0)}.` },
      abmahnung: { subject: 'Abmahnung wegen Vertragsverletzung', prompt: `Erstelle eine Abmahnung für ${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}.` },
    };
    const t = templates[letterType];
    navigate(`/portal/office/brief?${new URLSearchParams({ contactId: lease.tenant_contact.id, subject: t.subject, prompt: t.prompt, leaseId: lease.id }).toString()}`);
  };

  // Guards
  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!unitId) return <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>Keine Einheit gefunden.</AlertDescription></Alert>;
  if (error) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Mietverträge</h3>
        <Button size="sm" className="h-7 text-xs" onClick={() => setIsCreating(true)} disabled={isCreating}>
          <UserPlus className="mr-1 h-3 w-3" />Neuen Vertrag anlegen
        </Button>
      </div>

      {isCreating && (
        <TenancyNewLeaseCard
          contacts={contacts} newLease={newLease}
          onUpdate={(u) => setNewLease(prev => ({ ...prev, ...u }))}
          onCreate={handleCreateLease} onCancel={() => setIsCreating(false)} saving={saving}
        />
      )}

      {activeLeases.length > 0 ? (
        <div className="space-y-4">
          {activeLeases.map(lease => (
            <TenancyLeaseCard
              key={lease.id} lease={lease} edits={edits}
              onUpdateField={updateLeaseField} onDelete={handleDeleteLease}
              onActivate={handleActivateLease} onOpenLetter={handleOpenLetterGenerator}
              deletingLeaseId={deletingLeaseId}
            />
          ))}
        </div>
      ) : !isCreating && (
        <Card><CardContent className="py-8 text-center"><UserPlus className="h-10 w-10 mx-auto text-muted-foreground/40" /><p className="mt-2 text-sm text-muted-foreground">Keine aktiven Mietverträge</p></CardContent></Card>
      )}

      <TenancyHistoricalLeases leases={historicalLeases} />

      <TenancyTLCSections
        activeLeases={activeLeases} propertyId={propertyId} tenantId={tenantId} unitId={unitId}
        orgName={orgName} propertyAddress={propertyAddress} propertyCity={propertyCity}
        propertyPostalCode={propertyPostalCode} unitDescription={unitDescription}
        unitAreaSqm={unitAreaSqm} unitRooms={unitRooms} propertyYearBuilt={propertyYearBuilt}
        events={events} tasks={tasks} resolveEvent={resolveEvent} updateTaskStatus={updateTaskStatus}
        deadlines={deadlines as any} completeDeadline={(id) => completeDeadline.mutate(id)}
        dismissDeadline={(id) => dismissDeadline.mutate(id)}
        readings={readings} metersLoading={metersLoading} fetchReadings={fetchReadings}
      />

      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 z-50">
          <div className="container mx-auto flex items-center justify-between max-w-7xl">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />Ungespeicherte Änderungen
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEdits({})}>Verwerfen</Button>
              <Button size="sm" onClick={handleSaveAll} disabled={saving}>
                {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}Speichern
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
