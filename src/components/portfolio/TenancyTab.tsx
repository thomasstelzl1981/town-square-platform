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
import { Loader2, AlertTriangle, UserPlus, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';
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

export function TenancyTab({ propertyId, tenantId, unitId }: TenancyTabProps) {
  const { user } = useAuth();
  const [lease, setLease] = useState<Lease | null>(null);
  const [leaseContact, setLeaseContact] = useState<Contact | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [invites, setInvites] = useState<RenterInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create lease dialog
  const [createLeaseOpen, setCreateLeaseOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLease, setNewLease] = useState({
    tenant_contact_id: '',
    monthly_rent: '',
    start_date: '',
  });
  
  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  async function fetchData() {
    if (!unitId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Fetch active lease
      const { data: leaseData } = await supabase
        .from('leases')
        .select('*')
        .eq('unit_id', unitId)
        .eq('tenant_id', tenantId)
        .in('status', ['active', 'notice_given', 'draft'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setLease(leaseData);

      // Fetch contact for this lease
      if (leaseData?.tenant_contact_id) {
        const { data: contactData } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email')
          .eq('id', leaseData.tenant_contact_id)
          .single();
        setLeaseContact(contactData);
      } else {
        setLeaseContact(null);
      }

      // Fetch contacts for creating lease
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .eq('tenant_id', tenantId)
        .order('last_name');

      setContacts(contactsData || []);

      // Fetch invites for this lease
      if (leaseData) {
        const { data: invitesData } = await supabase
          .from('renter_invites')
          .select('*')
          .eq('lease_id', leaseData.id)
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

  async function handleCreateLease() {
    if (!newLease.tenant_contact_id || !newLease.monthly_rent || !newLease.start_date) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    setCreating(true);
    try {
      const { error: insertError } = await supabase
        .from('leases')
        .insert({
          tenant_id: tenantId,
          unit_id: unitId,
          tenant_contact_id: newLease.tenant_contact_id,
          monthly_rent: parseFloat(newLease.monthly_rent),
          start_date: newLease.start_date,
          status: 'draft',
        });

      if (insertError) throw insertError;

      toast.success('Mietvertrag erstellt');
      setCreateLeaseOpen(false);
      setNewLease({ tenant_contact_id: '', monthly_rent: '', start_date: '' });
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Erstellen');
    }
    setCreating(false);
  }

  async function handleActivateLease() {
    if (!lease) return;
    
    try {
      const { error: updateError } = await supabase
        .from('leases')
        .update({ status: 'active' })
        .eq('id', lease.id);

      if (updateError) throw updateError;

      toast.success('Mietvertrag aktiviert');
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Aktivieren');
    }
  }

  async function handleSendInvite() {
    if (!lease || !leaseContact?.email) {
      toast.error('Keine E-Mail-Adresse hinterlegt');
      return;
    }

    setInviting(true);
    try {
      const { error: insertError } = await supabase
        .from('renter_invites')
        .insert({
          tenant_id: tenantId,
          lease_id: lease.id,
          unit_id: unitId,
          contact_id: lease.tenant_contact_id,
          email: leaseContact.email,
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
      {/* Current Lease */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mietvertrag</CardTitle>
              <CardDescription>
                Aktuelles Mietverhältnis für diese Immobilie
              </CardDescription>
            </div>
            {!lease && (
              <Dialog open={createLeaseOpen} onOpenChange={setCreateLeaseOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Mietvertrag anlegen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Neuen Mietvertrag anlegen</DialogTitle>
                    <DialogDescription>
                      Wählen Sie einen Kontakt als Mieter aus.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Mieter (Kontakt)</Label>
                      <Select
                        value={newLease.tenant_contact_id}
                        onValueChange={(v) => setNewLease(prev => ({ ...prev, tenant_contact_id: v }))}
                      >
                        <SelectTrigger>
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
                    </div>
                    <div className="space-y-2">
                      <Label>Warmmiete (€)</Label>
                      <Input
                        type="number"
                        value={newLease.monthly_rent}
                        onChange={(e) => setNewLease(prev => ({ ...prev, monthly_rent: e.target.value }))}
                        placeholder="1200.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mietbeginn</Label>
                      <Input
                        type="date"
                        value={newLease.start_date}
                        onChange={(e) => setNewLease(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateLeaseOpen(false)}>Abbrechen</Button>
                    <Button onClick={handleCreateLease} disabled={creating}>
                      {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Anlegen
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {lease ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {leaseContact?.last_name}, {leaseContact?.first_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{leaseContact?.email || 'Keine E-Mail'}</p>
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
                  <p className="text-muted-foreground">Mieter seit</p>
                  <p className="font-medium">{formatDate(lease.tenant_since)}</p>
                </div>
              </div>

              {lease.rent_increase && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Mieterhöhung</p>
                  <p className="font-medium">{lease.rent_increase}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {lease.status === 'draft' && (
                  <Button onClick={handleActivateLease}>
                    Mietvertrag aktivieren
                  </Button>
                )}
                
                {lease.status === 'active' && !lease.renter_org_id && (
                  <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Mail className="mr-2 h-4 w-4" />
                        Mieter einladen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Mieter zum Portal einladen</DialogTitle>
                        <DialogDescription>
                          Eine Einladung wird an {leaseContact?.email} gesendet.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteOpen(false)}>Abbrechen</Button>
                        <Button onClick={handleSendInvite} disabled={inviting}>
                          {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Einladung senden
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {lease.renter_org_id && (
                  <Badge variant="default" className="h-9 px-4">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mieter hat Portal-Zugang
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Kein aktiver Mietvertrag</p>
              <p className="text-sm text-muted-foreground">Legen Sie einen neuen Mietvertrag an.</p>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
