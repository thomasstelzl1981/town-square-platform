/**
 * useIntakeChecklistProgress — Queries the database to determine
 * how many required documents per module are already present.
 *
 * Checks `documents` table for matching document names linked to the tenant.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { STORAGE_MANIFEST, type ModuleStorageConfig } from '@/config/storageManifest';

export interface ChecklistProgress {
  module: ModuleStorageConfig;
  foundCount: number;
  totalCount: number;
  foundDocs: Set<string>;
}

const MODULES_WITH_CHECKLISTS = ['MOD_04', 'MOD_07', 'MOD_17', 'MOD_19'] as const;

export function useIntakeChecklistProgress(refreshKey: number = 0) {
  const { activeTenantId } = useAuth();
  const [progress, setProgress] = useState<ChecklistProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeTenantId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        // Get all document names for this tenant
        const { data: docs } = await supabase
          .from('documents')
          .select('name')
          .eq('tenant_id', activeTenantId);

        const docNames = new Set((docs ?? []).map((d) => d.name?.toLowerCase().trim()));

        const results: ChecklistProgress[] = [];

        for (const code of MODULES_WITH_CHECKLISTS) {
          const mod = STORAGE_MANIFEST[code];
          if (!mod || mod.required_docs.length === 0) continue;

          const foundDocs = new Set<string>();

          for (const reqDoc of mod.required_docs) {
            const reqLower = reqDoc.name.toLowerCase().trim();
            // Check if any uploaded document name contains the required doc name
            for (const uploaded of docNames) {
              if (uploaded.includes(reqLower) || reqLower.includes(uploaded)) {
                foundDocs.add(reqDoc.name);
                break;
              }
            }
          }

          results.push({
            module: mod,
            foundCount: foundDocs.size,
            totalCount: mod.required_docs.length,
            foundDocs,
          });
        }

        setProgress(results);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [activeTenantId, refreshKey]);

  return { progress, isLoading };
}
