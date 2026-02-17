/**
 * Pet Desk — Vorgänge Tab: Lead-Qualifizierung, Zuweisungen, offene Anfragen
 * Z3 → Z1 → Z2 Governance-Workflow
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, ArrowRight, CheckCircle, UserCheck, Clock, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  new: { label: 'Neu', color: 'bg-blue-100 text-blue-700', icon: Clock },
  qualified: { label: 'Qualifiziert', color: 'bg-amber-100 text-amber-700', icon: UserCheck },
  assigned: { label: 'Zugewiesen', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

export default function PetDeskVorgaenge() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'new' | 'qualified' | 'assigned'>('all');

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['pet-z1-vorgaenge'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pet_z1_customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['pet-providers-list'],
    queryFn: async () => {
      const { data } = await (supabase.from('pet_providers') as any).select('id, company_name').eq('is_active', true);
      return (data || []) as { id: string; company_name: string }[];
    },
  });

  // Qualify lead: new → qualified
  const qualifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pet_z1_customers')
        .update({ status: 'qualified' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-z1-vorgaenge'] });
      queryClient.invalidateQueries({ queryKey: ['pet-z1-customers'] });
      toast.success('Lead qualifiziert');
    },
  });

  // Assign lead: qualified → assigned (copy to pet_customers + pets)
  const assignMutation = useMutation({
    mutationFn: async ({ customerId, providerId }: { customerId: string; providerId: string }) => {
      // 1. Get Z1 customer data
      const { data: z1Customer, error: z1Err } = await supabase
        .from('pet_z1_customers')
        .select('*')
        .eq('id', customerId)
        .single();
      if (z1Err || !z1Customer) throw new Error('Z1-Kunde nicht gefunden');

      // 2. Insert into pet_customers (Z2)
      const { error: pcErr } = await supabase.from('pet_customers').insert({
        tenant_id: z1Customer.tenant_id,
        provider_id: providerId,
        z1_customer_id: customerId,
        first_name: z1Customer.first_name,
        last_name: z1Customer.last_name,
        email: z1Customer.email,
        phone: z1Customer.phone,
        address: z1Customer.address,
        city: z1Customer.city,
        postal_code: z1Customer.postal_code,
        notes: z1Customer.notes,
        source: 'lead',
        origin_zone: 'Z3',
        status: 'active',
      });
      if (pcErr) throw pcErr;

      // 3. Copy Z1 pets to pets table
      const { data: z1Pets } = await (supabase.from('pet_z1_pets' as any) as any)
        .select('*')
        .eq('z1_customer_id', customerId);

      if (z1Pets && z1Pets.length > 0) {
        // Get the newly created pet_customer id
        const { data: newCustomer } = await supabase
          .from('pet_customers')
          .select('id')
          .eq('z1_customer_id', customerId)
          .single();

        if (newCustomer) {
          for (const z1Pet of z1Pets) {
            await supabase.from('pets').insert({
              tenant_id: z1Pet.tenant_id,
              customer_id: newCustomer.id,
              name: z1Pet.name,
              species: z1Pet.species,
              breed: z1Pet.breed,
              gender: z1Pet.gender,
              birth_date: z1Pet.birth_date,
              weight_kg: z1Pet.weight_kg,
              chip_number: z1Pet.chip_number,
              neutered: z1Pet.neutered,
              notes: z1Pet.notes,
            });
          }
        }
      }

      // 4. Update Z1 status to assigned
      const { error: updateErr } = await supabase
        .from('pet_z1_customers')
        .update({
          status: 'assigned',
          assigned_provider_id: providerId,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', customerId);
      if (updateErr) throw updateErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-z1-vorgaenge'] });
      queryClient.invalidateQueries({ queryKey: ['pet-z1-customers'] });
      toast.success('Lead erfolgreich zugewiesen');
    },
    onError: (err: any) => {
      toast.error('Fehler bei Zuweisung: ' + err.message);
    },
  });

  const filtered = filter === 'all' ? customers : customers.filter(c => c.status === filter);
  const counts = {
    all: customers.length,
    new: customers.filter(c => c.status === 'new').length,
    qualified: customers.filter(c => c.status === 'qualified').length,
    assigned: customers.filter(c => c.status === 'assigned').length,
  };

  return (
    <div className="space-y-6">
      {/* Zone Flow */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-teal-100 text-teal-700 font-medium">Z3 Lead</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">Z1 Qualifizierung</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">Z2 Provider</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'new', 'qualified', 'assigned'] as const).map(key => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(key)}
            className="text-xs"
          >
            {key === 'all' ? 'Alle' : statusConfig[key]?.label || key}
            <Badge variant="secondary" className="ml-1.5 text-[10px]">{counts[key]}</Badge>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5" />
            Vorgänge
            {filtered.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{filtered.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-muted-foreground text-sm">Keine Vorgänge in dieser Kategorie</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(customer => {
                const status = statusConfig[customer.status] || statusConfig.new;
                return (
                  <div key={customer.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                        {customer.first_name?.[0]}{customer.last_name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{customer.first_name} {customer.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {customer.email} · {customer.source} · {new Date(customer.created_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] ${status.color}`}>{status.label}</Badge>

                      {customer.status === 'new' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => qualifyMutation.mutate(customer.id)}
                          disabled={qualifyMutation.isPending}
                        >
                          Qualifizieren
                        </Button>
                      )}

                      {customer.status === 'qualified' && providers.length > 0 && (
                        <Button
                          size="sm"
                          className="text-xs"
                          onClick={() => assignMutation.mutate({
                            customerId: customer.id,
                            providerId: providers[0].id,
                          })}
                          disabled={assignMutation.isPending}
                        >
                          Zuweisen → {providers[0].company_name}
                        </Button>
                      )}

                      {customer.status === 'assigned' && (
                        <span className="text-xs text-muted-foreground">
                          {customer.assigned_at ? new Date(customer.assigned_at).toLocaleDateString('de-DE') : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
