/**
 * syncProjectImagesToProperty — Copies image document_links from project to property.
 * 
 * SSOT rule: Property-level document_links are the ONLY source for all downstream channels
 * (Zone 3, MOD-08, MOD-09). This function propagates project images into property links
 * idempotently (upsert by document_id + object_id).
 * 
 * Called by syncProjectToListings during the media resync pass.
 */
import { supabase } from '@/integrations/supabase/client';

export interface ImageSyncResult {
  synced: number;
  skipped: number;
  errors: string[];
}

export async function syncProjectImagesToProperty(
  tenantId: string,
  projectId: string,
  propertyId: string,
): Promise<ImageSyncResult> {
  const result: ImageSyncResult = { synced: 0, skipped: 0, errors: [] };

  // 1. Fetch project-level image links (SSOT source)
  const { data: projectLinks, error: plErr } = await supabase
    .from('document_links')
    .select('document_id, is_title_image, display_order, slot_key, documents!inner (file_path, mime_type)')
    .eq('object_type', 'project')
    .eq('object_id', projectId)
    .eq('link_status', 'linked')
    .order('is_title_image', { ascending: false })
    .order('display_order', { ascending: true });

  if (plErr) {
    result.errors.push(`Projekt-Links laden: ${plErr.message}`);
    return result;
  }

  // Filter to images only
  const imageLinks = (projectLinks ?? []).filter((link: any) => {
    const doc = link.documents;
    return doc?.file_path && String(doc.mime_type || '').startsWith('image/');
  });

  if (imageLinks.length === 0) return result;

  // 2. Fetch existing property image links (to avoid duplicates)
  const { data: existingLinks } = await supabase
    .from('document_links')
    .select('document_id')
    .eq('object_type', 'property')
    .eq('object_id', propertyId)
    .eq('link_status', 'linked');

  const existingDocIds = new Set((existingLinks ?? []).map((l: any) => l.document_id));

  // 3. Insert missing links (idempotent — skip if document already linked)
  let coverAssigned = false;
  for (let i = 0; i < imageLinks.length; i++) {
    const link = imageLinks[i] as any;
    const docId = link.document_id;

    if (existingDocIds.has(docId)) {
      result.skipped++;
      continue;
    }

    const isCover = !coverAssigned && (link.is_title_image === true || i === 0);
    if (isCover) coverAssigned = true;

    const { error: insertErr } = await supabase
      .from('document_links')
      .insert({
        document_id: docId,
        object_type: 'property',
        object_id: propertyId,
        tenant_id: tenantId,
        link_status: 'linked',
        is_title_image: isCover,
        display_order: i,
        slot_key: isCover ? 'hero' : (link.slot_key || null),
        expose_visibility: 'public',
      });

    if (insertErr) {
      result.errors.push(`Link doc ${docId}: ${insertErr.message}`);
    } else {
      result.synced++;
    }
  }

  // 4. Update display_order on existing links to match project order
  // (ensures consistent gallery ordering across all channels)
  if (existingDocIds.size > 0) {
    for (let i = 0; i < imageLinks.length; i++) {
      const link = imageLinks[i] as any;
      if (!existingDocIds.has(link.document_id)) continue;

      const isCover = link.is_title_image === true || i === 0;
      await supabase
        .from('document_links')
        .update({ display_order: i, is_title_image: isCover })
        .eq('document_id', link.document_id)
        .eq('object_type', 'property')
        .eq('object_id', propertyId);
    }
  }

  return result;
}
