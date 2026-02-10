/**
 * LandingPagePreview — 4-Tab Website View (Zustand B)
 * Superbar navigation + tab content + global download CTA
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, BarChart3, Building2, Globe, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectPortfolioRow } from '@/types/projekte';
import { LandingPageInvestmentTab } from './LandingPageInvestmentTab';
import { LandingPageProjektTab } from './LandingPageProjektTab';
import { LandingPageAnbieterTab } from './LandingPageAnbieterTab';
import { LandingPageLegalTab } from './LandingPageLegalTab';
import { LandingPagePublishSection } from './LandingPagePublishSection';

interface LandingPagePreviewProps {
  project: ProjectPortfolioRow | null;
  isDemo: boolean;
}

const TABS = [
  { key: 'investment', label: 'Investment', icon: BarChart3 },
  { key: 'projekt', label: 'Projekt', icon: Building2 },
  { key: 'anbieter', label: 'Anbieter', icon: Globe },
  { key: 'legal', label: 'Legal & Dokumente', icon: FileText },
] as const;

type TabKey = typeof TABS[number]['key'];

export function LandingPagePreview({ project, isDemo }: LandingPagePreviewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('investment');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const handleDownloadExpose = () => {
    toast.info('Exposé-Download', { description: 'Im Demo-Modus nicht verfügbar. Erstellen Sie ein echtes Projekt.' });
  };

  return (
    <div className="space-y-6">
      {isDemo && (
        <Badge variant="secondary" className="opacity-60">Beispieldaten — Entwurf basiert auf Demodaten</Badge>
      )}

      {/* Superbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <nav className="flex gap-1 rounded-xl bg-muted p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSelectedUnitId(null); }}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Global Download CTA */}
        <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadExpose}>
          <Download className="h-4 w-4" />
          Verkaufsexposé downloaden
        </Button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'investment' && (
          <LandingPageInvestmentTab
            project={project}
            isDemo={isDemo}
            selectedUnitId={selectedUnitId}
            onSelectUnit={setSelectedUnitId}
            onBack={() => setSelectedUnitId(null)}
          />
        )}
        {activeTab === 'projekt' && <LandingPageProjektTab isDemo={isDemo} />}
        {activeTab === 'anbieter' && <LandingPageAnbieterTab isDemo={isDemo} />}
        {activeTab === 'legal' && <LandingPageLegalTab isDemo={isDemo} />}
      </div>

      {/* Publishing Section */}
      <LandingPagePublishSection />
    </div>
  );
}
