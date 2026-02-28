/**
 * Preview Safe Mode — Detects Lovable preview environment and provides
 * throttled configuration to prevent memory crashes.
 * 
 * Published builds are NEVER affected.
 */
import { useMemo } from 'react';

let _isPreviewCached: boolean | null = null;

function detectPreview(): boolean {
  if (_isPreviewCached !== null) return _isPreviewCached;
  try {
    const host = window.location.hostname;
    _isPreviewCached =
      host.includes('-preview--') ||
      (host.includes('lovable.app') && import.meta.env.DEV);
  } catch {
    _isPreviewCached = false;
  }
  return _isPreviewCached;
}

/** Lightweight non-hook helper for use outside React components */
export function isPreviewEnvironment(): boolean {
  return detectPreview();
}

export function usePreviewSafeMode() {
  const isPreview = useMemo(() => detectPreview(), []);

  return {
    /** true only in Lovable preview iframe — never in published builds */
    isPreview,
    /** PV monitoring interval: 60s in preview, 7s in production */
    safeRefreshInterval: isPreview ? 60_000 : 7_000,
    /** Whether to render heavy GPU widgets (Globe, Radio visualizer) */
    allowHeavyWidgets: !isPreview,
    /** Whether to render weather particle effects */
    allowWeatherEffects: !isPreview,
    /** Whether to preload modules eagerly */
    allowPreload: !isPreview,
  };
}
