import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Building2, 
  FileText,
  Pencil,
  Trash2,
  Loader2
} from 'lucide-react';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  public_id: string;
  created_at: string;
}

const columns: Column<Contact>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (contact: Contact) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium">{contact.first_name} {contact.last_name}</p>
          {contact.company && (
            <p className="text-xs text-muted-foreground">{contact.company}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'email',
    header: 'E-Mail',
    render: (contact: Contact) => contact.email || '-',
  },
  {
    key: 'phone',
    header: 'Telefon',
    render: (contact: Contact) => contact.phone || '-',
  },
];

export function KontakteTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
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
    mutationFn: async (data: typeof formData) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_tenant_id')
        .single();
      
      if (!profile?.active_tenant_id) {
        throw new Error('Kein aktiver Mandant');
      }

      const { error } = await supabase.from('contacts').insert({
        ...data,
        tenant_id: profile.active_tenant_id,
        public_id: crypto.randomUUID().slice(0, 8),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Kontakt erstellt');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  // Update contact mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('contacts')
        .update(updateData)
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

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      notes: '',
    });
  };

  const handleRowClick = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
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
      contact.company?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
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
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Neuer Kontakt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Kontakt erstellen</DialogTitle>
              <DialogDescription>
                Fügen Sie einen neuen Kontakt zu Ihrem Adressbuch hinzu.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
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

      {/* Contacts Table */}
      {contacts.length === 0 ? (
        <EmptyContacts onAdd={() => setCreateDialogOpen(true)} />
      ) : (
        <DataTable
          data={filteredContacts}
          columns={columns}
          onRowClick={handleRowClick}
        />
      )}

      {/* Contact Detail Drawer */}
      <DetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : ''}
        description={selectedContact?.company || undefined}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => deleteMutation.mutate(selectedContact!.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vorname</Label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nachname</Label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-Mail</Label>
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Firma</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notizen</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditMode(false)}>
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={() => updateMutation.mutate({ ...formData, id: selectedContact.id })}
                    disabled={updateMutation.isPending}
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
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {selectedContact.first_name} {selectedContact.last_name}
                      </h3>
                      {selectedContact.company && (
                        <p className="text-muted-foreground">{selectedContact.company}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedContact.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${selectedContact.email}`} className="text-primary hover:underline">
                          {selectedContact.email}
                        </a>
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${selectedContact.phone}`} className="text-primary hover:underline">
                          {selectedContact.phone}
                        </a>
                      </div>
                    )}
                    {selectedContact.company && (
                      <div className="flex items-center gap-3 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedContact.company}</span>
                      </div>
                    )}
                  </div>

                  {selectedContact.notes && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Notizen</h4>
                      <p className="text-sm text-muted-foreground">{selectedContact.notes}</p>
                    </div>
                  )}

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
    </div>
  );
}
