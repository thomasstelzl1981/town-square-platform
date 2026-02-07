import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, AlertTriangle, UserPlus, Mail, CheckCircle, XCircle, Clock, Edit2, History, Euro, Plus, FileText, TrendingUp } from 'lucide-react';
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
  // Extended fields
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

interface RenterInvite {
  id: string;
  email: string;
  status: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
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

export function TenancyTab({ propertyId, tenantId, unitId }: TenancyTabProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allLeases, setAllLeases] = useState<(Lease & { tenant_contact?: Contact })[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [invites, setInvites] = useState<RenterInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create/Edit lease dialog
  const [leaseDialogOpen, setLeaseDialogOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [saving, setSaving] = useState(false);
  const [leaseForm, setLeaseForm] = useState({
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
  
  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteLeaseId, setInviteLeaseId] = useState<string | null>(null);
  const [inviteContact, setInviteContact] = useState<Contact | null>(null);
  
  // Quick contact creation dialog
  const [quickContactDialogOpen, setQuickContactDialogOpen] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [newContactForm, setNewContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });

  async function fetchData() {
    if (!unitId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Fetch all leases for this unit with contact info
      const { data: leasesData } = await supabase
        .from('leases')
        .select(`
          *,
          tenant_contact:contacts!leases_contact_fk(id, first_name, last_name, email)
        `)
        .eq('unit_id', unitId)
        .eq('tenant_id', tenantId)
        .order('start_date', { ascending: false });

      // Map data to fix the array issue from Supabase joins
      const mappedLeases = (leasesData || []).map(lease => ({
        ...lease,
        tenant_contact: Array.isArray(lease.tenant_contact) 
          ? lease.tenant_contact[0] 
          : lease.tenant_contact
      }));
      setAllLeases(mappedLeases);

      // Fetch contacts for creating lease
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .eq('tenant_id', tenantId)
        .order('last_name');

      setContacts(contactsData || []);

      // Fetch invites for all leases
      if (leasesData && leasesData.length > 0) {
        const leaseIds = leasesData.map(l => l.id);
        const { data: invitesData } = await supabase
          .from('renter_invites')
          .select('*')
          .in('lease_id', leaseIds)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        setInvites(invitesData || []);
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden');
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, [unitId, tenantId]);

  // Separate active and historical leases
  const activeLeases = allLeases.filter(l => ['active', 'notice_given', 'draft'].includes(l.status));
  const historicalLeases = allLeases.filter(l => ['terminated', 'ended'].includes(l.status));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

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

  const getInviteStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Ausstehend</Badge>;
      case 'accepted': return <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" />Angenommen</Badge>;
      case 'expired': return <Badge variant="outline"><XCircle className="mr-1 h-3 w-3" />Abgelaufen</Badge>;
      case 'revoked': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Widerrufen</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  function openCreateDialog() {
    setEditingLease(null);
    setLeaseForm({
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
    setLeaseDialogOpen(true);
  }

  function openEditDialog(lease: Lease) {
    setEditingLease(lease);
    setLeaseForm({
      tenant_contact_id: lease.tenant_contact_id,
      lease_type: lease.lease_type || 'unbefristet',
      start_date: lease.start_date || '',
      end_date: lease.end_date || '',
      rent_cold_eur: lease.rent_cold_eur?.toString() || lease.monthly_rent?.toString() || '',
      nk_advance_eur: lease.nk_advance_eur?.toString() || '',
      heating_advance_eur: lease.heating_advance_eur?.toString() || '',
      deposit_amount_eur: lease.deposit_amount_eur?.toString() || '',
      deposit_status: lease.deposit_status || 'OPEN',
      payment_due_day: lease.payment_due_day?.toString() || '1',
      rent_model: lease.rent_model || 'FIX',
      next_rent_adjustment_date: lease.next_rent_adjustment_date || '',
    });
    setLeaseDialogOpen(true);
  }

  async function handleSaveLease() {
    if (!leaseForm.tenant_contact_id || !leaseForm.rent_cold_eur || !leaseForm.start_date) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    setSaving(true);
    try {
      const rentCold = parseFloat(leaseForm.rent_cold_eur) || 0;
      const nkAdvance = parseFloat(leaseForm.nk_advance_eur) || 0;
      const heatingAdvance = parseFloat(leaseForm.heating_advance_eur) || 0;
      const monthlyRent = rentCold + nkAdvance + heatingAdvance;

      const leaseData = {
        tenant_id: tenantId,
        unit_id: unitId,
        tenant_contact_id: leaseForm.tenant_contact_id,
        monthly_rent: monthlyRent,
        start_date: leaseForm.start_date,
        end_date: leaseForm.end_date || null,
        lease_type: leaseForm.lease_type,
        rent_cold_eur: rentCold,
        nk_advance_eur: nkAdvance,
        heating_advance_eur: heatingAdvance,
        deposit_amount_eur: parseFloat(leaseForm.deposit_amount_eur) || null,
        deposit_status: leaseForm.deposit_status,
        payment_due_day: parseInt(leaseForm.payment_due_day) || 1,
        rent_model: leaseForm.rent_model,
        next_rent_adjustment_date: leaseForm.next_rent_adjustment_date || null,
      };

      if (editingLease) {
        const { error: updateError } = await supabase
          .from('leases')
          .update(leaseData)
          .eq('id', editingLease.id);
        if (updateError) throw updateError;
        toast.success('Mietvertrag aktualisiert');
      } else {
        const { error: insertError } = await supabase
          .from('leases')
          .insert({ ...leaseData, status: 'draft' });
        if (insertError) throw insertError;
        toast.success('Mietvertrag erstellt');
      }

      setLeaseDialogOpen(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Speichern');
    }
    setSaving(false);
  }

  async function handleActivateLease(leaseId: string) {
    try {
      const { error: updateError } = await supabase
        .from('leases')
        .update({ status: 'active' })
        .eq('id', leaseId);

      if (updateError) throw updateError;
      toast.success('Mietvertrag aktiviert');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Aktivieren');
    }
  }

  function handleOpenLetterGenerator(lease: Lease & { tenant_contact?: Contact }, letterType: LetterType) {
    if (!lease.tenant_contact) {
      toast.error('Kein Kontakt für diesen Mietvertrag hinterlegt');
      return;
    }

    const templates: Record<LetterType, { subject: string; prompt: string }> = {
      kuendigung: {
        subject: 'Kündigung Ihres Mietvertrages',
        prompt: `Erstelle eine formelle Kündigung des Mietvertrages für ${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}. Der Mietvertrag begann am ${formatDate(lease.start_date)}. Die aktuelle Warmmiete beträgt ${formatCurrency(lease.monthly_rent)}.`,
      },
      mieterhoehung: {
        subject: 'Mieterhöhungsverlangen',
        prompt: `Erstelle ein Mieterhöhungsverlangen für ${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}. Die aktuelle Kaltmiete beträgt ${formatCurrency(lease.rent_cold_eur || 0)}. Bitte begründe die Erhöhung mit dem örtlichen Mietspiegel.`,
      },
      abmahnung: {
        subject: 'Abmahnung wegen Vertragsverletzung',
        prompt: `Erstelle eine Abmahnung für ${lease.tenant_contact.first_name} ${lease.tenant_contact.last_name}. Bitte frage mich nach dem konkreten Grund der Abmahnung.`,
      },
    };

    const template = templates[letterType];

    // Navigate to letter generator with pre-filled data
    const params = new URLSearchParams({
      contactId: lease.tenant_contact.id,
      subject: template.subject,
      prompt: template.prompt,
      leaseId: lease.id,
    });

    navigate(`/portal/office/brief?${params.toString()}`);
  }

  function openInviteDialog(lease: Lease & { tenant_contact?: Contact }) {
    if (!lease.tenant_contact?.email) {
      toast.error('Keine E-Mail-Adresse hinterlegt');
      return;
    }
    setInviteLeaseId(lease.id);
    setInviteContact(lease.tenant_contact);
    setInviteOpen(true);
  }

  async function handleSendInvite() {
    if (!inviteLeaseId || !inviteContact?.email) {
      toast.error('Keine E-Mail-Adresse hinterlegt');
      return;
    }

    setInviting(true);
    try {
      const { error: insertError } = await supabase
        .from('renter_invites')
        .insert({
          tenant_id: tenantId,
          lease_id: inviteLeaseId,
          unit_id: unitId,
          contact_id: inviteContact.id,
          email: inviteContact.email,
          created_by: user?.id,
        });

      if (insertError) throw insertError;

      toast.success('Einladung erstellt');
      setInviteOpen(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Erstellen der Einladung');
    }
    setInviting(false);
  }

  async function handleCreateQuickContact() {
    if (!newContactForm.first_name || !newContactForm.last_name) {
      toast.error('Bitte Vor- und Nachname eingeben');
      return;
    }

    setCreatingContact(true);
    try {
      // Generate a public_id for the contact
      const publicId = `KNT-${Date.now().toString(36).toUpperCase()}`;
      
      const { data: newContact, error: insertError } = await supabase
        .from('contacts')
        .insert([{
          tenant_id: tenantId,
          first_name: newContactForm.first_name,
          last_name: newContactForm.last_name,
          email: newContactForm.email || null,
          phone: newContactForm.phone || null,
          public_id: publicId,
        }])
        .select('id, first_name, last_name, email')
        .single();

      if (insertError) throw insertError;

      toast.success('Kontakt erstellt');
      
      // Reload contacts and auto-select the new one
      await fetchData();
      setLeaseForm(prev => ({ ...prev, tenant_contact_id: newContact.id }));
      
      // Reset form and close dialog
      setNewContactForm({ first_name: '', last_name: '', email: '', phone: '' });
      setQuickContactDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Erstellen');
    }
    setCreatingContact(false);
  }

  const calculateWarmRent = () => {
    const cold = parseFloat(leaseForm.rent_cold_eur) || 0;
    const nk = parseFloat(leaseForm.nk_advance_eur) || 0;
    const heating = parseFloat(leaseForm.heating_advance_eur) || 0;
    return cold + nk + heating;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!unitId) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Keine Einheit für diese Immobilie gefunden.</AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mietverträge</h3>
          <p className="text-sm text-muted-foreground">
            Verwalten Sie alle Mietverträge für diese Immobilie
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <UserPlus className="mr-2 h-4 w-4" />
          Neuen Mietvertrag anlegen
        </Button>
      </div>

      {/* Active Leases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Aktive Verträge ({activeLeases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeLeases.length > 0 ? (
            <div className="space-y-4">
              {activeLeases.map(lease => (
                <div key={lease.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {lease.tenant_contact?.last_name}, {lease.tenant_contact?.first_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lease.tenant_contact?.email || 'Keine E-Mail'}
                      </p>
                    </div>
                    {getStatusBadge(lease.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Warmmiete</p>
                      <p className="font-medium">{formatCurrency(lease.monthly_rent)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mietbeginn</p>
                      <p className="font-medium">{formatDate(lease.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mietende</p>
                      <p className="font-medium">{formatDate(lease.end_date)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vertragsart</p>
                      <p className="font-medium">
                        {LEASE_TYPES.find(t => t.value === lease.lease_type)?.label || 'Unbefristet'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(lease)}>
                      <Edit2 className="mr-1 h-3 w-3" />
                      Bearbeiten
                    </Button>
                    
                    {lease.status === 'draft' && (
                      <Button size="sm" onClick={() => handleActivateLease(lease.id)}>
                        Aktivieren
                      </Button>
                    )}
                    
                    {(lease.status === 'active' || lease.status === 'notice_given') && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenLetterGenerator(lease, 'kuendigung')}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          Kündigung
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenLetterGenerator(lease, 'mieterhoehung')}
                        >
                          <TrendingUp className="mr-1 h-3 w-3" />
                          Mieterhöhung
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenLetterGenerator(lease, 'abmahnung')}
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Abmahnung
                        </Button>
                        
                        {!lease.renter_org_id && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openInviteDialog(lease)}
                          >
                            <Mail className="mr-1 h-3 w-3" />
                            Einladen
                          </Button>
                        )}
                        
                        {lease.renter_org_id && (
                          <Badge variant="default" className="h-7 px-3">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Portal-Zugang
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Keine aktiven Mietverträge</p>
              <p className="text-sm text-muted-foreground">Legen Sie einen neuen Mietvertrag an.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historical Leases */}
      {historicalLeases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Historische Verträge ({historicalLeases.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historicalLeases.map(lease => (
                <div key={lease.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div>
                    <p className="font-medium text-muted-foreground">
                      {lease.tenant_contact?.last_name}, {lease.tenant_contact?.first_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(lease.start_date)} – {formatDate(lease.end_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(lease.status)}
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(lease.monthly_rent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Einladungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.map(invite => (
                <div key={invite.id} className="flex items-center justify-between text-sm p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-muted-foreground text-xs">
                      Erstellt: {formatDate(invite.created_at)} • Gültig bis: {formatDate(invite.expires_at)}
                    </p>
                  </div>
                  {getInviteStatusBadge(invite.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Lease Dialog */}
      <Dialog open={leaseDialogOpen} onOpenChange={setLeaseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLease ? 'Mietvertrag bearbeiten' : 'Neuen Mietvertrag anlegen'}
            </DialogTitle>
            <DialogDescription>
              {editingLease 
                ? 'Aktualisieren Sie die Vertragsdaten.'
                : 'Wählen Sie einen Kontakt als Mieter und geben Sie die Vertragsdetails ein.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Mieter Auswahl mit Schnellanlage-Button */}
            <div className="space-y-2">
              <Label>Mieter (Kontakt) *</Label>
              <div className="flex gap-2">
                <Select
                  value={leaseForm.tenant_contact_id}
                  onValueChange={(v) => setLeaseForm(prev => ({ ...prev, tenant_contact_id: v }))}
                  disabled={!!editingLease}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Kontakt auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.last_name}, {c.first_name} {c.email && `(${c.email})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!editingLease && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setQuickContactDialogOpen(true)}
                    title="Neuen Mieter anlegen"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Wählen Sie einen bestehenden Kontakt oder legen Sie einen neuen Mieter an
              </p>
            </div>

            {/* Vertragsdetails */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vertragsart</Label>
                <Select
                  value={leaseForm.lease_type}
                  onValueChange={(v) => setLeaseForm(prev => ({ ...prev, lease_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEASE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mietmodell</Label>
                <Select
                  value={leaseForm.rent_model}
                  onValueChange={(v) => setLeaseForm(prev => ({ ...prev, rent_model: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RENT_MODELS.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Laufzeit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mietbeginn *</Label>
                <Input
                  type="date"
                  value={leaseForm.start_date}
                  onChange={(e) => setLeaseForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mietende</Label>
                <Input
                  type="date"
                  value={leaseForm.end_date}
                  onChange={(e) => setLeaseForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Miete */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Miete</Label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Kaltmiete (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={leaseForm.rent_cold_eur}
                    onChange={(e) => setLeaseForm(prev => ({ ...prev, rent_cold_eur: e.target.value }))}
                    placeholder="750.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">NK-Vorauszahlung (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={leaseForm.nk_advance_eur}
                    onChange={(e) => setLeaseForm(prev => ({ ...prev, nk_advance_eur: e.target.value }))}
                    placeholder="150.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Heizkosten-VZ (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={leaseForm.heating_advance_eur}
                    onChange={(e) => setLeaseForm(prev => ({ ...prev, heating_advance_eur: e.target.value }))}
                    placeholder="100.00"
                  />
                </div>
              </div>
              <div className="p-2 bg-muted rounded text-sm flex justify-between">
                <span className="font-medium">Warmmiete</span>
                <span className="font-semibold text-foreground">
                  {calculateWarmRent().toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                </span>
              </div>
            </div>

            {/* Kaution & Zahlung */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Kaution (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={leaseForm.deposit_amount_eur}
                  onChange={(e) => setLeaseForm(prev => ({ ...prev, deposit_amount_eur: e.target.value }))}
                  placeholder="2250.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Kaution-Status</Label>
                <Select
                  value={leaseForm.deposit_status}
                  onValueChange={(v) => setLeaseForm(prev => ({ ...prev, deposit_status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPOSIT_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Zahlungstag</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={leaseForm.payment_due_day}
                  onChange={(e) => setLeaseForm(prev => ({ ...prev, payment_due_day: e.target.value }))}
                />
              </div>
            </div>

            {/* Nächste Anpassung */}
            <div className="space-y-2">
              <Label className="text-xs">Nächste Mietanpassung frühestens</Label>
              <Input
                type="date"
                value={leaseForm.next_rent_adjustment_date}
                onChange={(e) => setLeaseForm(prev => ({ ...prev, next_rent_adjustment_date: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaseDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveLease} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingLease ? 'Speichern' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mieter zum Portal einladen</DialogTitle>
            <DialogDescription>
              Eine Einladung wird an {inviteContact?.email} gesendet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSendInvite} disabled={inviting}>
              {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Einladung senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Contact Creation Dialog */}
      <Dialog open={quickContactDialogOpen} onOpenChange={setQuickContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Mieter anlegen</DialogTitle>
            <DialogDescription>
              Erstellen Sie schnell einen neuen Kontakt als Mieter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vorname *</Label>
                <Input
                  value={newContactForm.first_name}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Max"
                />
              </div>
              <div className="space-y-2">
                <Label>Nachname *</Label>
                <Input
                  value={newContactForm.last_name}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Mustermann"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input
                type="email"
                value={newContactForm.email}
                onChange={(e) => setNewContactForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="max@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                type="tel"
                value={newContactForm.phone}
                onChange={(e) => setNewContactForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+49 123 456789"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickContactDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateQuickContact} disabled={creatingContact}>
              {creatingContact && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anlegen & Auswählen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
