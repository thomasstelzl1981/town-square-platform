import { useModuleTiles } from '@/hooks/useModuleTiles';
import { ModuleDashboard } from '@/components/portal/ModuleDashboard';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Loader2 } from 'lucide-react';

const StammdatenPage = () => {
  const contentRef = usePdfContentRef();
  const { data, isLoading } = useModuleTiles('MOD-01');

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
          title={data?.title || 'Stammdaten'}
          description={data?.description || 'Kontakte, Adressen und Bankdaten verwalten'}
          subTiles={data?.sub_tiles || []}
          moduleCode="MOD-01"
        />
      </div>

      <div className="px-6">
        <PdfExportFooter 
          contentRef={contentRef} 
          documentTitle="Stammdaten" 
          moduleName="MOD-01 Stammdaten" 
        />
      </div>
    </div>
  );
};

export default StammdatenPage;
