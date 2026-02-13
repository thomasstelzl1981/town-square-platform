/**
 * MOD-21 Website Builder — Portal Module Page
 * Routes: index → scrollable dashboard, :websiteId/editor → WBEditor
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';

const WBDashboard = React.lazy(() => import('./website-builder/WBDashboard'));
const WBEditor = React.lazy(() => import('./website-builder/WBEditor'));

const Loading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export default function WebsiteBuilderPage() {
  return (
    <Routes>
      <Route index element={<React.Suspense fallback={<Loading />}><WBDashboard /></React.Suspense>} />
      <Route path=":websiteId/editor" element={<React.Suspense fallback={<Loading />}><WBEditor /></React.Suspense>} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
