/**
 * ACQUISITION CONTACT HOOKS
 * 
 * Hooks for Contact Staging, Outreach Queue, and Master Contact linking
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export type ContactStagingSource = 'apollo' | 'apify' | 'firecrawl' | 'manual' | 'geomap';
export type ContactStagingStatus = 'pending' | 'approved' | 'rejected' | 'merged';

export interface ContactStaging {
  id: string;
  tenant_id: string;
  mandate_id: string | null;
  source: ContactStagingSource;
  source_id: string | null;
  source_url: string | null;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  role_guess: string | null;
  service_area: string | null;
  quality_score: number;
  dedupe_key: string | null;
  enrichment_data: Record<string, unknown>;
  status: ContactStagingStatus;
  approved_at: string | null;
  approved_by: string | null;
  merged_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserContactLink {
  id: string;
  user_id: string;
  contact_id: string;
  mandate_id: string | null;
  folder: string | null;
  in_outreach_queue: boolean;
  notes: string | null;
  created_at: string;
  contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    company: string | null;
    phone: string | null;
  };
}

export interface CreateStagingContactData {
  mandate_id?: string;
  source: ContactStagingSource;
  source_id?: string;
  source_url?: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  website_url?: string;
  role_guess?: string;
  service_area?: string;
  quality_score?: number;
}

// ============================================================================
// CONTACT STAGING HOOKS
// ============================================================================

/**
 * Fetch staging contacts for a mandate
 */
export function useContactStaging(mandateId: string | undefined) {
  return useQuery({
    queryKey: ['contact-staging', mandateId],
    queryFn: async () => {
      if (!mandateId) return [];
      
      const { data, error } = await supabase
        .from('contact_staging')
        .select('*')
        .eq('mandate_id', mandateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContactStaging[];
    },
    enabled: !!mandateId,
  });
}

/**
 * Fetch all pending staging contacts (for admin review)
 */
export function usePendingStagingContacts() {
  const { isPlatformAdmin } = useAuth();

  return useQuery({
    queryKey: ['contact-staging', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_staging')
        .select('*')
        .eq('status', 'pending')
        .order('quality_score', { ascending: false });

      if (error) throw error;
      return data as ContactStaging[];
    },
    enabled: isPlatformAdmin,
  });
}

/**
 * Create new staging contact
 */
export function useCreateStagingContact() {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateStagingContactData) => {
      if (!activeTenantId) throw new Error('Keine Organisation');

      const { data: contact, error } = await supabase
        .from('contact_staging')
        .insert([{
          tenant_id: activeTenantId,
          ...data,
        }])
        .select()
        .single();

      if (error) throw error;
      return contact;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact-staging', variables.mandate_id] });
      toast.success('Kontakt zum Staging hinzugefügt');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

/**
 * Bulk create staging contacts (from API imports)
 */
export function useBulkCreateStagingContacts() {
  const queryClient = useQueryClient();
  const { activeTenantId } = useAuth();

  return useMutation({
    mutationFn: async ({ contacts, mandateId }: { contacts: Omit<CreateStagingContactData, 'mandate_id'>[]; mandateId: string }) => {
      if (!activeTenantId) throw new Error('Keine Organisation');

      const { data, error } = await supabase
        .from('contact_staging')
        .insert(contacts.map(c => ({
          tenant_id: activeTenantId,
          mandate_id: mandateId,
          ...c,
        })))
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact-staging', variables.mandateId] });
      toast.success(`${data.length} Kontakte importiert`);
    },
    onError: (error) => {
      toast.error('Import fehlgeschlagen: ' + (error as Error).message);
    },
  });
}

/**
 * Approve staging contact → Create/Update master contact
 */
export function useApproveContact() {
  const queryClient = useQueryClient();
  const { user, activeTenantId } = useAuth();

  return useMutation({
    mutationFn: async ({ stagingId, mandateId }: { stagingId: string; mandateId?: string }) => {
      if (!user?.id || !activeTenantId) throw new Error('Nicht eingeloggt');

      // Get staging contact
      const { data: staging, error: fetchError } = await supabase
        .from('contact_staging')
        .select('*')
        .eq('id', stagingId)
        .single();

      if (fetchError || !staging) throw new Error('Kontakt nicht gefunden');

      // Check for existing contact by email
      let contactId: string;
      
      // Generate a public_id for the contact
      const generatePublicId = () => `CON-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      if (staging.email) {
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('tenant_id', activeTenantId)
          .eq('email', staging.email)
          .single();

        if (existing) {
          contactId = existing.id;
          // Update existing
          await supabase
            .from('contacts')
            .update({
              first_name: staging.first_name || undefined,
              last_name: staging.last_name || undefined,
              phone: staging.phone || undefined,
              company: staging.company_name || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('id', contactId);
        } else {
          // Create new
          const { data: newContact, error: createError } = await supabase
            .from('contacts')
            .insert([{
              tenant_id: activeTenantId,
              public_id: generatePublicId(),
              first_name: staging.first_name || '',
              last_name: staging.last_name || '',
              email: staging.email,
              phone: staging.phone,
              company: staging.company_name,
            }])
            .select()
            .single();

          if (createError) throw createError;
          contactId = newContact.id;
        }
      } else {
        // Create without email
        const { data: newContact, error: createError } = await supabase
          .from('contacts')
          .insert([{
            tenant_id: activeTenantId,
            public_id: generatePublicId(),
            first_name: staging.first_name || '',
            last_name: staging.last_name || '',
            phone: staging.phone,
            company: staging.company_name,
          }])
          .select()
          .single();

        if (createError) throw createError;
        contactId = newContact.id;
      }

      // Link to user's contact book
      await supabase
        .from('user_contact_links')
        .upsert({
          user_id: user.id,
          contact_id: contactId,
          mandate_id: mandateId,
          folder: mandateId ? `Mandat ${staging.mandate_id?.slice(0, 8)}` : undefined,
        }, { onConflict: 'user_id,contact_id' });

      // Update staging record
      await supabase
        .from('contact_staging')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          merged_contact_id: contactId,
        })
        .eq('id', stagingId);

      return { contactId, stagingId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-staging'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['user-contact-links'] });
      toast.success('Kontakt übernommen');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });
}

/**
 * Reject staging contact
 */
export function useRejectContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stagingId: string) => {
      const { error } = await supabase
        .from('contact_staging')
        .update({ status: 'rejected' })
        .eq('id', stagingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-staging'] });
      toast.success('Kontakt abgelehnt');
    },
  });
}

// ============================================================================
// USER CONTACT LINKS (Manager's Contact Book)
// ============================================================================

/**
 * Fetch user's linked contacts
 */
export function useUserContactLinks(mandateId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-contact-links', user?.id, mandateId],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('user_contact_links')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, company, phone)
        `)
        .eq('user_id', user.id);

      if (mandateId) {
        query = query.eq('mandate_id', mandateId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserContactLink[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch outreach queue (contacts marked for outreach)
 */
export function useOutreachQueue(mandateId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['outreach-queue', mandateId, user?.id],
    queryFn: async () => {
      if (!user?.id || !mandateId) return [];

      const { data, error } = await supabase
        .from('user_contact_links')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, company, phone)
        `)
        .eq('user_id', user.id)
        .eq('mandate_id', mandateId)
        .eq('in_outreach_queue', true);

      if (error) throw error;
      return data as UserContactLink[];
    },
    enabled: !!user?.id && !!mandateId,
  });
}

/**
 * Add contact to outreach queue
 */
export function useAddToOutreachQueue() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ contactId, mandateId }: { contactId: string; mandateId: string }) => {
      if (!user?.id) throw new Error('Nicht eingeloggt');

      const { error } = await supabase
        .from('user_contact_links')
        .upsert({
          user_id: user.id,
          contact_id: contactId,
          mandate_id: mandateId,
          in_outreach_queue: true,
        }, { onConflict: 'user_id,contact_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach-queue'] });
      queryClient.invalidateQueries({ queryKey: ['user-contact-links'] });
      toast.success('Zur Outreach-Queue hinzugefügt');
    },
  });
}

/**
 * Remove from outreach queue
 */
export function useRemoveFromOutreachQueue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('user_contact_links')
        .update({ in_outreach_queue: false })
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach-queue'] });
      toast.success('Aus Queue entfernt');
    },
  });
}

// ============================================================================
// ENRICHMENT HOOK (Trigger AI enrichment)
// ============================================================================

export function useEnrichContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stagingId: string) => {
      const { data, error } = await supabase.functions.invoke('sot-acq-contact-enrich', {
        body: { stagingId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-staging'] });
      toast.success('Anreicherung gestartet');
    },
    onError: (error) => {
      toast.error('Anreicherung fehlgeschlagen: ' + (error as Error).message);
    },
  });
}
