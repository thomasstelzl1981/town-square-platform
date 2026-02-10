import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
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
import { EmptyContacts } from '@/components/shared/EmptyState';
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
  google_contact_id?: string | null;
  microsoft_contact_id?: string | null;
  synced_from?: string | null;
  synced_at?: string | null;
}

const columns: Column<Contact>[] = [
  {
    key: 'public_id',
    header: 'Interne ID',
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
    render: (_value: unknown, contact: Contact) => (
      <div className="flex items-center gap-2">
        <span>{contact.last_name}</span>
        {contact.synced_from && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {contact.synced_from === 'google' ? '📧' : contact.synced_from === 'microsoft' ? '📧' : ''}
          </span>
        )}
      </div>
    ),
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
    key: 'phone',
    header: 'Telefon',
    render: (_value: unknown, contact: Contact) => contact.phone || '-',
  },
  {
    key: 'street',
    header: 'Straße',
    render: (_value: unknown, contact: Contact) => contact.street || '-',
  },
  {
    key: 'postal_code',
    header: 'PLZ',
    render: (_value: unknown, contact: Contact) => contact.postal_code || '-',
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

export function KontakteTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>(emptyFormData);
  const [emailEnrichEnabled, setEmailEnrichEnabled] = useState(false);
  const [postEnrichEnabled, setPostEnrichEnabled] = useState(false);

  // Fetch enrichment settings
  const { data: enrichSettings } = useQuery({
    queryKey: ['tenant-enrich-settings'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_tenant_id')
        .single();
      
      if (!profile?.active_tenant_id) return null;
      
      const { data, error } = await supabase
        .from('tenant_extraction_settings')
        .select('auto_enrich_contacts_email, auto_enrich_contacts_post')
        .eq('tenant_id', profile.active_tenant_id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching enrich settings:', error);
        return null;
      }
      return data;
    },
  });

  // Sync state with DB
  useEffect(() => {
    if (enrichSettings) {
      setEmailEnrichEnabled(enrichSettings.auto_enrich_contacts_email ?? false);
      setPostEnrichEnabled(enrichSettings.auto_enrich_contacts_post ?? false);
    }
  }, [enrichSettings]);

  // Update enrichment settings mutation
  const updateEnrichSettingsMutation = useMutation({
    mutationFn: async ({ field, value }: { field: 'auto_enrich_contacts_email' | 'auto_enrich_contacts_post'; value: boolean }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_tenant_id')
        .single();
      
      if (!profile?.active_tenant_id) {
        throw new Error('Kein aktiver Mandant');
      }

      const { error } = await supabase
        .from('tenant_extraction_settings')
        .upsert({
          tenant_id: profile.active_tenant_id,
          [field]: value,
        }, { onConflict: 'tenant_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-enrich-settings'] });
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + error.message);
    },
  });

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('last_name');
      if (error) throw error;
      return data as Contact[];
    },
  });

  // Create contact mutation
  const createMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_tenant_id')
        .single();
      
      if (!profile?.active_tenant_id) {
        throw new Error('Kein aktiver Mandant');
      }

      const insertData = {
        first_name: data.first_name,
        last_name: data.last_name,
        tenant_id: profile.active_tenant_id,
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
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
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
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
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
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
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

  const handleWriteLetter = () => {
    if (selectedContact) {
      navigate(`/portal/ki-office/brief?contact=${selectedContact.id}`);
    }
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

  // Shared form fields component for reuse in dialog and drawer
  const ContactFormFields = ({ isCreate = false }: { isCreate?: boolean }) => (
    <div className="space-y-6">
      {/* Section 1: Person / Firma */}
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

      {/* Section 2: Kontakt */}
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
              type="tel"
              value={formData.phone_mobile}
              onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon (Festnetz)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Adresse */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Adresse</h4>
        <div className="space-y-2">
          <Label htmlFor="street">Straße & Hausnummer</Label>
          <Input
            id="street"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="postal_code">PLZ</Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label htmlFor="city">Ort</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Notizen */}
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
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-5 pb-4 border-b">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Kontaktbuch</h3>
            <p className="text-xs text-muted-foreground">{contacts.length} Kontakte</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kontakte durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Auto-Enrich Switches */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="email-enrich" className="text-sm text-muted-foreground cursor-pointer">
              E-Mail
            </Label>
            <Switch
              id="email-enrich"
              checked={emailEnrichEnabled}
              onCheckedChange={(checked) => {
                setEmailEnrichEnabled(checked);
                updateEnrichSettingsMutation.mutate({ field: 'auto_enrich_contacts_email', value: checked });
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="post-enrich" className="text-sm text-muted-foreground cursor-pointer">
              Post
            </Label>
            <Switch
              id="post-enrich"
              checked={postEnrichEnabled}
              onCheckedChange={(checked) => {
                setPostEnrichEnabled(checked);
                updateEnrichSettingsMutation.mutate({ field: 'auto_enrich_contacts_post', value: checked });
              }}
            />
          </div>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Neuer Kontakt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuen Kontakt erstellen</DialogTitle>
              <DialogDescription>
                Fügen Sie einen neuen Kontakt zu Ihrem Adressbuch hinzu.
              </DialogDescription>
            </DialogHeader>
            <ContactFormFields isCreate />
            <DialogFooter className="mt-4">
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
      </CardContent>
      <CardContent className="p-0">
      {/* Contacts Table */}
      {contacts.length === 0 ? (
        <div className="p-6"><EmptyContacts onAdd={() => setCreateDialogOpen(true)} /></div>
      ) : (
        <DataTable
          data={filteredContacts}
          columns={columns}
          onRowClick={handleRowClick}
        />
      )}
      </CardContent>

      {/* Contact Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : ''}
        description={selectedContact?.company || undefined}
        footer={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => deleteMutation.mutate(selectedContact!.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Löschen
            </Button>
            <Button onClick={handleWriteLetter} className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Brief schreiben
            </Button>
          </div>
        }
      >
        {selectedContact && (
          <div className="space-y-6">
            {editMode ? (
              // Edit Form
              <div className="space-y-4">
                <ContactFormFields />
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={() => updateMutation.mutate({ ...formData, id: selectedContact.id })}
                    disabled={updateMutation.isPending || !formData.first_name || !formData.last_name}
                  >
                    {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Speichern
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </Button>
                </div>
                <div className="space-y-4">
                  {/* Header with avatar */}
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {selectedContact.salutation && `${selectedContact.salutation} `}
                        {selectedContact.first_name} {selectedContact.last_name}
                      </h3>
                      {selectedContact.company && (
                        <p className="text-muted-foreground">{selectedContact.company}</p>
                      )}
                      {selectedContact.category && (
                        <div className="mt-1">
                          {getCategoryBadge(selectedContact.category)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-3">
                    {selectedContact.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline">
                          {selectedContact.email}
                        </a>
                      </div>
                    )}
                    {selectedContact.phone_mobile && (
                      <div className="flex items-center gap-3 text-sm">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${selectedContact.phone_mobile}`} className="text-primary hover:underline">
                          {selectedContact.phone_mobile}
                        </a>
                        <span className="text-xs text-muted-foreground">(Mobil)</span>
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${selectedContact.phone}`} className="text-primary hover:underline">
                          {selectedContact.phone}
                        </a>
                        <span className="text-xs text-muted-foreground">(Festnetz)</span>
                      </div>
                    )}
                    {selectedContact.company && (
                      <div className="flex items-center gap-3 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedContact.company}</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  {(selectedContact.street || selectedContact.city) && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Adresse</h4>
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          {selectedContact.street && <div>{selectedContact.street}</div>}
                          {(selectedContact.postal_code || selectedContact.city) && (
                            <div>
                              {selectedContact.postal_code} {selectedContact.city}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedContact.notes && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Notizen</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedContact.notes}</p>
                    </div>
                  )}

                  {/* Communication history placeholder */}
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Kommunikation</h4>
                    <p className="text-sm text-muted-foreground">
                      Noch keine Kommunikationshistorie vorhanden.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DetailDrawer>
    </Card>
  );
}
