/**
 * MANIFEST ROUTER — Zone-based code-split router
 * 
 * Each zone is lazy-loaded independently to reduce dev-server memory usage.
 * Only the zone matching the current path is loaded into memory.
 * 
 * Zone 1: /admin/*    → Zone1Router (Admin Portal)
 * Zone 2: /portal/*   → Zone2Router (User Portal)
 * Zone 3: /website/*  → Zone3Router (Brand Websites + Flat Routes)
 */

import React from 'react';
import { Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
// Note: Navigate, useParams, useLocation used by LegacyRedirect
import { PathNormalizer } from './PathNormalizer';
import { legacyRoutes } from '@/manifests/routesManifest';
import { getDomainEntry } from '@/hooks/useDomainRouter';
import NotFound from '@/pages/NotFound';

// =============================================================================
// Loading Fallback
// =============================================================================
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// =============================================================================
// Legacy Redirect Component — Preserves dynamic parameters
// =============================================================================
function LegacyRedirect({ to }: { to: string }) {
  const params = useParams();
  const location = useLocation();
  
  let redirectPath = to;
  Object.entries(params).forEach(([key, value]) => {
    if (key !== '*' && value) {
      redirectPath = redirectPath.replace(`:${key}`, value);
    }
  });
  
  const fullPath = `${redirectPath}${location.search}${location.hash}`;
  return <Navigate to={fullPath} replace />;
}

// =============================================================================
// Lazy Zone Routers — Only loaded when their path is visited
// =============================================================================
const Zone1Router = React.lazy(() => import('./Zone1Router'));
const Zone2Router = React.lazy(() => import('./Zone2Router'));
const Zone3Router = React.lazy(() => import('./Zone3Router'));

// =============================================================================
// MANIFEST ROUTER
// =============================================================================
export function ManifestRouter() {
  const domainEntry = getDomainEntry();
  
  return (
    <PathNormalizer>
      <Routes>
        {/* Legacy Redirects */}
        {legacyRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<LegacyRedirect to={route.redirect_to} />}
          />
        ))}

        {/* Zone 1: Admin Portal */}
        <Route path="/admin/*" element={
          <React.Suspense fallback={<LoadingFallback />}>
            <Zone1Router />
          </React.Suspense>
        } />

        {/* Zone 2: User Portal — on brand domains, redirect to website instead */}
        <Route path="/portal/*" element={
          domainEntry ? (
            <Navigate to={domainEntry.base} replace />
          ) : (
            <React.Suspense fallback={<LoadingFallback />}>
              <Zone2Router />
            </React.Suspense>
          )
        } />

        {/* Zone 3: Websites (canonical + flat brand-domain routes) */}
        <Route path="/website/*" element={
          <React.Suspense fallback={<LoadingFallback />}>
            <Zone3Router />
          </React.Suspense>
        } />

        {/* Zone 3: Flat routes for brand domains (e.g. kaufy.immo/vermieter) */}
        {domainEntry && (
          <Route path="/*" element={
            <React.Suspense fallback={<LoadingFallback />}>
              <Zone3Router />
            </React.Suspense>
          } />
        )}

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PathNormalizer>
  );
}

export default ManifestRouter;
