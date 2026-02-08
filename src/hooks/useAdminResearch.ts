/**
 * useAdminResearch — Hook for Zone 1 Contact Research & Enrichment
 * Manages Apollo searches, Firecrawl scraping, and research jobs
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface ResearchJob {
  id: string;
  job_type: string;
  query_params: Json;
  status: string | null;
  results_count: number | null;
  results: Json;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ApolloSearchParams {
  industries?: string[];
  regions?: string[];
  titles?: string[];
  min_employees?: number;
  max_employees?: number;
  keywords?: string[];
}

export interface ApolloContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company: string | null;
  company_website: string | null;
  linkedin_url: string | null;
  city: string | null;
  country: string | null;
}

export function useAdminResearch() {
  const queryClient = useQueryClient();

  // Fetch recent research jobs
  const jobsQuery = useQuery({
    queryKey: ['admin-research-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_research_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Start Apollo search
  const startApolloSearch = useMutation({
    mutationFn: async (params: ApolloSearchParams) => {
      // Create job record first
      const { data: job, error: jobError } = await supabase
        .from('admin_research_jobs')
        .insert({
          job_type: 'apollo_search',
          query_params: params as Json,
          status: 'running',
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Call Apollo search edge function
      try {
        const { data, error } = await supabase.functions.invoke('sot-apollo-search', {
          body: {
            ...params,
            job_id: job.id,
          },
        });

        if (error) throw error;

        // Update job with results
        const results = data?.contacts || [];
        await supabase
          .from('admin_research_jobs')
          .update({
            status: 'completed',
            results_count: results.length,
            results: results as Json,
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        return { job_id: job.id, contacts: results };
      } catch (error) {
        // Update job with error
        await supabase
          .from('admin_research_jobs')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-research-jobs'] });
    },
  });

  // Import contacts from search results
  const importContacts = useMutation({
    mutationFn: async ({ 
      contacts, 
      category,
      tags = [],
    }: { 
      contacts: ApolloContact[];
      category: string;
      tags?: string[];
    }) => {
      const importedIds: string[] = [];

      for (const contact of contacts) {
        // Check if contact already exists by email
        if (contact.email) {
          const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', contact.email)
            .eq('scope', 'zone1_admin')
            .maybeSingle();

          if (existing) {
            importedIds.push(existing.id);
            continue;
          }
        }

        // Create contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            first_name: contact.first_name || 'Unbekannt',
            last_name: contact.last_name || 'Unbekannt',
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            city: contact.city,
            category,
            scope: 'zone1_admin',
            tenant_id: null,
          } as never)
          .select('id')
          .single();

        if (contactError) {
          console.error('Failed to import contact:', contactError);
          continue;
        }

        importedIds.push(newContact.id);

        // Add tags
        if (tags.length > 0) {
          const tagInserts = tags.map(tag => ({
            contact_id: newContact.id,
            tag: tag.toLowerCase(),
          }));

          await supabase.from('admin_contact_tags').insert(tagInserts);
        }
      }

      return { imported_count: importedIds.length, contact_ids: importedIds };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-contact-tags'] });
    },
  });

  // Start Firecrawl website scrape
  const startWebsiteScrape = useMutation({
    mutationFn: async ({ url, extractContacts = true }: { url: string; extractContacts?: boolean }) => {
      // Create job record
      const { data: job, error: jobError } = await supabase
        .from('admin_research_jobs')
        .insert({
          job_type: 'firecrawl_scrape',
          query_params: { url, extractContacts } as Json,
          status: 'running',
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Firecrawl integration would go here
      // For now, mark as completed with empty results
      await supabase
        .from('admin_research_jobs')
        .update({
          status: 'completed',
          results_count: 0,
          results: [] as Json,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return { job_id: job.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-research-jobs'] });
    },
  });

  return {
    jobs: jobsQuery.data || [],
    isLoading: jobsQuery.isLoading,
    startApolloSearch,
    importContacts,
    startWebsiteScrape,
  };
}

// Saved Segments Hook
export interface SavedSegment {
  id: string;
  name: string;
  description: string | null;
  filter_config: Json;
  contact_count: number | null;
  created_at: string;
  updated_at: string;
}

export function useAdminSegments() {
  const queryClient = useQueryClient();

  const segmentsQuery = useQuery({
    queryKey: ['admin-saved-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_saved_segments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const createSegment = useMutation({
    mutationFn: async (segment: { name: string; description?: string; filter_config: Json }) => {
      const { data, error } = await supabase
        .from('admin_saved_segments')
        .insert({
          name: segment.name,
          description: segment.description || null,
          filter_config: segment.filter_config,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-saved-segments'] });
    },
  });

  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_saved_segments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-saved-segments'] });
    },
  });

  // Get contacts matching a segment's filter
  const getSegmentContacts = async (filterConfig: { categories?: string[]; tags?: string[]; cities?: string[] }) => {
    let query = supabase
      .from('contacts')
      .select('*')
      .eq('scope', 'zone1_admin');

    if (filterConfig.categories?.length) {
      query = query.in('category', filterConfig.categories);
    }

    if (filterConfig.cities?.length) {
      query = query.in('city', filterConfig.cities);
    }

    const { data: contacts, error } = await query;
    if (error) throw error;

    // Filter by tags if specified (requires join with admin_contact_tags)
    if (filterConfig.tags?.length && contacts) {
      const { data: taggedContacts } = await supabase
        .from('admin_contact_tags')
        .select('contact_id')
        .in('tag', filterConfig.tags);

      const taggedIds = new Set(taggedContacts?.map(t => t.contact_id) || []);
      return contacts.filter(c => taggedIds.has(c.id));
    }

    return contacts || [];
  };

  return {
    segments: segmentsQuery.data || [],
    isLoading: segmentsQuery.isLoading,
    createSegment,
    deleteSegment,
    getSegmentContacts,
  };
}
