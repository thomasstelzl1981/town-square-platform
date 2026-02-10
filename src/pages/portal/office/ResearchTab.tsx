/**
 * ResearchTab — 3-Kachel Container für Recherche-Feature
 */

import { ResearchFreeCard } from './components/ResearchFreeCard';
import { ResearchProCard } from './components/ResearchProCard';
import { ResearchCandidatesTray } from './components/ResearchCandidatesTray';

export function ResearchTab() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ResearchFreeCard />
        <ResearchProCard />
        <ResearchCandidatesTray />
      </div>
    </div>
  );
}
