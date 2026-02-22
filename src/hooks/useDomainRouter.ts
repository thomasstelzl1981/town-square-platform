import { useMemo } from 'react';
import { resolveDomain, type DomainEntry } from '@/config/domainMap';

/**
 * Detects if the current hostname matches a branded Zone 3 domain.
 * Returns the DomainEntry or null for staging/portal-only domains.
 */
export function useDomainRouter(): DomainEntry | null {
  return useMemo(() => resolveDomain(window.location.hostname), []);
}

/**
 * Non-hook version for use outside React components (e.g. in router setup).
 */
export function getDomainEntry(): DomainEntry | null {
  return resolveDomain(window.location.hostname);
}
