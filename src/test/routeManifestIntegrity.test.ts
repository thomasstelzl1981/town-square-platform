/**
 * Route Manifest Integrity Tests
 *
 * Validates that the routing configuration in Zone2Router and Zone3Router
 * stays in sync with the single source of truth in routesManifest.ts.
 *
 * Test (1): Every key in portalModulePageMap (Zone2Router) has a matching
 *           entry (by base) in zone2Portal.modules from routesManifest.ts.
 *
 * Test (2): Every Zone-3 website in zone3Websites has a component mapping
 *           for each of its routes in Zone3Router's zone3ComponentMaps.
 */

import { describe, it, expect } from 'vitest';
import { zone2Portal, zone3Websites } from '@/manifests/routesManifest';

// =============================================================================
// (1) Zone 2: portalModulePageMap keys must match zone2Portal.modules bases
// =============================================================================

/**
 * The set of keys present in portalModulePageMap in src/router/Zone2Router.tsx.
 * Update this list when adding or removing entries from that map.
 */
const portalModulePageMapKeys: ReadonlySet<string> = new Set([
  'dashboard',
  'stammdaten',
  'office',
  'dms',
  'immobilien',
  'verkauf',
  'finanzierung',
  'finanzierungsmanager',
  'investments',
  'vertriebspartner',
  'lead-manager',
  'akquise-manager',
  'projekte',
  'communication-pro',
  'fortbildung',
  'services',
  'cars',
  'finanzanalyse',
  'photovoltaik',
  'miety',
  'pets',
  'petmanager',
]);

describe('Zone 2: portalModulePageMap ↔ routesManifest integrity', () => {
  const moduleBases = new Set(
    Object.values(zone2Portal.modules || {}).map((m) => m.base)
  );

  it('every key in portalModulePageMap has a matching module base in zone2Portal.modules', () => {
    const missing: string[] = [];
    portalModulePageMapKeys.forEach((key) => {
      if (!moduleBases.has(key)) {
        missing.push(key);
      }
    });
    expect(
      missing,
      `portalModulePageMap keys without a matching zone2Portal.modules entry: ${missing.join(', ')}`
    ).toHaveLength(0);
  });

  it('every zone2Portal.modules base is covered by portalModulePageMap', () => {
    const missing: string[] = [];
    moduleBases.forEach((base) => {
      if (!portalModulePageMapKeys.has(base)) {
        missing.push(base);
      }
    });
    expect(
      missing,
      `zone2Portal.modules bases not in portalModulePageMap: ${missing.join(', ')}`
    ).toHaveLength(0);
  });
});

// =============================================================================
// (2) Zone 3: every website in zone3Websites has component mappings in Zone3Router
// =============================================================================

/**
 * The set of component names registered per site in zone3ComponentMaps in
 * src/router/Zone3Router.tsx.
 * Update this map when adding or removing components from that map.
 */
const zone3ComponentMapKeys: Record<string, ReadonlySet<string>> = {
  kaufy: new Set([
    'Kaufy2026Home',
    'Kaufy2026Expose',
    'Kaufy2026Vermieter',
    'Kaufy2026Verkaeufer',
    'Kaufy2026Vertrieb',
    'Kaufy2026Impressum',
    'Kaufy2026Datenschutz',
    'Kaufy2026Kontakt',
    'Kaufy2026FAQ',
    'KaufyRatgeber',
    'KaufyRatgeberArticle',
  ]),
  futureroom: new Set([
    'FutureRoomHome',
    'FutureRoomBonitat',
    'FutureRoomKarriere',
    'FutureRoomFAQ',
    'FutureRoomLogin',
    'FutureRoomAkte',
    'FutureRoomImpressum',
    'FutureRoomDatenschutz',
    'FutureRoomKontakt',
    'FutureRoomRatgeber',
    'FutureRoomRatgeberArticle',
  ]),
  sot: new Set([
    'SotHome',
    'SotPlattform',
    'SotIntelligenz',
    'SotModule',
    'SotPreise',
    'SotDemo',
    'SotKarriere',
    'SotFAQ',
    'SotImpressum',
    'SotDatenschutz',
    'SotNutzungsbedingungen',
    'SotMietsonderverwaltung',
    'SotImmobilienverwaltung',
    'SotFinanzdienstleistungen',
    'RatgeberMsvVsWeg',
    'RatgeberNebenkostenabrechnung',
    'RatgeberImmobilienverwalterWechseln',
    'RatgeberPortfolioAnalyse',
    'RatgeberImmobilienfinanzierung',
    'RatgeberRenditeberechnung',
  ]),
  acquiary: new Set([
    'AcquiaryHome',
    'AcquiaryMethodik',
    'AcquiaryNetzwerk',
    'AcquiaryKarriere',
    'AcquiaryObjekt',
    'AcquiaryImpressum',
    'AcquiaryDatenschutz',
    'AcquiaryKontakt',
    'AcquiaryFAQ',
    'AcquiaryRatgeber',
    'AcquiaryRatgeberArticle',
  ]),
  lennox: new Set([
    'LennoxStartseite',
    'LennoxPartnerProfil',
    'LennoxShop',
    'LennoxDoc',
    'LennoxLennox',
    'LennoxPartnerWerden',
    'LennoxAuth',
    'LennoxMeinBereich',
    'LennoxImpressum',
    'LennoxDatenschutz',
    'LennoxKontakt',
    'LennoxFAQ',
    'LennoxRatgeber',
    'LennoxRatgeberArticle',
  ]),
  'project-landing': new Set([
    'ProjectLandingHome',
    'ProjectLandingObjekt',
    'ProjectLandingBeratung',
    'ProjectLandingExpose',
    'ProjectLandingImpressum',
    'ProjectLandingDatenschutz',
  ]),
  ncore: new Set([
    'NcoreHome',
    'NcoreDigitalisierung',
    'NcoreStiftungen',
    'NcoreGeschaeftsmodelle',
    'NcoreNetzwerk',
    'NcoreGruender',
    'NcoreKontakt',
    'NcoreImpressum',
    'NcoreDatenschutz',
    'NcoreRatgeber',
    'NcoreRatgeberArticle',
  ]),
  otto: new Set([
    'OttoHome',
    'OttoUnternehmer',
    'OttoPrivateHaushalte',
    'OttoFinanzierung',
    'OttoKontakt',
    'OttoFAQ',
    'OttoImpressum',
    'OttoDatenschutz',
    'OttoRatgeber',
    'OttoRatgeberArticle',
  ]),
  zlwohnbau: new Set([
    'ZLWohnbauHome',
    'ZLWohnbauLeistungen',
    'ZLWohnbauPortfolio',
    'ZLWohnbauKontakt',
    'ZLWohnbauImpressum',
    'ZLWohnbauDatenschutz',
    'ZLWohnbauRatgeber',
    'ZLWohnbauRatgeberArticle',
  ]),
};

describe('Zone 3: zone3Websites ↔ zone3ComponentMaps integrity', () => {
  const siteKeys = Object.keys(zone3Websites);

  it('every zone3Websites site key has a component map entry in Zone3Router', () => {
    const missing = siteKeys.filter((key) => !(key in zone3ComponentMapKeys));
    expect(
      missing,
      `zone3Websites site keys without a zone3ComponentMaps entry: ${missing.join(', ')}`
    ).toHaveLength(0);
  });

  siteKeys.forEach((siteKey) => {
    describe(`${siteKey}`, () => {
      const site = zone3Websites[siteKey];
      const componentMap = zone3ComponentMapKeys[siteKey];

      it(`all route components in ${siteKey} are mapped in zone3ComponentMaps`, () => {
        if (!componentMap) {
          throw new Error(`No component map registered for site: ${siteKey}`);
        }
        const missing = site.routes
          .map((r) => r.component)
          .filter((c) => !componentMap.has(c));
        expect(
          missing,
          `${siteKey}: route components missing from zone3ComponentMaps: ${missing.join(', ')}`
        ).toHaveLength(0);
      });
    });
  });
});
