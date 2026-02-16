/**
 * MietyHomeDossierInline — Inline version of the dossier (no PageShell, no route params)
 * Used inside UebersichtTile when the user opens a home card inline.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/shared/LoadingState';
import { MietyDocTree } from './components/MietyDocTree';
import { MietyOverviewSection } from './components/MietyOverviewSection';
import { MietyContractsSection } from './components/MietyContractsSection';
import { MietyMeterSection } from './components/MietyMeterSection';
import { BuildingDetailsSection } from './components/BuildingDetailsSection';
import { LoanSection } from './components/LoanSection';
import { TenancySection } from './components/TenancySection';
import { ContractDrawer } from './components/ContractDrawer';
import { MeterReadingDrawer } from './components/MeterReadingDrawer';
import { UploadDrawer } from './components/UploadDrawer';
import { MessageCircle, Wrench } from 'lucide-react';

interface Props {
  homeId: string;
}

export default function MietyHomeDossierInline({ homeId }: Props) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [contractDrawerOpen, setContractDrawerOpen] = useState(false);
  const [meterDrawerOpen, setMeterDrawerOpen] = useState(false);
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);

  const { data: home, isLoading } = useQuery({
    queryKey: ['miety-home', homeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('miety_homes')
        .select('*')
        .eq('id', homeId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['miety-contracts', homeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('miety_contracts').select('id').eq('home_id', homeId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: readings = [] } = useQuery({
    queryKey: ['miety-meter-readings', homeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('miety_meter_readings').select('id').eq('home_id', homeId);
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <LoadingState />;
  if (!home) return null;

  return (
    <>
      <Card className="glass-card p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 min-h-0">
          {/* Left: Document Tree */}
          <Card className="glass-card hidden lg:flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dokumentenbaum</span>
            </div>
            <MietyDocTree
              homeId={homeId}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
            />
          </Card>

          {/* Right: Accordion Sections */}
          <div className="overflow-y-auto">
            <Accordion type="multiple" defaultValue={['overview', 'building', 'contracts', 'meters']} className="space-y-3">
              {/* Overview */}
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

              {/* Building Details */}
              <AccordionItem value="building" className="glass-card rounded-lg border px-4">
                <AccordionTrigger className="text-sm font-semibold py-3">Gebäudedetails</AccordionTrigger>
                <AccordionContent className="pb-4">
                  <BuildingDetailsSection home={home} />
                </AccordionContent>
              </AccordionItem>

              {/* Loans (only for Eigentum) */}
              {home.ownership_type === 'eigentum' && (
                <AccordionItem value="loans" className="glass-card rounded-lg border px-4">
                  <AccordionTrigger className="text-sm font-semibold py-3">Darlehen</AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <LoanSection homeId={homeId} />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Tenancy (only for Miete) */}
              {home.ownership_type === 'miete' && (
                <AccordionItem value="tenancy" className="glass-card rounded-lg border px-4">
                  <AccordionTrigger className="text-sm font-semibold py-3">Mietverhältnis</AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <TenancySection homeId={homeId} />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Contracts */}
              <AccordionItem value="contracts" className="glass-card rounded-lg border px-4">
                <AccordionTrigger className="text-sm font-semibold py-3">Verträge</AccordionTrigger>
                <AccordionContent className="pb-4">
                  <MietyContractsSection homeId={homeId} onOpenDrawer={() => setContractDrawerOpen(true)} />
                </AccordionContent>
              </AccordionItem>

              {/* Meter Readings */}
              <AccordionItem value="meters" className="glass-card rounded-lg border px-4">
                <AccordionTrigger className="text-sm font-semibold py-3">Zähler & Stände</AccordionTrigger>
                <AccordionContent className="pb-4">
                  <MietyMeterSection homeId={homeId} onOpenDrawer={() => setMeterDrawerOpen(true)} />
                </AccordionContent>
              </AccordionItem>

              {/* Insurances */}
              <AccordionItem value="insurances" className="glass-card rounded-lg border px-4">
                <AccordionTrigger className="text-sm font-semibold py-3">Versicherungen</AccordionTrigger>
                <AccordionContent className="pb-4">
                  <MietyContractsSection
                    homeId={homeId}
                    onOpenDrawer={() => setContractDrawerOpen(true)}
                    filterCategories={['hausrat', 'haftpflicht']}
                    title="Ihre Versicherungen"
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Providers */}
              <AccordionItem value="providers" className="glass-card rounded-lg border px-4">
                <AccordionTrigger className="text-sm font-semibold py-3">Versorger</AccordionTrigger>
                <AccordionContent className="pb-4">
                  <MietyContractsSection
                    homeId={homeId}
                    onOpenDrawer={() => setContractDrawerOpen(true)}
                    filterCategories={['strom', 'gas', 'wasser', 'internet']}
                    title="Ihre Versorger"
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Communication */}
              <AccordionItem value="communication" className="glass-card rounded-lg border px-4">
                <AccordionTrigger className="text-sm font-semibold py-3">Kommunikation</AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex flex-col items-center py-6 text-center">
                    <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Kommunikation — kommt bald</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Services */}
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
      </Card>

      {/* Drawers */}
      <ContractDrawer open={contractDrawerOpen} onOpenChange={setContractDrawerOpen} homeId={homeId} />
      <MeterReadingDrawer open={meterDrawerOpen} onOpenChange={setMeterDrawerOpen} homeId={homeId} />
      <UploadDrawer open={uploadDrawerOpen} onOpenChange={setUploadDrawerOpen} homeId={homeId} />
    </>
  );
}
