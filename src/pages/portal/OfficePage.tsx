import { useLocation } from 'react-router-dom';
import { useModuleTiles } from '@/hooks/useModuleTiles';
import { ModuleDashboard } from '@/components/portal/ModuleDashboard';
import { SubTabNav } from '@/components/shared';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Loader2 } from 'lucide-react';

// Sub-page components
import { EmailTab, BriefTab, KontakteTab, KalenderTab } from './office';

const OfficePage = () => {
  const location = useLocation();
  const contentRef = usePdfContentRef();
  const { data, isLoading } = useModuleTiles('MOD-02');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const subTiles = data?.sub_tiles || [
    { title: 'E-Mail', route: '/portal/ki-office/email' },
    { title: 'Briefgenerator', route: '/portal/ki-office/brief' },
    { title: 'Kontakte', route: '/portal/ki-office/kontakte' },
    { title: 'Kalender', route: '/portal/ki-office/kalender' },
  ];

  // Determine which sub-page to render
  const currentPath = location.pathname;
  const renderSubPage = () => {
    if (currentPath.endsWith('/email')) return <EmailTab />;
    if (currentPath.endsWith('/brief')) return <BriefTab />;
    if (currentPath.endsWith('/kontakte')) return <KontakteTab />;
    if (currentPath.endsWith('/kalender')) return <KalenderTab />;
    return null; // Dashboard view
  };

  const subPageContent = renderSubPage();
  const isOnSubPage = subPageContent !== null;

  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        {isOnSubPage ? (
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{data?.title || 'KI Office'}</h1>
              <p className="text-muted-foreground">{data?.description || 'KI-gestütztes Backoffice für Ihre Immobilienverwaltung'}</p>
            </div>
            <SubTabNav tabs={subTiles} />
            {subPageContent}
          </div>
        ) : (
          <ModuleDashboard
            title={data?.title || 'KI Office'}
            description={data?.description || 'KI-gestütztes Backoffice für Ihre Immobilienverwaltung'}
            subTiles={subTiles}
            moduleCode="MOD-02"
          />
        )}
      </div>

      <div className="px-6">
        <PdfExportFooter 
          contentRef={contentRef} 
          documentTitle="KI Office" 
          moduleName="MOD-02 KI Office" 
        />
      </div>
    </div>
  );
};

export default OfficePage;
