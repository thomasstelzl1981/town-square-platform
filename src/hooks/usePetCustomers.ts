/**
 * usePetCustomers — CRUD Hook fuer pet_customers (Zone 2)
 *
 * Unterscheidet drei Sources: manual, lead, mod05.
 * Eigenkunden werden direkt angelegt, Lead/MOD-05 werden ueber Z1 zugewiesen.
 * Im Demo-Modus werden hardcoded Demo-Kunden aus dem Demo-Container geliefert.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyProvider } from '@/hooks/usePetBookings';
import { toast } from 'sonner';
import { DEMO_PM_CUSTOMERS } from '@/engines/demoData';

export interface PetCustomer {
  id: string;
  tenant_id: string;
  provider_id: string | null;
  z1_customer_id: string | null;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  source: 'manual' | 'lead' | 'mod05';
  origin_zone: 'Z2' | 'Z3' | 'Z2-MOD05';
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CreatePetCustomerInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

/** Wandelt Demo-Daten in das PetCustomer-Format */
function mapDemoCustomers(): PetCustomer[] {
  return DEMO_PM_CUSTOMERS.map(c => ({
    id: c.id,
    tenant_id: c.tenantId,
    provider_id: c.providerId,
    z1_customer_id: c.z1CustomerId || null,
    user_id: c.userId || null,
    first_name: c.firstName,
    last_name: c.lastName,
    email: c.email || null,
    phone: c.phone || null,
    address: c.address || null,
    notes: c.notes || null,
    source: c.source,
    origin_zone: c.originZone,
    status: c.status,
    created_at: c.createdAt,
    updated_at: c.createdAt,
  }));
}

export function usePetCustomers() {
  const { data: provider } = useMyProvider();
  const queryClient = useQueryClient();

  const customersQuery = useQuery({
    queryKey: ['pet_customers', provider?.id],
    queryFn: async () => {
      if (!provider) return mapDemoCustomers();
      const { data, error } = await supabase
        .from('pet_customers')
        .select('*')
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const dbCustomers = (data || []) as PetCustomer[];
      // Wenn keine DB-Kunden vorhanden, Demo-Daten zeigen
      return dbCustomers.length > 0 ? dbCustomers : mapDemoCustomers();
    },
    enabled: true,
  });

  const createCustomer = useMutation({
    mutationFn: async (input: CreatePetCustomerInput) => {
      if (!provider) throw new Error('Kein Provider gefunden');
      const { data, error } = await supabase
        .from('pet_customers')
        .insert({
          tenant_id: provider.tenant_id,
          provider_id: provider.id,
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email || null,
          phone: input.phone || null,
          address: input.address || null,
          notes: input.notes || null,
          source: 'manual',
          origin_zone: 'Z2',
          status: 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet_customers'] });
      toast.success('Kunde erfolgreich angelegt');
    },
    onError: (err: Error) => {
      toast.error(`Fehler: ${err.message}`);
    },
  });

  const updateCustomer = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreatePetCustomerInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('pet_customers')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet_customers'] });
      toast.success('Kunde aktualisiert');
    },
    onError: (err: Error) => {
      toast.error(`Fehler: ${err.message}`);
    },
  });

  const archiveCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pet_customers')
        .update({ status: 'archived' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet_customers'] });
      toast.success('Kunde archiviert');
    },
    onError: (err: Error) => {
      toast.error(`Fehler: ${err.message}`);
    },
  });

  return {
    customers: customersQuery.data || [],
    isLoading: customersQuery.isLoading,
    createCustomer,
    updateCustomer,
    archiveCustomer,
    provider,
  };
}
