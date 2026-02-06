/**
 * useViewTracking - Hook für View-Tracking von Listings
 * Registriert einen View in listing_views bei Exposé-Aufruf
 * Dedupliziert Views pro Session
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseViewTrackingOptions {
  listingId: string | null;
  tenantId: string | null;
  source?: 'portal' | 'kaufy' | 'partner' | 'direct';
  enabled?: boolean;
}

// Generate session ID (persists for browser session)
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('sot_view_session');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('sot_view_session', sessionId);
  }
  return sessionId;
};

// Hash IP for privacy (we'll use session ID instead on frontend)
const getViewerHash = () => {
  // In frontend we use session-based tracking instead of IP
  return getSessionId();
};

export const useViewTracking = ({
  listingId,
  tenantId,
  source = 'portal',
  enabled = true
}: UseViewTrackingOptions) => {
  const hasTracked = useRef(false);
  const trackingKey = `view_${listingId}_${source}`;

  useEffect(() => {
    // Reset tracking flag when listing changes
    hasTracked.current = false;
  }, [listingId]);

  useEffect(() => {
    if (!enabled || !listingId || !tenantId || hasTracked.current) {
      return;
    }

    // Check if already tracked this session
    const alreadyTracked = sessionStorage.getItem(trackingKey);
    if (alreadyTracked) {
      hasTracked.current = true;
      return;
    }

    const trackView = async () => {
      try {
        const { error } = await supabase
          .from('listing_views')
          .insert({
            listing_id: listingId,
            tenant_id: tenantId,
            viewer_session: getSessionId(),
            viewer_ip_hash: getViewerHash(),
            source: source,
            referrer: document.referrer || null
          });

        if (error) {
          console.warn('View tracking failed:', error.message);
        } else {
          // Mark as tracked for this session
          sessionStorage.setItem(trackingKey, Date.now().toString());
          hasTracked.current = true;
        }
      } catch (err) {
        console.warn('View tracking error:', err);
      }
    };

    // Small delay to ensure page has loaded
    const timer = setTimeout(trackView, 500);
    return () => clearTimeout(timer);
  }, [listingId, tenantId, source, enabled, trackingKey]);

  return { hasTracked: hasTracked.current };
};

export default useViewTracking;
