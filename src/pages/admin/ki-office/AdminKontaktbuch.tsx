/**
 * AdminKontaktbuch — Consolidated Contact Book with Compliance Fields
 * Extends AdminKiOfficeKontakte with permission_status, legal_basis, do_not_contact
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { DataTable, Column } from '@/components/shared/DataTable';
import { DetailDrawer } from '@/components/shared/DetailDrawer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  User,
  Mail,
  Phone,
  Smartphone,
  Building2,
  FileText,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'Offen', label: 'Offen', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  { value: 'Mieter', label: 'Mieter', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'Eigentümer', label: 'Eigentümer', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'Verwalter', label: 'Verwalter', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'Makler', label: 'Makler', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  { value: 'Bank', label: 'Bank', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
  { value: 'Handwerker', label: 'Handwerker', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'Partner', label: 'Partner', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  { value: 'Sonstige', label: 'Sonstige', className: 'bg-muted text-muted-foreground' },
] as const;

const PERMISSION_STATUSES = [
  { value: 'unknown', label: 'Unbekannt', icon: Shield, className: 'bg-muted text-muted-foreground' },
  { value: 'opt_in', label: 'Opt-In', icon: ShieldCheck, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'legitimate_interest', label: 'Berecht. Interesse', icon: ShieldCheck, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'no_contact', label: 'Kein Kontakt', icon: ShieldX, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'unsubscribed', label: 'Abgemeldet', icon: ShieldAlert, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
] as const;

const SALUTATIONS = [
  { value: 'Herr', label: 'Herr' },
  { value: 'Frau', label: 'Frau' },
  { value: 'Divers', label: 'Divers' },
  { value: 'Firma', label: 'Firma' },
] as const;

function getCategoryBadge(category: string | null) {
  if (!category) return null;
  const cat = CATEGORIES.find(c => c.value === category);
  return cat ? (
    <Badge variant="outline" className={cat.className}>{cat.label}</Badge>
  ) : (
    <Badge variant="outline" className="bg-muted text-muted-foreground">{category}</Badge>
  );
}

function getPermissionBadge(status: string | null) {
  const ps = PERMISSION_STATUSES.find(p => p.value === (status || 'unknown')) || PERMISSION_STATUSES[0];
  const Icon = ps.icon;
  return (
    <Badge variant="outline" className={`text-xs ${ps.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {ps.label}
    </Badge>
  );
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  salutation: string | null;
  email: string | null;
  phone: string | null;
  phone_mobile: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  company: string | null;
  category: string | null;
  notes: string | null;
  public_id: string;
  created_at: string;
  scope: string | null;
  permission_status: string | null;
  legal_basis: string | null;
  do_not_contact: boolean | null;
  last_contacted_at: string | null;
}

interface ContactFormData {
  salutation: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_mobile: string;
  street: string;
  postal_code: string;
  city: string;
  company: string;
  category: string;
  notes: string;
  permission_status: string;
  legal_basis: string;
  do_not_contact: boolean;
}

const emptyFormData: ContactFormData = {
  salutation: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  phone_mobile: '',
  street: '',
  postal_code: '',
  city: '',
  company: '',
  category: '',
  notes: '',
  permission_status: 'unknown',
  legal_basis: '',
  do_not_contact: false,
};

export default function AdminKontaktbuch() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [permissionFilter, setPermissionFilter] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>(emptyFormData);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('scope', 'zone1_admin')
        .order('last_name');
      if (error) throw error;
      return data as unknown as Contact[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const { error } = await supabase.from('contacts').insert([{
        first_name: data.first_name,
        last_name: data.last_name,
        tenant_id: null,
        scope: 'zone1_admin',
        salutation: data.salutation || null,
        email: data.email || null,
        phone: data.phone || null,
        phone_mobile: data.phone_mobile || null,
        street: data.street || null,
        postal_code: data.postal_code || null,
        city: data.city || null,
        company: data.company || null,
        category: data.category || null,
        notes: data.notes || null,
        permission_status: data.permission_status || 'unknown',
        legal_basis: data.legal_basis || null,
        do_not_contact: data.do_not_contact,
      }] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Kontakt erstellt');
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      setCreateDialogOpen(false);
      setFormData(emptyFormData);
    },
    onError: (error) => toast.error('Fehler: ' + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ContactFormData & { id: string }) => {
      const { id, ...rest } = data;
      const { error } = await supabase.from('contacts').update({
        first_name: rest.first_name,
        last_name: rest.last_name,
        salutation: rest.salutation || null,
        email: rest.email || null,
        phone: rest.phone || null,
        phone_mobile: rest.phone_mobile || null,
        street: rest.street || null,
        postal_code: rest.postal_code || null,
        city: rest.city || null,
        company: rest.company || null,
        category: rest.category || null,
        notes: rest.notes || null,
        permission_status: rest.permission_status || 'unknown',
        legal_basis: rest.legal_basis || null,
        do_not_contact: rest.do_not_contact,
      } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Kontakt aktualisiert');
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      setEditMode(false);
    },
    onError: (error) => toast.error('Fehler: ' + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Kontakt gelöscht');
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      setDrawerOpen(false);
      setSelectedContact(null);
    },
    onError: (error) => toast.error('Fehler: ' + error.message),
  });

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      salutation: contact.salutation || '',
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      phone_mobile: contact.phone_mobile || '',
      street: contact.street || '',
      postal_code: contact.postal_code || '',
      city: contact.city || '',
      company: contact.company || '',
      category: contact.category || '',
      notes: contact.notes || '',
      permission_status: contact.permission_status || 'unknown',
      legal_basis: contact.legal_basis || '',
      do_not_contact: contact.do_not_contact || false,
    });
    setEditMode(false);
    setDrawerOpen(true);
  };

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q);
    const matchesPermission = permissionFilter === 'all' || c.permission_status === permissionFilter;
    return matchesSearch && matchesPermission;
  });

  const columns: Column<Contact>[] = [
    {
      key: 'company',
      header: 'Firma',
      render: (_v: unknown, c: Contact) => c.company || '-',
    },
    {
      key: 'first_name',
      header: 'Name',
      render: (_v: unknown, c: Contact) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-medium">{c.first_name} {c.last_name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'E-Mail',
      render: (_v: unknown, c: Contact) => c.email || '-',
    },
    {
      key: 'city',
      header: 'Ort',
      render: (_v: unknown, c: Contact) => c.city || '-',
    },
    {
      key: 'category',
      header: 'Kategorie',
      render: (_v: unknown, c: Contact) => getCategoryBadge(c.category) || '-',
    },
    {
      key: 'permission_status',
      header: 'Permission',
      render: (_v: unknown, c: Contact) => getPermissionBadge(c.permission_status),
    },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const ContactFormFields = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Person</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Anrede</Label>
            <Select value={formData.salutation} onValueChange={(v) => setFormData({ ...formData, salutation: v })}>
              <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                {SALUTATIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kategorie</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Vorname *</Label>
            <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Nachname *</Label>
            <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Firma</Label>
          <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Kontakt</h4>
        <div className="space-y-2">
          <Label>E-Mail</Label>
          <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Mobil</Label>
            <Input value={formData.phone_mobile} onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Telefon</Label>
            <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Adresse</h4>
        <div className="space-y-2">
          <Label>Straße</Label>
          <Input value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>PLZ</Label>
            <Input value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Ort</Label>
            <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Compliance Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Compliance / DSGVO
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Permission-Status</Label>
            <Select value={formData.permission_status} onValueChange={(v) => setFormData({ ...formData, permission_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERMISSION_STATUSES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rechtsgrundlage</Label>
            <Input
              value={formData.legal_basis}
              onChange={(e) => setFormData({ ...formData, legal_basis: e.target.value })}
              placeholder="z.B. Art. 6(1)(f) DSGVO"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <Switch
            checked={formData.do_not_contact}
            onCheckedChange={(v) => setFormData({ ...formData, do_not_contact: v })}
          />
          <div>
            <Label className="text-sm font-medium">Nicht kontaktieren</Label>
            <p className="text-xs text-muted-foreground">Sperrt jegliche ausgehende Kommunikation</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notizen</Label>
        <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
      </div>
    </div>
  );

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Kontakte durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={permissionFilter} onValueChange={setPermissionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Permission..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Permissions</SelectItem>
            {PERMISSION_STATUSES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Neuer Kontakt</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuen Kontakt erstellen</DialogTitle>
              <DialogDescription>Admin-Kontakt (Zone 1) mit Compliance-Daten</DialogDescription>
            </DialogHeader>
            <ContactFormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Abbrechen</Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.first_name || !formData.last_name || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{contacts.length} Kontakte</span>
        <span>·</span>
        <span>{contacts.filter(c => c.permission_status === 'opt_in' || c.permission_status === 'legitimate_interest').length} kontaktierbar</span>
        <span>·</span>
        <span>{contacts.filter(c => c.do_not_contact).length} gesperrt</span>
      </div>

      {/* Table */}
      {filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
          <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Keine Kontakte</h3>
          <p className="text-muted-foreground text-center mb-4">Erstellen Sie Ihren ersten Kontakt oder importieren Sie aus der Recherche.</p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />Kontakt erstellen
          </Button>
        </div>
      ) : (
        <DataTable data={filteredContacts} columns={columns} onRowClick={handleRowClick} />
      )}

      {/* Detail drawer */}
      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : ''}
        description={selectedContact?.company || selectedContact?.email || ''}
      >
        {selectedContact && (
          <div className="space-y-6">
            {editMode ? (
              <>
                <ContactFormFields />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">Abbrechen</Button>
                  <Button
                    onClick={() => updateMutation.mutate({ ...formData, id: selectedContact.id })}
                    disabled={updateMutation.isPending}
                    className="flex-1"
                  >
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Speichern
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryBadge(selectedContact.category)}
                    {getPermissionBadge(selectedContact.permission_status)}
                    {selectedContact.do_not_contact && (
                      <Badge variant="destructive" className="text-xs">
                        <ShieldX className="h-3 w-3 mr-1" />Gesperrt
                      </Badge>
                    )}
                  </div>
                  {selectedContact.company && (
                    <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{selectedContact.company}</span></div>
                  )}
                  {selectedContact.email && (
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline">{selectedContact.email}</a></div>
                  )}
                  {selectedContact.phone_mobile && (
                    <div className="flex items-center gap-2"><Smartphone className="h-4 w-4 text-muted-foreground" /><span>{selectedContact.phone_mobile}</span></div>
                  )}
                  {selectedContact.phone && (
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{selectedContact.phone}</span></div>
                  )}
                  {(selectedContact.street || selectedContact.city) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        {selectedContact.street && <div>{selectedContact.street}</div>}
                        {(selectedContact.postal_code || selectedContact.city) && (
                          <div>{[selectedContact.postal_code, selectedContact.city].filter(Boolean).join(' ')}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedContact.legal_basis && (
                    <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{selectedContact.legal_basis}</span></div>
                  )}
                  {selectedContact.last_contacted_at && (
                    <p className="text-xs text-muted-foreground">Letzter Kontakt: {new Date(selectedContact.last_contacted_at).toLocaleDateString('de-DE')}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditMode(true)} className="flex-1">
                    <Pencil className="h-4 w-4 mr-2" />Bearbeiten
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(selectedContact.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
