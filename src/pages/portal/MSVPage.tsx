import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useModuleTiles } from '@/hooks/useModuleTiles';
import { ModuleDashboard } from '@/components/portal/ModuleDashboard';
import { PdfExportFooter, usePdfContentRef } from '@/components/pdf';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const navigate = useNavigate();

  // Parse current sub-tab from URL
  const pathParts = location.pathname.split('/');
  const currentSubTab = pathParts[3] || 'objekte';

  const handleTabChange = (value: string) => {
    navigate(`/portal/msv/${value}`);
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
          <p className="text-muted-foreground">{data?.description || 'Mietsonderverwaltung – Zahlungen, Mahnungen und Mietberichte'}</p>
        </div>

        <Tabs value={currentSubTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="objekte">Objekte</TabsTrigger>
            <TabsTrigger value="mieteingang">Mieteingang</TabsTrigger>
            <TabsTrigger value="vermietung">Vermietung</TabsTrigger>
            <TabsTrigger value="einstellungen">Einstellungen</TabsTrigger>
          </TabsList>

          <TabsContent value="objekte">
            <ObjekteTab />
          </TabsContent>

          <TabsContent value="mieteingang">
            <MieteingangTab />
          </TabsContent>

          <TabsContent value="vermietung">
            <VermietungTab />
          </TabsContent>

          <TabsContent value="einstellungen">
            <EinstellungenTab />
          </TabsContent>
        </Tabs>
      </div>

      <div className="px-6">
        <PdfExportFooter 
          contentRef={contentRef} 
          documentTitle="Mietmanagement" 
          moduleName="MOD-05 MSV" 
        />
      </div>
    </div>
  );
};

export default MSVPage;
