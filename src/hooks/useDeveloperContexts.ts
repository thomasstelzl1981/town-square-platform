/**
 * Hook for managing Developer Contexts (Verkäufer-Gesellschaften)
 * MOD-13 PROJEKTE
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DeveloperContext, CreateDeveloperContextInput } from '@/types/projekte';

const QUERY_KEY = 'developer-contexts';

export function useDeveloperContexts() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = profile?.active_tenant_id;

  // Fetch all contexts for current tenant
  const { data: contexts = [], isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEY, tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('developer_contexts')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('is_default', { ascending: false })
        .order('name');
      
      if (error) throw error;
      return data as DeveloperContext[];
    },
    enabled: !!tenantId,
  });

  // Get default context
  const defaultContext = contexts.find(c => c.is_default) || contexts[0];

  // Create new context
  const createContext = useMutation({
    mutationFn: async (input: CreateDeveloperContextInput) => {
      if (!tenantId) throw new Error('No tenant selected');
      
      // If this is the first context or marked as default, set is_default
      const isDefault = input.is_default || contexts.length === 0;
      
      // If setting as default, clear other defaults first
      if (isDefault && contexts.length > 0) {
        await supabase
          .from('developer_contexts')
          .update({ is_default: false })
          .eq('tenant_id', tenantId);
      }
      
      const { data, error } = await supabase
        .from('developer_contexts')
        .insert({
          ...input,
          tenant_id: tenantId,
          is_default: isDefault,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as DeveloperContext;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Verkäufer-Kontext erstellt');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Erstellen: ' + error.message);
    },
  });

  // Update context
  const updateContext = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeveloperContext> & { id: string }) => {
      if (!tenantId) throw new Error('No tenant selected');
      
      // If setting as default, clear other defaults first
      if (updates.is_default) {
        await supabase
          .from('developer_contexts')
          .update({ is_default: false })
          .eq('tenant_id', tenantId)
          .neq('id', id);
      }
      
      const { data, error } = await supabase
        .from('developer_contexts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as DeveloperContext;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Kontext aktualisiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Aktualisieren: ' + error.message);
    },
  });

  // Delete context
  const deleteContext = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('developer_contexts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Kontext gelöscht');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Löschen: ' + error.message);
    },
  });

  // Set default context
  const setDefaultContext = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('No tenant selected');
      
      // Clear all defaults
      await supabase
        .from('developer_contexts')
        .update({ is_default: false })
        .eq('tenant_id', tenantId);
      
      // Set new default
      const { error } = await supabase
        .from('developer_contexts')
        .update({ is_default: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Standard-Kontext gesetzt');
    },
    onError: (error: Error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  return {
    contexts,
    defaultContext,
    isLoading,
    error,
    refetch,
    createContext,
    updateContext,
    deleteContext,
    setDefaultContext,
  };
}
