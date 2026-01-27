import { useLocation } from 'react-router-dom';
import { useModuleTiles } from '@/hooks/useModuleTiles';
import { ModuleDashboard } from '@/components/portal/ModuleDashboard';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Loader2 } from 'lucide-react';

// Sub-page components
import { ProfilTab } from './stammdaten/ProfilTab';
import { PersonenTab } from './stammdaten/PersonenTab';
import { FirmaTab } from './stammdaten/FirmaTab';
import { AbrechnungTab } from './stammdaten/AbrechnungTab';
import { SicherheitTab } from './stammdaten/SicherheitTab';

const StammdatenPage = () => {
  const location = useLocation();
  const contentRef = usePdfContentRef();
  const { data, isLoading } = useModuleTiles('MOD-01');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const subTiles = data?.sub_tiles || [
    { title: 'Profil', route: '/portal/stammdaten/profil' },
    { title: 'Firma', route: '/portal/stammdaten/firma' },
    { title: 'Personen', route: '/portal/stammdaten/personen' },
    { title: 'Abrechnung', route: '/portal/stammdaten/abrechnung' },
    { title: 'Sicherheit', route: '/portal/stammdaten/sicherheit' },
  ];

  // Determine which sub-page to render
  const currentPath = location.pathname;
  const renderSubPage = () => {
    if (currentPath.endsWith('/profil')) return <ProfilTab />;
    if (currentPath.endsWith('/firma')) return <FirmaTab />;
    if (currentPath.endsWith('/personen')) return <PersonenTab />;
    if (currentPath.endsWith('/abrechnung')) return <AbrechnungTab />;
    if (currentPath.endsWith('/sicherheit')) return <SicherheitTab />;
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
              <h1 className="text-3xl font-bold">{data?.title || 'Stammdaten'}</h1>
              <p className="text-muted-foreground">{data?.description || 'Kontakte, Adressen und Einstellungen verwalten'}</p>
            </div>
            {subPageContent}
          </div>
        ) : (
          <ModuleDashboard
            title={data?.title || 'Stammdaten'}
            description={data?.description || 'Kontakte, Adressen und Einstellungen verwalten'}
            subTiles={subTiles}
            moduleCode="MOD-01"
          />
        )}
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
