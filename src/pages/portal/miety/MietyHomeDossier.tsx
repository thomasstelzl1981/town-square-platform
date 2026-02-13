/**
 * MietyHomeDossier — 2-Column Dossier view for a single home
 * Left: Document Tree | Right: Accordion Sections + Quick Actions
 */
import { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/LoadingState';
import { MietyDossierHeader } from './components/MietyDossierHeader';
import { MietyDocTree } from './components/MietyDocTree';
import { MietyOverviewSection } from './components/MietyOverviewSection';
import { MietyContractsSection } from './components/MietyContractsSection';
import { MietyMeterSection } from './components/MietyMeterSection';
import { ContractDrawer } from './components/ContractDrawer';
import { MeterReadingDrawer } from './components/MeterReadingDrawer';
import { UploadDrawer } from './components/UploadDrawer';
import { MessageCircle, Wrench } from 'lucide-react';
import { PageShell } from '@/components/shared/PageShell';

export default function MietyHomeDossier() {
  const { homeId } = useParams<{ homeId: string }>();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [contractDrawerOpen, setContractDrawerOpen] = useState(false);
  const [meterDrawerOpen, setMeterDrawerOpen] = useState(false);
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);

  const { data: home, isLoading } = useQuery({
    queryKey: ['miety-home', homeId],
    queryFn: async () => {
      if (!homeId) return null;
      const { data, error } = await supabase
        .from('miety_homes')
        .select('*')
        .eq('id', homeId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!homeId,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['miety-contracts', homeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('miety_contracts').select('id').eq('home_id', homeId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!homeId,
  });

  const { data: readings = [] } = useQuery({
    queryKey: ['miety-meter-readings', homeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('miety_meter_readings').select('id').eq('home_id', homeId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!homeId,
  });

  if (isLoading) return <LoadingState />;
  if (!home) return <Navigate to="/portal/immobilien/zuhause/uebersicht" replace />;

  return (
    <PageShell>
      <MietyDossierHeader
        home={home}
        onOpenContractDrawer={() => setContractDrawerOpen(true)}
        onOpenMeterDrawer={() => setMeterDrawerOpen(true)}
        onOpenUploadDrawer={() => setUploadDrawerOpen(true)}
      />

      {/* 2-Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-0">
        {/* Left: Document Tree */}
        <Card className="glass-card hidden lg:flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dokumentenbaum</span>
          </div>
          <MietyDocTree
            homeId={homeId!}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
          />
        </Card>

        {/* Right: Accordion Sections */}
        <div className="overflow-y-auto">
          <Accordion type="multiple" defaultValue={['overview', 'contracts', 'meters']} className="space-y-3">
            {/* A) Overview */}
            <AccordionItem value="overview" className="glass-card rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-semibold py-3">Übersicht</AccordionTrigger>
              <AccordionContent className="pb-4">
                <MietyOverviewSection
                  contractsCount={contracts.length}
                  meterReadingsCount={readings.length}
                  documentsCount={0}
                />
              </AccordionContent>
            </AccordionItem>

            {/* B) Contracts */}
            <AccordionItem value="contracts" className="glass-card rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-semibold py-3">Verträge</AccordionTrigger>
              <AccordionContent className="pb-4">
                <MietyContractsSection homeId={homeId!} onOpenDrawer={() => setContractDrawerOpen(true)} />
              </AccordionContent>
            </AccordionItem>

            {/* C) Meter Readings */}
            <AccordionItem value="meters" className="glass-card rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-semibold py-3">Zähler & Stände</AccordionTrigger>
              <AccordionContent className="pb-4">
                <MietyMeterSection homeId={homeId!} onOpenDrawer={() => setMeterDrawerOpen(true)} />
              </AccordionContent>
            </AccordionItem>

            {/* D) Insurances */}
            <AccordionItem value="insurances" className="glass-card rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-semibold py-3">Versicherungen</AccordionTrigger>
              <AccordionContent className="pb-4">
                <MietyContractsSection
                  homeId={homeId!}
                  onOpenDrawer={() => setContractDrawerOpen(true)}
                  filterCategories={['hausrat', 'haftpflicht']}
                  title="Ihre Versicherungen"
                />
              </AccordionContent>
            </AccordionItem>

            {/* E) Providers */}
            <AccordionItem value="providers" className="glass-card rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-semibold py-3">Versorger</AccordionTrigger>
              <AccordionContent className="pb-4">
                <MietyContractsSection
                  homeId={homeId!}
                  onOpenDrawer={() => setContractDrawerOpen(true)}
                  filterCategories={['strom', 'gas', 'wasser', 'internet']}
                  title="Ihre Versorger"
                />
              </AccordionContent>
            </AccordionItem>

            {/* F) Communication */}
            <AccordionItem value="communication" className="glass-card rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-semibold py-3">Kommunikation</AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="flex flex-col items-center py-6 text-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Kommunikation — kommt bald</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* G) Services */}
            <AccordionItem value="services" className="glass-card rounded-lg border px-4">
              <AccordionTrigger className="text-sm font-semibold py-3">Services</AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="flex flex-col items-center py-6 text-center">
                  <Wrench className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Services & Vergleiche — kommt bald</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Drawers */}
      <ContractDrawer open={contractDrawerOpen} onOpenChange={setContractDrawerOpen} homeId={homeId!} />
      <MeterReadingDrawer open={meterDrawerOpen} onOpenChange={setMeterDrawerOpen} homeId={homeId!} />
      <UploadDrawer open={uploadDrawerOpen} onOpenChange={setUploadDrawerOpen} homeId={homeId!} />
    </PageShell>
  );
}
