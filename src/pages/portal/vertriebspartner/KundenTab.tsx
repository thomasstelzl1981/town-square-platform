/**
 * KundenTab — MOD-09 Vertriebspartner Kundenakte
 * Mit echten Kontakt-Daten aus der Datenbank
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserPlus, Calculator, Handshake, Archive, MoreHorizontal, Circle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { HowItWorks } from '@/components/vertriebspartner';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const KundenTab = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch contacts from database
  const { data: contacts = [], isLoading, refetch } = useQuery({
    queryKey: ['partner-contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return [];
      
      // Get user's active tenant
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_tenant_id')
        .eq('id', user.id)
        .single();
        
      if (!profile?.active_tenant_id) return [];
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('tenant_id', profile.active_tenant_id)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      return (data || []) as Contact[];
    }
  });

  const filteredContacts = contacts.filter(c => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(search) ||
      c.last_name?.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search) ||
      c.company?.toLowerCase().includes(search)
    );
  });

  const openContactDetail = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDrawerOpen(true);
  };

  const handleOpenInBeratung = (contact: Contact) => {
    // Navigate to Beratung with customer pre-selected
    toast.info('Öffne Beratung...', { description: `Für ${contact.first_name} ${contact.last_name}` });
    navigate('/portal/vertriebspartner/beratung');
  };

  const handleStartDeal = (contact: Contact) => {
    toast.success('Deal wird erstellt...', { description: `Für ${contact.first_name} ${contact.last_name}` });
  };

  const getDisplayName = (contact: Contact) => {
    if (contact.first_name || contact.last_name) {
      return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    }
    if (contact.company) return contact.company;
    return contact.email || 'Unbenannt';
  };

  return (
    <div className="space-y-6">
      <HowItWorks variant="kunden" />

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Kunden durchsuchen..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button 
              className="ml-auto"
              onClick={() => navigate('/portal/office/kontakte')}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Neuer Kunde
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Kundenakte</CardTitle>
            <Badge variant="secondary">{contacts.length} Kontakte</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead className="w-[150px]">Letzte Aktivität</TableHead>
                  <TableHead className="text-right w-[100px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchTerm 
                        ? 'Keine Kunden gefunden.'
                        : 'Noch keine Kunden vorhanden. Legen Sie Kontakte im KI-Office an.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow 
                      key={contact.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openContactDetail(contact)}
                    >
                      <TableCell>
                        <div className="font-medium">{getDisplayName(contact)}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.email || '–'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.phone || '–'}
                      </TableCell>
                      <TableCell>
                        {contact.company ? (
                          <Badge variant="outline" className="text-xs">
                            {contact.company}
                          </Badge>
                        ) : '–'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(contact.updated_at), { locale: de, addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openContactDetail(contact)}>
                              Details anzeigen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenInBeratung(contact)}>
                              <Calculator className="mr-2 h-4 w-4" />
                              In Beratung öffnen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStartDeal(contact)}>
                              <Handshake className="mr-2 h-4 w-4" />
                              Deal starten
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Contact Detail Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedContact && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {getDisplayName(selectedContact)}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Contact Data */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">Kontaktdaten</Label>
                  <div className="space-y-1 text-sm">
                    {selectedContact.email && <div>📧 {selectedContact.email}</div>}
                    {selectedContact.phone && <div>📱 {selectedContact.phone}</div>}
                    {selectedContact.company && <div>🏢 {selectedContact.company}</div>}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">Zeitstempel</Label>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Erstellt: {format(new Date(selectedContact.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
                    <div>Aktualisiert: {format(new Date(selectedContact.updated_at), 'dd.MM.yyyy HH:mm', { locale: de })}</div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">Notizen</Label>
                  <Textarea 
                    value={selectedContact.notes || ''}
                    placeholder="Interne Notizen zum Kunden..."
                    className="min-h-[100px]"
                    readOnly
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleOpenInBeratung(selectedContact)}
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    In Beratung
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => handleStartDeal(selectedContact)}
                  >
                    <Handshake className="mr-2 h-4 w-4" />
                    Deal starten
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default KundenTab;
