/**
 * Admin Repair Script: Fix document_links with node_id = NULL
 * 
 * DRY-RUN MODE: Set DRY_RUN=true to analyze without making changes.
 * 
 * Strategy:
 * 1. Find all document_links where node_id IS NULL
 * 2. For each, resolve the intended target folder via:
 *    - object_type + object_id → find matching entity root folder
 * 3. Output analysis per record
 * 4. If not dry-run, patch node_id to resolved folder
 * 
 * Usage: Import and call from admin panel or browser console
 */

import { supabase } from '@/integrations/supabase/client';

interface RepairResult {
  document_link_id: string;
  tenant_id: string;
  document_id: string;
  object_type: string | null;
  object_id: string | null;
  current_node_id: string | null;
  resolved_folder_id: string | null;
  resolved_folder_name: string | null;
  status: 'repaired' | 'no_folder_found' | 'skipped' | 'dry_run';
  error?: string;
}

export async function repairBrokenDocumentLinks(options: { dryRun?: boolean; limit?: number } = {}): Promise<{
  total: number;
  repaired: number;
  no_folder: number;
  skipped: number;
  results: RepairResult[];
}> {
  const { dryRun = true, limit = 100 } = options;

  console.log(`[REPAIR] Starting document_links repair (dry_run=${dryRun}, limit=${limit})`);

  // 1. Find broken links
  const { data: brokenLinks, error: fetchError } = await supabase
    .from('document_links')
    .select('id, tenant_id, document_id, object_type, object_id, node_id')
    .is('node_id', null)
    .limit(limit);

  if (fetchError) {
    console.error('[REPAIR] Failed to fetch broken links:', fetchError);
    return { total: 0, repaired: 0, no_folder: 0, skipped: 0, results: [] };
  }

  const links = brokenLinks || [];
  console.log(`[REPAIR] Found ${links.length} document_links with node_id=NULL`);

  const results: RepairResult[] = [];
  let repaired = 0;
  let noFolder = 0;
  let skipped = 0;

  // 2. Build a cache of entity root folders
  const folderCache = new Map<string, { id: string; name: string } | null>();

  for (const link of links) {
    const result: RepairResult = {
      document_link_id: link.id,
      tenant_id: link.tenant_id,
      document_id: link.document_id,
      object_type: link.object_type,
      object_id: link.object_id,
      current_node_id: link.node_id,
      resolved_folder_id: null,
      resolved_folder_name: null,
      status: 'skipped',
    };

    if (!link.object_type || !link.object_id) {
      result.status = 'skipped';
      result.error = 'No object_type or object_id';
      skipped++;
      results.push(result);
      continue;
    }

    // 3. Resolve target folder
    const cacheKey = `${link.tenant_id}:${link.object_type}:${link.object_id}`;
    
    if (!folderCache.has(cacheKey)) {
      // Find entity root folder
      const { data: folder } = await supabase
        .from('storage_nodes')
        .select('id, name')
        .eq('tenant_id', link.tenant_id)
        .eq('entity_type', link.object_type)
        .eq('entity_id', link.object_id)
        .eq('node_type', 'folder')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      folderCache.set(cacheKey, folder || null);
    }

    const resolvedFolder = folderCache.get(cacheKey);

    if (!resolvedFolder) {
      result.status = 'no_folder_found';
      result.error = `No root folder for ${link.object_type}/${link.object_id}`;
      noFolder++;
      results.push(result);
      continue;
    }

    result.resolved_folder_id = resolvedFolder.id;
    result.resolved_folder_name = resolvedFolder.name;

    // 4. Patch if not dry-run
    if (dryRun) {
      result.status = 'dry_run';
    } else {
      const { error: updateError } = await supabase
        .from('document_links')
        .update({ node_id: resolvedFolder.id })
        .eq('id', link.id);

      if (updateError) {
        result.status = 'skipped';
        result.error = updateError.message;
        skipped++;
      } else {
        result.status = 'repaired';
        repaired++;
      }
    }

    results.push(result);
  }

  // 5. Summary
  const summary = {
    total: links.length,
    repaired: dryRun ? 0 : repaired,
    no_folder: noFolder,
    skipped: skipped + (dryRun ? links.length - noFolder - skipped : 0),
    results,
  };

  console.log('[REPAIR] Summary:', {
    total: summary.total,
    repaired: summary.repaired,
    no_folder: summary.no_folder,
    skipped: summary.skipped,
  });

  console.table(results.map(r => ({
    link_id: r.document_link_id.slice(0, 8),
    tenant: r.tenant_id.slice(0, 8),
    object: `${r.object_type}/${r.object_id?.slice(0, 8)}`,
    resolved_to: r.resolved_folder_name || '—',
    status: r.status,
    error: r.error || '',
  })));

  return summary;
}
