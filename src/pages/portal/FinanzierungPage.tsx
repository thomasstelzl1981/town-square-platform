import { useModuleTiles } from '@/hooks/useModuleTiles';
import { ModuleDashboard } from '@/components/portal/ModuleDashboard';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

const FinanzierungPage = () => {
  const contentRef = usePdfContentRef();
  const { data, isLoading } = useModuleTiles('MOD-07');

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
        <div className="p-6 pb-0 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{data?.title || 'Finanzierung'}</h1>
            <p className="text-muted-foreground">{data?.description || 'Finanzierungsfälle vorbereiten und exportieren'}</p>
          </div>
          <Button className="no-print">
            <Plus className="mr-2 h-4 w-4" />
            Neuer Fall
          </Button>
        </div>
        
        <ModuleDashboard
          title=""
          description=""
          subTiles={data?.sub_tiles || []}
          moduleCode="MOD-07"
        />
      </div>

      <div className="px-6">
        <PdfExportFooter 
          contentRef={contentRef} 
          documentTitle="Finanzierungsübersicht" 
          moduleName="MOD-07 Finanzierung" 
        />
      </div>
    </div>
  );
};

export default FinanzierungPage;
