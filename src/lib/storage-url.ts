/**
 * Storage URL helpers
 *
 * In some environments the storage sign endpoint returns a relative path
 * (e.g. "/object/sign/<bucket>/<path>?token=...").
 * For <img src> and window.open we need an absolute URL.
 */

export function resolveStorageSignedUrl(signedUrl?: string | null): string {
  if (!signedUrl) return '';
  if (signedUrl.startsWith('http://') || signedUrl.startsWith('https://')) return signedUrl;

  const base = import.meta.env.VITE_SUPABASE_URL;
  if (!base) return signedUrl;

  // Supabase storage returns paths starting with "/object/..."
  if (signedUrl.startsWith('/')) {
    return `${base}/storage/v1${signedUrl}`;
  }

  // Fallback for paths like "object/sign/..."
  if (signedUrl.startsWith('object/')) {
    return `${base}/storage/v1/${signedUrl}`;
  }

  return signedUrl;
}
