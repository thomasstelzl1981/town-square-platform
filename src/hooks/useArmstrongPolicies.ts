/**
 * useArmstrongPolicies — Hook for Armstrong Policies Management
 * 
 * Fetches and manages policies from the database.
 * Categories: system_prompt, guardrail, security
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PolicyCategory = 'system_prompt' | 'guardrail' | 'security';
export type PolicyStatus = 'draft' | 'active' | 'deprecated';

export interface ArmstrongPolicy {
  id: string;
  policy_code: string;
  category: PolicyCategory;
  title_de: string;
  content: string;
  version: string;
  status: PolicyStatus;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyStats {
  total: number;
  active: number;
  draft: number;
  deprecated: number;
  byCategory: Record<PolicyCategory, number>;
}

/**
 * Fetch all policies
 */
async function fetchPolicies(): Promise<ArmstrongPolicy[]> {
  const { data, error } = await supabase
    .from('armstrong_policies')
    .select('*')
    .order('category', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching policies:', error);
    throw error;
  }

  return (data || []) as ArmstrongPolicy[];
}

/**
 * Hook to get all policies with stats
 */
export function useArmstrongPolicies(category?: PolicyCategory) {
  const { data: policies, isLoading, error, refetch } = useQuery({
    queryKey: ['armstrong-policies', category],
    queryFn: fetchPolicies,
    staleTime: 60000, // 1 minute
  });

  // Filter by category if provided
  const filteredPolicies = category
    ? (policies || []).filter(p => p.category === category)
    : policies || [];

  // Calculate stats
  const stats: PolicyStats = {
    total: (policies || []).length,
    active: (policies || []).filter(p => p.status === 'active').length,
    draft: (policies || []).filter(p => p.status === 'draft').length,
    deprecated: (policies || []).filter(p => p.status === 'deprecated').length,
    byCategory: {
      system_prompt: (policies || []).filter(p => p.category === 'system_prompt').length,
      guardrail: (policies || []).filter(p => p.category === 'guardrail').length,
      security: (policies || []).filter(p => p.category === 'security').length,
    },
  };

  return {
    policies: filteredPolicies,
    allPolicies: policies || [],
    stats,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to create a new policy
 */
export function useCreatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (policy: {
      policy_code: string;
      category: PolicyCategory;
      title_de: string;
      content: string;
      version?: string;
    }) => {
      const { data, error } = await supabase
        .from('armstrong_policies')
        .insert({
          policy_code: policy.policy_code,
          category: policy.category,
          title_de: policy.title_de,
          content: policy.content,
          version: policy.version || '1.0.0',
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armstrong-policies'] });
    },
  });
}

/**
 * Hook to update a policy
 */
export function useUpdatePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: {
      id: string;
      updates: Partial<Pick<ArmstrongPolicy, 'title_de' | 'content' | 'version' | 'status'>>;
    }) => {
      const { data, error } = await supabase
        .from('armstrong_policies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armstrong-policies'] });
    },
  });
}

/**
 * Hook to approve a policy (activate it)
 */
export function useApprovePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('armstrong_policies')
        .update({
          status: 'active',
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armstrong-policies'] });
    },
  });
}

/**
 * Hook to delete a policy
 */
export function useDeletePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('armstrong_policies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armstrong-policies'] });
    },
  });
}
