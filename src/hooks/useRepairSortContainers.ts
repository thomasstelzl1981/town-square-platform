/**
 * useRepairSortContainers — Einmaliges Repair-Script
 * 
 * Findet alle Fahrzeuge (cars_vehicles) ohne zugehörige inbox_sort_containers
 * und erstellt nachträglich Container + Sortierregeln.
 * 
 * Nutzung: repairMutation.mutate() aufrufen, danach kann der Hook entfernt werden.
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RepairResult {
  repaired: number;
  skipped: number;
  errors: string[];
}

export function useRepairSortContainers() {
  return useMutation({
    mutationFn: async (tenantId: string): Promise<RepairResult> => {
      const result: RepairResult = { repaired: 0, skipped: 0, errors: [] };

      // 1. All vehicles for this tenant
      const { data: vehicles, error: vErr } = await supabase
        .from('cars_vehicles')
        .select('id, license_plate, make, model, tenant_id')
        .eq('tenant_id', tenantId);

      if (vErr) throw vErr;
      if (!vehicles?.length) return result;

      // 2. Existing sort containers for entity_type = 'vehicle'
      const { data: existingContainers } = await supabase
        .from('inbox_sort_containers')
        .select('entity_id')
        .eq('tenant_id', tenantId)
        .eq('entity_type', 'vehicle' as any);

      const existingIds = new Set((existingContainers || []).map((c: any) => c.entity_id));

      // 3. Find vehicles without container
      const missing = vehicles.filter(v => !existingIds.has(v.id));

      if (!missing.length) {
        result.skipped = vehicles.length;
        return result;
      }

      // 4. Also check/create DMS root folder for MOD_17
      const { data: rootFolder } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('module_code', 'MOD_17')
        .is('parent_id', null)
        .eq('node_type', 'folder')
        .maybeSingle();

      // 5. Repair each vehicle
      for (const v of missing) {
        try {
          const entityName = [v.license_plate, v.make, v.model].filter(Boolean).join(' ');

          // 5a. Check if DMS folder exists, create if not
          let folderQuery = supabase
            .from('storage_nodes')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('entity_type', 'vehicle' as any)
            .eq('entity_id', v.id)
            .eq('node_type', 'folder');

          if (rootFolder?.id) {
            folderQuery = folderQuery.eq('parent_id', rootFolder.id);
          } else {
            folderQuery = folderQuery.is('parent_id', null);
          }

          const { data: existingFolderData } = await folderQuery.maybeSingle();

          let folderId = existingFolderData?.id;

          if (!folderId) {
            const { data: newFolder, error: folderErr } = await supabase
              .from('storage_nodes')
              .insert({
                tenant_id: tenantId,
                name: entityName,
                node_type: 'folder',
                module_code: 'MOD_17',
                entity_type: 'vehicle',
                entity_id: v.id,
                parent_id: rootFolder?.id || null,
                auto_created: true,
              } as any)
              .select('id')
              .single();

            if (folderErr) {
              result.errors.push(`Folder ${v.license_plate}: ${folderErr.message}`);
              continue;
            }
            folderId = newFolder.id;

            // Create DMS subfolders
            const subfolders = [
              '01_Zulassung', '02_Versicherung', '03_Werkstatt_TUeV',
              '04_Kaufvertrag', '05_Sonstiges',
            ].map(name => ({
              tenant_id: tenantId,
              name,
              node_type: 'folder',
              module_code: 'MOD_17',
              entity_type: 'vehicle',
              entity_id: v.id,
              parent_id: folderId!,
              auto_created: true,
            }));

            await supabase.from('storage_nodes').insert(subfolders as any);
          }

          // 5b. Create inbox_sort_container
          const { data: container, error: cErr } = await supabase
            .from('inbox_sort_containers')
            .insert({
              tenant_id: tenantId,
              name: entityName,
              is_enabled: true,
              entity_type: 'vehicle',
              entity_id: v.id,
            } as any)
            .select('id')
            .single();

          if (cErr) {
            result.errors.push(`Container ${v.license_plate}: ${cErr.message}`);
            continue;
          }

          // 5c. Create inbox_sort_rules with keywords
          const keywords = [v.license_plate, v.make, v.model].filter(Boolean);
          if (keywords.length > 0) {
            await supabase
              .from('inbox_sort_rules')
              .insert({
                container_id: container.id,
                field: 'subject',
                operator: 'contains',
                keywords_json: keywords,
              } as any);
          }

          result.repaired++;
        } catch (err: any) {
          result.errors.push(`${v.license_plate}: ${err.message}`);
        }
      }

      result.skipped = vehicles.length - missing.length;
      return result;
    },
    onSuccess: (result) => {
      if (result.repaired > 0) {
        toast.success(`${result.repaired} Fahrzeug(e) repariert, ${result.skipped} übersprungen`);
      } else {
        toast.info(`Alle ${result.skipped} Fahrzeuge hatten bereits Sortierkacheln`);
      }
      if (result.errors.length > 0) {
        console.error('Repair errors:', result.errors);
        toast.error(`${result.errors.length} Fehler — siehe Console`);
      }
    },
    onError: (err) => {
      console.error('Repair failed:', err);
      toast.error('Repair fehlgeschlagen');
    },
  });
}
