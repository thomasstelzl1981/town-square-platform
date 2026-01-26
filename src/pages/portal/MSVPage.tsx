import { useLocation } from 'react-router-dom';
import { useModuleTiles } from '@/hooks/useModuleTiles';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Loader2 } from 'lucide-react';
import { 
  ObjekteTab, 
  MieteingangTab, 
  VermietungTab, 
  EinstellungenTab 
} from './msv';

const MSVPage = () => {
  const contentRef = usePdfContentRef();
  const { data, isLoading } = useModuleTiles('MOD-05');
  const location = useLocation();
  const currentPath = location.pathname;

  // Determine which sub-page to render based on URL (Sidebar-First Pattern)
  const renderSubPage = () => {
    if (currentPath.endsWith('/objekte') || currentPath === '/portal/msv') {
      return <ObjekteTab />;
    }
    if (currentPath.endsWith('/mieteingang')) {
      return <MieteingangTab />;
    }
    if (currentPath.endsWith('/vermietung')) {
      return <VermietungTab />;
    }
    if (currentPath.endsWith('/einstellungen')) {
      return <EinstellungenTab />;
    }
    return <ObjekteTab />; // Default
  };

  const getSubPageTitle = () => {
    if (currentPath.endsWith('/objekte') || currentPath === '/portal/msv') return 'Objekte';
    if (currentPath.endsWith('/mieteingang')) return 'Mieteingang';
    if (currentPath.endsWith('/vermietung')) return 'Vermietung';
    if (currentPath.endsWith('/einstellungen')) return 'Einstellungen';
    return 'Objekte';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{data?.title || 'Mietmanagement'}</h1>
          <p className="text-muted-foreground">
            {data?.description || 'Mietsonderverwaltung'} — {getSubPageTitle()}
          </p>
        </div>

        <div className="space-y-4">
          {renderSubPage()}
        </div>
      </div>

      <div className="px-6">
        <PdfExportFooter 
          contentRef={contentRef} 
          documentTitle={`MSV – ${getSubPageTitle()}`} 
          moduleName="MOD-05 MSV" 
        />
      </div>
    </div>
  );
};

export default MSVPage;
