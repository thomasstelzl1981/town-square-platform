/**
 * Pet Desk — Kunden Tab: Z1-Kundendatenbank mit PetDossier-Tierakten
 * Uses SSOT pet_customers + pets tables (not legacy pet_z1_*)
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, PawPrint, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PetDossier } from '@/components/shared/pet-dossier';

function usePetsForCustomer(customerId: string | null) {
  return useQuery({
    queryKey: ['z1_pets_for_customer', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data } = await supabase
        .from('pets')
        .select('id, name, species, breed')
        .eq('customer_id', customerId);
      return data || [];
    },
    enabled: !!customerId,
  });
}

export default function PetDeskKunden() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['z1-pet-customers-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pet_customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      {/* Zone Flow Indicator */}
      <div className="flex items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-teal-100 text-teal-700 font-medium">Z3 Website</span>
        <span className="text-muted-foreground">→</span>
        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">Z1 Pet Desk</span>
        <span className="text-muted-foreground">→</span>
        <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">Z2 Provider</span>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Kundendatenbank
            {customers.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{customers.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : customers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Globe className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-muted-foreground text-sm">Noch keine Kunden registriert.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map(customer => {
                const isExpanded = expandedId === customer.id;
                return (
                  <div key={customer.id} className="border rounded-lg">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                      className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                          {customer.first_name?.[0]}{customer.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{customer.first_name} {customer.last_name}</p>
                          <p className="text-xs text-muted-foreground">{customer.email} {customer.phone ? `· ${customer.phone}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{customer.source}</Badge>
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && <Z1CustomerDossier customer={customer} />}
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

/** Inline PetDossier for each pet of a Z1 customer */
function Z1CustomerDossier({ customer }: { customer: any }) {
  const { data: pets = [], isLoading } = usePetsForCustomer(customer.id);

  const ownerData = {
    id: customer.id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city ?? null,
    postal_code: customer.postal_code ?? null,
  };

  return (
    <div className="px-3 pb-4 border-t space-y-4 pt-4">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : pets.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <PawPrint className="h-4 w-4" />
          Keine Tiere zugeordnet.
        </div>
      ) : (
        pets.map((p, idx) => (
          <div key={p.id}>
            {idx > 0 && <div className="border-t border-border/30 my-4" />}
            <PetDossier
              petId={p.id}
              context="z2-provider"
              readOnly={true}
              showOwner={idx === 0}
              externalOwner={idx === 0 ? ownerData : null}
            />
          </div>
        ))
      )}
    </div>
  );
}