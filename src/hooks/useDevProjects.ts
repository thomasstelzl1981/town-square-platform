/**
 * Hook for managing Developer Projects
 * MOD-13 PROJEKTE
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { isDemoId } from '@/engines/demoData/engine';
import { useDemoToggles } from '@/hooks/useDemoToggles';
import type { DevProject, CreateProjectInput, ProjectPortfolioRow, ProjectStatus } from '@/types/projekte';

const QUERY_KEY = 'dev-projects';

export function useDevProjects(contextId?: string) {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = profile?.active_tenant_id;
  const { isEnabled } = useDemoToggles();
  const demoEnabled = isEnabled('GP-PROJEKT');

  // Fetch projects (optionally filtered by context)
  const { data: projects = [], isLoading, error, refetch } = useQuery({
    queryKey: [QUERY_KEY, tenantId, contextId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      let query = supabase
        .from('dev_projects')
        .select(`
          *,
          developer_context:developer_contexts(*)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      
      if (contextId) {
        query = query.eq('developer_context_id', contextId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DevProject[];
    },
    enabled: !!tenantId,
  });

  // Fetch portfolio view with unit aggregation and extended KPIs
  const { data: portfolioRows = [], isLoading: isLoadingPortfolio } = useQuery({
    queryKey: [QUERY_KEY, 'portfolio', tenantId, contextId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      // Fetch projects with unit counts
      let projectQuery = supabase
        .from('dev_projects')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      
      if (contextId) {
        projectQuery = projectQuery.eq('developer_context_id', contextId);
      }
      
      const { data: projectsData, error: projectsError } = await projectQuery;
      if (projectsError) throw projectsError;
      
      // Fetch all units for these projects with list_price for revenue calculation
      const projectIds = projectsData.map(p => p.id);
      if (projectIds.length === 0) return [];
      
      const { data: unitsData, error: unitsError } = await supabase
        .from('dev_project_units')
        .select('project_id, status, list_price')
        .in('project_id', projectIds);
      
      if (unitsError) throw unitsError;
      
      // Aggregate units per project
      const unitsByProject: Record<string, { 
        available: number; 
        reserved: number; 
        sold: number;
        revenueActual: number; // Sum of sold units × list_price
      }> = {};
      
      unitsData.forEach(unit => {
        if (!unitsByProject[unit.project_id]) {
          unitsByProject[unit.project_id] = { available: 0, reserved: 0, sold: 0, revenueActual: 0 };
        }
        if (unit.status === 'available') {
          unitsByProject[unit.project_id].available++;
        } else if (unit.status === 'reserved') {
          unitsByProject[unit.project_id].reserved++;
        } else if (unit.status === 'sold') {
          unitsByProject[unit.project_id].sold++;
          unitsByProject[unit.project_id].revenueActual += unit.list_price || 0;
        }
      });
      
      // Build portfolio rows with extended KPIs
      return projectsData.map(p => {
        const units = unitsByProject[p.id] || { available: 0, reserved: 0, sold: 0, revenueActual: 0 };
        const totalUnits = units.available + units.reserved + units.sold;
        const progressPercent = totalUnits > 0 ? Math.round((units.sold / totalUnits) * 100) : 0;
        
        // Calculate margin
        const purchasePrice = p.purchase_price || 0;
        const saleTarget = p.total_sale_target || 0;
        const renovation = p.renovation_budget || 0;
        const grossProfit = saleTarget - purchasePrice - renovation;
        const marginPercent = purchasePrice > 0 ? Math.round((grossProfit / purchasePrice) * 100) : null;
        
        return {
          id: p.id,
          project_code: p.project_code,
          name: p.name,
          city: p.city,
          postal_code: p.postal_code || null,
          project_type: (p as any).project_type || null, // May not exist in older rows
          status: p.status as ProjectStatus,
          total_units_count: totalUnits,
          units_available: units.available,
          units_reserved: units.reserved,
          units_sold: units.sold,
          purchase_price: p.purchase_price,
          total_sale_target: p.total_sale_target,
          sale_revenue_actual: units.revenueActual || null,
          profit_margin_percent: marginPercent,
          progress_percent: progressPercent,
          // Marketing flags
          kaufy_listed: p.kaufy_listed || false,
          kaufy_featured: p.kaufy_featured || false,
          landingpage_enabled: p.landingpage_enabled || false,
        } as ProjectPortfolioRow;
      });
    },
    enabled: !!tenantId,
  });

  // Create project
  const createProject = useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      if (!tenantId) throw new Error('No tenant selected');
      
      const { data, error } = await supabase
        .from('dev_projects')
        .insert({
          ...input,
          tenant_id: tenantId,
          created_by: user?.id,
        })
        .select(`
          *,
          developer_context:developer_contexts(*)
        `)
        .single();
      
      if (error) throw error;
      return data as DevProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Projekt erstellt');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Erstellen: ' + error.message);
    },
  });

  // Update project
  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DevProject> & { id: string }) => {
      const { data, error } = await supabase
        .from('dev_projects')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          developer_context:developer_contexts(*)
        `)
        .single();
      
      if (error) throw error;
      return data as DevProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Projekt aktualisiert');
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Aktualisieren: ' + error.message);
    },
  });

  // Delete project including storage files - returns detailed protocol
  const deleteProjectWithProtocol = async (id: string): Promise<{
    projectId: string;
    projectName: string;
    projectCode: string;
    storageFilesFound: string[];
    storageFilesDeleted: string[];
    storageErrors: string[];
    dbRecordsDeleted: {
      units: number;
      reservations: number;
      documents: number;
    };
    success: boolean;
    timestamp: string;
  }> => {
    if (!tenantId) throw new Error('No tenant selected');
    
    const protocol = {
      projectId: id,
      projectName: '',
      projectCode: '',
      storageFilesFound: [] as string[],
      storageFilesDeleted: [] as string[],
      storageErrors: [] as string[],
      dbRecordsDeleted: {
        units: 0,
        reservations: 0,
        documents: 0,
      },
      success: false,
      timestamp: new Date().toISOString(),
    };

    // Get project info for protocol
    const { data: project } = await supabase
      .from('dev_projects')
      .select('name, project_code')
      .eq('id', id)
      .single();
    
    if (project) {
      protocol.projectName = project.name || '';
      protocol.projectCode = project.project_code || '';
    }

    // Count records before deletion for protocol
    const { count: unitCount } = await supabase
      .from('dev_project_units')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id);
    protocol.dbRecordsDeleted.units = unitCount || 0;

    const { count: reservationCount } = await supabase
      .from('dev_project_reservations')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id);
    protocol.dbRecordsDeleted.reservations = reservationCount || 0;

    const { count: docCount } = await supabase
      .from('dev_project_documents')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id);
    protocol.dbRecordsDeleted.documents = docCount || 0;
    
    // 1. Recursively collect all storage files
    const storagePath = `projects/${tenantId}/${id}`;
    
    const collectFiles = async (folderPath: string): Promise<string[]> => {
      const files: string[] = [];
      
      try {
        const { data: items } = await supabase.storage
          .from('project-documents')
          .list(folderPath, { limit: 1000 });
        
        if (items) {
          for (const item of items) {
            const fullPath = `${folderPath}/${item.name}`;
            
            if (item.id === null) {
              // Folder - recurse
              const subFiles = await collectFiles(fullPath);
              files.push(...subFiles);
            } else {
              // File
              files.push(fullPath);
            }
          }
        }
      } catch (err) {
        console.error('Error listing folder:', folderPath, err);
      }
      
      return files;
    };

    try {
      protocol.storageFilesFound = await collectFiles(storagePath);
      
      // 2. Delete all files in batches
      if (protocol.storageFilesFound.length > 0) {
        // Supabase storage remove can handle up to 100 files at once
        const batchSize = 100;
        for (let i = 0; i < protocol.storageFilesFound.length; i += batchSize) {
          const batch = protocol.storageFilesFound.slice(i, i + batchSize);
          
          const { data: deleted, error: deleteError } = await supabase.storage
            .from('project-documents')
            .remove(batch);
          
          if (deleteError) {
            protocol.storageErrors.push(`Batch ${i / batchSize + 1}: ${deleteError.message}`);
          } else if (deleted) {
            protocol.storageFilesDeleted.push(...batch);
          }
        }
      }
    } catch (storageError) {
      console.error('Error cleaning up storage:', storageError);
      protocol.storageErrors.push(storageError instanceof Error ? storageError.message : 'Unknown error');
    }
    
    // 3. Delete project (cascade will handle units, reservations, documents, etc.)
    const { error } = await supabase
      .from('dev_projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      protocol.storageErrors.push(`DB: ${error.message}`);
      throw error;
    }
    
    protocol.success = true;
    return protocol;
  };

  const deleteProject = useMutation({
    mutationFn: deleteProjectWithProtocol,
    onSuccess: (protocol) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Projekt und Dateien gelöscht', {
        description: `${protocol.storageFilesDeleted.length} Dateien entfernt`,
      });
    },
    onError: (error: Error) => {
      toast.error('Fehler beim Löschen: ' + error.message);
    },
  });

  // Generate project code
  const generateProjectCode = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const prefix = 'BT';
    
    // Get count of existing projects this year
    const { count } = await supabase
      .from('dev_projects')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId!)
      .like('project_code', `${prefix}-${year}-%`);
    
    const nextNum = (count || 0) + 1;
    return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`;
  };

  // Filter demo data from DB results when toggle is OFF
  const filteredProjects = demoEnabled ? projects : projects.filter(p => !isDemoId(p.id));
  const filteredPortfolioRows = demoEnabled ? portfolioRows : portfolioRows.filter(p => !isDemoId(p.id));

  return {
    projects: filteredProjects,
    portfolioRows: filteredPortfolioRows,
    isLoading,
    isLoadingPortfolio,
    error,
    refetch,
    createProject,
    updateProject,
    deleteProject,
    generateProjectCode,
  };
}

// Hook for single project with full dossier data
export function useProjectDossier(projectId: string | undefined) {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;

  return useQuery({
    queryKey: [QUERY_KEY, 'dossier', projectId],
    queryFn: async () => {
      if (!projectId || !tenantId) return null;
      
      // Fetch project with context
      const { data: project, error: projectError } = await supabase
        .from('dev_projects')
        .select(`
          *,
          developer_context:developer_contexts(*)
        `)
        .eq('id', projectId)
        .single();
      
      if (projectError) throw projectError;
      
      // Fetch units
      const { data: units, error: unitsError } = await supabase
        .from('dev_project_units')
        .select('*')
        .eq('project_id', projectId)
        .order('unit_number');
      
      if (unitsError) throw unitsError;
      
      // Fetch reservations with buyer info
      const { data: reservations, error: reservationsError } = await supabase
        .from('dev_project_reservations')
        .select(`
          *,
          unit:dev_project_units(*),
          buyer_contact:contacts(id, first_name, last_name, email),
          partner_org:organizations!dev_project_reservations_partner_org_id_fkey(id, name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (reservationsError) throw reservationsError;
      
      // Fetch active calculation
      const { data: calculations, error: calcError } = await supabase
        .from('dev_project_calculations')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (calcError) throw calcError;
      
      // Fetch documents
      const { data: documents, error: docsError } = await supabase
        .from('dev_project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (docsError) throw docsError;
      
      return {
        project: project as DevProject,
        units: units || [],
        reservations: reservations || [],
        calculation: calculations?.[0] || null,
        documents: documents || [],
        context: project.developer_context,
      };
    },
    enabled: !!projectId && !!tenantId,
  });
}
