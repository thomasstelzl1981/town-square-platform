import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { 
  ExposeDragDropUploader,
  StandaloneCalculatorPanel,
  PortalSearchTool,
  PropertyResearchTool,
} from './components';

export default function AkquiseTools() {
  return (
    <PageShell>
      <ModulePageHeader title="AKQUISE-TOOLS" description="Werkzeuge für Recherche, Bewertung und Kalkulation" />
      <ExposeDragDropUploader />
      <StandaloneCalculatorPanel />
      <PortalSearchTool />
      <PropertyResearchTool />
    </PageShell>
  );
}
