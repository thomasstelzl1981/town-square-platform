/**
 * LandingPageWebsite — Context-free 4-tab website component
 * Used both inside the portal browser-frame preview AND the public Zone 3 route
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BarChart3, Building2, Globe, FileText } from 'lucide-react';
import type { ProjectPortfolioRow } from '@/types/projekte';
import type { LandingPage } from '@/hooks/useLandingPage';
import { LandingPageInvestmentTab } from './LandingPageInvestmentTab';
import { LandingPageProjektTab } from './LandingPageProjektTab';
import { LandingPageAnbieterTab } from './LandingPageAnbieterTab';
import { LandingPageLegalTab } from './LandingPageLegalTab';

const TABS = [
  { key: 'investment', label: 'Investment', icon: BarChart3 },
  { key: 'projekt', label: 'Lage & Umgebung', icon: Building2 },
  { key: 'anbieter', label: 'Anbieter', icon: Globe },
  { key: 'legal', label: 'Legal & Dokumente', icon: FileText },
] as const;

type TabKey = typeof TABS[number]['key'];

interface LandingPageWebsiteProps {
  project: ProjectPortfolioRow | null;
  landingPage: LandingPage | null;
  isDemo: boolean;
}

export function LandingPageWebsite({ project, landingPage, isDemo }: LandingPageWebsiteProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('investment');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  return (
    <div className="min-h-[400px]">
      {/* Superbar Navigation */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-4 py-2">
        <nav className="flex gap-1 rounded-xl bg-muted p-1 max-w-2xl">
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
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4 md:p-6">
        {activeTab === 'investment' && (
          <LandingPageInvestmentTab
            project={project}
            isDemo={isDemo}
            selectedUnitId={selectedUnitId}
            onSelectUnit={setSelectedUnitId}
            onBack={() => setSelectedUnitId(null)}
          />
        )}
        {activeTab === 'projekt' && <LandingPageProjektTab isDemo={isDemo} landingPage={landingPage} />}
        {activeTab === 'anbieter' && <LandingPageAnbieterTab isDemo={isDemo} landingPage={landingPage} />}
        {activeTab === 'legal' && <LandingPageLegalTab isDemo={isDemo} />}
      </div>
    </div>
  );
}
