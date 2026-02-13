/**
 * MOD-21 Website Builder — Portal Module Page
 * Handles internal tile routing for the website builder module
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

const WBWebsites = React.lazy(() => import('./website-builder/WBWebsites'));
const WBDesign = React.lazy(() => import('./website-builder/WBDesign'));
const WBSeo = React.lazy(() => import('./website-builder/WBSeo'));
const WBVertrag = React.lazy(() => import('./website-builder/WBVertrag'));
const WBEditor = React.lazy(() => import('./website-builder/WBEditor'));

const Loading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export default function WebsiteBuilderPage() {
  return (
    <Routes>
      <Route index element={<Navigate to="websites" replace />} />
      <Route path="websites" element={<React.Suspense fallback={<Loading />}><WBWebsites /></React.Suspense>} />
      <Route path="design" element={<React.Suspense fallback={<Loading />}><WBDesign /></React.Suspense>} />
      <Route path="seo" element={<React.Suspense fallback={<Loading />}><WBSeo /></React.Suspense>} />
      <Route path="vertrag" element={<React.Suspense fallback={<Loading />}><WBVertrag /></React.Suspense>} />
      <Route path=":websiteId/editor" element={<React.Suspense fallback={<Loading />}><WBEditor /></React.Suspense>} />
      <Route path="*" element={<Navigate to="websites" replace />} />
    </Routes>
  );
}
