import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Loader2, AlertTriangle, UserPlus, Mail, CheckCircle, XCircle, Clock, History, Euro, Plus, FileText, TrendingUp, ChevronDown, Save, Trash2 } from 'lucide-react';
import { isDemoId } from '@/engines/demoData/engine';
import { WidgetDeleteOverlay } from '@/components/shared/WidgetDeleteOverlay';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Lease {
  id: string;
  status: string;
  monthly_rent: number;
  start_date: string;
  end_date: string | null;
  tenant_since: string | null;
  rent_increase: string | null;
  renter_org_id: string | null;
  tenant_contact_id: string;
  lease_type?: string;
  rent_cold_eur?: number;
  nk_advance_eur?: number;
  heating_advance_eur?: number;
  deposit_amount_eur?: number;
  deposit_status?: string;
  payment_due_day?: number;
  rent_model?: string;
  next_rent_adjustment_date?: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

interface TenancyTabProps {
  propertyId: string;
  tenantId: string;
  unitId: string;
}

const LEASE_TYPES = [
  { value: 'unbefristet', label: 'Unbefristet' },
  { value: 'befristet', label: 'Befristet' },
  { value: 'staffel', label: 'Staffelmiete' },
  { value: 'index', label: 'Indexmiete' },
  { value: 'gewerbe', label: 'Gewerbe' },
];

const DEPOSIT_STATUSES = [
  { value: 'PAID', label: 'Gezahlt' },
  { value: 'OPEN', label: 'Offen' },
  { value: 'PARTIAL', label: 'Teilweise' },
];

const RENT_MODELS = [
  { value: 'FIX', label: 'Festmiete' },
  { value: 'INDEX', label: 'Indexmiete' },
  { value: 'STAFFEL', label: 'Staffelmiete' },
];

type LetterType = 'kuendigung' | 'mieterhoehung' | 'abmahnung';

// Track edits per lease
interface LeaseEdits {
  [leaseId: string]: Partial<{
    lease_type: string;
    rent_cold_eur: string;
    nk_advance_eur: string;
    heating_advance_eur: string;
    deposit_amount_eur: string;
    deposit_status: string;
    payment_due_day: string;
    rent_model: string;
    next_rent_adjustment_date: string;
    start_date: string;
    end_date: string;
    tenant_contact_id: string;
  }>;
}

export function TenancyTab({ propertyId, tenantId, unitId }: TenancyTabProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allLeases, setAllLeases] = useState<(Lease & { tenant_contact?: Contact })[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [edits, setEdits] = useState<LeaseEdits>({});
  const [isCreating, setIsCreating] = useState(false);
  const [historicalOpen, setHistoricalOpen] = useState(false);

  // New lease form state
  const [newLease, setNewLease] = useState({
    tenant_contact_id: '',
    lease_type: 'unbefristet',
    start_date: '',
    end_date: '',
    rent_cold_eur: '',
    nk_advance_eur: '',
    heating_advance_eur: '',
    deposit_amount_eur: '',
    deposit_status: 'OPEN',
    payment_due_day: '1',
    rent_model: 'FIX',
    next_rent_adjustment_date: '',
  });

  const fetchData = useCallback(async () => {
    if (!unitId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const { data: leasesData } = await supabase
        .from('leases')
        .select(`*, tenant_contact:contacts!leases_contact_fk(id, first_name, last_name, email)`)
        .eq('unit_id', unitId)
        .eq('tenant_id', tenantId)
        .order('start_date', { ascending: false });

      const mappedLeases = (leasesData || []).map(lease => ({
        ...lease,
        tenant_contact: Array.isArray(lease.tenant_contact) ? lease.tenant_contact[0] : lease.tenant_contact,
      }));
      setAllLeases(mappedLeases);

      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .eq('tenant_id', tenantId)
        .order('last_name');
      setContacts(contactsData || []);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Fehler beim Laden');
    }
    setLoading(false);
  }, [unitId, tenantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeLeases = allLeases.filter(l => ['active', 'notice_given', 'draft'].includes(l.status));
  const historicalLeases = allLeases.filter(l => ['terminated', 'ended'].includes(l.status));

  const isDirty = Object.keys(edits).length > 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '–';
    return format(new Date(dateStr), 'dd.MM.yyyy', { locale: de });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default">Aktiv</Badge>;
      case 'draft': return <Badge variant="secondary">Entwurf</Badge>;
      case 'notice_given': return <Badge variant="destructive">Gekündigt</Badge>;
      case 'terminated': return <Badge variant="outline">Beendet</Badge>;
      case 'ended': return <Badge variant="outline">Beendet</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get current field value (edit overrides DB value)
  const getField = (lease: Lease, field: string): string => {
    const leaseEdits = edits[lease.id];
    if (leaseEdits && field in leaseEdits) return (leaseEdits as any)[field];
    const val = (lease as any)[field];
    return val != null ? String(val) : '';
  };

  const updateLeaseField = (leaseId: string, field: string, value: string) => {
    setEdits(prev => ({
      ...prev,
      [leaseId]: { ...prev[leaseId], [field]: value },
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const [leaseId, changes] of Object.entries(edits)) {
        const rentCold = parseFloat(changes.rent_cold_eur || '') || undefined;
        const nkAdvance = parseFloat(changes.nk_advance_eur || '') || undefined;
        const heatingAdvance = parseFloat(changes.heating_advance_eur || '') || undefined;

        const updateData: any = {};
        if (changes.lease_type !== undefined) updateData.lease_type = changes.lease_type;
        if (changes.rent_cold_eur !== undefined) updateData.rent_cold_eur = rentCold;
        if (changes.nk_advance_eur !== undefined) updateData.nk_advance_eur = nkAdvance;
        if (changes.heating_advance_eur !== undefined) updateData.heating_advance_eur = heatingAdvance;
        if (changes.deposit_amount_eur !== undefined) updateData.deposit_amount_eur = parseFloat(changes.deposit_amount_eur) || null;
        if (changes.deposit_status !== undefined) updateData.deposit_status = changes.deposit_status;
        if (changes.payment_due_day !== undefined) updateData.payment_due_day = parseInt(changes.payment_due_day) || 1;
        if (changes.rent_model !== undefined) updateData.rent_model = changes.rent_model;
        if (changes.next_rent_adjustment_date !== undefined) updateData.next_rent_adjustment_date = changes.next_rent_adjustment_date || null;
        if (changes.start_date !== undefined) updateData.start_date = changes.start_date;
        if (changes.end_date !== undefined) updateData.end_date = changes.end_date || null;

        // Recalc monthly_rent if any rent field changed
        if (rentCold !== undefined || nkAdvance !== undefined || heatingAdvance !== undefined) {
          const lease = allLeases.find(l => l.id === leaseId);
          const cold = rentCold ?? lease?.rent_cold_eur ?? 0;
          const nk = nkAdvance ?? lease?.nk_advance_eur ?? 0;
          const heat = heatingAdvance ?? lease?.heating_advance_eur ?? 0;
          updateData.monthly_rent = cold + nk + heat;
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
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    setSaving(true);
    try {
      const rentCold = parseFloat(newLease.rent_cold_eur) || 0;
      const nkAdvance = parseFloat(newLease.nk_advance_eur) || 0;
      const heatingAdvance = parseFloat(newLease.heating_advance_eur) || 0;

      const { error } = await supabase.from('leases').insert({
        tenant_id: tenantId,
        unit_id: unitId,
        tenant_contact_id: newLease.tenant_contact_id,
        monthly_rent: rentCold + nkAdvance + heatingAdvance,
        start_date: newLease.start_date,
        end_date: newLease.end_date || null,
        lease_type: newLease.lease_type,
        rent_cold_eur: rentCold,
        nk_advance_eur: nkAdvance,
        heating_advance_eur: heatingAdvance,
        deposit_amount_eur: parseFloat(newLease.deposit_amount_eur) || null,
        deposit_status: newLease.deposit_status,
        payment_due_day: parseInt(newLease.payment_due_day) || 1,
        rent_model: newLease.rent_model,
        next_rent_adjustment_date: newLease.next_rent_adjustment_date || null,
        status: 'draft',
      });
      if (error) throw error;
      toast.success('Mietvertrag erstellt');
      setIsCreating(false);
      setNewLease({
        tenant_contact_id: '', lease_type: 'unbefristet', start_date: '', end_date: '',
        rent_cold_eur: '', nk_advance_eur: '', heating_advance_eur: '', deposit_amount_eur: '',
        deposit_status: 'OPEN', payment_due_day: '1', rent_model: 'FIX', next_rent_adjustment_date: '',
      });
      await fetchData();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || 'Fehler beim Erstellen');
    }
    setSaving(false);
  };

  const [deletingLeaseId, setDeletingLeaseId] = useState<string | null>(null);
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

  const handleOpenLetterGenerator = (lease: Lease & { tenant_contact?: Contact }, letterType: LetterType) => {
    if (!lease.tenant_contact) { toast.error('Kein Kontakt hinterlegt'); return; }
    const templates: Record<LetterType, { subject: string; prompt: string }> = {
      kuendigung: {
        subject: 'Kündigung Ihres Mietvertrages',
        prompt: `Erstelle eine formelle Kündigung des Mietvertrages für ${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}. Der Mietvertrag begann am ${formatDate(lease.start_date)}. Die aktuelle Warmmiete beträgt ${formatCurrency(lease.monthly_rent)}.`,
      },
      mieterhoehung: {
        subject: 'Mieterhöhungsverlangen',
        prompt: `Erstelle ein Mieterhöhungsverlangen für ${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}. Die aktuelle Kaltmiete beträgt ${formatCurrency(lease.rent_cold_eur || 0)}.`,
      },
      abmahnung: {
        subject: 'Abmahnung wegen Vertragsverletzung',
        prompt: `Erstelle eine Abmahnung für ${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}.`,
      },
    };
    const template = templates[letterType];
    const params = new URLSearchParams({
      contactId: lease.tenant_contact.id,
      subject: template.subject,
      prompt: template.prompt,
      leaseId: lease.id,
    });
    navigate(`/portal/office/brief?${params.toString()}`);
  };

  const calculateWarmRent = (cold: string, nk: string, heating: string) =>
    (parseFloat(cold) || 0) + (parseFloat(nk) || 0) + (parseFloat(heating) || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!unitId) {
    return (
      <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>Keine Einheit gefunden.</AlertDescription></Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>
    );
  }

  // Inline lease card renderer
  const renderLeaseCard = (lease: Lease & { tenant_contact?: Contact }) => {
    const cold = getField(lease, 'rent_cold_eur');
    const nk = getField(lease, 'nk_advance_eur');
    const heating = getField(lease, 'heating_advance_eur');
    const warmRent = calculateWarmRent(cold, nk, heating);

    return (
      <Card key={lease.id} className="relative group">
        {!isDemoId(lease.id) && (
          <WidgetDeleteOverlay
            title={lease.tenant_contact ? `${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}` : 'Mietvertrag'}
            onConfirmDelete={() => handleDeleteLease(lease.id)}
            isDeleting={deletingLeaseId === lease.id}
          />
        )}
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              {lease.tenant_contact
                ? `${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}`
                : 'Kein Mieter'}
            </CardTitle>
            {getStatusBadge(lease.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-3">
          {/* Row 1: Vertragsart + Mietmodell */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Vertragsart</Label>
              <Select
                value={getField(lease, 'lease_type') || 'unbefristet'}
                onValueChange={(v) => updateLeaseField(lease.id, 'lease_type', v)}
              >
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEASE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mietmodell</Label>
              <Select
                value={getField(lease, 'rent_model') || 'FIX'}
                onValueChange={(v) => updateLeaseField(lease.id, 'rent_model', v)}
              >
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RENT_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Miete */}
          <div className="grid grid-cols-3 gap-3 pt-1 border-t">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Kaltmiete (€)</Label>
              <Input type="number" step="0.01" value={cold} onChange={(e) => updateLeaseField(lease.id, 'rent_cold_eur', e.target.value)} className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">NK-Vorausz. (€)</Label>
              <Input type="number" step="0.01" value={nk} onChange={(e) => updateLeaseField(lease.id, 'nk_advance_eur', e.target.value)} className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Heizk.-VZ (€)</Label>
              <Input type="number" step="0.01" value={heating} onChange={(e) => updateLeaseField(lease.id, 'heating_advance_eur', e.target.value)} className="h-7 text-xs" />
            </div>
          </div>

          {/* Warmmiete computed */}
          <div className="flex justify-between items-center text-xs bg-muted/50 rounded px-3 py-1.5">
            <span className="text-muted-foreground">Warmmiete</span>
            <span className="font-semibold">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(warmRent)}</span>
          </div>

          {/* Row 3: Laufzeit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mietbeginn</Label>
              <Input type="date" value={getField(lease, 'start_date')} onChange={(e) => updateLeaseField(lease.id, 'start_date', e.target.value)} className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mietende</Label>
              <Input type="date" value={getField(lease, 'end_date')} onChange={(e) => updateLeaseField(lease.id, 'end_date', e.target.value)} className="h-7 text-xs" />
            </div>
          </div>

          {/* Row 4: Kaution + Zahlung */}
          <div className="grid grid-cols-3 gap-3 pt-1 border-t">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Kaution (€)</Label>
              <Input type="number" step="0.01" value={getField(lease, 'deposit_amount_eur')} onChange={(e) => updateLeaseField(lease.id, 'deposit_amount_eur', e.target.value)} className="h-7 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Kaution-Status</Label>
              <Select value={getField(lease, 'deposit_status') || 'OPEN'} onValueChange={(v) => updateLeaseField(lease.id, 'deposit_status', v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPOSIT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Zahlungstag</Label>
              <Input type="number" min={1} max={31} value={getField(lease, 'payment_due_day')} onChange={(e) => updateLeaseField(lease.id, 'payment_due_day', e.target.value)} className="h-7 text-xs" />
            </div>
          </div>

          {/* Row 5: Nächste Anpassung */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nächste Mietanpassung</Label>
            <Input type="date" value={getField(lease, 'next_rent_adjustment_date')} onChange={(e) => updateLeaseField(lease.id, 'next_rent_adjustment_date', e.target.value)} className="h-7 text-xs" />
          </div>

          {/* Actions footer */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {lease.status === 'draft' && (
              <Button size="sm" className="h-7 text-xs" onClick={() => handleActivateLease(lease.id)}>
                Aktivieren
              </Button>
            )}
            {(lease.status === 'active' || lease.status === 'notice_given') && (
              <>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleOpenLetterGenerator(lease, 'kuendigung')}>
                  <FileText className="mr-1 h-3 w-3" />Kündigung
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleOpenLetterGenerator(lease, 'mieterhoehung')}>
                  <TrendingUp className="mr-1 h-3 w-3" />Mieterhöhung
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleOpenLetterGenerator(lease, 'abmahnung')}>
                  <AlertTriangle className="mr-1 h-3 w-3" />Abmahnung
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // New lease inline card
  const renderNewLeaseCard = () => (
    <Card className="border-dashed border-primary/30">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" />
          Neuer Mietvertrag
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-3">
        {/* Mieter */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Mieter (Kontakt) *</Label>
          <Select value={newLease.tenant_contact_id} onValueChange={(v) => setNewLease(prev => ({ ...prev, tenant_contact_id: v }))}>
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Kontakt auswählen" /></SelectTrigger>
            <SelectContent>
              {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.last_name}, {c.first_name} {c.email && `(${c.email})`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Vertragsart</Label>
            <Select value={newLease.lease_type} onValueChange={(v) => setNewLease(prev => ({ ...prev, lease_type: v }))}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{LEASE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Mietmodell</Label>
            <Select value={newLease.rent_model} onValueChange={(v) => setNewLease(prev => ({ ...prev, rent_model: v }))}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{RENT_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Mietbeginn *</Label>
            <Input type="date" value={newLease.start_date} onChange={(e) => setNewLease(prev => ({ ...prev, start_date: e.target.value }))} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Mietende</Label>
            <Input type="date" value={newLease.end_date} onChange={(e) => setNewLease(prev => ({ ...prev, end_date: e.target.value }))} className="h-7 text-xs" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1 border-t">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Kaltmiete (€) *</Label>
            <Input type="number" step="0.01" value={newLease.rent_cold_eur} onChange={(e) => setNewLease(prev => ({ ...prev, rent_cold_eur: e.target.value }))} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">NK-Vorausz. (€)</Label>
            <Input type="number" step="0.01" value={newLease.nk_advance_eur} onChange={(e) => setNewLease(prev => ({ ...prev, nk_advance_eur: e.target.value }))} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Heizk.-VZ (€)</Label>
            <Input type="number" step="0.01" value={newLease.heating_advance_eur} onChange={(e) => setNewLease(prev => ({ ...prev, heating_advance_eur: e.target.value }))} className="h-7 text-xs" />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs bg-muted/50 rounded px-3 py-1.5">
          <span className="text-muted-foreground">Warmmiete</span>
          <span className="font-semibold">
            {calculateWarmRent(newLease.rent_cold_eur, newLease.nk_advance_eur, newLease.heating_advance_eur).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Kaution (€)</Label>
            <Input type="number" step="0.01" value={newLease.deposit_amount_eur} onChange={(e) => setNewLease(prev => ({ ...prev, deposit_amount_eur: e.target.value }))} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Kaution-Status</Label>
            <Select value={newLease.deposit_status} onValueChange={(v) => setNewLease(prev => ({ ...prev, deposit_status: v }))}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{DEPOSIT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Zahlungstag</Label>
            <Input type="number" min={1} max={31} value={newLease.payment_due_day} onChange={(e) => setNewLease(prev => ({ ...prev, payment_due_day: e.target.value }))} className="h-7 text-xs" />
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" className="h-7 text-xs" onClick={handleCreateLease} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Anlegen
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsCreating(false)}>
            Abbrechen
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Mietverträge</h3>
        <Button size="sm" className="h-7 text-xs" onClick={() => setIsCreating(true)} disabled={isCreating}>
          <UserPlus className="mr-1 h-3 w-3" />
          Neuen Vertrag anlegen
        </Button>
      </div>

      {/* New lease card */}
      {isCreating && renderNewLeaseCard()}

      {/* Active leases as inline-editable cards */}
      {activeLeases.length > 0 ? (
        <div className="space-y-4">
          {activeLeases.map(renderLeaseCard)}
        </div>
      ) : !isCreating && (
        <Card>
          <CardContent className="py-8 text-center">
            <UserPlus className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">Keine aktiven Mietverträge</p>
          </CardContent>
        </Card>
      )}

      {/* Historical leases — Collapsible */}
      {historicalLeases.length > 0 && (
        <Collapsible open={historicalOpen} onOpenChange={setHistoricalOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-8 text-xs">
              <span className="flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                Historische Verträge ({historicalLeases.length})
              </span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${historicalOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {historicalLeases.map(lease => (
              <div key={lease.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-xs">
                <div>
                  <p className="font-medium text-muted-foreground">
                    {lease.tenant_contact?.last_name}, {lease.tenant_contact?.first_name}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDate(lease.start_date)} – {formatDate(lease.end_date)}
                  </p>
                </div>
                <div className="text-right">
                  {getStatusBadge(lease.status)}
                  <p className="text-muted-foreground mt-1">{formatCurrency(lease.monthly_rent)}</p>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Sticky Save Bar (only when dirty) */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-3 z-50">
          <div className="container mx-auto flex items-center justify-between max-w-7xl">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Ungespeicherte Änderungen
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEdits({})}>Verwerfen</Button>
              <Button size="sm" onClick={handleSaveAll} disabled={saving}>
                {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                Speichern
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
