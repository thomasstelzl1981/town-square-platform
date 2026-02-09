/**
 * SocialPage — Wrapper für MOD-14 Social mit Sidebar + nested Routes
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { SocialSidebar, SocialMobileNav } from './SocialSidebar';

// Sub-pages (direct imports, parent is already lazy-loaded)
import { OverviewPage } from './OverviewPage';
import { AuditPage } from './AuditPage';
import { InspirationPage } from './InspirationPage';
import { KnowledgePage } from './KnowledgePage';
import { InboundPage } from './InboundPage';
import { AssetsPage } from './AssetsPage';
import { CreatePage } from './CreatePage';
import { CalendarPage } from './CalendarPage';
import { PerformancePage } from './PerformancePage';

export function SocialPage() {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-full">
      {isMobile ? (
        <SocialMobileNav />
      ) : null}
      <div className="flex flex-1 min-h-0">
        {!isMobile && <SocialSidebar />}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="inspiration" element={<InspirationPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="inbound" element={<InboundPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="create" element={<CreatePage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
