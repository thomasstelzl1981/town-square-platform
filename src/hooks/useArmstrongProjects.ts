/**
 * useArmstrongProjects — CRUD hook for armstrong_projects table
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface ArmstrongProject {
  id: string;
  user_id: string;
  tenant_id: string;
  title: string;
  goal: string | null;
  status: 'active' | 'archived' | 'completed';
  linked_entities: Record<string, string[]>;
  memory_snippets: MemorySnippet[];
  task_list: ProjectTask[];
  created_at: string;
  updated_at: string;
}

export interface MemorySnippet {
  id: string;
  type: 'decision' | 'assumption' | 'preference' | 'note';
  content: string;
  created_at: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  done: boolean;
  created_at: string;
}

export function useArmstrongProjects() {
  const { session, activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['armstrong-projects', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('armstrong_projects')
        .select('*')
        .eq('user_id', userId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ArmstrongProject[];
    },
    enabled: !!userId,
  });

  const createProject = useMutation({
    mutationFn: async (input: { title: string; goal?: string }) => {
      const { data, error } = await supabase
        .from('armstrong_projects')
        .insert({
          user_id: userId!,
          tenant_id: activeTenantId!,
          title: input.title,
          goal: input.goal || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ArmstrongProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armstrong-projects'] });
    },
    onError: () => {
      toast({ title: 'Fehler', description: 'Projekt konnte nicht erstellt werden.', variant: 'destructive' });
    },
  });

  const updateProject = useMutation({
    mutationFn: async (input: { id: string } & Partial<Pick<ArmstrongProject, 'title' | 'goal' | 'status' | 'linked_entities' | 'memory_snippets' | 'task_list'>>) => {
      const { id, ...updates } = input;
      const { error } = await supabase
        .from('armstrong_projects')
        .update({ ...(updates as any), updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armstrong-projects'] });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('armstrong_projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['armstrong-projects'] });
    },
  });

  const activeProjects = projects.filter(p => p.status === 'active');

  return {
    projects,
    activeProjects,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
  };
}
