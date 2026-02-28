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
  'futureroom.app': { siteKey: 'futureroom', base: '/website/futureroom' },
  'www.futureroom.app': { siteKey: 'futureroom', base: '/website/futureroom' },
  'futureroom.cloud': { siteKey: 'futureroom', base: '/website/futureroom' },
  'www.futureroom.cloud': { siteKey: 'futureroom', base: '/website/futureroom' },
  'futureroom.finance': { siteKey: 'futureroom', base: '/website/futureroom' },
  'www.futureroom.finance': { siteKey: 'futureroom', base: '/website/futureroom' },
  // Acquiary
  'acquiary.com': { siteKey: 'acquiary', base: '/website/acquiary' },
  'www.acquiary.com': { siteKey: 'acquiary', base: '/website/acquiary' },
  'acquiary.de': { siteKey: 'acquiary', base: '/website/acquiary' },
  'www.acquiary.de': { siteKey: 'acquiary', base: '/website/acquiary' },
  // Lennox & Friends
  'lennoxandfriends.app': { siteKey: 'lennox', base: '/website/tierservice' },
  'www.lennoxandfriends.app': { siteKey: 'lennox', base: '/website/tierservice' },
  // System of a Town (primary domain — also serves portal)
  'systemofatown.com': { siteKey: 'sot', base: '/website/sot' },
  'www.systemofatown.com': { siteKey: 'sot', base: '/website/sot' },
  // Ncore Business Consulting
  'ncore.online': { siteKey: 'ncore', base: '/website/ncore' },
  'www.ncore.online': { siteKey: 'ncore', base: '/website/ncore' },
  'thomasstelzl.com': { siteKey: 'ncore', base: '/website/ncore' },
  'www.thomasstelzl.com': { siteKey: 'ncore', base: '/website/ncore' },
  'thomas-stelzl.com': { siteKey: 'ncore', base: '/website/ncore' },
  'www.thomas-stelzl.com': { siteKey: 'ncore', base: '/website/ncore' },
  'thomasstelzl.de': { siteKey: 'ncore', base: '/website/ncore' },
  'www.thomasstelzl.de': { siteKey: 'ncore', base: '/website/ncore' },
  // Otto² Advisory (ZL Finanzdienstleistungen GmbH)
  'otto2advisory.com': { siteKey: 'otto', base: '/website/otto-advisory' },
  'www.otto2advisory.com': { siteKey: 'otto', base: '/website/otto-advisory' },
  'finanzdienstleistungen.gmbh': { siteKey: 'otto', base: '/website/otto-advisory' },
  'www.finanzdienstleistungen.gmbh': { siteKey: 'otto', base: '/website/otto-advisory' },
  'finanzdienstleistungen.info': { siteKey: 'otto', base: '/website/otto-advisory' },
  'www.finanzdienstleistungen.info': { siteKey: 'otto', base: '/website/otto-advisory' },
  'zl-beratung.de': { siteKey: 'otto', base: '/website/otto-advisory' },
  'www.zl-beratung.de': { siteKey: 'otto', base: '/website/otto-advisory' },
  'zl-finanzen.de': { siteKey: 'otto', base: '/website/otto-advisory' },
  'www.zl-finanzen.de': { siteKey: 'otto', base: '/website/otto-advisory' },
  // ZL Wohnbau GmbH
  'zl-wohnbau.de': { siteKey: 'zlwohnbau', base: '/website/zl-wohnbau' },
  'www.zl-wohnbau.de': { siteKey: 'zlwohnbau', base: '/website/zl-wohnbau' },
  'zl-gruppe.com': { siteKey: 'zlwohnbau', base: '/website/zl-wohnbau' },
  'www.zl-gruppe.com': { siteKey: 'zlwohnbau', base: '/website/zl-wohnbau' },
};

/**
 * Resolve current hostname to a domain entry.
 * Returns null for staging/preview domains (*.lovable.app, localhost, etc.)
 */
export function resolveDomain(hostname: string): DomainEntry | null {
  return domainMap[hostname] ?? null;
}
