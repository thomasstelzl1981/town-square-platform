import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, Plus, Search, Phone, Mail, Globe, 
  Loader2, Edit, Trash2, CheckCircle2 
} from 'lucide-react';
import { useFinanceBankContacts } from '@/hooks/useFinanceMandate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function BankContactsPanel() {
  const { data: banks, isLoading } = useFinanceBankContacts();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = React.useState({
    bank_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    portal_url: '',
    notes: '',
  });

  const createBank = useMutation({
    mutationFn: async (data: typeof formData) => {
      const publicId = `BANK-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await supabase
        .from('finance_bank_contacts')
        .insert([{
          ...data,
          public_id: publicId,
          is_active: true,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-bank-contacts'] });
      toast.success('Bankkontakt erstellt');
      setIsDialogOpen(false);
      setFormData({
        bank_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        portal_url: '',
        notes: '',
      });
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  const filteredBanks = React.useMemo(() => {
    if (!banks) return [];
    if (!searchQuery) return banks;
    
    const query = searchQuery.toLowerCase();
    return banks.filter(bank => 
      bank.bank_name.toLowerCase().includes(query) ||
      bank.contact_name?.toLowerCase().includes(query)
    );
  }, [banks, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBank.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Bankkontakte
          </h2>
          <p className="text-muted-foreground">
            Verwaltung der Finanzierungspartner
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neue Bank
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Bankkontakt hinzufügen</DialogTitle>
                <DialogDescription>
                  Fügen Sie einen neuen Finanzierungspartner hinzu.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="bank_name">Bankname *</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact_name">Ansprechpartner</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contact_email">E-Mail</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact_phone">Telefon</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="portal_url">Portal-URL</Label>
                  <Input
                    id="portal_url"
                    type="url"
                    value={formData.portal_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, portal_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={createBank.isPending}>
                  {createBank.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Erstellen
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Banken suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Bank Cards */}
      {filteredBanks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Keine Bankkontakte gefunden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBanks.map((bank) => (
            <Card key={bank.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{bank.bank_name}</CardTitle>
                  <Badge variant={bank.is_active ? 'default' : 'secondary'}>
                    {bank.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
                {bank.contact_name && (
                  <CardDescription>{bank.contact_name}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {bank.contact_email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${bank.contact_email}`} className="hover:underline">
                      {bank.contact_email}
                    </a>
                  </div>
                )}
                {bank.contact_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${bank.contact_phone}`} className="hover:underline">
                      {bank.contact_phone}
                    </a>
                  </div>
                )}
                {bank.portal_url && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={bank.portal_url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                      Portal öffnen
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
