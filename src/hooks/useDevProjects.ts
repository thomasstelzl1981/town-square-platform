/**
 * Hook for managing Developer Projects
 * MOD-13 PROJEKTE
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DevProject, CreateProjectInput, ProjectPortfolioRow, ProjectStatus } from '@/types/projekte';

const QUERY_KEY = 'dev-projects';

export function useDevProjects(contextId?: string) {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = profile?.active_tenant_id;

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

  // Delete project including storage files
  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('No tenant selected');
      
      // 1. Delete files from Storage bucket
      const storagePath = `projects/${tenantId}/${id}`;
      
      try {
        // List all files in the project folder
        const { data: files } = await supabase.storage
          .from('project-documents')
          .list(storagePath, { limit: 1000 });
        
        if (files && files.length > 0) {
          // List expose subfolder
          const { data: exposeFiles } = await supabase.storage
            .from('project-documents')
            .list(`${storagePath}/expose`);
          
          // List pricelist subfolder
          const { data: pricelistFiles } = await supabase.storage
            .from('project-documents')
            .list(`${storagePath}/pricelist`);
          
          const filesToDelete: string[] = [];
          
          if (exposeFiles) {
            exposeFiles.forEach(f => filesToDelete.push(`${storagePath}/expose/${f.name}`));
          }
          if (pricelistFiles) {
            pricelistFiles.forEach(f => filesToDelete.push(`${storagePath}/pricelist/${f.name}`));
          }
          
          if (filesToDelete.length > 0) {
            const { error: deleteStorageError } = await supabase.storage
              .from('project-documents')
              .remove(filesToDelete);
            
            if (deleteStorageError) {
              console.error('Storage delete error:', deleteStorageError);
              // Continue with project deletion even if storage fails
            }
          }
        }
      } catch (storageError) {
        console.error('Error cleaning up storage:', storageError);
        // Continue with project deletion
      }
      
      // 2. Delete project (cascade will handle units, reservations, etc.)
      const { error } = await supabase
        .from('dev_projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Projekt und Dateien gelöscht');
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

  return {
    projects,
    portfolioRows,
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
          partner_org:organizations(id, name)
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
