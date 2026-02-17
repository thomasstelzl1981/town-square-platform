/**
 * PMKunden — Kunden & Tiere (Pet Manager)
 * Eigene Kundenverwaltung mit manueller Anlage (Einstieg A).
 * Source-Badges zeigen Herkunft: Manual, Lead, MOD-05.
 */
import { Users, PawPrint, Plus, Mail, Phone, MapPin, ChevronDown, ChevronUp, Hash, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DESIGN } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState } from 'react';
import { usePetCustomers, type CreatePetCustomerInput } from '@/hooks/usePetCustomers';
import { useBookings } from '@/hooks/usePetBookings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isDemoId } from '@/engines/demoData';
import { DEMO_PM_PETS, DEMO_PM_BOOKINGS } from '@/engines/demoData';

const SOURCE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  manual: { label: 'Eigenkunde', variant: 'secondary' },
  lead: { label: 'Website-Lead', variant: 'default' },
  mod05: { label: 'Portal (MOD-05)', variant: 'outline' },
};

function usePetsForCustomer(customerId: string | null) {
  return useQuery({
    queryKey: ['pets_for_customer', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      // Demo-Kunden: Tiere aus hardcoded Demo-Daten
      if (isDemoId(customerId)) {
        return DEMO_PM_PETS
          .filter(p => p.customerId === customerId)
          .map(p => ({ id: p.id, name: p.name, species: p.species, breed: p.breed, birth_date: p.birthDate }));
      }
      const { data } = await supabase
        .from('pets')
        .select('id, name, species, breed, birth_date')
        .eq('customer_id', customerId);
      return data || [];
    },
    enabled: !!customerId,
  });
}

export default function PMKunden() {
  const { customers, isLoading, createCustomer, provider } = usePetCustomers();
  const { data: bookings = [] } = useBookings(provider ? { providerId: provider.id } : undefined);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePetCustomerInput>({
    first_name: '', last_name: '', email: '', phone: '', address: '', notes: '',
  });

  const handleCreate = () => {
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    createCustomer.mutate(form, {
      onSuccess: () => {
        setShowCreate(false);
        setForm({ first_name: '', last_name: '', email: '', phone: '', address: '', notes: '' });
      },
    });
  };

  // Count bookings per customer
  const getBookingCount = (customerId: string) => {
    // Demo-Kunden: Buchungen aus hardcoded Demo-Daten
    if (isDemoId(customerId)) {
      return DEMO_PM_BOOKINGS.filter(b => b.customerId === customerId).length;
    }
    return bookings.filter(b => {
      const customer = customers.find(c => c.id === customerId);
      return customer?.user_id && b.client_user_id === customer.user_id;
    }).length;
  };

  // Provider-Check nur für Anlage-Button (Demo-Daten zeigen wir immer)
  const canCreate = !!provider;

  return (
    <PageShell>
      <div className="space-y-6">
        {/* Header with create button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Kunden & Tiere</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{customers.length} Kunden</Badge>
            {canCreate && (
              <Button
                size="sm"
                className="rounded-full h-8 w-8 p-0"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Customer list */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-12 text-center space-y-3">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground">Noch keine Kunden angelegt.</p>
            <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Ersten Kunden anlegen
            </Button>
          </div>
        ) : (
          <div className={DESIGN.LIST.GAP}>
            {customers.map(c => {
              const isExpanded = expandedId === c.id;
              const sourceInfo = SOURCE_LABELS[c.source] || SOURCE_LABELS.manual;
              const bookingCount = getBookingCount(c.id);

              return (
                <Card key={c.id} className={DESIGN.CARD.SECTION}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={DESIGN.HEADER.WIDGET_ICON_BOX}>
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {c.first_name} {c.last_name}
                            </p>
                            <Badge variant={sourceInfo.variant} className="text-[10px] shrink-0">
                              {sourceInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                            {c.email && (
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 shrink-0" />{c.email}
                              </span>
                            )}
                            {c.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 shrink-0" />{c.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        {bookingCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                            <Hash className="h-3 w-3" /> {bookingCount} Buchungen
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                          <Calendar className="h-3 w-3" /> {format(parseISO(c.created_at), 'dd.MM.yyyy', { locale: de })}
                        </div>
                        <Button
                          variant="ghost" size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setExpandedId(isExpanded ? null : c.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          <span className="ml-1">Akte</span>
                        </Button>
                      </div>
                    </div>

                    {/* Expanded dossier */}
                    {isExpanded && <CustomerDossier customer={c} />}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Customer Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Neuen Kunden anlegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="first_name">Vorname *</Label>
                  <Input id="first_name" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="last_name">Nachname *</Label>
                  <Input id="last_name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email">E-Mail</Label>
                  <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="notes">Notizen</Label>
                <Textarea id="notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>Abbrechen</Button>
              <Button onClick={handleCreate} disabled={!form.first_name.trim() || !form.last_name.trim() || createCustomer.isPending}>
                {createCustomer.isPending ? 'Wird angelegt…' : 'Anlegen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}

/** Inline dossier for an expanded customer */
function CustomerDossier({ customer }: { customer: { id: string; address: string | null; notes: string | null; source: string } }) {
  const { data: pets = [], isLoading } = usePetsForCustomer(customer.id);

  return (
    <div className="mt-4 border-t pt-3 space-y-3">
      {/* Address & Notes */}
      {customer.address && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" /> {customer.address}
        </div>
      )}
      {customer.notes && (
        <p className="text-xs text-muted-foreground italic">{customer.notes}</p>
      )}

      {/* Pets */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Tiere</p>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Laden…</p>
        ) : pets.length === 0 ? (
          <p className="text-xs text-muted-foreground">Noch keine Tiere zugeordnet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {pets.map(p => (
              <Badge key={p.id} variant="secondary" className="text-[10px] gap-1">
                <PawPrint className="h-2.5 w-2.5" />
                {p.name} {p.breed ? `(${p.breed})` : ''}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
