/**
 * DOMAIN MAP — Maps custom domains to Zone 3 website routes
 * 
 * Each custom domain is mapped to a siteKey (matching zone3Websites keys in routesManifest)
 * and a base path (the internal route prefix for that site).
 */

export interface DomainEntry {
  siteKey: string;
  base: string;
}

export const domainMap: Record<string, DomainEntry> = {
  // Kaufy
  'kaufy.immo': { siteKey: 'kaufy', base: '/website/kaufy' },
  'www.kaufy.immo': { siteKey: 'kaufy', base: '/website/kaufy' },
  // FutureRoom
  'futureroom.online': { siteKey: 'futureroom', base: '/website/futureroom' },
  'www.futureroom.online': { siteKey: 'futureroom', base: '/website/futureroom' },
  // Acquiary
  'acquiary.com': { siteKey: 'acquiary', base: '/website/acquiary' },
  'www.acquiary.com': { siteKey: 'acquiary', base: '/website/acquiary' },
  // Lennox & Friends
  'lennoxandfriends.app': { siteKey: 'lennox', base: '/website/tierservice' },
  'www.lennoxandfriends.app': { siteKey: 'lennox', base: '/website/tierservice' },
  // System of a Town (primary domain — also serves portal)
  'systemofatown.com': { siteKey: 'sot', base: '/website/sot' },
  'www.systemofatown.com': { siteKey: 'sot', base: '/website/sot' },
};

/**
 * Resolve current hostname to a domain entry.
 * Returns null for staging/preview domains (*.lovable.app, localhost, etc.)
 */
export function resolveDomain(hostname: string): DomainEntry | null {
  return domainMap[hostname] ?? null;
}
