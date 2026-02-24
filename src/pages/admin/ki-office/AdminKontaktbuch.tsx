/**
 * AdminKontaktbuch — Master Contact Book
 * Layout: Filterleiste (immer sichtbar) → Haupttabelle (alle Spalten) → Inline-Detail
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Plus, Search, User, Mail, Phone, Loader2, Pencil, Trash2, X, Shield,
} from 'lucide-react';
import { CATEGORY_OPTIONS, SALUTATION_OPTIONS, PERMISSION_OPTIONS } from '@/config/contactSchema';

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
  salutation: '', first_name: '', last_name: '', email: '', phone: '', phone_mobile: '',
  street: '', postal_code: '', city: '', company: '', category: '', notes: '',
  permission_status: 'unknown', legal_basis: '', do_not_contact: false,
};

function getCategoryBadge(category: string | null) {
  if (!category) return <span className="text-muted-foreground text-xs">—</span>;
  const cat = CATEGORY_OPTIONS.find(c => c.value === category);
  return <Badge variant="outline" className={`text-xs ${cat?.className || 'bg-muted text-muted-foreground'}`}>{cat?.label || category}</Badge>;
}

function getPermissionBadge(status: string | null) {
  const ps = PERMISSION_OPTIONS.find(p => p.value === (status || 'unknown')) || PERMISSION_OPTIONS[0];
  return <Badge variant="outline" className={`text-xs ${ps.className}`}>{ps.label}</Badge>;
}

export default function AdminKontaktbuch() {
  const queryClient = useQueryClient();

  // ── Filters ──
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPermission, setFilterPermission] = useState('all');
  const [filterCity, setFilterCity] = useState('');
  const [filterHasEmail, setFilterHasEmail] = useState('all');
  const [filterDNC, setFilterDNC] = useState('all');

  // ── Inline detail ──
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>(emptyFormData);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts').select('*').eq('scope', 'zone1_admin').order('last_name');
      if (error) throw error;
      return data as unknown as Contact[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const { error } = await supabase.from('contacts').insert([{
        first_name: data.first_name, last_name: data.last_name, tenant_id: null, scope: 'zone1_admin',
        salutation: data.salutation || null, email: data.email || null, phone: data.phone || null,
        phone_mobile: data.phone_mobile || null, street: data.street || null, postal_code: data.postal_code || null,
        city: data.city || null, company: data.company || null, category: data.category || null,
        notes: data.notes || null, permission_status: data.permission_status || 'unknown',
        legal_basis: data.legal_basis || null, do_not_contact: data.do_not_contact,
      }] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Kontakt erstellt');
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      setCreateDialogOpen(false); setFormData(emptyFormData);
    },
    onError: (error) => toast.error('Fehler: ' + error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ContactFormData & { id: string }) => {
      const { id, ...rest } = data;
      const { error } = await supabase.from('contacts').update({
        first_name: rest.first_name, last_name: rest.last_name,
        salutation: rest.salutation || null, email: rest.email || null, phone: rest.phone || null,
        phone_mobile: rest.phone_mobile || null, street: rest.street || null, postal_code: rest.postal_code || null,
        city: rest.city || null, company: rest.company || null, category: rest.category || null,
        notes: rest.notes || null, permission_status: rest.permission_status || 'unknown',
        legal_basis: rest.legal_basis || null, do_not_contact: rest.do_not_contact,
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
      setSelectedContact(null);
    },
    onError: (error) => toast.error('Fehler: ' + error.message),
  });

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      salutation: contact.salutation || '', first_name: contact.first_name, last_name: contact.last_name,
      email: contact.email || '', phone: contact.phone || '', phone_mobile: contact.phone_mobile || '',
      street: contact.street || '', postal_code: contact.postal_code || '', city: contact.city || '',
      company: contact.company || '', category: contact.category || '', notes: contact.notes || '',
      permission_status: contact.permission_status || 'unknown', legal_basis: contact.legal_basis || '',
      do_not_contact: contact.do_not_contact || false,
    });
    setEditMode(false);
  };

  const filteredContacts = contacts.filter(c => {
    const q = searchQuery.toLowerCase();
    if (q) {
      const searchable = [c.first_name, c.last_name, c.email, c.company, c.city, c.phone, c.phone_mobile].filter(Boolean).join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    if (filterPermission !== 'all' && c.permission_status !== filterPermission) return false;
    if (filterCity && !c.city?.toLowerCase().includes(filterCity.toLowerCase())) return false;
    if (filterHasEmail === 'yes' && !c.email) return false;
    if (filterHasEmail === 'no' && c.email) return false;
    if (filterDNC === 'yes' && !c.do_not_contact) return false;
    if (filterDNC === 'no' && c.do_not_contact) return false;
    return true;
  });

  const ContactFormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Anrede</Label>
          <Select value={formData.salutation} onValueChange={v => setFormData({ ...formData, salutation: v })}>
            <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
            <SelectContent>{SALUTATION_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Kategorie</Label>
          <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
            <SelectTrigger><SelectValue placeholder="Auswählen..." /></SelectTrigger>
            <SelectContent>{CATEGORY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label className="text-xs">Vorname *</Label><Input value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Nachname *</Label><Input value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} /></div>
      </div>
      <div className="space-y-1.5"><Label className="text-xs">Firma</Label><Input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} /></div>
      <div className="space-y-1.5"><Label className="text-xs">E-Mail</Label><Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label className="text-xs">Mobil</Label><Input value={formData.phone_mobile} onChange={e => setFormData({ ...formData, phone_mobile: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Telefon</Label><Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
      </div>
      <div className="space-y-1.5"><Label className="text-xs">Straße</Label><Input value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label className="text-xs">PLZ</Label><Input value={formData.postal_code} onChange={e => setFormData({ ...formData, postal_code: e.target.value })} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Ort</Label><Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Permission</Label>
          <Select value={formData.permission_status} onValueChange={v => setFormData({ ...formData, permission_status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PERMISSION_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label className="text-xs">Rechtsgrundlage</Label><Input value={formData.legal_basis} onChange={e => setFormData({ ...formData, legal_basis: e.target.value })} placeholder="Art. 6(1)(f) DSGVO" /></div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
        <Switch checked={formData.do_not_contact} onCheckedChange={v => setFormData({ ...formData, do_not_contact: v })} />
        <div><Label className="text-sm font-medium">Nicht kontaktieren (DNC)</Label><p className="text-xs text-muted-foreground">Sperrt jegliche Kommunikation</p></div>
      </div>
      <div className="space-y-1.5"><Label className="text-xs">Notizen</Label><Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} /></div>
    </div>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight uppercase">Kontaktbuch</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Neuer Kontakt</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuen Kontakt erstellen</DialogTitle>
              <DialogDescription>Admin-Kontakt (Zone 1)</DialogDescription>
            </DialogHeader>
            <ContactFormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Abbrechen</Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={!formData.first_name || !formData.last_name || createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{contacts.length} Kontakte</span>
        <span>·</span>
        <span>{contacts.filter(c => c.permission_status === 'opt_in' || c.permission_status === 'legitimate_interest').length} kontaktierbar</span>
        <span>·</span>
        <span>{contacts.filter(c => c.do_not_contact).length} gesperrt</span>
      </div>

      {/* ═══ FILTERLEISTE (immer sichtbar) ═══ */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="relative col-span-2 md:col-span-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Freitext..." className="pl-8 h-9 text-sm" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Kategorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {CATEGORY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPermission} onValueChange={setFilterPermission}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Permission" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Permissions</SelectItem>
                {PERMISSION_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={filterCity} onChange={e => setFilterCity(e.target.value)} placeholder="Stadt..." className="h-9 text-sm" />
            <Select value={filterHasEmail} onValueChange={setFilterHasEmail}>
              <SelectTrigger className="h-9"><SelectValue placeholder="E-Mail" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="yes">Mit E-Mail</SelectItem>
                <SelectItem value="no">Ohne E-Mail</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDNC} onValueChange={setFilterDNC}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Gesperrt" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="yes">Gesperrt</SelectItem>
                <SelectItem value="no">Nicht gesperrt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ═══ HAUPTTABELLE (immer sichtbar, alle Spalten) ═══ */}
      {filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
          <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Keine Kontakte</h3>
          <p className="text-muted-foreground text-center mb-4">Erstellen Sie Ihren ersten Kontakt oder importieren Sie aus der Recherche.</p>
          <Button onClick={() => setCreateDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Kontakt erstellen</Button>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[60px]">Anrede</TableHead>
                <TableHead className="min-w-[100px]">Vorname</TableHead>
                <TableHead className="min-w-[100px]">Nachname</TableHead>
                <TableHead className="min-w-[140px]">Firma</TableHead>
                <TableHead className="min-w-[90px]">Kategorie</TableHead>
                <TableHead className="min-w-[170px]">E-Mail</TableHead>
                <TableHead className="min-w-[110px]">Mobil</TableHead>
                <TableHead className="min-w-[110px]">Telefon</TableHead>
                <TableHead className="min-w-[140px]">Straße</TableHead>
                <TableHead className="min-w-[55px]">PLZ</TableHead>
                <TableHead className="min-w-[80px]">Ort</TableHead>
                <TableHead className="min-w-[90px]">Permission</TableHead>
                <TableHead className="min-w-[110px]">Rechtsgrundlage</TableHead>
                <TableHead className="min-w-[50px]">DNC</TableHead>
                <TableHead className="min-w-[100px]">Letzter Kontakt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map(c => (
                <TableRow
                  key={c.id}
                  className={`cursor-pointer ${selectedContact?.id === c.id ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'}`}
                  onClick={() => handleRowClick(c)}
                >
                  <TableCell className="text-xs">{c.salutation || '—'}</TableCell>
                  <TableCell className="text-sm">{c.first_name}</TableCell>
                  <TableCell className="text-sm font-medium">{c.last_name}</TableCell>
                  <TableCell className="text-sm">{c.company || '—'}</TableCell>
                  <TableCell>{getCategoryBadge(c.category)}</TableCell>
                  <TableCell>
                    {c.email ? <span className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3 text-muted-foreground shrink-0" /><span className="truncate max-w-[140px]">{c.email}</span></span> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">{c.phone_mobile || '—'}</TableCell>
                  <TableCell className="text-sm">{c.phone || '—'}</TableCell>
                  <TableCell className="text-sm">{c.street || '—'}</TableCell>
                  <TableCell className="text-xs">{c.postal_code || '—'}</TableCell>
                  <TableCell className="text-sm">{c.city || '—'}</TableCell>
                  <TableCell>{getPermissionBadge(c.permission_status)}</TableCell>
                  <TableCell className="text-xs">{c.legal_basis || '—'}</TableCell>
                  <TableCell className="text-center">
                    {c.do_not_contact ? <Badge variant="destructive" className="text-xs">Ja</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.last_contacted_at ? new Date(c.last_contacted_at).toLocaleDateString('de-DE') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ═══ INLINE-DETAIL (unter Tabelle, statt Drawer) ═══ */}
      {selectedContact && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {selectedContact.salutation ? `${selectedContact.salutation} ` : ''}{selectedContact.first_name} {selectedContact.last_name}
                {selectedContact.company && <span className="text-muted-foreground font-normal ml-2">— {selectedContact.company}</span>}
              </CardTitle>
              <div className="flex items-center gap-2">
                {!editMode && (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />Bearbeiten
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="hover:text-destructive" onClick={() => deleteMutation.mutate(selectedContact.id)} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedContact(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <div className="space-y-4">
                <ContactFormFields />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditMode(false)}>Abbrechen</Button>
                  <Button onClick={() => updateMutation.mutate({ ...formData, id: selectedContact.id })} disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Speichern
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-xs text-muted-foreground block">E-Mail</span>{selectedContact.email || '—'}</div>
                <div><span className="text-xs text-muted-foreground block">Mobil</span>{selectedContact.phone_mobile || '—'}</div>
                <div><span className="text-xs text-muted-foreground block">Telefon</span>{selectedContact.phone || '—'}</div>
                <div><span className="text-xs text-muted-foreground block">Kategorie</span>{getCategoryBadge(selectedContact.category)}</div>
                <div><span className="text-xs text-muted-foreground block">Straße</span>{selectedContact.street || '—'}</div>
                <div><span className="text-xs text-muted-foreground block">PLZ / Ort</span>{[selectedContact.postal_code, selectedContact.city].filter(Boolean).join(' ') || '—'}</div>
                <div><span className="text-xs text-muted-foreground block">Permission</span>{getPermissionBadge(selectedContact.permission_status)}</div>
                <div><span className="text-xs text-muted-foreground block">Rechtsgrundlage</span>{selectedContact.legal_basis || '—'}</div>
                <div><span className="text-xs text-muted-foreground block">DNC</span>{selectedContact.do_not_contact ? <Badge variant="destructive" className="text-xs">Gesperrt</Badge> : 'Nein'}</div>
                <div><span className="text-xs text-muted-foreground block">Letzter Kontakt</span>{selectedContact.last_contacted_at ? new Date(selectedContact.last_contacted_at).toLocaleDateString('de-DE') : '—'}</div>
                {selectedContact.notes && <div className="col-span-2"><span className="text-xs text-muted-foreground block">Notizen</span>{selectedContact.notes}</div>}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
