import * as React from 'react';
import { DESIGN } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Calculator, FolderOpen, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  PortalSearchTool,
  PortalSearchInbox,
  AISearchProfileIntake,
  PropertyResearchTool,
  StandaloneCalculatorPanel,
  AcqDataRoom,
  ExposeDragDropUploader,
} from './components';
import type { PortalSearchParams } from '@/hooks/useAcqTools';

export default function AkquiseTools() {
  const [calcOpen, setCalcOpen] = React.useState(false);
  const [dataRoomOpen, setDataRoomOpen] = React.useState(false);
  const [exposeUploadOpen, setExposeUploadOpen] = React.useState(false);
  const [searchParams, setSearchParams] = React.useState<PortalSearchParams | null>(null);

  const handleAIApply = (params: PortalSearchParams) => {
    setSearchParams(params);
  };

  return (
    <PageShell>
      <ModulePageHeader title="Akquise-Tools" description="Werkzeuge für Recherche, Bewertung und Kalkulation" />
      
      <div className={DESIGN.SPACING.SECTION}>
        {/* 0. KI-Suchprofil (Phase 3) */}
        <AISearchProfileIntake onApply={handleAIApply} />

        {/* 1. Portal-Recherche (Phase 1 + 2 Persistierung) */}
        <PortalSearchTool initialParams={searchParams} />

        {/* 2. Objekt-Inbox (Phase 2) */}
        <PortalSearchInbox />

        {/* 3. Immobilienbewertung (inkl. GeoMap + Sprengnetter) */}
        <PropertyResearchTool />

        {/* 4. Exposé-Upload & Analyse (persistiert in Objekteingang) */}
        <Collapsible open={exposeUploadOpen} onOpenChange={setExposeUploadOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-between py-3 px-4 h-auto',
                DESIGN.CARD.BASE,
                'hover:bg-muted/30'
              )}
            >
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <span className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Exposé-Upload & Analyse</span>
                <span className={DESIGN.TYPOGRAPHY.HINT}>— Exposés hochladen und in Objekteingang speichern</span>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', exposeUploadOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <ExposeDragDropUploader />
          </CollapsibleContent>
        </Collapsible>

        {/* 5. Standalone-Kalkulator (Collapsible) */}
        <Collapsible open={calcOpen} onOpenChange={setCalcOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-between py-3 px-4 h-auto',
                DESIGN.CARD.BASE,
                'hover:bg-muted/30'
              )}
            >
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                <span className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Standalone-Kalkulatoren</span>
                <span className={DESIGN.TYPOGRAPHY.HINT}>— Schnelle Kalkulation ohne Mandat-Kontext</span>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', calcOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <StandaloneCalculatorPanel />
          </CollapsibleContent>
        </Collapsible>

        {/* 6. Datenraum (Collapsible) */}
        <Collapsible open={dataRoomOpen} onOpenChange={setDataRoomOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-between py-3 px-4 h-auto',
                DESIGN.CARD.BASE,
                'hover:bg-muted/30'
              )}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                <span className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Datenraum</span>
                <span className={DESIGN.TYPOGRAPHY.HINT}>— Akquise-Dokumente und Exposés</span>
              </div>
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', dataRoomOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <AcqDataRoom />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </PageShell>
  );
}
