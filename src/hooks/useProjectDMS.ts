/**
 * Hook for Project DMS (Document Management) operations
 * MOD-13 PROJEKTE - DMS Integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DMSFolder {
  id: string;
  name: string;
  parent_id: string | null;
  node_type: 'folder' | 'file';
  dev_project_id: string | null;
  dev_project_unit_id: string | null;
  created_at: string;
  children?: DMSFolder[];
}

const QUERY_KEY = 'project-dms';

export function useProjectDMS(projectId: string | undefined) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;
  const queryClient = useQueryClient();

  // Fetch folder tree for a project
  const { data: folderTree, isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEY, projectId],
    queryFn: async () => {
      if (!projectId || !tenantId) return null;

      // Fetch all folders related to this project
      const { data: folders, error } = await supabase
        .from('storage_nodes')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('dev_project_id', projectId)
        .order('name');

      if (error) throw error;
      if (!folders || folders.length === 0) return null;

      // Build tree structure
      const folderMap = new Map<string, DMSFolder & { children: DMSFolder[] }>();
      let rootFolder: DMSFolder | null = null;

      folders.forEach(f => {
        folderMap.set(f.id, { ...f, children: [] } as DMSFolder & { children: DMSFolder[] });
      });

      folders.forEach(f => {
        const folder = folderMap.get(f.id)!;
        if (f.parent_id && folderMap.has(f.parent_id)) {
          folderMap.get(f.parent_id)!.children.push(folder);
        } else if (!f.parent_id) {
          rootFolder = folder;
        }
      });

      // If no root found, find the project-level folder
      if (!rootFolder) {
        const projectRoot = folders.find(f => !f.parent_id || !folderMap.has(f.parent_id));
        if (projectRoot) {
          rootFolder = folderMap.get(projectRoot.id) || null;
        }
      }

      return rootFolder;
    },
    enabled: !!projectId && !!tenantId,
  });

  // Get unit folders
  const { data: unitFolders = [] } = useQuery({
    queryKey: [QUERY_KEY, 'units', projectId],
    queryFn: async () => {
      if (!projectId || !tenantId) return [];

      const { data, error } = await supabase
        .from('storage_nodes')
        .select(`
          *,
          unit:dev_project_units(id, unit_number)
        `)
        .eq('tenant_id', tenantId)
        .eq('dev_project_id', projectId)
        .not('dev_project_unit_id', 'is', null)
        .eq('node_type', 'folder')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && !!tenantId,
  });

  // Create subfolder
  const createFolder = useMutation({
    mutationFn: async ({ 
      name, 
      parentId, 
      unitId 
    }: { 
      name: string; 
      parentId?: string; 
      unitId?: string;
    }) => {
      if (!projectId || !tenantId) throw new Error('Missing context');

      const { data, error } = await supabase
        .from('storage_nodes')
        .insert({
          name,
          node_type: 'folder',
          parent_id: parentId || null,
          tenant_id: tenantId,
          dev_project_id: projectId,
          dev_project_unit_id: unitId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, projectId] });
      toast.success('Ordner erstellt');
    },
    onError: (error: Error) => {
      toast.error('Fehler: ' + error.message);
    },
  });

  // Initialize DMS structure for a new project (called manually or by trigger)
  const initializeProjectDMS = useMutation({
    mutationFn: async ({ 
      projectCode, 
      units 
    }: { 
      projectCode: string; 
      units: { id: string; unit_number: string }[];
    }) => {
      if (!projectId || !tenantId) throw new Error('Missing context');

      // This is typically handled by database trigger, but can be called manually
      // The structure is:
      // /Projekte/{projectCode}/
      //   ├── Allgemein/
      //   │   ├── Exposé/
      //   │   ├── Grundbuch/
      //   │   ├── Teilungserklärung/
      //   │   └── ...
      //   └── Einheiten/
      //       ├── WE-001/
      //       └── WE-002/

      // Create root folder
      const { data: projectRoot, error: rootError } = await supabase
        .from('storage_nodes')
        .insert({
          name: `Projekte`,
          node_type: 'folder',
          tenant_id: tenantId,
          object_type: 'dev_project',
        })
        .select()
        .single();

      if (rootError) throw rootError;

      // Create project folder under Projekte
      const { data: projectFolder, error: pfError } = await supabase
        .from('storage_nodes')
        .insert({
          name: projectCode,
          node_type: 'folder',
          parent_id: projectRoot.id,
          tenant_id: tenantId,
          dev_project_id: projectId,
        })
        .select()
        .single();

      if (pfError) throw pfError;

      // Create Allgemein folder
      const { data: allgemeinFolder, error: agError } = await supabase
        .from('storage_nodes')
        .insert({
          name: 'Allgemein',
          node_type: 'folder',
          parent_id: projectFolder.id,
          tenant_id: tenantId,
          dev_project_id: projectId,
        })
        .select()
        .single();

      if (agError) throw agError;

      // Create Allgemein subfolders
      const allgemeinSubfolders = ['Exposé', 'Grundbuch', 'Teilungserklärung', 'Energieausweis', 'Fotos'];
      for (const name of allgemeinSubfolders) {
        await supabase.from('storage_nodes').insert({
          name,
          node_type: 'folder',
          parent_id: allgemeinFolder.id,
          tenant_id: tenantId,
          dev_project_id: projectId,
        });
      }

      // Create Einheiten folder
      const { data: einheitenFolder, error: efError } = await supabase
        .from('storage_nodes')
        .insert({
          name: 'Einheiten',
          node_type: 'folder',
          parent_id: projectFolder.id,
          tenant_id: tenantId,
          dev_project_id: projectId,
        })
        .select()
        .single();

      if (efError) throw efError;

      // Create unit folders
      for (const unit of units) {
        const { data: unitFolder, error: ufError } = await supabase
          .from('storage_nodes')
          .insert({
            name: `WE-${unit.unit_number}`,
            node_type: 'folder',
            parent_id: einheitenFolder.id,
            tenant_id: tenantId,
            dev_project_id: projectId,
            dev_project_unit_id: unit.id,
          })
          .select()
          .single();

        if (ufError) continue;

        // Create unit subfolders
        const unitSubfolders = ['Grundriss', 'Mietvertrag', 'Kaufvertrag'];
        for (const name of unitSubfolders) {
          await supabase.from('storage_nodes').insert({
            name,
            node_type: 'folder',
            parent_id: unitFolder.id,
            tenant_id: tenantId,
            dev_project_id: projectId,
            dev_project_unit_id: unit.id,
          });
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, projectId] });
      toast.success('DMS-Struktur erstellt');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Erstellen der DMS-Struktur: ' + error.message);
    },
  });

  return {
    folderTree,
    unitFolders,
    isLoading,
    error,
    refetch,
    createFolder,
    initializeProjectDMS,
  };
}
