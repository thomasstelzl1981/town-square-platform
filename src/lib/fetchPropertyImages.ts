/**
 * Shared helper for fetching property images with signed URLs.
 * Used by MOD-08, MOD-09, and Zone 3 (KAUFY) for consistent image loading.
 * Now uses centralized imageCache for deduplication and TTL caching.
 */
import { supabase } from '@/integrations/supabase/client';
import { getCachedSignedUrl } from '@/lib/imageCache';

interface DocumentLink {
  object_id: string;
  is_title_image: boolean | null;
  display_order: number | null;
  documents: {
    file_path: string | null;
    mime_type: string | null;
  } | null;
}

/**
 * Fetches hero images for properties using document_links and signed URLs.
 * Returns a Map of propertyId → signedUrl
 */
export async function fetchPropertyImages(
  propertyIds: string[]
): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();

  if (propertyIds.length === 0) return imageMap;

  // 1. Query document_links with documents join
  const { data: imageLinks, error } = await supabase
    .from('document_links')
    .select(`
      object_id,
      is_title_image,
      display_order,
      documents!inner (file_path, mime_type)
    `)
    .in('object_id', propertyIds)
    .eq('object_type', 'property')
    .order('is_title_image', { ascending: false })
    .order('display_order', { ascending: true });

  if (error || !imageLinks?.length) return imageMap;

  // 2. Find best image per property (title image first, then lowest display_order)
  const bestByProperty = new Map<string, string>();

  for (const link of imageLinks as DocumentLink[]) {
    const doc = link.documents;
    if (!doc?.file_path) continue;
    if (!String(doc.mime_type || '').startsWith('image/')) continue;

    const propId = link.object_id;
    
    if (!bestByProperty.has(propId) || link.is_title_image) {
      bestByProperty.set(propId, doc.file_path);
    }
  }

  // 3. Generate signed URLs in parallel (via cache)
  await Promise.all(
    Array.from(bestByProperty.entries()).map(async ([propId, filePath]) => {
      const url = await getCachedSignedUrl(filePath);
      if (url) {
        imageMap.set(propId, url);
      }
    })
  );

  return imageMap;
}
