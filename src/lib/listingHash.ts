/**
 * Listing Hash — Computes a deterministic hash for drift detection.
 * Used by SLC Channel Drift to detect when a listing has changed
 * but the publication hasn't been re-synced.
 */

/**
 * Compute a simple hash from listing fields relevant for publication.
 * Uses a basic string hash (DJB2) — sufficient for drift detection.
 */
export function computeListingHash(fields: {
  title?: string | null;
  asking_price?: number | null;
  description?: string | null;
  commission_rate?: number | null;
  status?: string | null;
}): string {
  const input = [
    fields.title || '',
    String(fields.asking_price || 0),
    fields.description || '',
    String(fields.commission_rate || 0),
    fields.status || '',
  ].join('|');

  // DJB2 hash
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
