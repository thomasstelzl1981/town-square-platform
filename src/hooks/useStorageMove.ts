/**
 * useStorageMove — Hook for moving files and folders within the DMS
 * 
 * ARCH-DMS-01: Both document_links.node_id AND storage_nodes.parent_id
 * are updated atomically in the server-side RPC.
 */
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MoveResult {
  success: boolean;
  message: string;
  error?: string;
}

export function useStorageMove(tenantId: string, onSuccess?: () => void) {
  const [isMoving, setIsMoving] = useState(false);

  const moveFile = useCallback(async (documentId: string, newFolderId: string): Promise<boolean> => {
    setIsMoving(true);
    try {
      const { data, error } = await supabase.rpc('move_storage_file', {
        p_document_id: documentId,
        p_new_folder_id: newFolderId,
        p_tenant_id: tenantId,
      });

      if (error) throw error;

      const result = data as unknown as MoveResult;
      if (!result.success) {
        toast.error(result.message);
        return false;
      }

      toast.success(result.message);
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Move file failed:', err);
      toast.error('Verschieben fehlgeschlagen');
      return false;
    } finally {
      setIsMoving(false);
    }
  }, [tenantId, onSuccess]);

  const moveFolder = useCallback(async (folderId: string, newParentId: string): Promise<boolean> => {
    setIsMoving(true);
    try {
      const { data, error } = await supabase.rpc('move_storage_folder', {
        p_folder_id: folderId,
        p_new_parent_id: newParentId,
        p_tenant_id: tenantId,
      });

      if (error) throw error;

      const result = data as unknown as MoveResult;
      if (!result.success) {
        toast.error(result.message);
        return false;
      }

      toast.success(result.message);
      onSuccess?.();
      return true;
    } catch (err) {
      console.error('Move folder failed:', err);
      toast.error('Verschieben fehlgeschlagen');
      return false;
    } finally {
      setIsMoving(false);
    }
  }, [tenantId, onSuccess]);

  return { moveFile, moveFolder, isMoving };
}
