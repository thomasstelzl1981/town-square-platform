/**
 * AdminKiOfficeKontakte — Zone 1 Kontakte Manager
 * Basiert auf Zone 2 KontakteTab, aber mit scope = 'zone1_admin'
 * KEINE Mandanten-Zuordnung (platform-weit)
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
  MapPin
} from 'lucide-react';

// Category configuration with colors
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
    <Badge variant="outline" className={cat.className}>
      {cat.label}
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-muted text-muted-foreground">
      {category}
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
}

const columns: Column<Contact>[] = [
  {
    key: 'public_id',
    header: 'ID',
    render: (_value: unknown, contact: Contact) => (
      <span className="font-mono text-xs text-muted-foreground">{contact.public_id}</span>
    ),
  },
  {
    key: 'company',
    header: 'Firma',
    render: (_value: unknown, contact: Contact) => contact.company || '-',
  },
  {
    key: 'salutation',
    header: 'Anrede',
    render: (_value: unknown, contact: Contact) => contact.salutation || '-',
  },
  {
    key: 'first_name',
    header: 'Vorname',
    render: (_value: unknown, contact: Contact) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
        <span className="font-medium">{contact.first_name}</span>
      </div>
    ),
  },
  {
    key: 'last_name',
    header: 'Name',
    render: (_value: unknown, contact: Contact) => contact.last_name,
  },
  {
    key: 'email',
    header: 'E-Mail',
    render: (_value: unknown, contact: Contact) => contact.email || '-',
  },
  {
    key: 'phone_mobile',
    header: 'Mobil',
    render: (_value: unknown, contact: Contact) => contact.phone_mobile || '-',
  },
  {
    key: 'city',
    header: 'Ort',
    render: (_value: unknown, contact: Contact) => contact.city || '-',
  },
  {
    key: 'category',
    header: 'Kategorie',
    render: (_value: unknown, contact: Contact) => getCategoryBadge(contact.category) || '-',
  },
];

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
};

export default function AdminKiOfficeKontakte() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>(emptyFormData);
  const [emailEnrichEnabled, setEmailEnrichEnabled] = useState(false);
  const [postEnrichEnabled, setPostEnrichEnabled] = useState(false);

  // Fetch enrichment settings (admin-level)
  const { data: enrichSettings } = useQuery({
    queryKey: ['admin-enrich-settings'],
    queryFn: async () => {
      // For admin, we use a special settings key or first available tenant
      const { data, error } = await supabase
        .from('tenant_extraction_settings')
        .select('auto_enrich_contacts_email, auto_enrich_contacts_post')
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching enrich settings:', error);
        return null;
      }
      return data;
    },
  });

  useEffect(() => {
    if (enrichSettings) {
      setEmailEnrichEnabled(enrichSettings.auto_enrich_contacts_email ?? false);
      setPostEnrichEnabled(enrichSettings.auto_enrich_contacts_post ?? false);
    }
  }, [enrichSettings]);

  // Fetch Zone 1 admin contacts (scope = zone1_admin)
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['admin-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('scope', 'zone1_admin')
        .order('last_name');
      if (error) throw error;
      return data as Contact[];
    },
  });

  // Create contact mutation
  const createMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const insertData = {
        first_name: data.first_name,
        last_name: data.last_name,
        tenant_id: null, // Zone 1 contacts have no tenant
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
      };

      const { error } = await supabase.from('contacts').insert([insertData] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Kontakt erstellt');
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      setCreateDialogOpen(false);
      setFormData(emptyFormData);
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  // Update contact mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ContactFormData & { id: string }) => {
      const { id, ...updateData } = data;
      
      const cleanedData: Record<string, string | null> = {
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        salutation: updateData.salutation || null,
        email: updateData.email || null,
        phone: updateData.phone || null,
        phone_mobile: updateData.phone_mobile || null,
        street: updateData.street || null,
        postal_code: updateData.postal_code || null,
        city: updateData.city || null,
        company: updateData.company || null,
        category: updateData.category || null,
        notes: updateData.notes || null,
      };

      const { error } = await supabase
        .from('contacts')
        .update(cleanedData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Kontakt aktualisiert');
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      setEditMode(false);
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  // Delete contact mutation
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
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    },
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
    });
    setEditMode(false);
    setDrawerOpen(true);
  };

  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    return (
      contact.first_name.toLowerCase().includes(query) ||
      contact.last_name.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.company?.toLowerCase().includes(query) ||
      contact.category?.toLowerCase().includes(query) ||
      contact.city?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Form fields component
  const ContactFormFields = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Person</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salutation">Anrede</Label>
            <Select
              value={formData.salutation}
              onValueChange={(value) => setFormData({ ...formData, salutation: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {SALUTATIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Vorname *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Nachname *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Firma</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Kontakt</h4>
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone_mobile">Mobil</Label>
            <Input
              id="phone_mobile"
              value={formData.phone_mobile}
              onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Adresse</h4>
        <div className="space-y-2">
          <Label htmlFor="street">Straße</Label>
          <Input
            id="street"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postal_code">PLZ</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ort</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notizen</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header with search and actions */}
      <div className="flex items-center gap-4 pt-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Kontakte durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Auto-Enrichment Switches */}
        <div className="flex items-center gap-4 px-3 py-2 rounded-md border bg-muted/30">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="email-enrich" className="text-xs">E-Mail</Label>
            <Switch
              id="email-enrich"
              checked={emailEnrichEnabled}
              onCheckedChange={setEmailEnrichEnabled}
            />
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="post-enrich" className="text-xs">Post</Label>
            <Switch
              id="post-enrich"
              checked={postEnrichEnabled}
              onCheckedChange={setPostEnrichEnabled}
            />
          </div>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Kontakt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuen Kontakt erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie einen neuen Admin-Kontakt (Zone 1).
              </DialogDescription>
            </DialogHeader>
            <ContactFormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Abbrechen
              </Button>
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

      {/* Contacts table */}
      {filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
          <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Keine Admin-Kontakte</h3>
          <p className="text-muted-foreground text-center mb-4">
            Erstellen Sie Ihren ersten Kontakt für das Admin KI-Office.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Kontakt erstellen
          </Button>
        </div>
      ) : (
        <DataTable
          data={filteredContacts}
          columns={columns}
          onRowClick={handleRowClick}
        />
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
                  <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">
                    Abbrechen
                  </Button>
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
                  {selectedContact.category && (
                    <div>{getCategoryBadge(selectedContact.category)}</div>
                  )}
                  
                  {selectedContact.company && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedContact.company}</span>
                    </div>
                  )}
                  
                  {selectedContact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline">
                        {selectedContact.email}
                      </a>
                    </div>
                  )}
                  
                  {selectedContact.phone_mobile && (
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedContact.phone_mobile}</span>
                    </div>
                  )}
                  
                  {selectedContact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedContact.phone}</span>
                    </div>
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
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditMode(true)} className="flex-1">
                    <Pencil className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(selectedContact.id)}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
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
