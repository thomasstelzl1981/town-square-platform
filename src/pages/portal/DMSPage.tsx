import { useLocation } from 'react-router-dom';
import { useModuleTiles } from '@/hooks/useModuleTiles';
import { ModuleDashboard } from '@/components/portal/ModuleDashboard';
import { SubTabNav } from '@/components/shared';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Loader2 } from 'lucide-react';

// Sub-page components
import { StorageTab, PosteingangTab, SortierenTab, EinstellungenTab } from './dms';

const DMSPage = () => {
  const location = useLocation();
  const contentRef = usePdfContentRef();
  const { data, isLoading } = useModuleTiles('MOD-03');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const subTiles = data?.sub_tiles || [
    { title: 'Storage', route: '/portal/dms/storage' },
    { title: 'Posteingang', route: '/portal/dms/posteingang' },
    { title: 'Sortieren', route: '/portal/dms/sortieren' },
    { title: 'Einstellungen', route: '/portal/dms/einstellungen' },
  ];

  // Determine which sub-page to render
  const currentPath = location.pathname;
  const renderSubPage = () => {
    if (currentPath.endsWith('/storage')) return <StorageTab />;
    if (currentPath.endsWith('/posteingang')) return <PosteingangTab />;
    if (currentPath.endsWith('/sortieren')) return <SortierenTab />;
    if (currentPath.endsWith('/einstellungen')) return <EinstellungenTab />;
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
              <h1 className="text-3xl font-bold">{data?.title || 'Dokumentenmanagement'}</h1>
              <p className="text-muted-foreground">{data?.description || 'Dokumente verwalten, sortieren und archivieren'}</p>
            </div>
            <SubTabNav tabs={subTiles} />
            {subPageContent}
          </div>
        ) : (
          <ModuleDashboard
            title={data?.title || 'Dokumentenmanagement'}
            description={data?.description || 'Dokumente verwalten, sortieren und archivieren'}
            subTiles={subTiles}
            moduleCode="MOD-03"
          />
        )}
      </div>

      <div className="px-6">
        <PdfExportFooter 
          contentRef={contentRef} 
          documentTitle="Dokumentenmanagement" 
          moduleName="MOD-03 DMS" 
        />
      </div>
    </div>
  );
};

export default DMSPage;
