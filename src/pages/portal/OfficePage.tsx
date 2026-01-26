import { useModuleTiles } from '@/hooks/useModuleTiles';
import { ModuleDashboard } from '@/components/portal/ModuleDashboard';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Loader2 } from 'lucide-react';

const OfficePage = () => {
  const contentRef = usePdfContentRef();
  const { data, isLoading } = useModuleTiles('MOD-02');

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
        <ModuleDashboard
          title={data?.title || 'KI Office'}
          description={data?.description || 'KI-gestütztes Backoffice für Ihre Immobilienverwaltung'}
          subTiles={data?.sub_tiles || []}
          moduleCode="MOD-02"
        />
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
