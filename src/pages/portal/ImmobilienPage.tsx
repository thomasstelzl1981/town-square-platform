import { useLocation, useNavigate } from 'react-router-dom';
import { useModuleTiles } from '@/hooks/useModuleTiles';
import { ModuleDashboard } from '@/components/portal/ModuleDashboard';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ArrowLeft } from 'lucide-react';
import { PortfolioTab } from './immobilien/PortfolioTab';
import { KontexteTab } from './immobilien/KontexteTab';
import { SanierungTab } from './immobilien/SanierungTab';
import { BewertungTab } from './immobilien/BewertungTab';

const ImmobilienPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = usePdfContentRef();
  const { data, isLoading } = useModuleTiles('MOD-04');

  const currentPath = location.pathname;

  // Determine which sub-page to render
  const renderSubPage = () => {
    if (currentPath.endsWith('/portfolio')) {
      return <PortfolioTab />;
    }
    if (currentPath.endsWith('/kontexte')) {
      return <KontexteTab />;
    }
    if (currentPath.endsWith('/sanierung')) {
      return <SanierungTab />;
    }
    if (currentPath.endsWith('/bewertung')) {
      return <BewertungTab />;
    }
    return null; // Show dashboard
  };

  const subPage = renderSubPage();
  const isSubPage = subPage !== null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If we're on a sub-page, render it with back navigation
  if (isSubPage) {
    const getSubPageTitle = () => {
      if (currentPath.endsWith('/portfolio')) return 'Portfolio';
      if (currentPath.endsWith('/kontexte')) return 'Vermieter-Kontexte';
      if (currentPath.endsWith('/sanierung')) return 'Sanierung';
      if (currentPath.endsWith('/bewertung')) return 'Bewertung';
      return '';
    };

    return (
      <div className="space-y-6">
        <div ref={contentRef}>
          <div className="p-6 pb-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/portal/immobilien')}
                className="no-print"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{getSubPageTitle()}</h1>
                <p className="text-muted-foreground">
                  {data?.title || 'Immobilien'} – {getSubPageTitle()}
                </p>
              </div>
            </div>
            {currentPath.endsWith('/portfolio') && (
              <Button onClick={() => navigate('/portal/immobilien/neu')} className="no-print">
                <Plus className="mr-2 h-4 w-4" />
                Neue Immobilie
              </Button>
            )}
          </div>
          
          <div className="p-6 pt-4 w-full overflow-x-auto">
            {subPage}
          </div>
        </div>

        <div className="px-6">
          <PdfExportFooter 
            contentRef={contentRef} 
            documentTitle={`Immobilien – ${getSubPageTitle()}`} 
            moduleName="MOD-04 Immobilien" 
          />
        </div>
      </div>
    );
  }

  // Default: Dashboard view
  return (
    <div className="space-y-6">
      <div ref={contentRef}>
        <div className="p-6 pb-0 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{data?.title || 'Immobilien'}</h1>
            <p className="text-muted-foreground">{data?.description || 'Ihr Immobilienportfolio verwalten'}</p>
          </div>
          <Button onClick={() => navigate('/portal/immobilien/neu')} className="no-print">
            <Plus className="mr-2 h-4 w-4" />
            Neue Immobilie
          </Button>
        </div>
        
        <ModuleDashboard
          title=""
          description=""
          subTiles={data?.sub_tiles || []}
          moduleCode="MOD-04"
        />
      </div>

      <div className="px-6">
        <PdfExportFooter 
          contentRef={contentRef} 
          documentTitle="Immobilienübersicht" 
          moduleName="MOD-04 Immobilien" 
        />
      </div>
    </div>
  );
};

export default ImmobilienPage;
