import { useEffect, useRef } from 'react';

/**
 * usePageView — Fires a single page view event to sot-page-view edge function.
 * GDPR-compliant: no cookies, no IP storage, no personal data.
 * Deduplicates via useRef to prevent double-fires in StrictMode.
 */
export function usePageView(brand: string, path: string) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (!projectId) return;

    const url = `https://${projectId}.supabase.co/functions/v1/sot-page-view`;

    // Fire-and-forget, non-blocking
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand,
        path,
        referrer: document.referrer || null,
      }),
      keepalive: true,
    }).catch(() => {
      // Silently fail — analytics should never break the UX
    });
  }, [brand, path]);
}
