import * as React from 'react';
import { DESIGN } from '@/config/designManifest';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { 
  PortalSearchTool,
  AISearchProfileIntake,
} from './components';
import type { PortalSearchParams } from '@/hooks/useAcqTools';

export default function AkquiseTools() {
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

        {/* 1. Portal-Recherche — Treffer fließen direkt in Objekteingang */}
        <PortalSearchTool initialParams={searchParams} />

        {/* 2. SoT Bewertung — wird in Phase 5 hier integriert */}
      </div>
    </PageShell>
  );
}
