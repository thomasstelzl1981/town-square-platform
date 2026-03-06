/**
 * Storage URL helpers
 *
 * In some environments the storage sign endpoint returns a relative path
 * (e.g. "/object/sign/<bucket>/<path>?token=...").
 * For <img src>, fetch and downloads we need an absolute URL.
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

function inferFilenameFromUrl(url: string): string | undefined {
  try {
    const { pathname } = new URL(url);
    const raw = pathname.split('/').pop();
    return raw ? decodeURIComponent(raw) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Robust download helper for signed storage URLs.
 *
 * Why: some client-side filters block direct navigation to `.../storage/v1/object/sign/...`.
 * We fetch the blob first and then trigger a local object URL download.
 */
export async function downloadFromSignedUrl(signedUrl?: string | null, fileName?: string): Promise<void> {
  const absoluteUrl = resolveStorageSignedUrl(signedUrl);
  if (!absoluteUrl) {
    throw new Error('Ungültige Download-URL');
  }

  const response = await fetch(absoluteUrl, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`Download fehlgeschlagen (${response.status})`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = fileName || inferFilenameFromUrl(absoluteUrl) || 'download';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1500);
}

