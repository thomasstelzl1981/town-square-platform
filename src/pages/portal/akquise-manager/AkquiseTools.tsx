import * as React from 'react';
import { DESIGN } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { 
  PortalSearchTool,
  AISearchProfileIntake,
} from './components';
import { ValuationPreflight, ValuationPipeline, ValuationReportReader } from '@/components/shared/valuation';
import { useValuationCase } from '@/hooks/useValuationCase';
import type { PortalSearchParams } from '@/hooks/useAcqTools';

export default function AkquiseTools() {
  const [searchParams, setSearchParams] = React.useState<PortalSearchParams | null>(null);
  const valuation = useValuationCase();

  const handleAIApply = (params: PortalSearchParams) => {
    setSearchParams(params);
  };

  const handlePreflightFromUrl = (sourceUrl?: string) => {
    valuation.runPreflight({
      sourceUrls: sourceUrl ? [sourceUrl] : [],
      sourceContext: 'ACQUIARY_TOOLS',
    });
  };

  const handleStartFromUrl = (sourceUrl?: string) => {
    valuation.runValuation({
      sourceUrls: sourceUrl ? [sourceUrl] : [],
      sourceContext: 'ACQUIARY_TOOLS',
    });
  };

  const result = valuation.state.resultData;
  const hasResult = result?.valueBand || result?.results;
  const resultObj = result?.results || result;

  return (
    <PageShell>
      <ModulePageHeader title="Akquise-Tools" description="Werkzeuge für Recherche, Bewertung und Kalkulation" />
      
      <div className={DESIGN.SPACING.SECTION}>
        {/* 0. KI-Suchprofil (Phase 3) */}
        <AISearchProfileIntake onApply={handleAIApply} />

        {/* 1. Portal-Recherche — Treffer fließen direkt in Objekteingang */}
        <PortalSearchTool initialParams={searchParams} />

        {/* 2. SoT Bewertung */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {valuation.state.status !== 'running' && valuation.state.status !== 'final' && (
              <ValuationPreflight
                preflight={valuation.state.preflight}
                isLoading={valuation.isLoading}
                onCheckPreflight={() => handlePreflightFromUrl()}
                onStartValuation={() => handleStartFromUrl()}
              />
            )}

            {valuation.state.status === 'running' && (
              <ValuationPipeline
                stages={valuation.state.stages}
                currentStage={valuation.state.currentStage}
                status={valuation.state.status}
                error={valuation.state.error}
              />
            )}
          </div>

          {hasResult && (
            <ValuationReportReader
              valueBand={resultObj?.valueBand || null}
              methods={resultObj?.methods || []}
              financing={resultObj?.financing || []}
              stressTests={resultObj?.stressTests || []}
              lienProxy={resultObj?.lienProxy || null}
              debtService={resultObj?.debtService || null}
              dataQuality={resultObj?.dataQuality || null}
              compStats={resultObj?.compStats || null}
              executiveSummary={resultObj?.executiveSummary}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
