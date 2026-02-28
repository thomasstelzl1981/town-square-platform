/**
 * ZONE 3 ROUTER — Website Routes (all brands)
 * 
 * Extracted from ManifestRouter.tsx for code-splitting.
 * Only loaded when visiting /website/* paths or brand domains.
 */

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { zone3Websites } from '@/manifests/routesManifest';
import { getDomainEntry } from '@/hooks/useDomainRouter';

// =============================================================================
// Loading Fallback
// =============================================================================
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// =============================================================================
// Zone 3: Layout Components
// =============================================================================
const Kaufy2026Layout = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Layout'));
const FutureRoomLayout = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomLayout'));
const SotLayout = React.lazy(() => import('@/pages/zone3/sot/SotLayout'));
const AcquiaryLayout = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryLayout'));
const LennoxLayout = React.lazy(() => import('@/pages/zone3/lennox/LennoxLayout'));
const ProjectLandingLayout = React.lazy(() => import('@/pages/zone3/project-landing/ProjectLandingLayout'));
const NcoreLayout = React.lazy(() => import('@/pages/zone3/ncore/NcoreLayout'));
const OttoAdvisoryLayout = React.lazy(() => import('@/pages/zone3/otto/OttoAdvisoryLayout'));
const ZLWohnbauLayout = React.lazy(() => import('@/pages/zone3/zlwohnbau/ZLWohnbauLayout'));

// =============================================================================
// Zone 3: Page Components (all lazy)
// =============================================================================

// Kaufy
const Kaufy2026Home = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Home'));
const Kaufy2026Expose = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Expose'));
const Kaufy2026Vermieter = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Vermieter'));
const Kaufy2026Verkaeufer = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Verkaeufer'));
const Kaufy2026Vertrieb = React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Vertrieb'));

// FutureRoom
const FutureRoomHome = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomHome'));
const FutureRoomBonitat = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomBonitat'));
const FutureRoomKarriere = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomKarriere'));
const FutureRoomFAQ = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomFAQ'));
const FutureRoomLogin = React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomLogin'));

// SoT
const SotHome = React.lazy(() => import('@/pages/zone3/sot/SotHome'));
const SotPlattform = React.lazy(() => import('@/pages/zone3/sot/SotPlattform'));
const SotIntelligenz = React.lazy(() => import('@/pages/zone3/sot/SotIntelligenz'));
const SotPreise = React.lazy(() => import('@/pages/zone3/sot/SotPreise'));
const SotDemo = React.lazy(() => import('@/pages/zone3/sot/SotDemo'));
const SotKarriere = React.lazy(() => import('@/pages/zone3/sot/SotKarriere'));
const SotFAQ = React.lazy(() => import('@/pages/zone3/sot/SotFAQ'));
const SotMietsonderverwaltung = React.lazy(() => import('@/pages/zone3/sot/SotMietsonderverwaltung'));
const SotImmobilienverwaltung = React.lazy(() => import('@/pages/zone3/sot/SotImmobilienverwaltung'));
const SotFinanzdienstleistungen = React.lazy(() => import('@/pages/zone3/sot/SotFinanzdienstleistungen'));
const RatgeberMsvVsWeg = React.lazy(() => import('@/pages/zone3/sot/ratgeber/RatgeberMsvVsWeg'));
const RatgeberNebenkostenabrechnung = React.lazy(() => import('@/pages/zone3/sot/ratgeber/RatgeberNebenkostenabrechnung'));
const RatgeberImmobilienverwalterWechseln = React.lazy(() => import('@/pages/zone3/sot/ratgeber/RatgeberImmobilienverwalterWechseln'));
const RatgeberPortfolioAnalyse = React.lazy(() => import('@/pages/zone3/sot/ratgeber/RatgeberPortfolioAnalyse'));
const RatgeberImmobilienfinanzierung = React.lazy(() => import('@/pages/zone3/sot/ratgeber/RatgeberImmobilienfinanzierung'));
const RatgeberRenditeberechnung = React.lazy(() => import('@/pages/zone3/sot/ratgeber/RatgeberRenditeberechnung'));

// Acquiary
const AcquiaryHome = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryHome'));
const AcquiaryMethodik = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryMethodik'));
const AcquiaryNetzwerk = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryNetzwerk'));
const AcquiaryKarriere = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryKarriere'));
const AcquiaryObjekt = React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryObjekt'));

// Lennox
const LennoxStartseite = React.lazy(() => import('@/pages/zone3/lennox/LennoxStartseite'));
const LennoxPartnerProfil = React.lazy(() => import('@/pages/zone3/lennox/LennoxPartnerProfil'));
const LennoxShop = React.lazy(() => import('@/pages/zone3/lennox/LennoxShop'));
const LennoxPartnerWerden = React.lazy(() => import('@/pages/zone3/lennox/LennoxPartnerWerden'));
const LennoxAuth = React.lazy(() => import('@/pages/zone3/lennox/LennoxAuth'));
const LennoxMeinBereich = React.lazy(() => import('@/pages/zone3/lennox/LennoxMeinBereich'));

// Project Landing
const ProjectLandingHome = React.lazy(() => import('@/pages/zone3/project-landing/ProjectLandingHome'));
const ProjectLandingObjekt = React.lazy(() => import('@/pages/zone3/project-landing/ProjectLandingObjekt'));
const ProjectLandingBeratung = React.lazy(() => import('@/pages/zone3/project-landing/ProjectLandingBeratung'));
const ProjectLandingExpose = React.lazy(() => import('@/pages/zone3/project-landing/ProjectLandingExpose'));

// Ncore
const NcoreHome = React.lazy(() => import('@/pages/zone3/ncore/NcoreHome'));

// Otto
const OttoHome = React.lazy(() => import('@/pages/zone3/otto/OttoHome'));

// ZL Wohnbau
const ZLWohnbauHome = React.lazy(() => import('@/pages/zone3/zlwohnbau/ZLWohnbauHome'));

// =============================================================================
// Layout Map
// =============================================================================
const zone3LayoutMap: Record<string, React.ComponentType<{ children?: React.ReactNode }>> = {
  Kaufy2026Layout,
  FutureRoomLayout,
  SotLayout,
  AcquiaryLayout,
  LennoxLayout,
  ProjectLandingLayout,
  NcoreLayout,
  OttoAdvisoryLayout,
  ZLWohnbauLayout,
};

// =============================================================================
// Component Maps per brand
// =============================================================================
const zone3ComponentMaps: Record<string, Record<string, React.ComponentType>> = {
  kaufy: {
    Kaufy2026Home,
    Kaufy2026Expose,
    Kaufy2026Vermieter,
    Kaufy2026Verkaeufer,
    Kaufy2026Vertrieb,
    Kaufy2026Impressum: React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Impressum')),
    Kaufy2026Datenschutz: React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Datenschutz')),
    Kaufy2026Kontakt: React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026Kontakt')),
    Kaufy2026FAQ: React.lazy(() => import('@/pages/zone3/kaufy2026/Kaufy2026FAQ')),
    KaufyRatgeber: React.lazy(() => import('@/pages/zone3/kaufy2026/KaufyRatgeber')),
    KaufyRatgeberArticle: React.lazy(() => import('@/pages/zone3/kaufy2026/KaufyRatgeberArticle')),
  },
  futureroom: {
    FutureRoomHome,
    FutureRoomBonitat,
    FutureRoomKarriere,
    FutureRoomFAQ,
    FutureRoomLogin,
    FutureRoomAkte: React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomAkteGuarded')),
    FutureRoomImpressum: React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomImpressum')),
    FutureRoomDatenschutz: React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomDatenschutz')),
    FutureRoomKontakt: React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomKontakt')),
    FutureRoomRatgeber: React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomRatgeber')),
    FutureRoomRatgeberArticle: React.lazy(() => import('@/pages/zone3/futureroom/FutureRoomRatgeberArticle')),
  },
  sot: {
    SotHome,
    SotPlattform,
    SotIntelligenz,
    SotModule: React.lazy(() => import('@/pages/zone3/sot/SotModule')),
    SotPreise,
    SotDemo,
    SotKarriere,
    SotFAQ,
    SotMietsonderverwaltung,
    SotImmobilienverwaltung,
    SotFinanzdienstleistungen,
    RatgeberMsvVsWeg,
    RatgeberNebenkostenabrechnung,
    RatgeberImmobilienverwalterWechseln,
    RatgeberPortfolioAnalyse,
    RatgeberImmobilienfinanzierung,
    RatgeberRenditeberechnung,
    SotImpressum: React.lazy(() => import('@/pages/zone3/sot/SotImpressum')),
    SotDatenschutz: React.lazy(() => import('@/pages/zone3/sot/SotDatenschutz')),
  },
  acquiary: {
    AcquiaryHome,
    AcquiaryMethodik,
    AcquiaryNetzwerk,
    AcquiaryKarriere,
    AcquiaryObjekt,
    AcquiaryImpressum: React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryImpressum')),
    AcquiaryDatenschutz: React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryDatenschutz')),
    AcquiaryKontakt: React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryKontakt')),
    AcquiaryFAQ: React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryFAQ')),
    AcquiaryRatgeber: React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryRatgeber')),
    AcquiaryRatgeberArticle: React.lazy(() => import('@/pages/zone3/acquiary/AcquiaryRatgeberArticle')),
  },
  lennox: {
    LennoxStartseite,
    LennoxPartnerProfil,
    LennoxShop,
    LennoxPartnerWerden,
    LennoxAuth,
    LennoxMeinBereich,
    LennoxImpressum: React.lazy(() => import('@/pages/zone3/lennox/LennoxImpressum')),
    LennoxDatenschutz: React.lazy(() => import('@/pages/zone3/lennox/LennoxDatenschutz')),
    LennoxKontakt: React.lazy(() => import('@/pages/zone3/lennox/LennoxKontakt')),
    LennoxFAQ: React.lazy(() => import('@/pages/zone3/lennox/LennoxFAQ')),
    LennoxRatgeber: React.lazy(() => import('@/pages/zone3/lennox/LennoxRatgeber')),
    LennoxRatgeberArticle: React.lazy(() => import('@/pages/zone3/lennox/LennoxRatgeberArticle')),
  },
  'project-landing': {
    ProjectLandingHome,
    ProjectLandingObjekt,
    ProjectLandingBeratung,
    ProjectLandingExpose,
    ProjectLandingImpressum: React.lazy(() => import('@/pages/zone3/project-landing/ProjectLandingImpressum')),
    ProjectLandingDatenschutz: React.lazy(() => import('@/pages/zone3/project-landing/ProjectLandingDatenschutz')),
  },
  ncore: {
    NcoreHome,
    NcoreDigitalisierung: React.lazy(() => import('@/pages/zone3/ncore/NcoreDigitalisierung')),
    NcoreStiftungen: React.lazy(() => import('@/pages/zone3/ncore/NcoreStiftungen')),
    NcoreGeschaeftsmodelle: React.lazy(() => import('@/pages/zone3/ncore/NcoreGeschaeftsmodelle')),
    NcoreNetzwerk: React.lazy(() => import('@/pages/zone3/ncore/NcoreNetzwerk')),
    NcoreGruender: React.lazy(() => import('@/pages/zone3/ncore/NcoreGruender')),
    NcoreKontakt: React.lazy(() => import('@/pages/zone3/ncore/NcoreKontakt')),
    NcoreImpressum: React.lazy(() => import('@/pages/zone3/ncore/NcoreImpressum')),
    NcoreDatenschutz: React.lazy(() => import('@/pages/zone3/ncore/NcoreDatenschutz')),
    NcoreRatgeber: React.lazy(() => import('@/pages/zone3/ncore/NcoreRatgeber')),
    NcoreRatgeberArticle: React.lazy(() => import('@/pages/zone3/ncore/NcoreRatgeberArticle')),
  },
  otto: {
    OttoHome,
    OttoUnternehmer: React.lazy(() => import('@/pages/zone3/otto/OttoUnternehmer')),
    OttoPrivateHaushalte: React.lazy(() => import('@/pages/zone3/otto/OttoPrivateHaushalte')),
    OttoFinanzierung: React.lazy(() => import('@/pages/zone3/otto/OttoFinanzierung')),
    OttoKontakt: React.lazy(() => import('@/pages/zone3/otto/OttoKontakt')),
    OttoFAQ: React.lazy(() => import('@/pages/zone3/otto/OttoFAQ')),
    OttoImpressum: React.lazy(() => import('@/pages/zone3/otto/OttoImpressum')),
    OttoDatenschutz: React.lazy(() => import('@/pages/zone3/otto/OttoDatenschutz')),
    OttoRatgeber: React.lazy(() => import('@/pages/zone3/otto/OttoRatgeber')),
    OttoRatgeberArticle: React.lazy(() => import('@/pages/zone3/otto/OttoRatgeberArticle')),
  },
  zlwohnbau: {
    ZLWohnbauHome,
    ZLWohnbauLeistungen: React.lazy(() => import('@/pages/zone3/zlwohnbau/ZLWohnbauLeistungen')),
    ZLWohnbauPortfolio: React.lazy(() => import('@/pages/zone3/zlwohnbau/ZLWohnbauPortfolio')),
    ZLWohnbauKontakt: React.lazy(() => import('@/pages/zone3/zlwohnbau/ZLWohnbauKontakt')),
    ZLWohnbauImpressum: React.lazy(() => import('@/pages/zone3/zlwohnbau/ZLWohnbauImpressum')),
    ZLWohnbauDatenschutz: React.lazy(() => import('@/pages/zone3/zlwohnbau/ZLWohnbauDatenschutz')),
  },
};

// =============================================================================
// ZONE 3 ROUTER
// =============================================================================
export default function Zone3Router() {
  const domainEntry = getDomainEntry();

  return (
    <Routes>
      {/* Canonical /website/* paths */}
      {Object.entries(zone3Websites).map(([siteKey, site]) => {
        const Layout = zone3LayoutMap[site.layout];
        const componentMap = zone3ComponentMaps[siteKey];

        if (!Layout) {
          console.warn(`Missing layout: ${site.layout}`);
          return null;
        }

        return (
          <Route key={siteKey} path={site.base.replace('/website', '')} element={
            <React.Suspense fallback={<LoadingFallback />}>
              <Layout />
            </React.Suspense>
          }>
            {site.routes.map((route) => {
              const Component = componentMap?.[route.component];
              if (!Component) {
                console.warn(`Missing component: ${route.component} for ${siteKey}`);
                return null;
              }
              return (
                <Route
                  key={route.path || 'index'}
                  index={route.path === ''}
                  path={route.path || undefined}
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <Component />
                    </React.Suspense>
                  }
                />
              );
            })}
          </Route>
        );
      })}

      {/* Flat Routes for Brand Domains */}
      {(() => {
        if (!domainEntry) return null;
        
        const site = zone3Websites[domainEntry.siteKey];
        if (!site) return null;
        
        const Layout = zone3LayoutMap[site.layout];
        const componentMap = zone3ComponentMaps[domainEntry.siteKey];
        if (!Layout || !componentMap) return null;

        return (
          <Route path="/" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <Layout />
            </React.Suspense>
          }>
            {site.routes.map((route) => {
              const Component = componentMap[route.component];
              if (!Component) return null;
              return (
                <Route
                  key={`flat-${route.path || 'index'}`}
                  index={route.path === ''}
                  path={route.path || undefined}
                  element={
                    <React.Suspense fallback={<LoadingFallback />}>
                      <Component />
                    </React.Suspense>
                  }
                />
              );
            })}
          </Route>
        );
      })()}
    </Routes>
  );
}
