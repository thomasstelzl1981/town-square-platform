/**
 * Hook for PV DMS — Auto-create folder structure for PV plants
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PV_DMS_FOLDERS = [
  '01_Stammdaten',
  '02_MaStR_BNetzA',
  '03_Netzbetreiber',
  '04_Zaehler',
  '05_Wechselrichter_und_Speicher',
  '06_Versicherung',
  '07_Steuer_USt_BWA',
  '08_Wartung_Service',
];

export const PV_REQUIRED_DOCS = [
  { name: 'Inbetriebnahmeprotokoll', folder: '05_Wechselrichter_und_Speicher' },
  { name: 'Netzbetreiber-Bestätigung', folder: '03_Netzbetreiber' },
  { name: 'Anmeldebestätigung MaStR', folder: '02_MaStR_BNetzA' },
  { name: 'Zählerprotokoll', folder: '04_Zaehler' },
  { name: 'Versicherungsnachweis', folder: '06_Versicherung' },
  { name: 'Wartungsvertrag', folder: '08_Wartung_Service' },
];

export function usePvDMS() {
  const { profile } = useAuth();
  const tenantId = profile?.active_tenant_id;
  const queryClient = useQueryClient();

  const createDMSTree = useMutation({
    mutationFn: async ({ plantId, plantName }: { plantId: string; plantName: string }) => {
      if (!tenantId) throw new Error('No tenant');

      // Create root folder for this plant
      const { data: root, error: rootErr } = await supabase
        .from('storage_nodes')
        .insert({
          name: plantName,
          node_type: 'folder',
          tenant_id: tenantId,
          pv_plant_id: plantId,
          module_code: 'MOD-19',
        })
        .select()
        .single();

      if (rootErr) throw rootErr;

      // Create sub-folders
      for (const folderName of PV_DMS_FOLDERS) {
        await supabase
          .from('storage_nodes')
          .insert({
            name: folderName,
            node_type: 'folder',
            parent_id: root.id,
            tenant_id: tenantId,
            pv_plant_id: plantId,
            module_code: 'MOD-19',
          });
      }

      // Update plant with dms_root_node_id
      await supabase
        .from('pv_plants')
        .update({ dms_root_node_id: root.id })
        .eq('id', plantId);

      return root.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pv-plants'] });
    },
    onError: (err: Error) => {
      toast.error('DMS-Fehler: ' + err.message);
    },
  });

  return { createDMSTree, PV_DMS_FOLDERS, PV_REQUIRED_DOCS };
}
